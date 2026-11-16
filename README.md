# UniConnect Backend

Initial Spring Boot foundation for the UniConnect team project.

## Requirements

- JDK 25
- Microsoft SQL Server with TCP/IP enabled

## Local SQL Server configuration

The application connects to the existing `UniConnect` database at `localhost:1433` using SQL Server Authentication. Create or use a dedicated SQL Server login that has access to this database; do not use an administrator login for the application. Set `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` in the same terminal session used to launch Spring Boot. `.env.example` documents the expected values, but Spring Boot does not load that file automatically.

For local development in PowerShell, set the connection URL and SQL Server login, then enter the password securely:

```powershell
$env:DB_URL = 'jdbc:sqlserver://localhost:1433;databaseName=UniConnect;encrypt=true;trustServerCertificate=true'
$env:DB_USERNAME = 'your_sql_server_login'
$securePassword = Read-Host 'Enter the SQL Server login password' -AsSecureString
$env:DB_PASSWORD = (New-Object System.Net.NetworkCredential('', $securePassword)).Password
```

`trustServerCertificate=true` is intended only for local development with a self-signed certificate. For production, use a trusted SQL Server certificate and set `trustServerCertificate=false`.

## Local JWT configuration

The JWT signing key must be generated locally. The following PowerShell commands create a Base64-encoded key from 32 cryptographically random bytes and set the three JWT variables for the current terminal session:

```powershell
$randomBytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($randomBytes)
$env:JWT_SECRET_BASE64 = [Convert]::ToBase64String($randomBytes)
$rng.Dispose()
$env:JWT_ACCESS_TOKEN_TTL_SECONDS = '900'
$env:JWT_ISSUER = 'uniconnect-api'
```

Keep the generated key out of source control, logs, screenshots, and shared files. The JWT configuration planned for the next implementation step will require at least 32 random bytes after Base64 decoding. The expiration is in seconds; `900` is 15 minutes.

`.env.example` documents the expected JWT variable names and values, but Spring Boot does not automatically load `.env` or `.env.example`. Set these variables in the same PowerShell session used to launch the application. The current configuration has an empty fallback for the secret so the application can start before JWT key configuration is implemented; token signing and validation are not configured yet.

Because the Spring Security starter is being added before the custom security filter chain, Spring Boot's default web security behavior applies temporarily when the application is run. The next implementation step will replace it with the intended stateless Bearer-token configuration.

Flyway uses the SQL Server database module and applies versioned migrations from `src/main/resources/db/migration`. Hibernate schema generation is set to `validate` so it will not silently create or alter tables.

## Build

From the project root, run:

```powershell
.\mvnw.cmd test
```

The user and profile schema will be introduced through versioned Flyway migrations in a later implementation step.
