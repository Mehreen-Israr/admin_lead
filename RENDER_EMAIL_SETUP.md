# 🚀 Render Email Setup Guide

## Quick Setup for Email Functionality

### Step 1: Go to Your Render Dashboard
1. Go to [render.com](https://render.com)
2. Sign in to your account
3. Find your backend service (admin-lead-backend)

### Step 2: Add Environment Variables
1. Click on your backend service
2. Go to the **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add these 3 variables:

```bash
EMAIL_USER=leadmagnet.notifications@gmail.com
EMAIL_PASS=drjipelanfuflzbt
EMAIL_SERVICE=gmail
```

### Step 3: Redeploy
1. After adding the environment variables
2. Click **"Manual Deploy"** or **"Redeploy"**
3. Wait for the deployment to complete

### Step 4: Test
1. Go to your admin dashboard
2. Go to the Contacts page
3. Try to reply to a contact
4. The email should now work!

## 🔧 Environment Variables Explained:

- **EMAIL_USER**: Your Gmail address
- **EMAIL_PASS**: Your Gmail App Password (not your regular password)
- **EMAIL_SERVICE**: Set to "gmail" for Gmail

## 📧 Gmail App Password Setup:

If you need to create a new App Password:

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication if not already enabled
3. Go to "App passwords"
4. Generate a new app password for "Mail"
5. Use the 16-character password (not your regular password)

## ✅ Verification:

After setup, you should see in the Render logs:
```
Email service config loaded: { user: '***@gmail.com', pass: '***', service: 'gmail' }
Email service: Connection verified successfully
```

## 🚨 Troubleshooting:

If you still get "Email service not configured":

1. **Check the environment variables are set correctly**
2. **Make sure you redeployed after adding the variables**
3. **Check the Render logs for any error messages**
4. **Verify the Gmail App Password is correct**

## 📞 Need Help?

The email service will now work automatically when admins reply to contacts. No separate email test page needed!
