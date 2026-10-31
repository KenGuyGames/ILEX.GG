ILEX.GG multiplayer cloud service 0.2.0

Deploy only on Render's Free compute plan, backed by a Neon Free PostgreSQL project.
No Render Postgres, persistent disk, paid add-on, credit card, or upgrade is needed.
Render's free service sleeps when inactive and is subject to usage limits. Neon
also has free-plan quotas. This is a small casual beta, not guaranteed availability.

Render configuration:
  Repository: KenGuyGames/ILEX.GG
  Branch: multiplayer-cloud
  Root directory: multiplayer-cloud
  Runtime: Node.js 24
  Build: npm ci --omit=dev && node optimize-engine.cjs && node build-assets.cjs
  Start: node --expose-gc --max-old-space-size=320 server.cjs
  Compute: Free ($0/month)
  Region: Ohio (matching the Neon project's region)
  Secret environment: DATABASE_URL = Neon PostgreSQL connection string
  Health check: /health

DATABASE_URL belongs only in Render's private environment settings. Never put
it in a GitHub file, URL, client script, screenshot, issue, or release archive.
The browser/client calls the public server API and never connects to Neon.

The server requires verified PostgreSQL TLS. It uses transactions for commands,
snapshots, result records and durable duplicate-request receipts. A deployment
epoch prevents an older Render process from modifying state after a new process
has loaded recovery data. One deployed process handles game rooms; do not scale
this beta horizontally. PostgreSQL, not Render's ephemeral disk, owns persistence.

GET /health: liveness (no secrets)
GET /api/info: rules-library fingerprint and public file hashes
POST /api/register, /api/login, /api/recover: account lifecycle
GET /api/state: authenticated player-specific lobby and match state
POST /api/command: authenticated commands with durable request IDs

The browser game is served at /game/ with compressed scripts and the original
public game assets. Card artwork loads directly from its public image sources.
Players can also use the separate local online preview pointed to this service's
HTTPS onrender.com URL. Never enter a database URL in a game client.
The installed Windows app and Android APK do not yet contain this hosted client.

Ranked disabled; custom cards/Cube, clocks/series, spectators, and chat deferred.
Passwords/recovery codes/session tokens are hashed. Full saved matches are private
server data. Reports are stored for the operator; no moderation team is implied.

Tests: npm ci; npm test
Tests run against embedded PostgreSQL (PGlite) with actual ILEX.GG engine files,
not a mock SQL implementation. Live Neon/Render acceptance is still required
after provisioning. Do not claim Internet or external-PC acceptance from local
tests alone.

The initial Free beta is limited to two rooms. Cold startup on the free CPU
can take several minutes. Static card literals are generated as separate JSON
files at build time to keep initialization within the 512 MB limit. All
34,737 registered card entries have matching printed fields and class names
in the compact and original builds; no card data is removed.
