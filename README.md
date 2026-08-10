# TeamLanding

DENeon team site built with Vue 3, Vue Router and Vite. Project inquiries are
handled by a separate Express API and delivered through server-side SMTP.

## Application structure

- `/` — existing team landing page and member profile modals.
- `/start-project` — project inquiry page.
- `/contact` — short general contact page.
- `POST /api/project-inquiries` — validated inquiry submission.
- `POST /api/contact-messages` — validated general contact message.
- `GET /api/healthz` — API health and SMTP configuration state.
- `src/components/project/ProjectInquiryForm.vue` — accessible form and UI states.
- `server/` — validation, rate limiting, mail composition and API endpoint.
- `shared/projectInquiryOptions.js` — shared allowlists used by frontend and API.

## Local development

Install dependencies and copy the example environment file:

```sh
npm ci
cp .env.example .env
```

Start the API with Nodemailer's JSON transport (it never contacts Gmail):

```sh
npm run dev:api
```

In a second terminal start Vite. Its `/api` proxy points to port `8080`:

```sh
npm run dev
```

Open `http://127.0.0.1:5173/start-project`. Direct page refresh is supported by
Vite locally and Nginx's `try_files ... /index.html` fallback in production.
The same applies to `http://127.0.0.1:5173/contact`.

## Validation and tests

```sh
npm test
npm run build
```

There is no lint script in this repository. Tests cover validation, unknown
select values, honeypot handling, rate limiting, recipient protection, generic
SMTP errors, HTML escaping and successful inquiry IDs.
Contact tests also cover subject allowlisting, minimum message length, recipient
protection, honeypot handling, rate limiting and successful message IDs.

## Production images

`Dockerfile` builds and tests the Vue frontend, then copies `dist` into the
non-root Nginx runtime layout. `Dockerfile.api` packages the Express API. The
production redeploy script tags both images with the Git commit, imports them
into k3s containerd, verifies their presence and only then applies Kubernetes
resources. See `DEPLOYMENT.md` for recovery, verification, logs and rollback.

## Environment variables

See `.env.example`. `SMTP_PASSWORD` and every other non-`VITE_` variable are
read only by the Node API. Never prefix an SMTP value with `VITE_`, because Vite
exposes such variables to the browser bundle.

For Gmail, enable two-step verification and create an App Password for this
service. Use that 16-character App Password as `SMTP_PASSWORD`; do not use the
Google account password. Production stores it in Kubernetes Secret
`team-landing-smtp`, key `SMTP_PASSWORD`. Full deployment commands are in
`DEPLOYMENT.md`.

## API check with mock delivery

With `npm run dev:api` running:

```sh
curl -s http://127.0.0.1:8080/api/healthz

curl -i http://127.0.0.1:8080/api/project-inquiries \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://team.deneon.net' \
  --data '{"fullName":"Test Client","workEmail":"client@example.com","companyName":"Example","companyWebsite":"https://example.com","projectTitle":"Customer platform","projectType":"Web application","projectStage":"Idea or discovery","expertise":["Full-stack development"],"expectedStartDate":"Within 1–3 months","budget":"$15,000–$30,000","description":"We need a secure customer platform with role-based access, reporting and integrations.","relevantLinks":"https://example.com/brief","timezone":"UTC+4","consent":true,"website":"","startedAt":1}'
```

JSON transport writes the generated message to the API process without sending
mail. No automatic client email is generated in this version.

General contact messages use the same SMTP transport and can be checked at
`POST /api/contact-messages`. The server-only recipient is configured with
`CONTACT_MESSAGE_RECIPIENT`; the browser cannot override it.

```sh
curl -i http://127.0.0.1:8080/api/contact-messages \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://team.deneon.net' \
  --data '{"fullName":"Test Contact","email":"contact@example.com","company":"Example","subject":"General inquiry","message":"This is a local JSON transport test message.","consent":true,"website":"","startedAt":1}'
```
