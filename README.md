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

**Before starting the backend against a database that needs these migrations:**

1. Verify the selected database is `UniConnect_Test` (or the explicitly intended target).
2. Verify V1 and V2 history and V2 checksum compatibility; confirm the expected pending migration versions.
3. Review V3–V7 and create/verify a restorable database backup.
4. Obtain approval for the database-changing startup. Flyway will run through the normal application startup; do not execute migration SQL manually in SSMS.

Do not modify V1 or V2 to resolve checksum or schema issues. Stop and investigate any unexpected migration history or validation error before proceeding.

## Start the application

First configure the environment variables above in the same terminal/session. Then, from the repository root:

```powershell
.\mvnw.cmd spring-boot:run
```

In another terminal:

```powershell
Set-Location frontend
npm ci
npm run dev
```

The frontend uses the shared Axios API client and defaults to `http://localhost:8080`; set `VITE_API_BASE_URL` when the backend uses another base URL.

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
