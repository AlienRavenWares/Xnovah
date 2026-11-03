# Xnovah signup email notifications

The website's **Waitlist** and **Xnovah Dispatch Newsletter** forms both send submissions to `/api/waitlist`. The server forwards signup notifications through FormSubmit and includes a clear source label.

## Activate the receiving inbox

1. Open `app/api/waitlist/route.ts` in GitHub.
2. Replace `const NOTIFICATION_EMAIL='demo@example.com';` with your actual receiving address, e.g. `const NOTIFICATION_EMAIL='youremail@gmail.com';`.
3. Commit the change to `main` and wait for Vercel to finish deploying.
4. Submit a test email using one of the Xnovah forms.
5. **FormSubmit may send an activation/verification email** to your receiving inbox. Open it and confirm the form before expecting notifications.
6. Test both Waitlist and Newsletter again and check inbox/spam.

The demo address is intentionally blocked: the form returns a configuration error until the address is replaced, rather than sending real users' emails to a placeholder.

## Notification contents

- Subject: `Xnovah — New Waitlist signup` or `Xnovah — New Newsletter signup`
- Subscriber email
- Source
- UTC submission time

## Important limitations

This mode sends notifications **instead of storing subscribers in a database**. The previously created `/admin` dashboard remains in the repo but requires a PostgreSQL `DATABASE_URL` and admin credentials, and will not show email-only submissions. The FormSubmit service is an external delivery dependency. Consider spam/rate-limit protections, consent wording, and a durable subscriber list before scaling. Do not use a demo mailbox to collect real visitor data.
