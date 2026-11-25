IF COL_LENGTH(N'dbo.users', N'username') IS NULL
BEGIN
    ALTER TABLE dbo.users ADD username VARCHAR(80) NULL;
END;

IF COL_LENGTH(N'dbo.users', N'is_suspended') IS NULL
BEGIN
    ALTER TABLE dbo.users
        ADD is_suspended BIT NOT NULL
            CONSTRAINT df_users_is_suspended DEFAULT (0);
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.users')
        AND name = N'ux_users_username'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX ux_users_username
        ON dbo.users (username)
        WHERE username IS NOT NULL;');
END;
