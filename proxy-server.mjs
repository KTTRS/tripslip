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

  const routeKey = `${req.method} ${req.url?.split('?')[0]}`;
  if (apiHandlers[routeKey]) {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const endpoint = req.url?.split('?')[0] || '';

    if (endpoint.startsWith('/api/send-') || endpoint.startsWith('/api/discovery/')) {
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
  console.log('App Routes:');
  console.log('  /          -> landing  (port 3000)');
  console.log('  /venue/*   -> venue    (port 3001)');
  console.log('  /teacher/* -> teacher  (port 3002)');
  console.log('  /parent/*  -> parent   (port 3003)');
  console.log('  /school/*  -> school   (port 4200)');
});
