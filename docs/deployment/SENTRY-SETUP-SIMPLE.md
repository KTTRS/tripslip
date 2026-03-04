# Sentry Setup - Super Simple Guide

**Time needed:** 5 minutes  
**What it does:** Tracks errors in your apps so you know when something breaks

## Step 1: Create Account (2 minutes)

1. Go to: https://sentry.io
2. Click the big blue "Get Started" button
3. You'll see 3 options - click "Sign up with email"

**Fill in:**
- Email: [your email]
- Password: [create a password]
- Click "Continue"

4. Check your email for verification
5. Click the verification link

## Step 2: Answer Their Questions (1 minute)

**Question 1: "What's your role?"**
- Answer: **"Engineering"** (just click it)

**Question 2: "What's your team size?"**
- Answer: **"Just me"** or **"2-10"** (doesn't matter, just click one)

**Question 3: "What do you want to monitor?"**
- Answer: **"Web Application"** (click it)

**Question 4: "Organization name"**
- Answer: **"TripSlip"** (type this)
- Click "Continue"

## Step 3: Create Your First Project (2 minutes)

You'll see "Create your first project"

**Fill in these EXACTLY:**

1. **"Select a platform"**
   - Scroll down and click **"React"**

2. **"Set your alert frequency"**
   - Leave it as **"Alert me on every new issue"** (default)

3. **"Project name"**
   - Type: **"tripslip-landing"**

4. **"Team"**
   - Leave as **"#general"** (default)

5. Click the blue **"Create Project"** button

## Step 4: Get Your DSN (30 seconds)

After creating the project, you'll see a page with code.

**Look for a line that says:**
```javascript
dsn: "https://abc123def456@o789.ingest.sentry.io/123456"
```

**Copy that entire URL** (the part in quotes)
- It starts with `https://`
- It has `@` in the middle
- It ends with numbers

**Send me this DSN!**

## Step 5: Skip the Rest (10 seconds)

You'll see a page asking you to install code.

**Just click "Skip" or "I'll do this later"** at the bottom

We'll configure the code later.

## Step 6: Get Your Auth Token (1 minute)

1. Look at the **bottom left** of the screen
2. Click your **profile picture** or **initials**
3. Click **"User settings"**
4. On the left sidebar, click **"Auth Tokens"**
5. Click the blue **"Create New Token"** button

**Fill in:**
- **Name:** Type "TripSlip Deployment"
- **Scopes:** Check these 3 boxes:
  - ☑️ `project:read`
  - ☑️ `project:releases`
  - ☑️ `org:read`
- Click **"Create Token"**

**Copy the token** (starts with `sntrys_`)

⚠️ **IMPORTANT:** Copy it NOW - you can't see it again!

**Send me this token!**

## What to Send Me

After following the steps above, send me these 2 things:

```
SENTRY_DSN=https://abc123@o456.ingest.sentry.io/789
SENTRY_AUTH_TOKEN=sntrys_abc123def456...
```

## That's It!

You're done with Sentry! We'll create the other 4 projects (venue, school, teacher, parent) later if needed, but one DSN works for all apps initially.

## If You Get Stuck

**Can't find the DSN?**
1. Click "Projects" in the left sidebar
2. Click "tripslip-landing"
3. Click "Settings" (gear icon)
4. Click "Client Keys (DSN)"
5. Copy the DSN

**Can't find Auth Tokens?**
1. Click your profile picture (bottom left)
2. Click "User settings"
3. Click "Auth Tokens" in left sidebar

## Why Do We Need Sentry?

When your app breaks (and all apps break sometimes), Sentry tells you:
- What error happened
- Which user experienced it
- What page they were on
- What they were doing
- How to fix it

It's like having a security camera for your code!

## Free Plan

Sentry's free plan includes:
- 5,000 errors per month
- 1 user
- 30 days of history

This is plenty for starting out. You can upgrade later if needed.

---

**Questions?** Just tell me where you got stuck and I'll help!
