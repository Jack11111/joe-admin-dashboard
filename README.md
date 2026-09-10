# Smoky Mountains Dreams Investments LLC — Operations Dashboard Prototype

A mobile-friendly static dashboard prototype intended for GitHub Pages.

## Login
- Email: `email@email.com`
- Password: `Test123!`

## Main prototype workflow
The Dashboard puts **Send receipts to the bookkeeper** front and center:
1. Choose a property and expense category.
2. Set receipt date and optional amount.
3. Upload one or more receipt documents/images.
4. Add a note.
5. Enter the bookkeeper email.
6. Send.

### Demo vs live email
GitHub Pages only serves static files and cannot securely send arbitrary email attachments by itself. Therefore:
- With no endpoint configured, **Send** records the receipt package locally as `Demo sent`.
- In **Settings → Email delivery**, an HTTPS endpoint can be configured. The app will send a `multipart/form-data` POST containing the receipt metadata and uploaded files.

Expected form fields:
- `property`
- `category`
- `date`
- `amount`
- `note`
- `to`
- `receipts` (one or more files)

A serverless endpoint can later be implemented using services such as Cloudflare Workers, Supabase Edge Functions, Netlify Functions, or another backend, then connected without changing the GitHub Pages hosting model.

## Other prototype areas
- Properties overview
- Repair tracking
- Remodel projects
- Owner tasks
- Bookkeeping history
- CSV receipt export
- Reports placeholders
- Settings for bookkeeper and delivery endpoint

## Deployment
This repository includes a GitHub Pages workflow in `.github/workflows/pages.yml`. Pushes to `main` deploy the static dashboard to GitHub Pages.

## Security warning
The requested prototype credentials are client-side and therefore visible in page source. This hides the UI from casual access only; it is **not production authentication**. Do not store real private financial documents in this version. Replace it with real authentication and protected document storage before production use.
