# UniConnect frontend

This React application uses Vite for development and production builds. See the
repository [README](../README.md) for database configuration and full-stack setup.

From this directory:

```bash
npm ci
npm run dev
npm test
npm run lint
npm run build
```

During development, Vite proxies `/api` requests to the Spring Boot backend on
`http://localhost:8080`. Set `VITE_API_BASE_URL` only when using a direct API
endpoint instead.
