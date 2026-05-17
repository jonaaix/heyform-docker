# HeyForm Docker

A short Docker setup for a self-hosted HeyForm instance.

## Quick start

1. Prepare files and start the stack:

```bash
cp compose.example.yaml compose.yaml
cp .env.example .env
```

2. Adjust values in `.env` (e.g. `DOMAIN`, secrets, passwords).
3. Restart the stack:

```bash
docker compose up -d && docker compose logs -f
```

## Notes

- The `main-proxy` network must already exist as an external network.
- Reverse proxy labels are preconfigured for Caddy.
