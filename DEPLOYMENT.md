# TeamLanding production deployment

TeamLanding runs in the isolated `team-landing` namespace on a single-node k3s
host. Traefik routes `/api` to the Express API Service and all other paths to
the Nginx frontend Service. Nginx provides SPA fallback for `/start-project`
and `/contact`.

## Image strategy

Both workloads use immutable images tagged with the deployed Git commit:

```text
docker.io/library/team-landing:<12-character-commit>
docker.io/library/team-landing-api:<12-character-commit>
```

`deploy/redeploy.sh` builds both images with Docker first. Only when both builds
succeed does it export them together and import them into k3s containerd. The
script verifies both exact references in `k3s ctr images list` before rendering
and applying `deploy/k8s.yaml`. Changing the commit tag changes each Pod
template, so Kubernetes creates a new ReplicaSet without relying on a mutable
`:local` tag or a manual rollout restart.

The earlier `ErrImageNeverPull` failure occurred because the API Deployment
referenced `team-landing-api:local` with `imagePullPolicy: Never`, while that
tag was absent from the k3s containerd image store.

## SMTP Secret

The existing Secret must remain:

```text
namespace: team-landing
name: team-landing-smtp
key: SMTP_PASSWORD
```

Redeploy checks only that the Secret and key exist. It never creates, updates,
prints or exports the Secret. Non-secret SMTP settings remain in the
`team-landing-api` ConfigMap.

## Recover the current production deployment

Run as root on the server. This updates the installed script directly from the
reviewed `origin/main` version, then performs the complete build and rollout:

```sh
git -C /opt/deneon/team-landing/source fetch origin main
git -C /opt/deneon/team-landing/source show origin/main:deploy/redeploy.sh | \
  install -m 0755 /dev/stdin /usr/local/bin/redeploy-team-landing
/usr/local/bin/redeploy-team-landing
```

Do not manually delete the working frontend Pod. Kubernetes replaces old Pods
after the imported immutable images are available and removes failed old API
Pods as the new ReplicaSet becomes healthy.

## Normal redeploy

```sh
/usr/local/bin/redeploy-team-landing
```

Preflight fails before mutation when Git, Docker, the Docker daemon, k3s,
kubectl, either Dockerfile or required source files are unavailable. On a later
failure the script prints Deployments, Pods, recent namespace events and safe
API logs, then exits non-zero. It never prints Secret data or Pod environment.

## Verify images and rollout

```sh
k3s ctr images list | grep 'docker.io/library/team-landing'

k3s kubectl get deployment/team-landing \
  deployment/team-landing-api -n team-landing \
  -o custom-columns=NAME:.metadata.name,IMAGE:.spec.template.spec.containers[0].image,READY:.status.readyReplicas

k3s kubectl rollout status deployment/team-landing -n team-landing --timeout=180s
k3s kubectl rollout status deployment/team-landing-api -n team-landing --timeout=180s
k3s kubectl get pods -n team-landing -o wide
```

## Health checks

```sh
curl -I https://team.deneon.net/
curl -I https://team.deneon.net/start-project
curl -I https://team.deneon.net/contact
curl -s https://team.deneon.net/api/healthz
```

The API health response must contain `"status":"ok"` and
`"smtpConfigured":true` before testing a real form submission.

## Logs and diagnostics

```sh
k3s kubectl logs -n team-landing deployment/team-landing-api --tail=100
k3s kubectl logs -n team-landing deployment/team-landing --tail=100
k3s kubectl logs -n team-landing deployment/team-landing-api -f
k3s kubectl get events -n team-landing --sort-by='.lastTimestamp' | tail -n 40
```

Application logs contain message/inquiry IDs and short error codes, not request
bodies, email addresses, SMTP credentials or project descriptions.

## Rollback

Immutable image references remain in ReplicaSet history, so the previous
frontend and API revisions can be restored together:

```sh
/usr/local/bin/redeploy-team-landing --rollback
```

Then verify:

```sh
k3s kubectl rollout status deployment/team-landing -n team-landing --timeout=180s
k3s kubectl rollout status deployment/team-landing-api -n team-landing --timeout=180s
curl -s https://team.deneon.net/api/healthz
```

Keep at least the current and previous commit-tagged images in k3s containerd;
do not prune the previous deployed image before a rollback window has passed.
