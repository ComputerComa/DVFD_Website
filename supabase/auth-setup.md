# Hosted Supabase Auth setup

This app uses Supabase's built-in email confirmation, invitation, and password recovery flows. No Auth Hook is required for these emails.

In **Authentication → URL Configuration**:

- Set **Site URL** to the production site root, for example `https://your-domain.example`.
- Add `http://localhost:3000/admin/**` for development.
- Add `https://your-domain.example/admin/**` for production.

In **Authentication → Providers → Email**, enable **Confirm email** if administrators should confirm their email addresses before signing in.

In **Authentication → Email Templates**, retain `{{ .ConfirmationURL }}` in confirmation, invitation, and recovery templates. It carries the safe `redirectTo` destination used by the app. If a custom template builds its own URL from `{{ .SiteURL }}`, use `{{ .RedirectTo }}` instead.

For production email delivery, configure a custom SMTP provider under **Authentication → SMTP Settings**. Supabase's default mail service is intended for development/testing.
