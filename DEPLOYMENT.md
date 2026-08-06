# TeamLanding deployment

`TeamLanding` runs in the isolated `team-landing` k3s namespace. Traefik exposes
the site, the existing `letsencrypt-prod` cert-manager ClusterIssuer manages its
certificate, and a non-root `nginx:1.28-alpine` pod serves the static Vite build.

The host keeps the Git checkout at `/opt/deneon/team-landing/source` and exactly
two fixed web slots at `/var/www/team.deneon.net/build-a` and `build-b`. The
`current` symlink is switched atomically only after a successful build. The other
slot is retained as the single rollback target; no timestamped releases are made.

## Redeploy

Run as root on the server:

```sh
/usr/local/bin/redeploy-team-landing
```

The script locks concurrent runs with `flock`, fetches `origin/main`, builds with
an ephemeral `node:24-alpine` container, applies the Kubernetes manifest, waits
for rollout and TLS readiness, and checks both HTTPS and the HTTP redirect. The
container is removed automatically. `node_modules` and `dist` are removed after
each run; no application image, tar archive, release directory, or Docker build
cache is created.

## Operations

```sh
# Status
k3s kubectl get deploy,pod,svc,ingress,certificate -n team-landing

# Application logs
k3s kubectl logs -n team-landing deployment/team-landing --tail=100

# Certificate details
openssl s_client -connect team.deneon.net:443 -servername team.deneon.net </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates -ext subjectAltName

# Project disk usage
du -sh /opt/deneon/team-landing /var/www/team.deneon.net

# Switch to the one retained previous build
/usr/local/bin/redeploy-team-landing --rollback
```

The deployment survives reboots because k3s is enabled as a system service and
the pod uses a Deployment controller. The host-mounted web slots persist across
pod and server restarts.
