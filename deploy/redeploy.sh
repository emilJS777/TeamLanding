#!/usr/bin/env bash
set -Eeuo pipefail

readonly REPOSITORY_URL="https://github.com/emilJS777/TeamLanding.git"
readonly BRANCH="main"
readonly APP_ROOT="/opt/deneon/team-landing"
readonly SOURCE_DIR="${APP_ROOT}/source"
readonly WEB_ROOT="/var/www/team.deneon.net"
readonly LOCK_FILE="/run/lock/redeploy-team-landing.lock"
readonly BUILD_IMAGE="node:24-alpine"
readonly NAMESPACE="team-landing"
readonly DOMAIN="team.deneon.net"

log() {
  printf '[team-landing] %s\n' "$*"
}

fail() {
  log "ERROR: $*" >&2
  exit 1
}

atomic_link() {
  local target="$1"
  local link="$2"
  ln -s "$target" "${link}.new"
  mv -Tf "${link}.new" "$link"
}

check_https() {
  curl --fail --silent --show-error --location \
    --retry 8 --retry-delay 3 --retry-all-errors \
    --max-time 15 "https://${DOMAIN}/" >/dev/null
}

rollback() {
  local current_target previous_target
  current_target="$(readlink "${WEB_ROOT}/current" 2>/dev/null || true)"
  previous_target="$(readlink "${WEB_ROOT}/previous" 2>/dev/null || true)"

  [[ "$current_target" =~ ^build-[ab]$ ]] || fail "current release is unavailable"
  [[ "$previous_target" =~ ^build-[ab]$ ]] || fail "previous release is unavailable"
  [[ -f "${WEB_ROOT}/${previous_target}/index.html" ]] || fail "previous release is incomplete"

  atomic_link "$previous_target" "${WEB_ROOT}/current"
  atomic_link "$current_target" "${WEB_ROOT}/previous"

  check_https || {
    atomic_link "$current_target" "${WEB_ROOT}/current"
    atomic_link "$previous_target" "${WEB_ROOT}/previous"
    fail "rollback health check failed; restored original release"
  }

  log "rollback complete: ${previous_target} is active"
}

[[ "${EUID}" -eq 0 ]] || fail "run as root"

for command_name in curl docker flock git k3s rsync; do
  command -v "$command_name" >/dev/null || fail "required command not found: ${command_name}"
done

mkdir -p "$APP_ROOT" "$WEB_ROOT/build-a" "$WEB_ROOT/build-b"
exec 9>"$LOCK_FILE"
flock -n 9 || fail "another redeploy is already running"

if [[ "${1:-}" == "--rollback" ]]; then
  rollback
  exit 0
fi
[[ "$#" -eq 0 ]] || fail "usage: $0 [--rollback]"

cleanup() {
  if [[ -d "$SOURCE_DIR" ]]; then
    rm -rf "${SOURCE_DIR}/node_modules" "${SOURCE_DIR}/dist"
  fi
}
trap cleanup EXIT

if [[ ! -d "${SOURCE_DIR}/.git" ]]; then
  log "cloning ${BRANCH}"
  git clone --branch "$BRANCH" --single-branch "$REPOSITORY_URL" "$SOURCE_DIR"
else
  [[ "$(git -C "$SOURCE_DIR" remote get-url origin)" == "$REPOSITORY_URL" ]] || \
    fail "unexpected Git origin in ${SOURCE_DIR}"
fi

log "updating source from origin/${BRANCH}"
git -C "$SOURCE_DIR" fetch --prune origin "$BRANCH"
git -C "$SOURCE_DIR" checkout -B "$BRANCH" "origin/${BRANCH}"
git -C "$SOURCE_DIR" clean -fdx

log "building with ${BUILD_IMAGE}"
docker run --rm \
  --name team-landing-build \
  --mount "type=bind,src=${SOURCE_DIR},dst=/app" \
  --workdir /app \
  --env CI=true \
  "$BUILD_IMAGE" \
  sh -lc 'npm ci --no-audit --no-fund && npm run build'

[[ -s "${SOURCE_DIR}/dist/index.html" ]] || fail "build did not produce dist/index.html"
[[ -d "${SOURCE_DIR}/dist/assets" ]] || fail "build did not produce dist/assets"

current_target="$(readlink "${WEB_ROOT}/current" 2>/dev/null || true)"
case "$current_target" in
  build-a) next_target="build-b" ;;
  build-b) next_target="build-a" ;;
  *) next_target="build-a" ;;
esac

log "publishing to ${next_target}"
rsync -a --delete "${SOURCE_DIR}/dist/" "${WEB_ROOT}/${next_target}/"

if [[ "$current_target" =~ ^build-[ab]$ ]]; then
  atomic_link "$current_target" "${WEB_ROOT}/previous"
fi
atomic_link "$next_target" "${WEB_ROOT}/current"

restore_previous() {
  if [[ "$current_target" =~ ^build-[ab]$ ]]; then
    atomic_link "$current_target" "${WEB_ROOT}/current"
    log "restored ${current_target} after failed deployment" >&2
  fi
}

log "applying isolated k3s resources"
if ! k3s kubectl apply -f "${SOURCE_DIR}/deploy/k8s.yaml"; then
  restore_previous
  fail "kubectl apply failed"
fi
if ! k3s kubectl rollout status deployment/team-landing -n "$NAMESPACE" --timeout=180s; then
  restore_previous
  fail "deployment rollout failed"
fi
if ! k3s kubectl wait certificate/team-landing-tls -n "$NAMESPACE" \
  --for=condition=Ready --timeout=180s; then
  restore_previous
  fail "TLS certificate did not become ready"
fi

if ! check_https; then
  restore_previous
  fail "HTTPS health check failed"
fi

http_status="$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 15 "http://${DOMAIN}/")"
[[ "$http_status" == "301" || "$http_status" == "308" ]] || {
  restore_previous
  fail "expected HTTP redirect, received ${http_status}"
}

log "deployment complete: https://${DOMAIN} (${next_target}, commit $(git -C "$SOURCE_DIR" rev-parse --short HEAD))"

