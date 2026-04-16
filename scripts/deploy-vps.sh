#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# AgentisOrchestra -- VPS One-Shot Deploy Script
#
# Usage: Copy this entire script and paste into your VPS terminal.
#        Or: curl -sSL https://raw.githubusercontent.com/agentislab/agentis-orchestra/main/scripts/deploy-vps.sh | bash
#
# Prerequisites: Ubuntu 22.04/24.04 with root access
# =============================================================================

INSTALL_DIR="/opt/agentis-orchestra"
REPO="https://github.com/agentislab/agentis-orchestra.git"
DOMAIN="${ORCHESTRA_DOMAIN:-}"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║       AgentisOrchestra -- VPS Deployer       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# --- Pre-flight checks ---

if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: Run as root (or with sudo)."
  exit 1
fi

echo "[1/7] Checking system..."
if ! command -v apt-get &>/dev/null; then
  echo "ERROR: This script requires Ubuntu/Debian (apt-get)."
  exit 1
fi
echo "  OS: $(lsb_release -ds 2>/dev/null || cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2)"
echo "  RAM: $(free -h | awk '/^Mem:/{print $2}')"
echo "  Disk: $(df -h / | awk 'NR==2{print $4}') free"

# --- Install Docker if missing ---

echo ""
echo "[2/7] Installing Docker..."
if command -v docker &>/dev/null; then
  echo "  Docker already installed: $(docker --version)"
else
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable docker
  systemctl start docker
  echo "  Docker installed: $(docker --version)"
fi

# Verify compose
if ! docker compose version &>/dev/null; then
  echo "ERROR: Docker Compose V2 not found."
  exit 1
fi

# --- Install Git if missing ---

if ! command -v git &>/dev/null; then
  apt-get install -y -qq git
fi

# --- Clone repo ---

echo ""
echo "[3/7] Cloning AgentisOrchestra..."
if [ -d "$INSTALL_DIR/.git" ]; then
  echo "  Directory exists, pulling latest..."
  cd "$INSTALL_DIR"
  git pull --ff-only
else
  git clone "$REPO" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# --- Generate secrets ---

echo ""
echo "[4/7] Generating configuration..."
if [ ! -f .env ]; then
  cp .env.example .env

  # Generate random secrets
  BRIDGE_TOKEN=$(openssl rand -hex 16)
  SECRET=$(openssl rand -hex 32)
  ENCRYPT_KEY=$(openssl rand -hex 32)
  DB_PASS=$(openssl rand -hex 16)

  sed -i "s/BRIDGE_TOKEN=change-me-in-production/BRIDGE_TOKEN=$BRIDGE_TOKEN/" .env
  sed -i "s/NEXTAUTH_SECRET=change-me-in-production/NEXTAUTH_SECRET=$SECRET/" .env
  sed -i "s|ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000000|ENCRYPTION_KEY=$ENCRYPT_KEY|" .env
  sed -i "s/DB_PASSWORD=change-me-in-production/DB_PASSWORD=$DB_PASS/" .env

  # Set domain if provided
  if [ -n "$DOMAIN" ]; then
    echo "DOMAIN=$DOMAIN" >> .env
    echo "  Domain: $DOMAIN"
  fi

  echo "  .env created with random secrets"
else
  echo "  .env already exists (keeping current config)"
fi

# --- Set up firewall ---

echo ""
echo "[5/7] Configuring firewall..."
if command -v ufw &>/dev/null; then
  ufw allow 22/tcp   2>/dev/null || true  # SSH
  ufw allow 80/tcp   2>/dev/null || true  # HTTP
  ufw allow 443/tcp  2>/dev/null || true  # HTTPS
  ufw --force enable 2>/dev/null || true
  echo "  Ports 22, 80, 443 open"
else
  echo "  UFW not installed, skipping firewall config"
fi

# --- Start services ---

echo ""
echo "[6/7] Starting services..."
docker compose -f docker-compose.prod.yml up -d --build

# Wait for health
echo "  Waiting for services to start..."
sleep 15

# --- Verify ---

echo ""
echo "[7/7] Verifying..."

check_service() {
  local name="$1"
  local check="$2"
  if eval "$check" &>/dev/null; then
    echo "  [OK] $name"
  else
    echo "  [!!] $name -- may still be starting"
  fi
}

check_service "Database" "docker compose -f docker-compose.prod.yml exec -T db pg_isready -U agentis"
check_service "Bridge" "curl -sf --max-time 5 http://localhost:3847/health"
check_service "App" "curl -sf --max-time 5 http://localhost:3000/api/health"

# --- Set up daily backup cron ---

CRON_JOB="0 3 * * * cd $INSTALL_DIR && ./scripts/backup.sh >> /var/log/orchestra-backup.log 2>&1"
if ! crontab -l 2>/dev/null | grep -q "orchestra-backup"; then
  (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
  echo ""
  echo "  Daily backup scheduled (3:00 AM)"
fi

# --- Done ---

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║           Deployment Complete                ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
if [ -n "$DOMAIN" ]; then
  echo "  URL:  https://$DOMAIN"
  echo "  (SSL will auto-provision within 60 seconds)"
else
  echo "  URL:  http://$(hostname -I | awk '{print $1}'):3000"
  echo ""
  echo "  To enable SSL, set your domain:"
  echo "    echo 'DOMAIN=orchestra.yourcompany.com' >> $INSTALL_DIR/.env"
  echo "    docker compose -f docker-compose.prod.yml up -d"
fi
echo ""
echo "  Logs:    cd $INSTALL_DIR && make logs"
echo "  Health:  cd $INSTALL_DIR && make health"
echo "  Backup:  cd $INSTALL_DIR && make backup"
echo ""
echo "  Open the URL above to start the setup wizard."
echo ""
