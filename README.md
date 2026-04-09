# Nitro starter

Create your API and deploy it anywhere with this Nitro starter.

## Getting started

```bash
npm install
npm run dev
```

## Deploying

```bash
npm run build
```

Then checkout the [Nitro documentation](https://v3.nitro.build/deploy) to learn more about the different deployment presets.

## Auth callback URL

This project mounts Better Auth under normal routes at `/auth/*`.

For Google OAuth, configure the callback URL as:

`<BETTER_AUTH_URL>/auth/callback/google`

Local example:

`http://localhost:3000/auth/callback/google`
