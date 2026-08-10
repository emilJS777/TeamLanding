# TeamLanding deployment

TeamLanding runs in the isolated `team-landing` k3s namespace. Traefik routes
`/api` to the Node inquiry API and all other paths to the non-root Nginx static
site. Nginx provides SPA history fallback, so `/start-project` and `/contact`
can be refreshed or opened directly. cert-manager manages the existing TLS certificate.

The redeploy script builds the Vite site in `node:24-alpine`, builds
`Dockerfile.api`, imports the API image into k3s containerd, switches the static
build atomically and waits for both Deployments.

## One-time Gmail SMTP secret

Create a Gmail App Password after enabling two-step verification. On the
production server, put it only in Kubernetes Secret `team-landing-smtp`, key
`SMTP_PASSWORD`:

```sh
read -rsp 'Gmail App Password: ' SMTP_APP_PASSWORD; echo
k3s kubectl -n team-landing create secret generic team-landing-smtp \
  --from-literal=SMTP_PASSWORD="$SMTP_APP_PASSWORD" \
  --dry-run=client -o yaml | k3s kubectl apply -f -
unset SMTP_APP_PASSWORD
```

The non-secret SMTP host, user, recipient, sender and origin allowlist are in
the `team-landing-api` ConfigMap in `deploy/k8s.yaml`. Do not commit a Secret
manifest or a real `.env` file.

## First deployment with the API-aware script

Update the installed deployment script once, then redeploy:

```sh
git -C /opt/deneon/team-landing/source fetch origin main
git -C /opt/deneon/team-landing/source show origin/main:deploy/redeploy.sh | \
  install -m 0755 /dev/stdin /usr/local/bin/redeploy-team-landing
/usr/local/bin/redeploy-team-landing
```

Subsequent deployments:

```sh
/usr/local/bin/redeploy-team-landing
```

## Verification

```sh
curl -I https://team.deneon.net/
curl -I https://team.deneon.net/start-project
curl -I https://team.deneon.net/contact
curl -s https://team.deneon.net/api/healthz
curl -i https://team.deneon.net/api/contact-messages \
  -H 'Content-Type: application/json' \
  --data '{"fullName":"Production Check","email":"your-address@example.com","company":"","subject":"General inquiry","message":"This is an intentional production delivery check.","consent":true,"website":"","startedAt":1}'
k3s kubectl get deploy,pod,svc,ingress,certificate -n team-landing
k3s kubectl rollout status deployment/team-landing deployment/team-landing-api -n team-landing
```

The health response must show `"smtpConfigured":true` before a real inquiry is
submitted. To perform a real delivery check, use the API payload documented in
`README.md` against `https://team.deneon.net`; that action sends a real email to
`deneonofficial@gmail.com`.

The same API Deployment handles `POST /api/contact-messages`. Its recipient is
the non-secret `CONTACT_MESSAGE_RECIPIENT` value in the existing ConfigMap. No
additional Kubernetes Secret is required.

## Logs

```sh
k3s kubectl logs -n team-landing deployment/team-landing-api --tail=100
k3s kubectl logs -n team-landing deployment/team-landing --tail=100
k3s kubectl logs -n team-landing deployment/team-landing-api -f
```

The API logs inquiry IDs and short error codes only. It does not log request
bodies, client email addresses or project descriptions.

## Restart and rollback

```sh
k3s kubectl rollout restart deployment/team-landing-api -n team-landing
/usr/local/bin/redeploy-team-landing --rollback
```

The scripted rollback atomically restores the previous static build. API code
is packaged as a local k3s image; for an API rollback, check out the desired Git
commit and run the redeploy script so that image and manifests are rebuilt from
that known commit.

## Secret rotation

Repeat the Secret creation command with the new App Password, then run:

```sh
k3s kubectl rollout restart deployment/team-landing-api -n team-landing
k3s kubectl rollout status deployment/team-landing-api -n team-landing
```
