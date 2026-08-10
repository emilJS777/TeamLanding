#!/usr/bin/env bash
set -Eeuo pipefail

readonly REPOSITORY_URL="https://github.com/emilJS777/TeamLanding.git"
readonly BRANCH="main"
readonly APP_ROOT="/opt/deneon/team-landing"
readonly SOURCE_DIR="${APP_ROOT}/source"
readonly LOCK_FILE="/run/lock/redeploy-team-landing.lock"
readonly NAMESPACE="team-landing"
readonly DOMAIN="team.deneon.net"
readonly FRONTEND_IMAGE_NAME="docker.io/library/team-landing"
readonly API_IMAGE_NAME="docker.io/library/team-landing-api"

rendered_manifest=""

log() {
  printf '[team-landing] %s\n' "$*"
}

fail() {
  log "ERROR: $*" >&2
  return 1
}

cleanup() {
  if [[ -n "$rendered_manifest" && -f "$rendered_manifest" ]]; then
    rm -f "$rendered_manifest"
  fi
}

diagnose() {
  local exit_code=$?
  local line_number="${1:-unknown}"
  trap - ERR
  log "deployment failed at line ${line_number}; collecting safe diagnostics" >&2
  if command -v k3s >/dev/null 2>&1 && k3s kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
    k3s kubectl get deployment -n "$NAMESPACE" -o wide >&2 || true
    k3s kubectl get pods -n "$NAMESPACE" -o wide >&2 || true
    k3s kubectl get events -n "$NAMESPACE" --sort-by='.lastTimestamp' | tail -n 40 >&2 || true
    k3s kubectl logs -n "$NAMESPACE" deployment/team-landing-api --tail=100 >&2 || true
  fi
  exit "$exit_code"
}

check_https_path() {
  local path="$1"
  curl --fail --silent --show-error --location \
    --retry 8 --retry-delay 3 --retry-all-errors \
    --max-time 15 "https://${DOMAIN}${path}" >/dev/null
}

verify_image() {
  local image="$1"
  k3s ctr images list -q | grep -Fqx "$image" || fail "k3s image store does not contain ${image}"
}

verify_smtp_secret() {
  local state
  state="$(k3s kubectl get secret team-landing-smtp -n "$NAMESPACE" \
    -o go-template='{{if index .data "SMTP_PASSWORD"}}present{{else}}missing{{end}}')"
  [[ "$state" == "present" ]] || fail "team-landing-smtp/SMTP_PASSWORD is missing"
  log "SMTP Secret and required key are present"
}

rollback() {
  log "rolling back frontend and API Deployments"
  k3s kubectl rollout undo deployment/team-landing -n "$NAMESPACE"
  k3s kubectl rollout undo deployment/team-landing-api -n "$NAMESPACE"
  k3s kubectl rollout status deployment/team-landing -n "$NAMESPACE" --timeout=180s
  k3s kubectl rollout status deployment/team-landing-api -n "$NAMESPACE" --timeout=180s
  check_https_path "/"
  check_https_path "/api/healthz"
  log "rollback complete"
}

trap cleanup EXIT
trap 'diagnose "$LINENO"' ERR

[[ "${EUID}" -eq 0 ]] || fail "run as root"
[[ "$#" -le 1 ]] || fail "usage: $0 [--rollback]"
[[ "$#" -eq 0 || "${1:-}" == "--rollback" ]] || fail "usage: $0 [--rollback]"

for command_name in curl docker flock git grep k3s mktemp sed tail; do
  command -v "$command_name" >/dev/null 2>&1 || fail "required command not found: ${command_name}"
done

k3s kubectl version --client >/dev/null 2>&1 || fail "k3s kubectl is unavailable"

mkdir -p "$APP_ROOT"
exec 9>"$LOCK_FILE"
flock -n 9 || fail "another redeploy is already running"

if [[ "${1:-}" == "--rollback" ]]; then
  rollback
  exit 0
fi

docker info >/dev/null 2>&1 || fail "Docker daemon is unavailable"
[[ -d "${SOURCE_DIR}/.git" ]] || fail "Git repository is missing: ${SOURCE_DIR}"
[[ "$(git -C "$SOURCE_DIR" remote get-url origin)" == "$REPOSITORY_URL" ]] || \
  fail "unexpected Git origin in ${SOURCE_DIR}"

log "updating source from origin/${BRANCH}"
git -C "$SOURCE_DIR" fetch --prune origin "$BRANCH"
git -C "$SOURCE_DIR" checkout -B "$BRANCH" "origin/${BRANCH}"
git -C "$SOURCE_DIR" clean -fdx

for required_file in Dockerfile Dockerfile.api package.json package-lock.json deploy/k8s.yaml; do
  [[ -f "${SOURCE_DIR}/${required_file}" ]] || fail "required file is missing: ${required_file}"
done

readonly DEPLOY_TAG="$(git -C "$SOURCE_DIR" rev-parse --short=12 HEAD)"
readonly FRONTEND_IMAGE="${FRONTEND_IMAGE_NAME}:${DEPLOY_TAG}"
readonly API_IMAGE="${API_IMAGE_NAME}:${DEPLOY_TAG}"

verify_smtp_secret

log "building frontend image ${FRONTEND_IMAGE}"
docker build --pull \
  --tag "$FRONTEND_IMAGE" \
  --file "${SOURCE_DIR}/Dockerfile" \
  "$SOURCE_DIR"

log "building API image ${API_IMAGE}"
docker build --pull \
  --tag "$API_IMAGE" \
  --file "${SOURCE_DIR}/Dockerfile.api" \
  "$SOURCE_DIR"

log "importing both images into k3s containerd"
docker save "$FRONTEND_IMAGE" "$API_IMAGE" | k3s ctr images import -

verify_image "$FRONTEND_IMAGE"
verify_image "$API_IMAGE"
log "both images are available in k3s"

rendered_manifest="$(mktemp /tmp/team-landing-k8s.XXXXXX.yaml)"
sed \
  -e "s|__FRONTEND_IMAGE__|${FRONTEND_IMAGE}|g" \
  -e "s|__API_IMAGE__|${API_IMAGE}|g" \
  "${SOURCE_DIR}/deploy/k8s.yaml" >"$rendered_manifest"

grep -Fq "image: ${FRONTEND_IMAGE}" "$rendered_manifest" || fail "frontend image was not rendered"
grep -Fq "image: ${API_IMAGE}" "$rendered_manifest" || fail "API image was not rendered"

log "applying k3s resources for commit ${DEPLOY_TAG}"
k3s kubectl apply -f "$rendered_manifest"

log "waiting for frontend rollout"
k3s kubectl rollout status deployment/team-landing -n "$NAMESPACE" --timeout=180s
log "waiting for API rollout"
k3s kubectl rollout status deployment/team-landing-api -n "$NAMESPACE" --timeout=180s
k3s kubectl wait certificate/team-landing-tls -n "$NAMESPACE" \
  --for=condition=Ready --timeout=180s

check_https_path "/"
check_https_path "/start-project"
check_https_path "/contact"
check_https_path "/api/healthz"

http_status="$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 15 "http://${DOMAIN}/")"
[[ "$http_status" == "301" || "$http_status" == "308" ]] || \
  fail "expected HTTP redirect, received ${http_status}"

log "deployment complete: https://${DOMAIN} (commit ${DEPLOY_TAG})"
