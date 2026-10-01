# Deshler Fire & Rescue Auth emails

These are HTML bodies for a hosted Supabase project. In the Supabase Dashboard, go to **Authentication -> Email Templates**, select the matching template, set the subject below, and paste the file contents into the body editor.

> New Supabase Free projects using Supabase's default email sender cannot customize Auth templates. Configure custom SMTP (or use a paid Supabase plan) first if the editor is locked.

| Supabase template | File | Suggested subject |
| --- | --- | --- |
| Confirm sign up | `confirm-signup.html` | Confirm your Deshler Fire & Rescue account |
| Invite user | `invite-user.html` | You are invited to Deshler Fire & Rescue administration |
| Reset password | `reset-password.html` | Reset your Deshler Fire & Rescue password |
| Magic link / OTP | `magic-link.html` | Your Deshler Fire & Rescue sign-in link |
| Change email address | `change-email.html` | Confirm your new email address |
| Password changed notification | `password-changed.html` | Your Deshler Fire & Rescue password was changed |

Before sending production mail, set **Authentication -> URL Configuration -> Site URL** to `https://dvfdne.org` and add `https://dvfdne.org/admin/**` to the redirect allow list. The `{{ .ConfirmationURL }}` placeholder is intentionally left intact: it contains the secure, one-time Supabase link and the approved redirect destination.

The logo is loaded from the public site. If its path changes, update `https://dvfdne.org/dvfd_emblem.png` in each template.
