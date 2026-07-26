#!/usr/bin/env bash
set -euo pipefail

mode="${1:---quick}"
if [[ "$mode" != "--quick" && "$mode" != "--full" ]]; then
  echo "Usage: scripts/ci-check.sh [--quick|--full]" >&2
  exit 2
fi

project="fonolife-check"
compose_started=false
secondary_app_id=""

cleanup() {
  local status=$?
  if [[ "$compose_started" == "true" ]]; then
    if [[ "$status" -ne 0 ]]; then
      docker compose -p "$project" logs >docker-compose.log 2>&1 || true
    fi
    docker compose -p "$project" down -v --remove-orphans || true
  fi
}
trap cleanup EXIT
rm -f docker-compose.log

node_major="$(node -p "process.versions.node.split('.')[0]")"
if [[ "$node_major" != "24" ]]; then
  echo "Node 24 is required; found $(node --version)." >&2
  exit 1
fi

echo "[1/8] Whitespace"
git -c core.whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol diff --check

echo "[2/8] Repository hygiene and runtime alignment"
npm run repo:hygiene

echo "[3/8] Typecheck"
npm run typecheck

echo "[4/8] Unit, HTTP contract and security tests"
npm test

echo "[5/8] Production build"
npm run build

echo "[6/8] Dependency audit"
npm audit --audit-level=high

echo "[7/8] Graphify AST refresh"
npx --yes @sentropic/graphify@0.17.1 update .

if [[ "$mode" == "--quick" ]]; then
  echo "[8/8] Quick gate complete"
  exit 0
fi

echo "[8/8] PostgreSQL, migrations, seed, smoke, Playwright and axe"
compose_started=true
docker compose -p "$project" up -d --build --wait

docker compose -p "$project" exec -T app node dist/db/migrate.js
docker compose -p "$project" exec -T app node dist/db/migrate.js
docker compose -p "$project" exec -T db createdb -U fonolife fonolife_upgrade
for migration in migrations/*.sql; do
  if [[ "$(basename "$migration")" == "022_idempotency_fingerprints.sql" ]]; then
    break
  fi
  docker compose -p "$project" exec -T db \
    psql -U fonolife -d fonolife_upgrade -v ON_ERROR_STOP=1 <"$migration" >/dev/null
done
for _ in 1 2; do
  docker compose -p "$project" exec -T db \
    psql -U fonolife -d fonolife_upgrade -v ON_ERROR_STOP=1 \
    <migrations/022_idempotency_fingerprints.sql >/dev/null
done
docker compose -p "$project" exec -T db dropdb -U fonolife fonolife_upgrade
docker compose -p "$project" exec -T -e APP_ENV=test app node dist/db/seed.js
docker compose -p "$project" exec -T -e APP_ENV=test app node dist/db/seed.js
docker compose -p "$project" exec -T app node dist/db/seed.js
docker compose -p "$project" exec -T app node dist/db/seed.js
set +e
production_seed_output="$(
  docker compose -p "$project" exec -T -e APP_ENV=production app node dist/db/seed.js 2>&1
)"
production_seed_status=$?
set -e
if [[ "$production_seed_status" -eq 0 ]] || ! grep -q "demo configuration is forbidden in production" <<<"$production_seed_output"; then
  echo "Production demo-seed refusal check failed." >&2
  echo "$production_seed_output" >&2
  exit 1
fi
for _ in 1 2; do
  docker compose -p "$project" exec -T \
    -e DEMO_RESET_CONFIRM=RESET_DEMO \
    -e DEMO_OPERATION_TOKEN=ci-demo-reset-token \
    -e DEMO_RESET_TOKEN=ci-demo-reset-token \
    app npm run demo:reset
done

curl --fail --silent --show-error http://localhost:3000/api/health >/dev/null
secondary_app_id="$(docker compose -p "$project" run -d --no-deps -p 127.0.0.1::3000 app)"
secondary_port="$(
  docker inspect --format \
    '{{(index (index .NetworkSettings.Ports "3000/tcp") 0).HostPort}}' \
    "$secondary_app_id"
)"
secondary_origin="http://localhost:$secondary_port"
for _ in {1..20}; do
  if curl --fail --silent "$secondary_origin/api/health" >/dev/null; then break; fi
  sleep 1
done
curl --fail --silent --show-error "$secondary_origin/api/health" >/dev/null
node tests/dashboard-smoke.mjs
node tests/finance-smoke.mjs
node tests/devsec-smoke.mjs
SECONDARY_ORIGIN="$secondary_origin" node tests/release-concurrency-smoke.mjs

assert_immutable_ledger() {
  local statement="$1"
  local output
  local status
  set +e
  output="$(docker compose -p "$project" exec -T db psql -U fonolife -d fonolife_demo -v ON_ERROR_STOP=1 -c "$statement" 2>&1)"
  status=$?
  set -e
  if [[ "$status" -eq 0 ]] || ! grep -q "histórico financeiro é imutável" <<<"$output"; then
    echo "Financial ledger immutability check failed for: $statement" >&2
    echo "$output" >&2
    exit 1
  fi
}

assert_immutable_ledger "UPDATE financial_entries SET amount_cents=1"
assert_immutable_ledger "DELETE FROM financial_entries"
npm run test:e2e

echo "Full CI gate complete."
