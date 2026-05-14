# Environment Variables Setup Guide

## Where Environment Variables Are Set

Environment variables are stored in the `.env` file in the root directory of your project.

## Development Mode (Current Setup)

The `.env` file is already configured for development:

- Leave `EMAIL_*` variables **empty or commented out**
- Emails will log to your **server terminal/console** instead of being sent
- Perfect for testing without an SMTP server

To run in development:

```bash
npm start
```

## Production Mode (Gmail SMTP Example)

To send real emails in production, edit the `.env` file and uncomment/fill these values:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=your-email@gmail.com
```

### Getting Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** if not already enabled
3. Go to **App passwords** (at the bottom of Security page)
4. Select **Mail** and **Windows Computer** (or your platform)
5. Google will generate a 16-character **app-specific password**
6. Copy that password and paste it as `EMAIL_PASS` in `.env`
   - Remove spaces if any: `abcd efgh ijkl mnop` → `abcdefghijklmnop`

### Other Email Providers

For other providers (like SendGrid, Mailgun, Outlook):

- Change `EMAIL_HOST` to the provider's SMTP server
- Adjust `EMAIL_PORT` (usually 465 or 587)
- Update `EMAIL_USER` and `EMAIL_PASS` accordingly

## Email Validation Rules

The app now validates:

1. **Email Format**: Must be a valid email (e.g., `name@domain.com`)
2. **Gmail Requirement**: Must be a `@gmail.com` account
3. Both **admin login** and **order placement** require valid Gmail addresses

## Restart After Changes

After editing `.env`, restart the server:

```bash
npm start
```

Changes take effect immediately.
