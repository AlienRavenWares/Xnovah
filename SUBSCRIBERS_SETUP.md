# Xnovah native subscriber collection

Both website forms submit to `/api/waitlist`. The waitlist sends source `early-access` and the dispatch form sends `newsletter`. Records are stored in PostgreSQL with separate `Waitlist` and `Newsletter` source labels. An email may sign up for both lists.

## Required Vercel environment variables

- `DATABASE_URL`: PostgreSQL connection string, including SSL support. Use a managed PostgreSQL database (e.g. Neon) or your own persistent Postgres server. Vercel serverless filesystem is not permanent.
- `XNOVAH_ADMIN_USER`: private admin username.
- `XNOVAH_ADMIN_PASSWORD`: strong random password of at least 16 characters.

Add them to Production (and Preview if desired) in Vercel, then redeploy. Do not commit values to GitHub.

Admin: `https://xnovah-main.vercel.app/admin`. Your browser requests Basic Authentication credentials. The admin page and data endpoint are protected by middleware. Use HTTPS and do not share credentials.

The API creates the `xnovah_subscribers` table automatically when it first receives a signup or admin query. No external email service or Google Sheets integration is used. No marketing emails are sent.

Features: per-source uniqueness, source labels, timestamp, search, source filter, CSV export. The CSV and dashboard currently show the most recent 10,000 records; production scaling should add pagination, rate limiting, unsubscribe/consent tracking, and admin SSO.
