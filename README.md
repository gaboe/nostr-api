## Description

When running our application in a Docker container, we're experiencing connection timeouts when trying to connect to Nostr relays. The same code works fine on macOS bun, but fails in bun the Docker environment.

Also i have tried using nodejs with polyfill hack, but it didn't work either https://github.com/nbd-wtf/nostr-tools/pull/347

Is this package supossed to work on server?

## Reproduction

1. Run `docker build -t nostr-api .`
2. Run `curl -X POST http://localhost:3000/notification/nostr`

When running locally with `bun run dev` it works
