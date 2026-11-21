IF OBJECT_ID(N'dbo.industrial_rooms', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.industrial_rooms (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        industry_key NVARCHAR(120) NOT NULL UNIQUE,
        industry_name NVARCHAR(150) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;

IF OBJECT_ID(N'dbo.industrial_room_members', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.industrial_room_members (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        room_id UNIQUEIDENTIFIER NOT NULL,
        user_id UNIQUEIDENTIFIER NOT NULL,
        member_role NVARCHAR(40) NOT NULL DEFAULT 'WORKING_STUDENT',
        joined_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_ind_room_members_room FOREIGN KEY (room_id) REFERENCES dbo.industrial_rooms(id),
        CONSTRAINT FK_ind_room_members_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
        CONSTRAINT UQ_ind_room_user UNIQUE (room_id, user_id)
    );
END;

IF OBJECT_ID(N'dbo.industrial_room_messages', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.industrial_room_messages (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        room_id UNIQUEIDENTIFIER NOT NULL,
        sender_id UNIQUEIDENTIFIER NOT NULL,
        message_text NVARCHAR(2000) NOT NULL,
        sent_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_ind_room_msgs_room FOREIGN KEY (room_id) REFERENCES dbo.industrial_rooms(id),
        CONSTRAINT FK_ind_room_msgs_sender FOREIGN KEY (sender_id) REFERENCES dbo.users(id)
    );
END;