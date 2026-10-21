# Xnovah AI — Next.js Landing Page

A premium, responsive multi-section landing page built with Next.js App Router, React, TypeScript, Tailwind CSS 4, Framer Motion and Lucide icons.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. To verify a production build, run `npm run build`.

## Waitlist configuration (required before collecting emails)

1. Create a Resend account and an Audience.
2. Copy `.env.example` to `.env.local` and set `RESEND_API_KEY` and `RESEND_AUDIENCE_ID`.
3. Restart the development server. Submissions are then stored as Resend contacts.
4. Configure your own privacy policy, consent wording, and launch-email workflows before publicly promoting the waitlist.

The endpoint returns an error if no provider is configured. It does not silently claim to save emails. This starter does not send welcome emails; configure that as a Resend automation or add a verified-domain email flow.

## Connecting MagicAI

MagicAI is a Laravel/PHP application, separate from this Next.js marketing site. Host MagicAI on an app subdomain (e.g. app.yourdomain.com), and this Next.js site on the main domain. Replace the waitlist buttons with login/app links when you're ready. Do not assume the MagicAI installation shares a database or auth session with Next.js.

## Before launch

- Confirm which MagicAI modules and paid extensions are actually installed; update the feature copy accordingly.
- Replace the placeholder `hello@xnovah.ai` contact link with your actual email address.
- Add legal pages and business information, and decide on the official domain.
- Supply product screenshots when the actual MagicAI installation is configured; the workspace shown here is a concept illustration, not a real MagicAI screenshot.
- Review all copy, prices, providers and claims before publishing.

## Design sections

Announcement bar, sticky navigation, editorial hero with CSS planet, marquee, 8-feature grid, interactive concept studio, product story, 3 audience cards, 3-step workflow, AI ecosystem, brand values, accordion FAQ, waitlist CTA, and footer.

## Sources used for feature inspiration

MagicAI product description on CodeCanyon: https://codecanyon.net/item/magicai-openai-content-text-image-chat-code-generator-as-saas/45408109

Original copy and visual design are written for Xnovah, not copied from the vendor website.
