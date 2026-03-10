import http from 'node:http';
import httpProxy from 'http-proxy';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { geocodeAddress, searchVenuesLive, discoverNearbyVenues, deduplicateVenues, runDiscoveryForSchool } from './services/venue-discovery.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || process.env.REPL_DEPLOYMENT === '1';

const proxy = IS_PRODUCTION ? null : httpProxy.createProxyServer({ ws: true });

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.map': 'application/json',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.txt': 'text/plain',
};

const APP_DIST_DIRS = {
  landing: path.join(__dirname, 'apps/landing/dist'),
  venue: path.join(__dirname, 'apps/venue/dist'),
  teacher: path.join(__dirname, 'apps/teacher/dist'),
  parent: path.join(__dirname, 'apps/parent/dist'),
  school: path.join(__dirname, 'apps/school/dist'),
};

function serveStatic(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  try {
    const content = fs.readFileSync(filePath);
    const headers = { 'Content-Type': mime };
    if (ext === '.js' || ext === '.css' || ext === '.woff2' || ext === '.woff') {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    }
    res.writeHead(200, headers);
    res.end(content);
    return true;
  } catch {
    return false;
  }
}

function serveApp(req, res, appName, urlPath) {
  const distDir = APP_DIST_DIRS[appName];
  if (!distDir || !fs.existsSync(distDir)) {
    res.writeHead(503, { 'Content-Type': 'text/plain' });
    res.end('App not built yet');
    return;
  }

  const cleanPath = urlPath.replace(/^\/+/, '');
  const filePath = path.join(distDir, cleanPath);

  if (cleanPath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveStatic(res, filePath);
    return;
  }

  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' });
    res.end(fs.readFileSync(indexPath));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

async function getTwilioCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken || !hostname) {
    throw new Error('Twilio connector not available');
  }

  const data = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
    {
      headers: {
        'Accept': 'application/json',
        'X-Replit-Token': xReplitToken
      }
    }
  ).then(res => res.json());

  const settings = data.items?.[0]?.settings;
  if (!settings?.account_sid || !settings?.api_key || !settings?.api_key_secret) {
    throw new Error('Twilio credentials not found');
  }
  return settings;
}

async function sendSMS(to, message) {
  const creds = await getTwilioCredentials();
  const authString = Buffer.from(`${creds.api_key}:${creds.api_key_secret}`).toString('base64');
  const fromNumber = creds.phone_number || process.env.TWILIO_PHONE_NUMBER;

  const body = new URLSearchParams({
    To: to,
    From: fromNumber,
    Body: message,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${creds.account_sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    }
  );

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Twilio API error');
  }
  return result;
}

const routes = [
  { prefix: '/venue', target: 'http://localhost:3001' },
  { prefix: '/teacher', target: 'http://localhost:3002' },
  { prefix: '/parent', target: 'http://localhost:3003' },
  { prefix: '/school', target: 'http://localhost:4200' },
];

function getTarget(url) {
  for (const route of routes) {
    if (url && url.startsWith(route.prefix)) {
      return route.target;
    }
  }
  return 'http://localhost:3000';
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(ip, endpoint) {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);
  if (!record || now - record.start > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { start: now, count: 1 });
    return true;
  }
  record.count++;
  if (record.count > RATE_LIMIT_MAX) return false;
  return true;
}

async function verifyAuth(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getUser(token);
    return !error && !!data?.user;
  } catch {
    return false;
  }
}

function sendJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

async function handleSendSMS(req, res) {
  try {
    const { to, message } = await parseBody(req);
    if (!to || !message) {
      return sendJSON(res, 400, { error: 'Missing required fields: to, message' });
    }

    const result = await sendSMS(to, message);

    try {
      const supabase = getSupabase();
      await supabase.from('sms_logs').insert({
        to_number: to,
        message_body: message,
        status: 'sent',
        provider_message_id: result.sid,
        sent_at: new Date().toISOString(),
      });
    } catch (logErr) {
      console.warn('Failed to log SMS to database:', logErr.message);
    }

    sendJSON(res, 200, { success: true, messageSid: result.sid });
  } catch (err) {
    console.error('SMS send error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

async function handleSendPermissionSlip(req, res) {
  try {
    const { permissionSlipId } = await parseBody(req);
    if (!permissionSlipId) {
      return sendJSON(res, 400, { error: 'Missing permissionSlipId' });
    }

    const supabase = getSupabase();

    const { data: slip, error: slipErr } = await supabase
      .from('permission_slips')
      .select(`
        id, status, magic_link_token, magic_link_expires_at,
        student:students(id, first_name, last_name, roster_id),
        trip:trips(id, experience_id, trip_date,
          experience:experiences(id, title, venue_id,
            venue:venues(id, name)
          )
        )
      `)
      .eq('id', permissionSlipId)
      .single();

    if (slipErr || !slip) {
      return sendJSON(res, 404, { error: 'Permission slip not found' });
    }

    let token = slip.magic_link_token;
    if (!token || (slip.magic_link_expires_at && new Date(slip.magic_link_expires_at) < new Date())) {
      const crypto = await import('node:crypto');
      token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      await supabase
        .from('permission_slips')
        .update({ magic_link_token: token, magic_link_expires_at: expiresAt })
        .eq('id', permissionSlipId);
    }

    const parentLink = `${process.env.VITE_APP_URL || 'https://' + (process.env.REPL_SLUG ? process.env.REPL_SLUG + '.' + process.env.REPLIT_DEV_DOMAIN : 'localhost:5000')}/parent/auth?token=${token}`;

    const studentName = slip.student ? `${slip.student.first_name} ${slip.student.last_name}` : 'your child';
    const tripTitle = slip.trip?.experience?.title || 'Field Trip';
    const venueName = slip.trip?.experience?.venue?.name || '';

    const smsMessage = `TripSlip: Permission slip ready for ${studentName}'s trip to ${venueName || tripTitle}. Sign here: ${parentLink}`;

    const { data: parentLinks } = await supabase
      .from('student_parents')
      .select('parent:parents(phone, email, first_name)')
      .eq('student_id', slip.student?.id);

    let smsSent = false;
    let emailSent = false;
    const results = [];

    if (parentLinks?.length) {
      for (const link of parentLinks) {
        const parent = link.parent;
        if (parent?.phone) {
          try {
            await sendSMS(parent.phone, smsMessage);
            smsSent = true;
            results.push({ type: 'sms', to: parent.phone, status: 'sent' });
          } catch (err) {
            results.push({ type: 'sms', to: parent.phone, status: 'failed', error: err.message });
          }
        }
      }
    }

    await supabase
      .from('permission_slips')
      .update({ status: 'sent' })
      .eq('id', permissionSlipId)
      .in('status', ['pending', 'draft']);

    sendJSON(res, 200, { success: true, parentLink, smsSent, emailSent, results });
  } catch (err) {
    console.error('Send permission slip error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

async function handleSendBulkReminders(req, res) {
  try {
    const { tripId, channel = 'sms' } = await parseBody(req);
    if (!tripId) {
      return sendJSON(res, 400, { error: 'Missing tripId' });
    }

    const supabase = getSupabase();

    const { data: slips, error } = await supabase
      .from('permission_slips')
      .select(`
        id, status, magic_link_token,
        student:students(id, first_name, last_name)
      `)
      .eq('trip_id', tripId)
      .in('status', ['sent', 'pending']);

    if (error) {
      return sendJSON(res, 500, { error: error.message });
    }

    const results = [];
    for (const slip of (slips || [])) {
      try {
        const resp = await new Promise((resolve, reject) => {
          const fakeReq = {
            on: (event, cb) => {
              if (event === 'data') cb(JSON.stringify({ permissionSlipId: slip.id }));
              if (event === 'end') cb();
            }
          };
          const fakeRes = {
            writeHead: () => {},
            end: (data) => resolve(JSON.parse(data))
          };
          handleSendPermissionSlip(fakeReq, fakeRes).catch(reject);
        });
        results.push({ slipId: slip.id, student: `${slip.student?.first_name} ${slip.student?.last_name}`, ...resp });
      } catch (err) {
        results.push({ slipId: slip.id, error: err.message });
      }
    }

    sendJSON(res, 200, { success: true, sent: results.length, results });
  } catch (err) {
    console.error('Bulk reminder error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

async function handleUploadForm(req, res) {
  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);
    const contentType = req.headers['content-type'] || '';

    if (!contentType.includes('multipart/form-data')) {
      return sendJSON(res, 400, { error: 'Expected multipart/form-data' });
    }

    const boundaryMatch = contentType.match(/boundary=(.+)/);
    if (!boundaryMatch) {
      return sendJSON(res, 400, { error: 'No boundary found' });
    }

    const boundary = boundaryMatch[1];
    const parts = body.toString('binary').split('--' + boundary);
    let fileBuffer = null;
    let fileName = '';
    let fileContentType = 'application/octet-stream';
    const fields = {};

    for (const part of parts) {
      if (part.includes('filename=')) {
        const nameMatch = part.match(/filename="([^"]+)"/);
        const typeMatch = part.match(/Content-Type:\s*(.+)/i);
        fileName = nameMatch ? nameMatch[1] : 'upload';
        fileContentType = typeMatch ? typeMatch[1].trim() : 'application/octet-stream';
        const dataStart = part.indexOf('\r\n\r\n') + 4;
        const dataEnd = part.lastIndexOf('\r\n');
        fileBuffer = Buffer.from(part.substring(dataStart, dataEnd), 'binary');
      } else if (part.includes('name=')) {
        const nameMatch = part.match(/name="([^"]+)"/);
        if (nameMatch) {
          const dataStart = part.indexOf('\r\n\r\n') + 4;
          const dataEnd = part.lastIndexOf('\r\n');
          fields[nameMatch[1]] = part.substring(dataStart, dataEnd).trim();
        }
      }
    }

    if (!fileBuffer) {
      return sendJSON(res, 400, { error: 'No file found in upload' });
    }

    const tripId = fields.trip_id;
    if (!tripId) {
      return sendJSON(res, 400, { error: 'Missing trip_id field' });
    }

    const supabase = getSupabase();
    const ext = fileName.split('.').pop() || 'pdf';
    const storagePath = `${tripId}/${Date.now()}_${fileName}`;

    const { error: uploadErr } = await supabase.storage
      .from('trip-forms')
      .upload(storagePath, fileBuffer, { contentType: fileContentType });

    if (uploadErr) {
      return sendJSON(res, 500, { error: 'Upload failed: ' + uploadErr.message });
    }

    const { data: urlData } = supabase.storage
      .from('trip-forms')
      .getPublicUrl(storagePath);

    const { data: formRecord, error: insertErr } = await supabase
      .from('trip_forms')
      .insert({
        trip_id: tripId,
        title: fields.title || fileName,
        form_type: fields.form_type || 'custom',
        description: fields.description || '',
        file_url: urlData?.publicUrl || storagePath,
        required: fields.required === 'true',
        source: 'uploaded',
      })
      .select()
      .single();

    if (insertErr) {
      return sendJSON(res, 500, { error: 'Failed to create form record: ' + insertErr.message });
    }

    sendJSON(res, 200, { success: true, form: formRecord });
  } catch (err) {
    console.error('Upload form error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

async function handleSendEmail(req, res) {
  try {
    const { to, subject, html, text } = await parseBody(req);
    if (!to || (!html && !text)) {
      return sendJSON(res, 400, { error: 'Missing required fields: to, and html or text' });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, html, text },
    });

    if (error) {
      throw new Error(error.message || 'Email send failed');
    }

    sendJSON(res, 200, { success: true, data });
  } catch (err) {
    console.error('Email send error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

async function handleDiscoveryRun(req, res) {
  try {
    const body = await parseBody(req);
    const { school_id, radius_miles } = body;

    if (!school_id) {
      return sendJSON(res, 400, { error: 'school_id is required' });
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
      return sendJSON(res, 500, { error: 'GEOAPIFY_API_KEY not configured' });
    }

    const result = await runDiscoveryForSchool(school_id, apiKey, {
      radiusMiles: radius_miles || 25,
    });

    sendJSON(res, 200, result);
  } catch (err) {
    console.error('Discovery error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

async function handleDiscoveryNearby(req, res) {
  try {
    const body = await parseBody(req);
    const { lat, lon, radius_miles } = body;

    if (!lat || !lon) {
      return sendJSON(res, 400, { error: 'lat and lon are required' });
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
      return sendJSON(res, 500, { error: 'GEOAPIFY_API_KEY not configured' });
    }

    const result = await searchVenuesLive(
      { lat, lon, radiusMiles: radius_miles || 25 },
      apiKey
    );

    sendJSON(res, 200, result);
  } catch (err) {
    console.error('Nearby discovery error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

async function handleDiscoverySearch(req, res) {
  try {
    const body = await parseBody(req);
    const { address, lat, lon, radiusMiles, venueTypes, searchText } = body;

    if (!address && !lat) {
      return sendJSON(res, 400, { error: 'address or lat/lon is required' });
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
      return sendJSON(res, 500, { error: 'GEOAPIFY_API_KEY not configured' });
    }

    const result = await searchVenuesLive(
      { address, lat, lon, radiusMiles, venueTypes, searchText },
      apiKey
    );

    sendJSON(res, 200, result);
  } catch (err) {
    console.error('Discovery search error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

async function handleDiscoveryGeocode(req, res) {
  try {
    const body = await parseBody(req);
    const { address } = body;

    if (!address) {
      return sendJSON(res, 400, { error: 'address is required' });
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
      return sendJSON(res, 500, { error: 'GEOAPIFY_API_KEY not configured' });
    }

    const result = await geocodeAddress(address, apiKey);
    sendJSON(res, 200, result);
  } catch (err) {
    console.error('Geocode error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

async function handleVenueLookupUser(req, res) {
  try {
    const body = await parseBody(req);
    const { email } = body;
    if (!email) {
      return sendJSON(res, 400, { error: 'Email is required' });
    }

    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const supabase = getSupabase();

    const { data: { user: requester }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !requester) {
      return sendJSON(res, 401, { error: 'Authentication required' });
    }

    const { data: venueUser, error: vuErr } = await supabase
      .from('venue_users')
      .select('venue_id, role')
      .eq('user_id', requester.id)
      .is('deactivated_at', null)
      .single();

    if (vuErr || !venueUser || venueUser.role !== 'administrator') {
      return sendJSON(res, 403, { error: 'Only venue administrators can look up users' });
    }

    let allUsers = [];
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) {
        console.error('Admin listUsers error:', error.message);
        return sendJSON(res, 500, { error: 'Failed to look up user' });
      }
      allUsers = allUsers.concat(users || []);
      if (!users || users.length < perPage) break;
      page++;
    }

    const found = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!found) {
      return sendJSON(res, 404, { error: 'User not found' });
    }

    sendJSON(res, 200, { userId: found.id, email: found.email });
  } catch (err) {
    console.error('Lookup user error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

async function handleSignupFindOrCreateSchool(req, res) {
  try {
    const supabase = getSupabase();
    const body = await parseBody(req);
    const { name } = body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return sendJSON(res, 400, { error: 'School name is required (at least 2 characters)' });
    }
    const trimmed = name.trim();

    const { data: existing } = await supabase
      .from('schools')
      .select('id, name')
      .ilike('name', trimmed)
      .limit(1)
      .single();

    if (existing) {
      return sendJSON(res, 200, { id: existing.id, name: existing.name, created: false });
    }

    const { data: created, error } = await supabase
      .from('schools')
      .insert({ name: trimmed })
      .select('id, name')
      .single();

    if (error) {
      console.error('Create school error:', error.message);
      return sendJSON(res, 500, { error: 'Failed to create school' });
    }

    sendJSON(res, 200, { id: created.id, name: created.name, created: true });
  } catch (err) {
    console.error('Find/create school error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

async function handleSignupFindOrCreateDistrict(req, res) {
  try {
    const supabase = getSupabase();
    const body = await parseBody(req);
    const { name } = body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return sendJSON(res, 400, { error: 'District name is required (at least 2 characters)' });
    }
    const trimmed = name.trim();

    const { data: existing } = await supabase
      .from('districts')
      .select('id, name')
      .ilike('name', trimmed)
      .limit(1)
      .single();

    if (existing) {
      return sendJSON(res, 200, { id: existing.id, name: existing.name, created: false });
    }

    const { data: created, error } = await supabase
      .from('districts')
      .insert({ name: trimmed })
      .select('id, name')
      .single();

    if (error) {
      console.error('Create district error:', error.message);
      return sendJSON(res, 500, { error: 'Failed to create district' });
    }

    sendJSON(res, 200, { id: created.id, name: created.name, created: true });
  } catch (err) {
    console.error('Find/create district error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

async function handleSignupFindOrCreateVenue(req, res) {
  try {
    const supabase = getSupabase();
    const body = await parseBody(req);
    const { name, contactEmail } = body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return sendJSON(res, 400, { error: 'Venue name is required (at least 2 characters)' });
    }
    if (!contactEmail || typeof contactEmail !== 'string') {
      return sendJSON(res, 400, { error: 'Contact email is required' });
    }
    const trimmed = name.trim();

    const { data: existing } = await supabase
      .from('venues')
      .select('id, name')
      .ilike('name', trimmed)
      .limit(1)
      .single();

    if (existing) {
      return sendJSON(res, 200, { id: existing.id, name: existing.name, created: false });
    }

    const { data: created, error } = await supabase
      .from('venues')
      .insert({ name: trimmed, contact_email: contactEmail.trim() })
      .select('id, name')
      .single();

    if (error) {
      console.error('Create venue error:', error.message);
      return sendJSON(res, 500, { error: 'Failed to create venue' });
    }

    sendJSON(res, 200, { id: created.id, name: created.name, created: true });
  } catch (err) {
    console.error('Find/create venue error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

async function handleSignupLinkVenueUser(req, res) {
  try {
    const supabase = getSupabase();
    const body = await parseBody(req);
    const { userId, venueId } = body;
    if (!userId || !venueId) {
      return sendJSON(res, 400, { error: 'userId and venueId are required' });
    }

    const { data: existing } = await supabase
      .from('venue_users')
      .select('id')
      .eq('user_id', userId)
      .eq('venue_id', venueId)
      .maybeSingle();

    if (existing) {
      return sendJSON(res, 200, { linked: true, existing: true });
    }

    const { error: vuError } = await supabase
      .from('venue_users')
      .insert({
        user_id: userId,
        venue_id: venueId,
        role: 'administrator',
      });

    if (vuError) {
      console.error('Create venue_users error:', vuError.message);
      return sendJSON(res, 500, { error: 'Failed to link user to venue' });
    }

    await supabase
      .from('venues')
      .update({
        claimed: true,
        claimed_by: userId,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', venueId)
      .is('claimed_by', null);

    sendJSON(res, 200, { linked: true, existing: false });
  } catch (err) {
    console.error('Link venue user error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

async function handleVenueUploadExperienceForm(req, res) {
  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);
    const contentType = req.headers['content-type'] || '';

    if (!contentType.includes('multipart/form-data')) {
      return sendJSON(res, 400, { error: 'Expected multipart/form-data' });
    }

    const boundaryMatch = contentType.match(/boundary=(.+)/);
    if (!boundaryMatch) {
      return sendJSON(res, 400, { error: 'No boundary found' });
    }

    const boundary = boundaryMatch[1];
    const parts = body.toString('binary').split('--' + boundary);
    let fileBuffer = null;
    let fileName = '';
    let fileContentType = 'application/octet-stream';
    const fields = {};

    for (const part of parts) {
      if (part.includes('filename=')) {
        const nameMatch = part.match(/filename="([^"]+)"/);
        const typeMatch = part.match(/Content-Type:\s*(.+)/i);
        fileName = nameMatch ? nameMatch[1] : 'upload';
        fileContentType = typeMatch ? typeMatch[1].trim() : 'application/octet-stream';
        const dataStart = part.indexOf('\r\n\r\n') + 4;
        const dataEnd = part.lastIndexOf('\r\n');
        fileBuffer = Buffer.from(part.substring(dataStart, dataEnd), 'binary');
      } else if (part.includes('name=')) {
        const nameMatch = part.match(/name="([^"]+)"/);
        if (nameMatch) {
          const dataStart = part.indexOf('\r\n\r\n') + 4;
          const dataEnd = part.lastIndexOf('\r\n');
          fields[nameMatch[1]] = part.substring(dataStart, dataEnd).trim();
        }
      }
    }

    if (!fileBuffer) {
      return sendJSON(res, 400, { error: 'No file found in upload' });
    }

    const maxSize = 10 * 1024 * 1024;
    if (fileBuffer.length > maxSize) {
      return sendJSON(res, 400, { error: 'File too large. Maximum size is 10MB.' });
    }

    const allowedExts = ['pdf', 'doc', 'docx', 'txt'];
    const fileExt = (fileName.split('.').pop() || '').toLowerCase();
    if (!allowedExts.includes(fileExt)) {
      return sendJSON(res, 400, { error: 'Invalid file type. Accepted: PDF, DOC, DOCX, TXT.' });
    }

    const { venue_id, experience_id, form_name, category } = fields;
    if (!venue_id || !experience_id) {
      return sendJSON(res, 400, { error: 'venue_id and experience_id required' });
    }

    const supabase = getSupabase();
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `venue-forms/${venue_id}/${Date.now()}_${safeName}`;

    let fileUrl = '';
    const { error: uploadErr } = await supabase.storage
      .from('trip-forms')
      .upload(storagePath, fileBuffer, { contentType: fileContentType });

    if (uploadErr) {
      const localDir = path.join(__dirname, 'public', 'uploads', 'venue-forms');
      if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
      const localPath = path.join(localDir, `${Date.now()}_${safeName}`);
      fs.writeFileSync(localPath, fileBuffer);
      fileUrl = `/public/uploads/venue-forms/${path.basename(localPath)}`;
    } else {
      const { data: urlData } = supabase.storage
        .from('trip-forms')
        .getPublicUrl(storagePath);
      fileUrl = urlData?.publicUrl || storagePath;
    }

    const { data: venueForm, error: formErr } = await supabase
      .from('venue_forms')
      .insert({
        venue_id,
        name: (form_name || fileName).trim(),
        category: category || 'waiver',
        file_url: fileUrl,
        file_size_bytes: fileBuffer.length,
        required: true,
      })
      .select()
      .single();

    if (formErr) throw new Error(formErr.message);

    const { error: linkErr } = await supabase
      .from('experience_forms')
      .insert({
        experience_id,
        form_id: venueForm.id,
        required: true,
      });

    if (linkErr) throw new Error(linkErr.message);

    sendJSON(res, 200, { form: venueForm });
  } catch (err) {
    console.error('Venue upload experience form error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

async function handleVenueDeleteExperienceForm(req, res) {
  const supabase = getSupabase();
  try {
    const body = await parseBody(req);
    const { form_id, experience_id } = body;
    if (!form_id || !experience_id) return sendJSON(res, 400, { error: 'form_id and experience_id required' });

    await supabase.from('experience_forms').delete().eq('form_id', form_id).eq('experience_id', experience_id);
    await supabase.from('venue_forms').delete().eq('id', form_id);

    sendJSON(res, 200, { success: true });
  } catch (err) {
    console.error('Delete experience form error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

async function handleVenueGetExperienceForms(req, res) {
  const supabase = getSupabase();
  try {
    const body = await parseBody(req);
    const { experience_id } = body;
    if (!experience_id) return sendJSON(res, 400, { error: 'experience_id required' });

    const { data, error } = await supabase
      .from('experience_forms')
      .select('form_id, required, venue_form:venue_forms(id, name, category, file_url, file_size_bytes)')
      .eq('experience_id', experience_id);

    if (error) throw new Error(error.message);

    const forms = (data || []).map(ef => ({
      id: ef.venue_form?.id,
      name: ef.venue_form?.name,
      category: ef.venue_form?.category,
      file_url: ef.venue_form?.file_url,
      file_size_bytes: ef.venue_form?.file_size_bytes,
      required: ef.required,
    })).filter(f => f.id);

    sendJSON(res, 200, { forms });
  } catch (err) {
    console.error('Get experience forms error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

async function handleVenueGetExperienceResponses(req, res) {
  const supabase = getSupabase();
  try {
    const body = await parseBody(req);
    const { experience_id } = body;
    if (!experience_id) return sendJSON(res, 400, { error: 'experience_id required' });

    const { data: trips } = await supabase
      .from('trips')
      .select('id, trip_date, direct_link_token, status')
      .eq('experience_id', experience_id)
      .order('trip_date', { ascending: false });

    if (!trips || trips.length === 0) {
      return sendJSON(res, 200, { trips: [] });
    }

    const tripIds = trips.map(t => t.id);
    const { data: slips } = await supabase
      .from('permission_slips')
      .select('id, trip_id, status, student_name, parent_name, parent_email, parent_phone, form_data, signed_at')
      .in('trip_id', tripIds)
      .order('signed_at', { ascending: false });

    const tripsWithSlips = trips.map(t => ({
      ...t,
      slips: (slips || []).filter(s => s.trip_id === t.id),
    }));

    sendJSON(res, 200, { trips: tripsWithSlips });
  } catch (err) {
    console.error('Get experience responses error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

async function handleVenueSendTeacherLink(req, res) {
  try {
    const body = await parseBody(req);
    const { experience_id, teacher_email, trip_date, student_count } = body;

    if (!experience_id || !trip_date) {
      return sendJSON(res, 400, { error: 'experience_id and trip_date are required' });
    }

    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const supabase = getSupabase();

    const { data: { user: requester }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !requester) {
      return sendJSON(res, 401, { error: 'Authentication required' });
    }

    const { data: venueUser } = await supabase
      .from('venue_users')
      .select('venue_id, role')
      .eq('user_id', requester.id)
      .is('deactivated_at', null)
      .limit(1)
      .single();

    if (!venueUser) {
      return sendJSON(res, 403, { error: 'Not a venue administrator' });
    }

    const { data: experience } = await supabase
      .from('experiences')
      .select('id, title, venue_id')
      .eq('id', experience_id)
      .eq('venue_id', venueUser.venue_id)
      .single();

    if (!experience) {
      return sendJSON(res, 404, { error: 'Experience not found' });
    }

    let teacher = null;
    if (teacher_email) {
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id, first_name, last_name, email')
        .eq('email', teacher_email)
        .limit(1)
        .single();
      teacher = teacherData;
    }

    const nodeCrypto = await import('node:crypto');
    const directLinkToken = `smc-${nodeCrypto.randomUUID().substring(0, 12)}`;

    const tripRecord = {
      experience_id,
      teacher_id: teacher?.id || null,
      trip_date,
      trip_time: '09:00:00',
      student_count: student_count || 30,
      status: 'pending',
      is_free: true,
      direct_link_token: directLinkToken,
    };

    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .insert(tripRecord)
      .select('id')
      .single();

    if (tripErr) {
      console.error('Trip creation error:', tripErr.message);
      return sendJSON(res, 500, { error: 'Failed to create trip' });
    }

    const { data: expForms } = await supabase
      .from('experience_forms')
      .select('form_id, required, venue_form:venue_forms(id, name, category, file_url)')
      .eq('experience_id', experience_id);

    if (expForms && expForms.length > 0) {
      for (const ef of expForms) {
        const vf = ef.venue_form;
        if (!vf) continue;

        let consentText = vf.description || '';
        if (vf.file_url && vf.file_url.includes('JA_SMC_Consent')) {
          const consentTxtPath = path.join(__dirname, 'public', 'forms', 'JA_SMC_Consent_Text.txt');
          if (fs.existsSync(consentTxtPath)) {
            consentText = fs.readFileSync(consentTxtPath, 'utf-8');
          }
        }

        await supabase.from('trip_forms').insert({
          trip_id: trip.id,
          form_type: vf.category || 'indemnification',
          title: vf.name,
          description: consentText,
          file_url: vf.file_url || '',
          required: ef.required,
          source: 'venue',
        });
      }
    }

    const teacherLink = `/teacher/trip/${directLinkToken}/review`;
    const parentLink = `/parent/trip/${directLinkToken}`;

    sendJSON(res, 200, {
      trip_id: trip.id,
      direct_link_token: directLinkToken,
      teacher_link: teacherLink,
      parent_link: parentLink,
      teacher_found: !!teacher,
      teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : null,
    });
  } catch (err) {
    console.error('Send teacher link error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

async function handleTripLookup(req, res) {
  const supabase = getSupabase();
  try {
    const body = await parseBody(req);
    const { token, role } = body;
    if (!token) return sendJSON(res, 400, { error: 'Token is required' });

    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .select(`
        id,
        trip_date,
        trip_time,
        status,
        is_free,
        funding_model,
        transportation,
        configured_addons,
        special_requirements,
        student_count,
        direct_link_token,
        experience:experiences (
          title,
          description,
          duration_minutes,
          venue:venues (
            name,
            address
          )
        )
      `)
      .eq('direct_link_token', token)
      .single();

    if (tripError || !tripData) {
      return sendJSON(res, 404, { error: 'Trip not found' });
    }

    const { data: forms } = await supabase
      .from('trip_forms')
      .select('id, title, form_type, description, file_url, required, source')
      .eq('trip_id', tripData.id);

    let slips = [];
    if (role === 'teacher') {
      const { data: slipData } = await supabase
        .from('permission_slips')
        .select('id, status, student_name, parent_name, parent_email, parent_phone, signature, form_data, signed_at')
        .eq('trip_id', tripData.id)
        .order('signed_at', { ascending: false });
      slips = slipData || [];
    }

    sendJSON(res, 200, {
      trip: tripData,
      forms: forms || [],
      slips,
    });
  } catch (err) {
    console.error('Trip lookup error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

async function handleTripSubmitConsent(req, res) {
  const supabase = getSupabase();
  try {
    const body = await parseBody(req);
    const { token, student_name, form_data, parent_name, parent_email, parent_phone, signature } = body;
    if (!token || !student_name) return sendJSON(res, 400, { error: 'Token and student name are required' });

    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .select('id')
      .eq('direct_link_token', token)
      .single();

    if (tripError || !tripData) {
      return sendJSON(res, 404, { error: 'Trip not found' });
    }

    const { data: existing } = await supabase
      .from('permission_slips')
      .select('id')
      .eq('trip_id', tripData.id)
      .eq('student_name', student_name)
      .single();

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from('permission_slips')
        .update({
          status: 'signed',
          form_data: form_data || {},
          parent_name: parent_name || null,
          parent_email: parent_email || null,
          parent_phone: parent_phone || null,
          signature: signature || null,
          signed_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (updateError) throw new Error(updateError.message);
      return sendJSON(res, 200, { slip: updated });
    }

    const { data: slip, error: slipError } = await supabase
      .from('permission_slips')
      .insert({
        trip_id: tripData.id,
        student_name,
        status: 'signed',
        form_data: form_data || {},
        parent_name: parent_name || null,
        parent_email: parent_email || null,
        parent_phone: parent_phone || null,
        signature: signature || null,
        signed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (slipError) throw new Error(slipError.message);
    sendJSON(res, 200, { slip });
  } catch (err) {
    console.error('Trip submit consent error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

async function handleTripAddForm(req, res) {
  const supabase = getSupabase();
  try {
    const body = await parseBody(req);
    const { token, title, description } = body;
    if (!token || !title) return sendJSON(res, 400, { error: 'Token and title required' });

    const { data: tripData } = await supabase
      .from('trips')
      .select('id')
      .eq('direct_link_token', token)
      .single();

    if (!tripData) return sendJSON(res, 404, { error: 'Trip not found' });

    const { data, error: insertError } = await supabase
      .from('trip_forms')
      .insert({
        trip_id: tripData.id,
        form_type: 'teacher_requirement',
        title: title.trim(),
        description: (description || '').trim(),
        file_url: '',
        required: true,
        source: 'teacher',
      })
      .select('id, title, form_type, description, file_url, required, source')
      .single();

    if (insertError) throw new Error(insertError.message);
    sendJSON(res, 200, { form: data });
  } catch (err) {
    console.error('Add trip form error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

async function handleTripUploadForm(req, res) {
  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);
    const contentType = req.headers['content-type'] || '';

    if (!contentType.includes('multipart/form-data')) {
      return sendJSON(res, 400, { error: 'Expected multipart/form-data' });
    }

    const boundaryMatch = contentType.match(/boundary=(.+)/);
    if (!boundaryMatch) {
      return sendJSON(res, 400, { error: 'No boundary found' });
    }

    const boundary = boundaryMatch[1];
    const parts = body.toString('binary').split('--' + boundary);
    let fileBuffer = null;
    let fileName = '';
    let fileContentType = 'application/octet-stream';
    const fields = {};

    for (const part of parts) {
      if (part.includes('filename=')) {
        const nameMatch = part.match(/filename="([^"]+)"/);
        const typeMatch = part.match(/Content-Type:\s*(.+)/i);
        fileName = nameMatch ? nameMatch[1] : 'upload';
        fileContentType = typeMatch ? typeMatch[1].trim() : 'application/octet-stream';
        const dataStart = part.indexOf('\r\n\r\n') + 4;
        const dataEnd = part.lastIndexOf('\r\n');
        fileBuffer = Buffer.from(part.substring(dataStart, dataEnd), 'binary');
      } else if (part.includes('name=')) {
        const nameMatch = part.match(/name="([^"]+)"/);
        if (nameMatch) {
          const dataStart = part.indexOf('\r\n\r\n') + 4;
          const dataEnd = part.lastIndexOf('\r\n');
          fields[nameMatch[1]] = part.substring(dataStart, dataEnd).trim();
        }
      }
    }

    if (!fileBuffer) {
      return sendJSON(res, 400, { error: 'No file found in upload' });
    }

    const maxSize = 10 * 1024 * 1024;
    if (fileBuffer.length > maxSize) {
      return sendJSON(res, 400, { error: 'File too large. Maximum size is 10MB.' });
    }

    const allowedExts = ['pdf', 'doc', 'docx', 'txt'];
    const fileExt = (fileName.split('.').pop() || '').toLowerCase();
    if (!allowedExts.includes(fileExt)) {
      return sendJSON(res, 400, { error: 'Invalid file type. Accepted: PDF, DOC, DOCX, TXT.' });
    }

    const { token, title } = fields;
    if (!token) return sendJSON(res, 400, { error: 'Token required' });

    const supabase = getSupabase();

    const { data: tripData } = await supabase
      .from('trips')
      .select('id')
      .eq('direct_link_token', token)
      .single();

    if (!tripData) return sendJSON(res, 404, { error: 'Trip not found' });

    const ext = fileName.split('.').pop() || 'pdf';
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${tripData.id}/${Date.now()}_${safeName}`;

    const { error: uploadErr } = await supabase.storage
      .from('trip-forms')
      .upload(storagePath, fileBuffer, { contentType: fileContentType });

    let fileUrl = '';
    if (uploadErr) {
      const localDir = path.join(__dirname, 'public', 'uploads');
      if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
      const localPath = path.join(localDir, `${Date.now()}_${safeName}`);
      fs.writeFileSync(localPath, fileBuffer);
      fileUrl = `/public/uploads/${path.basename(localPath)}`;
    } else {
      const { data: urlData } = supabase.storage
        .from('trip-forms')
        .getPublicUrl(storagePath);
      fileUrl = urlData?.publicUrl || storagePath;
    }

    const { data: formRecord, error: insertErr } = await supabase
      .from('trip_forms')
      .insert({
        trip_id: tripData.id,
        title: (title || fileName).trim(),
        form_type: 'teacher_requirement',
        description: fields.description || '',
        file_url: fileUrl,
        required: true,
        source: 'teacher',
      })
      .select('id, title, form_type, description, file_url, required, source')
      .single();

    if (insertErr) throw new Error(insertErr.message);
    sendJSON(res, 200, { form: formRecord });
  } catch (err) {
    console.error('Trip upload form error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

async function handleTripRemoveForm(req, res) {
  const supabase = getSupabase();
  try {
    const body = await parseBody(req);
    const { token, form_id } = body;
    if (!token || !form_id) return sendJSON(res, 400, { error: 'Token and form_id required' });

    const { data: tripData } = await supabase
      .from('trips')
      .select('id')
      .eq('direct_link_token', token)
      .single();

    if (!tripData) return sendJSON(res, 404, { error: 'Trip not found' });

    await supabase
      .from('trip_forms')
      .delete()
      .eq('id', form_id)
      .eq('trip_id', tripData.id)
      .eq('source', 'teacher');

    sendJSON(res, 200, { success: true });
  } catch (err) {
    console.error('Remove trip form error:', err.message);
    sendJSON(res, 500, { error: err.message });
  }
}

const apiHandlers = {
  'POST /api/send-sms': handleSendSMS,
  'POST /api/send-email': handleSendEmail,
  'POST /api/send-permission-slip': handleSendPermissionSlip,
  'POST /api/send-bulk-reminders': handleSendBulkReminders,
  'POST /api/upload-form': handleUploadForm,
  'POST /api/discovery/run': handleDiscoveryRun,
  'POST /api/discovery/nearby': handleDiscoveryNearby,
  'POST /api/discovery/geocode': handleDiscoveryGeocode,
  'POST /api/discovery/search': handleDiscoverySearch,
  'POST /api/venue/lookup-user': handleVenueLookupUser,
  'POST /api/venue/upload-experience-form': handleVenueUploadExperienceForm,
  'POST /api/venue/delete-experience-form': handleVenueDeleteExperienceForm,
  'POST /api/venue/get-experience-forms': handleVenueGetExperienceForms,
  'POST /api/venue/get-experience-responses': handleVenueGetExperienceResponses,
  'POST /api/venue/send-teacher-link': handleVenueSendTeacherLink,
  'POST /api/trip/lookup': handleTripLookup,
  'POST /api/trip/submit-consent': handleTripSubmitConsent,
  'POST /api/trip/add-form': handleTripAddForm,
  'POST /api/trip/upload-form': handleTripUploadForm,
  'POST /api/trip/remove-form': handleTripRemoveForm,
  'POST /api/signup/find-or-create-school': handleSignupFindOrCreateSchool,
  'POST /api/signup/find-or-create-district': handleSignupFindOrCreateDistrict,
  'POST /api/signup/find-or-create-venue': handleSignupFindOrCreateVenue,
  'POST /api/signup/link-venue-user': handleSignupLinkVenueUser,
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS' && req.url?.startsWith('/api/')) {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  if (req.url === '/healthz' || (req.url === '/' && req.method === 'HEAD')) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('ok');
  }

  if (req.url?.startsWith('/public/') && req.method === 'GET') {
    const safePath = req.url.split('?')[0].replace(/\.\./g, '');
    const filePath = path.join(import.meta.dirname || '.', safePath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return serveStatic(res, filePath);
    }
  }

  const routeKey = `${req.method} ${req.url?.split('?')[0]}`;
  if (apiHandlers[routeKey]) {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const endpoint = req.url?.split('?')[0] || '';

    if (endpoint.startsWith('/api/signup/') || endpoint.startsWith('/api/trip/')) {
      if (!checkRateLimit(clientIp, endpoint)) {
        return sendJSON(res, 429, { error: 'Too many requests. Please try again later.' });
      }
    } else if (endpoint.startsWith('/api/send-') || endpoint.startsWith('/api/discovery/') || endpoint.startsWith('/api/venue/')) {
      const authed = await verifyAuth(req);
      if (!authed) {
        return sendJSON(res, 401, { error: 'Authentication required' });
      }
      if (!checkRateLimit(clientIp, endpoint)) {
        return sendJSON(res, 429, { error: 'Too many requests. Please try again later.' });
      }
    }

    return apiHandlers[routeKey](req, res);
  }

  if (req.url && !req.url.startsWith('/api/')) {
    for (const route of routes) {
      if (req.url === route.prefix) {
        res.writeHead(301, { Location: route.prefix + '/' });
        return res.end();
      }
    }
  }

  if (IS_PRODUCTION) {
    const url = req.url || '/';
    if (url.startsWith('/venue/') || url === '/venue') {
      serveApp(req, res, 'venue', url.slice('/venue'.length));
    } else if (url.startsWith('/teacher/') || url === '/teacher') {
      serveApp(req, res, 'teacher', url.slice('/teacher'.length));
    } else if (url.startsWith('/parent/') || url === '/parent') {
      serveApp(req, res, 'parent', url.slice('/parent'.length));
    } else if (url.startsWith('/school/') || url === '/school') {
      serveApp(req, res, 'school', url.slice('/school'.length));
    } else {
      serveApp(req, res, 'landing', url);
    }
  } else {
    const target = getTarget(req.url);
    proxy.web(req, res, { target });
  }
});

if (!IS_PRODUCTION) {
  server.on('upgrade', (req, socket, head) => {
    const target = getTarget(req.url);
    proxy.ws(req, socket, head, { target });
  });

  proxy.on('error', (err, req, res) => {
    console.error('Proxy error:', err.message);
    if (res && res.writeHead) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('App is starting up, please refresh in a moment.');
    }
  });
}

server.listen(5000, '0.0.0.0', () => {
  console.log(`TripSlip ${IS_PRODUCTION ? 'Production' : 'Dev'} Server running on http://0.0.0.0:5000`);
  console.log('API Routes:');
  console.log('  POST /api/send-sms');
  console.log('  POST /api/send-email');
  console.log('  POST /api/send-permission-slip');
  console.log('  POST /api/send-bulk-reminders');
  console.log('  POST /api/upload-form');
  console.log('  POST /api/discovery/run');
  console.log('  POST /api/discovery/nearby');
  console.log('  POST /api/discovery/geocode');
  console.log('  POST /api/discovery/search');
  console.log('  POST /api/venue/lookup-user');
  console.log('  POST /api/signup/find-or-create-school');
  console.log('  POST /api/signup/find-or-create-district');
  console.log('  POST /api/signup/find-or-create-venue');
  console.log('  POST /api/signup/link-venue-user');
  console.log('App Routes:');
  console.log('  /          -> landing  (port 3000)');
  console.log('  /venue/*   -> venue    (port 3001)');
  console.log('  /teacher/* -> teacher  (port 3002)');
  console.log('  /parent/*  -> parent   (port 3003)');
  console.log('  /school/*  -> school   (port 4200)');
});
