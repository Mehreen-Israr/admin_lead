# Email Setup Guide

## Quick Fix for Email Errors

The errors you're seeing are because email credentials are not configured in your Render deployment.

## Step-by-Step Setup

### 1. Get Gmail App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Factor Authentication** if not already enabled
3. Go to **App passwords** section
4. Select **Mail** and generate a new password
5. Copy the 16-character password (format: `abcd efgh ijkl mnop`)

### 2. Configure Render Environment Variables

1. Go to your [Render Dashboard](https://dashboard.render.com)
2. Select your backend service
3. Go to **Environment** tab
4. Add these variables:

```
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_SERVICE=gmail
```

### 3. Redeploy

After adding the environment variables, redeploy your service. The email functionality should now work.

## Alternative: Use Email Client Instead

If you don't want to set up email credentials, you can use the "Open Email Client" or "Copy All" buttons in the reply modal. These work without any server configuration.

## Troubleshooting

- **"Email credentials not configured"**: Add EMAIL_USER and EMAIL_PASS environment variables
- **"Invalid credentials"**: Check that you're using an App Password, not your regular Gmail password
- **"Connection timeout"**: Check your internet connection and email settings

## Testing

After setup, try sending a test email from the Contacts page. If it works, you'll see "Email sent successfully!" message.
