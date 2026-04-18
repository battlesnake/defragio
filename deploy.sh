#!/usr/bin/env bash
# Deploys the defrag static site to a remote server running Caddy.
#
# Usage:
#   ./deploy.sh             # rsync the site to the server
#   ./deploy.sh --setup     # one-time: install Caddy + write Caddyfile + start
#   ./deploy.sh --status    # show remote caddy status + recent logs
#
# Override via env:
#   DEFRAG_HOST    (default 68.183.33.59)
#   DEFRAG_USER    (default root)
#   DEFRAG_DOMAIN  (default <host>.nip.io)
#   DEFRAG_ROOT    (default /var/www/defrag)
#
# Requires: ssh + rsync locally; Debian/Ubuntu on the remote.

set -euo pipefail

DEFRAG_HOST="${DEFRAG_HOST:-68.183.33.59}"
DEFRAG_USER="${DEFRAG_USER:-root}"
DEFRAG_DOMAIN="${DEFRAG_DOMAIN:-${DEFRAG_HOST}.nip.io}"
DEFRAG_ROOT="${DEFRAG_ROOT:-/var/www/defrag}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

ssh_target="$DEFRAG_USER@$DEFRAG_HOST"

cmd_setup() {
  echo "==> Setting up $ssh_target ($DEFRAG_DOMAIN)"
  # heredoc is sent over ssh; runs as root on the remote.
  ssh -o StrictHostKeyChecking=accept-new "$ssh_target" \
    "DEFRAG_DOMAIN='$DEFRAG_DOMAIN' DEFRAG_ROOT='$DEFRAG_ROOT' bash -s" <<'REMOTE'
set -euo pipefail

# Install Caddy from the official repo if not present.
if ! command -v caddy >/dev/null 2>&1; then
  echo "==> Installing Caddy"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https curl gpg
  curl -fsSL 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -fsSL 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq
  apt-get install -y -qq caddy
else
  echo "==> Caddy already installed: $(caddy version | head -1)"
fi

# Site root.
mkdir -p "$DEFRAG_ROOT"
chown -R caddy:caddy "$DEFRAG_ROOT"

# Caddyfile.
cat > /etc/caddy/Caddyfile <<CADDYFILE
{
  email admin@$DEFRAG_DOMAIN
}

$DEFRAG_DOMAIN {
  root * $DEFRAG_ROOT
  encode gzip
  file_server
  header {
    Cache-Control "public, max-age=300"
    -Server
  }
}
CADDYFILE

# Open ports if ufw is active.
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow 80/tcp >/dev/null
  ufw allow 443/tcp >/dev/null
fi

systemctl enable caddy >/dev/null 2>&1 || true
systemctl restart caddy
sleep 1
systemctl --no-pager --lines=5 status caddy || true
REMOTE
  echo
  echo "==> Setup done. Now run: ./deploy.sh"
  echo "==> Site will be at: https://$DEFRAG_DOMAIN"
}

cmd_deploy() {
  echo "==> Deploying $SCRIPT_DIR → $ssh_target:$DEFRAG_ROOT"
  # Ensure remote root exists (in case --setup hasn't been run).
  ssh -o StrictHostKeyChecking=accept-new "$ssh_target" \
    "mkdir -p '$DEFRAG_ROOT' && chown -R caddy:caddy '$DEFRAG_ROOT' 2>/dev/null || true"

  rsync -az --delete --human-readable \
    --exclude='.git/' \
    --exclude='.gitignore' \
    --exclude='.superpowers/' \
    --exclude='.refs/' \
    --exclude='node_modules/' \
    --exclude='tests/' \
    --exclude='docs/' \
    --exclude='deploy.sh' \
    --exclude='package.json' \
    --exclude='package-lock.json' \
    --exclude='README.md' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    "$SCRIPT_DIR/" "$ssh_target:$DEFRAG_ROOT/"

  # Make sure caddy can read everything we just dropped in.
  ssh "$ssh_target" "chown -R caddy:caddy '$DEFRAG_ROOT' 2>/dev/null || true"

  echo "==> Deployed → https://$DEFRAG_DOMAIN"
}

cmd_status() {
  ssh "$ssh_target" "systemctl --no-pager --lines=20 status caddy; echo; journalctl -u caddy --no-pager -n 30"
}

case "${1:-deploy}" in
  --setup|setup)   cmd_setup ;;
  --status|status) cmd_status ;;
  --deploy|deploy|"") cmd_deploy ;;
  *)
    echo "usage: $0 [--setup|--deploy|--status]" >&2
    exit 2
    ;;
esac
