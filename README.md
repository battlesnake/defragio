# defrag

Browser platformer themed as the Win98 Disk Defragmenter.

Repo: <https://github.com/battlesnake/defragio>

## Develop

Serve over HTTP so ES module imports work:

    npm run dev

Then open http://localhost:8080.

## Test

    npm test

## Deploy

Static site served via Caddy (auto-TLS via Let's Encrypt) on a remote server.

First-time setup (installs Caddy, writes Caddyfile, opens ports if ufw is active):

    npm run deploy:setup

Subsequent deploys (rsyncs site files only, ~instant):

    npm run deploy

Defaults to `root@68.183.33.59`, hostname `68.183.33.59.nip.io`. Override
via env vars:

    DEFRAG_HOST=1.2.3.4 DEFRAG_USER=deploy DEFRAG_DOMAIN=foo.example.com npm run deploy:setup
    DEFRAG_HOST=1.2.3.4 DEFRAG_USER=deploy npm run deploy

Check remote status / logs:

    npm run deploy:status
