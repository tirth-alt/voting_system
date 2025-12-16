# Google OAuth Setup Guide

This guide walks you through setting up Google OAuth for Dean authentication in the election voting application.

## Prerequisites

- Google Account (use your college email or personal Google account)
- Access to Google Cloud Console

---

## Step 1: Create a Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create New Project**
   - Click the project dropdown in the top navigation bar
   - Click "New Project"
   - **Project Name**: `College Election Voting` (or any name you prefer)
   - **Organization**: Leave as "No organization" (unless you have one)
   - Click "Create"

3. **Wait for Project Creation**
   - Takes 10-30 seconds
   - You'll see a notification when it's ready

---

## Step 2: Enable Google+ API (Required for OAuth)

1. **Navigate to APIs & Services**
   - In the left sidebar, click "APIs & Services" → "Library"
   - Or visit: https://console.cloud.google.com/apis/library

2. **Search for Google+ API**
   - In the search bar, type: `Google+ API`
   - Click on "Google+ API" from the results

3. **Enable the API**
   - Click the blue "Enable" button
   - Wait for it to activate

---

## Step 3: Configure OAuth Consent Screen

1. **Go to OAuth Consent Screen**
   - Left sidebar: "APIs & Services" → "OAuth consent screen"
   - Or visit: https://console.cloud.google.com/apis/credentials/consent

2. **Choose User Type**
   - Select **"External"** (allows any Google account to sign in)
   - Click "Create"

3. **Fill Out App Information**
   
   **App information:**
   - **App name**: `College Election Admin`
   - **User support email**: Your email address
   - **Application logo**: (Optional, skip for now)
   
   **App domain:**
   - **Application home page**: `http://localhost:3000`
   - **Application privacy policy**: (Optional, leave blank for dev)
   - **Application terms of service**: (Optional, leave blank for dev)
   
   **Authorized domains:**
   - Leave blank for localhost development
   
   **Developer contact information:**
   - **Email addresses**: Your email address
   
   Click "Save and Continue"

4. **Scopes**
   - Click "Add or Remove Scopes"
   - Find and select:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
   - Click "Update"
   - Click "Save and Continue"

5. **Test Users** (Optional for External)
   - You can add the Dean's email here for testing
   - Click "Add Users" → Enter Dean's email
   - Click "Save and Continue"

6. **Summary**
   - Review your settings
   - Click "Back to Dashboard"

---

## Step 4: Create OAuth Credentials

1. **Go to Credentials**
   - Left sidebar: "APIs & Services" → "Credentials"
   - Or visit: https://console.cloud.google.com/apis/credentials

2. **Create Credentials**
   - Click "+ Create Credentials" at the top
   - Select "OAuth client ID"

3. **Configure OAuth Client**
   
   **Application type:**
   - Select **"Web application"**
   
   **Name:**
   - Enter: `Election Voting App`
   
   **Authorized JavaScript origins:**
   - Click "+ Add URI"
   - Enter: `http://localhost:3000`
   
   **Authorized redirect URIs:**
   - Click "+ Add URI"
   - Enter: `http://localhost:3000/api/auth/callback/google`
   
   Click "Create"

4. **Save Your Credentials**
   - A modal will appear with your credentials
   - **Client ID**: Looks like `123456789-abcdefg.apps.googleusercontent.com`
   - **Client Secret**: Looks like `GOCSPX-abc123def456`
   
   **⚠️ IMPORTANT**: Copy both of these values NOW - you'll need them in the next step

---

## Step 5: Add Credentials to Your Application

1. **Open Your `.env` File**
   - Navigate to: `/Users/tirth/Desktop/college-election-voting/nextjs-app/.env`

2. **Add the Following Lines**
   ```env
   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret-here
   NEXTAUTH_SECRET=your-random-secret-here
   NEXTAUTH_URL=http://localhost:3000
   
   # Dean Email Whitelist (comma-separated)
   ALLOWED_DEAN_EMAILS=dean@college.edu,assistant.dean@college.edu
   
   # Election Commission Email Whitelist (comma-separated)
   ALLOWED_COMMISSION_EMAILS=commission@college.edu,member@college.edu
   ```

3. **Replace the Placeholders**
   - `GOOGLE_CLIENT_ID`: Paste the Client ID from Step 4
   - `GOOGLE_CLIENT_SECRET`: Paste the Client Secret from Step 4
   - `NEXTAUTH_SECRET`: Generate a random string (see below)
   - `ALLOWED_DEAN_EMAILS`: Replace with actual Dean's email(s)
   - `ALLOWED_COMMISSION_EMAILS`: Replace with Election Commission members' emails

4. **Generate NEXTAUTH_SECRET**
   
   Run this command in your terminal:
   ```bash
   openssl rand -base64 32
   ```
   
   Or visit: https://generate-secret.vercel.app/32
   
   Copy the output and paste it as your `NEXTAUTH_SECRET`

---

## Step 6: Install Required Package

1. **Install NextAuth.js**
   ```bash
   cd /Users/tirth/Desktop/college-election-voting/nextjs-app
   npm install next-auth
   ```

2. **Restart Your Dev Server**
   - Stop the current server (Ctrl+C)
   - Start it again:
   ```bash
   npm run dev
   ```

---

## Step 7: Test the Setup

After implementing the OAuth routes (in the implementation phase), you can test:

1. **Visit the Admin Page**
   - Go to: http://localhost:3000/admin

2. **Click "Sign in with Google"**
   - You should see the Google sign-in popup
   - Select your Google account
   - Grant permissions

3. **Verify Authentication**
   - You should be logged in
   - Check that your role is set to "dean" (if your email is in `ALLOWED_DEAN_EMAILS`)

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Problem**: The redirect URI doesn't match what you configured in Google Cloud

**Solution**:
- Make sure you added: `http://localhost:3000/api/auth/callback/google`
- Check for typos or extra spaces
- Ensure no trailing slash

### Error: "Access blocked: This app's request is invalid"
**Problem**: OAuth consent screen not properly configured

**Solution**:
- Go back to OAuth consent screen in Google Cloud
- Make sure you added scopes for email and profile
- Save changes and try again

### Error: "Invalid client"
**Problem**: Client ID or Secret is incorrect

**Solution**:
- Double-check your `.env` file
- Make sure you copied the full Client ID and Secret
- No extra spaces or quotes around the values

### Dean Can't Sign In (Not Whitelisted)
**Problem**: Dean's email not in `ALLOWED_DEAN_EMAILS`

**Solution**:
- Check `.env` file
- Make sure Dean's email is spelled correctly
- Must match exactly (case-sensitive)
- Restart server after changing `.env`

---

## Security Notes

✅ **Safe to Commit**:
- OAuth consent screen configuration
- Client ID (it's meant to be public)

❌ **NEVER Commit**:
- `GOOGLE_CLIENT_SECRET` (keep in `.env`, add `.env` to `.gitignore`)
- `NEXTAUTH_SECRET`
- Any passwords or sensitive data

---

## For Production Deployment

When deploying to production (not localhost):

1. **Update Authorized Origins**
   - Add your production domain: `https://yourdomain.com`

2. **Update Redirect URIs**
   - Add: `https://yourdomain.com/api/auth/callback/google`

3. **Update `.env` Variables**
   ```env
   NEXTAUTH_URL=https://yourdomain.com
   ```

4. **Verify OAuth Consent Screen**
   - Update app homepage to production URL
   - Consider adding privacy policy and terms of service

---

## Need Help?

- **Google Cloud Console**: https://console.cloud.google.com/
- **NextAuth.js Docs**: https://next-auth.js.org/providers/google
- **Google OAuth Documentation**: https://developers.google.com/identity/protocols/oauth2

---

## Summary Checklist

Before proceeding with code implementation, make sure you have:

- [ ] Created a Google Cloud project
- [ ] Enabled Google+ API
- [ ] Configured OAuth consent screen
- [ ] Created OAuth credentials (Client ID + Secret)
- [ ] Added credentials to `.env` file
- [ ] Generated `NEXTAUTH_SECRET`
- [ ] Added Dean's email to `ALLOWED_DEAN_EMAILS`
- [ ] Installed `next-auth` package
- [ ] Restarted dev server

Once all checked, you're ready for the code implementation! ✅
