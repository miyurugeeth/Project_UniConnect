# UniConnect

UniConnect is a Spring Boot and React application for university students. The social networking module supports student profiles and search, category-aware posts and feed filtering, media attachments, likes, and comments.

## Requirements

- JDK 25
- Node.js and npm
- Microsoft SQL Server

## Configuration

Spring Boot does not load `.env` files automatically. Supply the following environment variables through your local development environment or deployment secret manager; never commit or print credential values:

| Variable | Purpose |
| --- | --- |
| `DB_URL` | SQL Server JDBC URL; local default targets `UniConnect_Test` |
| `DB_USERNAME` | SQL Server application login |
| `DB_PASSWORD` | SQL Server application password |
| `JWT_SECRET_BASE64` | Base64-encoded JWT signing key |
| `JWT_ACCESS_TOKEN_TTL_SECONDS` | Access-token lifetime |
| `JWT_ISSUER` | JWT issuer |
| `FRONTEND_ORIGIN` | Allowed frontend origin |
| `SOCIAL_MEDIA_PROVIDER` | Media storage provider; currently `local` |
| `SOCIAL_MEDIA_STORAGE_DIR` | Private local media directory |

Use a dedicated least-privilege database login. For production SQL Server connections, use a trusted certificate and disable `trustServerCertificate`. The local JDBC default is for development only.

## Social networking

- Student profile viewing and student search.
- Student follow/unfollow, follower and following lists, with self-follow prevention and a database uniqueness constraint.
- Authenticated post creation, editing, and deletion, with category selection and latest-first paginated feed.
- API-provided category labels and category filtering.
- Multiple private photo attachments and one video per post; previews and attachment retention/removal are supported during editing.
- Like/unlike controls with a unique database constraint and per-student liked state.
- Paginated comments with author information and owner-only edit/delete operations.
- Authenticated one-to-one messages between users, with user search, conversation history, and a chat box that refreshes new messages every five seconds.
- Notification system: post like/comment notifications, follow-request and follow-accepted notifications, notification bell with unread count, dropdown and dedicated notifications page, mark-as-read / mark-all-as-read / delete, click-to-navigate, and per-user notification isolation.

Student identity for protected post, like, and comment actions comes from the authenticated JWT, not a client-supplied student ID.

## Media storage and limits

The local provider stores files outside the public web root, by default at `${user.home}/.uniconnect/social-media`. Override this with `SOCIAL_MEDIA_STORAGE_DIR`. The `SocialMediaStorageService` abstraction allows a future cloud provider; local storage is the provider currently implemented.

Development defaults:

- Up to 5 attachments per post, including no more than 1 video.
- JPEG, PNG, or GIF images up to 10 MiB each.
- MP4 or WebM videos up to 100 MiB each.
- Total multipart request limit: 150 MiB.
- Image dimensions and pixel count are bounded by backend configuration.

The backend validates content signatures and image dimensions, generates storage keys, and stores only attachment metadata in SQL Server. Client filenames and MIME declarations are not used as storage identities.

## Database migrations

Flyway applies versioned migrations from `src/main/resources/db/migration` during normal application startup. The social schema migrations are:

- V3: post categories, category assignment/backfill, category foreign key, and feed index.
- V4: post attachment metadata.
- V5: likes and the unique post/student constraint.
- V6: comments and post/comment indexes.
- V7: student follow relationships, self-follow check, uniqueness, and follower/following indexes.
- V8: persistent direct messages, participant foreign keys, self-message prevention, and conversation indexes.
- V9: notifications table (recipient, actor, type, message, link target, read state).
- V10: follow status column (`PENDING`/`ACCEPTED`) on `student_follows` for the follow-request/accept flow.

**Before starting the backend against a database that needs these migrations:**

1. Verify the selected database is `UniConnect_Test` (or the explicitly intended target).
2. Verify V1 and V2 history and V2 checksum compatibility; confirm the expected pending migration versions.
3. Review V3–V8 and create/verify a restorable database backup.
4. Obtain approval for the database-changing startup. Flyway will run through the normal application startup; do not execute migration SQL manually in SSMS.

Do not modify V1 or V2 to resolve checksum or schema issues. Stop and investigate any unexpected migration history or validation error before proceeding.

## Start the application

Use the VS Code integrated terminal. The backend and frontend need two separate terminals, and the SQL Server database must be running.

### Terminal 1: backend

Open a terminal from **Terminal → New Terminal**, then run this from the repository root:

```bash
cd /workspaces/Project_UniConnect
./run-backend.sh
```

The script loads the root `.env` file when present. Otherwise, it asks for the SQL Server username and hidden password and generates a private JWT signing key in `~/.uniconnect-jwt-secret` the first time it runs. Maven starts Spring Boot with its full dependency classpath. Keep this terminal open while using the app. Do not start the backend with `debugjava -cp target/classes`; that omits Spring dependencies. The JDBC URL is quoted so its semicolons are not treated as shell command separators.

For a local SQL Server using its default self-signed certificate, use the development-only connection string below. It overrides `DB_URL` from `.env` without changing that file. Do not use `trustServerCertificate=true` for production.

```bash
DB_URL='jdbc:sqlserver://localhost:1433;databaseName=UniConnect_Test;encrypt=true;trustServerCertificate=true' ./run-backend.sh
```

### Terminal 2: frontend

Open a second terminal (**Terminal → New Terminal**) and run:

```bash
cd /workspaces/Project_UniConnect/frontend
npm run dev -- --host 0.0.0.0
```

Open the **Local** URL printed by Vite (usually `http://localhost:5173`; it may choose `5174` if `5173` is busy). If this is a fresh setup and frontend dependencies are missing, run `npm ci` in the `frontend` folder once before starting Vite.

To stop the app, press **Ctrl+C** in both terminals. Closing VS Code also stops the app; reopen the project and repeat these steps when you want to run it again.

During development, Vite proxies `/api` requests to `http://localhost:8080`, avoiding cross-origin issues when Vite selects a different port. Set `VITE_API_BASE_URL` when using a direct API endpoint instead of the development proxy.

## Tests and checks

From the repository root:

```powershell
.\mvnw.cmd test
Set-Location frontend
npm ci
npm test
npm run lint
npm run build
```

The focused social backend tests are `StudentSocialControllerTest`, `StudentSocialServiceTest`, and `LocalSocialMediaStorageServiceTest`. Frontend component tests are run with Vitest.
