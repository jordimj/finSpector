#!/bin/zsh

set -euo pipefail

umask 077

readonly SCRIPT_DIR="${0:A:h}"
readonly REPO_ROOT="${SCRIPT_DIR:h}"
readonly SERVICE_LABEL="com.finhunter.local-app"
readonly LAUNCH_DOMAIN="gui/$(/usr/bin/id -u)"
readonly SERVICE_TARGET="${LAUNCH_DOMAIN}/${SERVICE_LABEL}"
readonly PLIST_PATH="${HOME}/Library/LaunchAgents/${SERVICE_LABEL}.plist"
readonly APPLICATION_SUPPORT_DIR="${HOME}/Library/Application Support/FinHunter"
readonly RUNTIME_ROOT="${APPLICATION_SUPPORT_DIR}/runtime"
readonly LOG_DIR="${HOME}/Library/Logs/FinHunter"
readonly LOG_PATH="${LOG_DIR}/service.log"
readonly APP_URL="http://localhost:4400"
readonly HEALTH_URL="http://127.0.0.1:4400/health"
readonly MAX_LOG_BYTES=5242880

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"

main() {
  case "${1:-}" in
    deploy)
      deploy_service
      ;;
    install)
      install_service
      ;;
    run)
      run_service
      ;;
    status)
      show_status
      ;;
    uninstall)
      uninstall_service
      ;;
    *)
      print_usage
      return 1
      ;;
  esac
}

install_service() {
  ensure_source_checkout
  load_node
  prepare_release
  write_launch_agent

  if service_is_loaded; then
    /bin/launchctl bootout "${SERVICE_TARGET}"
  fi

  /bin/launchctl bootstrap "${LAUNCH_DOMAIN}" "${PLIST_PATH}"
  /bin/launchctl enable "${SERVICE_TARGET}"
  /bin/launchctl kickstart -k "${SERVICE_TARGET}"
  wait_for_app

  print "FinHunter is installed and running at ${APP_URL}"
}

deploy_service() {
  ensure_source_checkout

  if [[ ! -f "${PLIST_PATH}" ]] || ! service_is_loaded; then
    print -u2 "FinHunter is not installed. Run corepack pnpm app:local:install first."
    return 1
  fi

  load_node
  prepare_release
  /bin/launchctl kickstart -k "${SERVICE_TARGET}"
  wait_for_app

  print "FinHunter was deployed successfully at ${APP_URL}"
}

run_service() {
  prepare_logs
  print "[$(/bin/date -u '+%Y-%m-%dT%H:%M:%SZ')] Starting FinHunter"

  load_node
  ensure_postgres

  if [[ ! -f "${REPO_ROOT}/apps/web/dist/index.html" ]]; then
    print -u2 "The web build is missing. Run corepack pnpm app:local:deploy."
    return 1
  fi

  cd "${REPO_ROOT}"
  export ALLOWED_HOSTS="localhost,127.0.0.1"
  export CORS_ORIGIN="http://localhost:4400,http://127.0.0.1:4400"
  export HOST="127.0.0.1"
  export LOG_LEVEL="warn"
  export PORT="4400"
  export WEB_DIST_DIR="${REPO_ROOT}/apps/web/dist"

  exec corepack pnpm --filter @finance/api start
}

show_status() {
  if service_is_loaded; then
    print "LaunchAgent: loaded"
  else
    print "LaunchAgent: not loaded"
  fi

  cd "${REPO_ROOT}"

  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    if docker compose ps --status running --services | /usr/bin/grep -qx postgres; then
      print "PostgreSQL: running"
    else
      print "PostgreSQL: not running"
    fi
  else
    print "Docker Desktop: not running"
  fi

  if /usr/bin/curl --fail --silent --max-time 2 "${HEALTH_URL}" >/dev/null; then
    print "FinHunter: reachable at ${APP_URL}"
  else
    print "FinHunter: not reachable"
  fi

  print "Logs: ${LOG_PATH}"
}

uninstall_service() {
  if service_is_loaded; then
    /bin/launchctl bootout "${SERVICE_TARGET}"
  fi

  if [[ -f "${PLIST_PATH}" ]]; then
    /bin/rm "${PLIST_PATH}"
  fi

  if [[ -d "${APPLICATION_SUPPORT_DIR}" ]]; then
    /bin/rm -rf "${APPLICATION_SUPPORT_DIR}"
  fi

  print "FinHunter LaunchAgent and deployed runtime removed. PostgreSQL and its data volume were left unchanged."
}

prepare_release() {
  cd "${REPO_ROOT}"

  corepack pnpm install --frozen-lockfile
  corepack pnpm typecheck
  corepack pnpm web:build
  ensure_postgres
  corepack pnpm db:migrate
  sync_runtime
}

sync_runtime() {
  print "Deploying the local runtime to ${RUNTIME_ROOT}..."
  /bin/mkdir -p "${RUNTIME_ROOT}"
  /bin/chmod 700 "${APPLICATION_SUPPORT_DIR}" "${RUNTIME_ROOT}"

  /usr/bin/rsync -a --delete --delete-excluded \
    --exclude '.agents/' \
    --exclude '.codex/' \
    --exclude '.DS_Store' \
    --exclude '.git/' \
    --exclude 'node_modules/' \
    --exclude 'packages/importer/src/data/' \
    "${REPO_ROOT}/" "${RUNTIME_ROOT}/"

  /bin/chmod 700 "${APPLICATION_SUPPORT_DIR}" "${RUNTIME_ROOT}"

  if [[ -f "${RUNTIME_ROOT}/.env" ]]; then
    /bin/chmod 600 "${RUNTIME_ROOT}/.env"
  fi

  cd "${RUNTIME_ROOT}"
  corepack pnpm install --frozen-lockfile
}

load_node() {
  if [[ -s "${HOME}/.nvm/nvm.sh" ]]; then
    export NVM_DIR="${HOME}/.nvm"
    set +u
    source "${NVM_DIR}/nvm.sh"
    nvm use --silent default >/dev/null
    set -u
  fi

  if ! command -v corepack >/dev/null 2>&1; then
    print -u2 "Corepack is unavailable. Configure an NVM default Node version first."
    return 1
  fi
}

ensure_postgres() {
  ensure_docker
  cd "${REPO_ROOT}"
  docker compose up -d postgres

  for _attempt in {1..60}; do
    if docker compose exec -T postgres \
      pg_isready -U finance -d finance_app >/dev/null 2>&1; then
      return 0
    fi

    /bin/sleep 2
  done

  print -u2 "PostgreSQL did not become ready within two minutes."
  return 1
}

ensure_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    print -u2 "Docker CLI is unavailable. Install Docker Desktop first."
    return 1
  fi

  if docker info >/dev/null 2>&1; then
    return 0
  fi

  print "Starting Docker Desktop..."
  /usr/bin/open -gj -a Docker || true

  for _attempt in {1..90}; do
    if docker info >/dev/null 2>&1; then
      return 0
    fi

    /bin/sleep 2
  done

  print -u2 "Docker Desktop did not become ready within three minutes."
  return 1
}

write_launch_agent() {
  local escaped_script_path

  escaped_script_path="$(xml_escape "${RUNTIME_ROOT}/scripts/local-app.zsh")"
  /bin/mkdir -p "${HOME}/Library/LaunchAgents"

  /bin/cat > "${PLIST_PATH}" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>KeepAlive</key>
  <true/>
  <key>Label</key>
  <string>${SERVICE_LABEL}</string>
  <key>ProcessType</key>
  <string>Background</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>${escaped_script_path}</string>
    <string>run</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>ThrottleInterval</key>
  <integer>15</integer>
</dict>
</plist>
EOF

  /bin/chmod 600 "${PLIST_PATH}"
  /usr/bin/plutil -lint "${PLIST_PATH}"
}

prepare_logs() {
  /bin/mkdir -p "${LOG_DIR}"
  /bin/chmod 700 "${LOG_DIR}"

  if [[ -f "${LOG_PATH}" ]] &&
    (( $(/usr/bin/stat -f '%z' "${LOG_PATH}") >= MAX_LOG_BYTES )); then
    /bin/mv -f "${LOG_PATH}" "${LOG_PATH}.1"
  fi

  /usr/bin/touch "${LOG_PATH}"
  /bin/chmod 600 "${LOG_PATH}"
  exec >> "${LOG_PATH}" 2>&1
}

wait_for_app() {
  for _attempt in {1..60}; do
    if /usr/bin/curl --fail --silent --max-time 2 "${HEALTH_URL}" >/dev/null; then
      return 0
    fi

    /bin/sleep 1
  done

  print -u2 "FinHunter did not become healthy. Check ${LOG_PATH}."
  return 1
}

service_is_loaded() {
  /bin/launchctl print "${SERVICE_TARGET}" >/dev/null 2>&1
}

ensure_source_checkout() {
  if [[ "${REPO_ROOT}" == "${RUNTIME_ROOT}" ]]; then
    print -u2 "Run install and deploy commands from the FinHunter source checkout."
    return 1
  fi
}

xml_escape() {
  print -r -- "$1" | /usr/bin/sed \
    -e 's/&/\&amp;/g' \
    -e 's/</\&lt;/g' \
    -e 's/>/\&gt;/g' \
    -e 's/"/\&quot;/g' \
    -e "s/'/\&apos;/g"
}

print_usage() {
  print -u2 "Usage: zsh scripts/local-app.zsh <install|deploy|run|status|uninstall>"
}

main "$@"
