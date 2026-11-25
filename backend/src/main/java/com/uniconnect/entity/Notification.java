package com.uniconnect.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

@Entity
@Table(
        name = "notifications",
        schema = "dbo",
        indexes = {
            @Index(
                    name = "ix_notifications_recipient_created",
                    columnList = "recipient_user_id, created_at, notification_id"),
            @Index(
                    name = "ix_notifications_recipient_read_created",
                    columnList = "recipient_user_id, is_read, created_at, notification_id")
        })
public class Notification {

    @Id
    @UuidGenerator
    @Column(name = "notification_id", nullable = false, updatable = false)
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "recipient_user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_notifications_recipient"))
    private User recipient;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "actor_user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_notifications_actor"))
    private User actor;

    @NotNull
    @Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private NotificationType type;

    @NotNull
    @Column(name = "message", nullable = false, length = 1000)
    private String message;

    @Column(name = "link_target", length = 500)
    private String linkTarget;

    @NotNull
    @Column(name = "is_read", nullable = false)
    private boolean isRead;

    @NotNull
    @JdbcTypeCode(SqlTypes.TIMESTAMP)
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @JdbcTypeCode(SqlTypes.TIMESTAMP)
    @Column(name = "read_at")
    private Instant readAt;

    protected Notification() {
    }

    public Notification(
            User recipient,
            User actor,
            NotificationType type,
            String message,
            String linkTarget) {
        this.recipient = recipient;
        this.actor = actor;
        this.type = type;
        this.message = message;
        this.linkTarget = linkTarget;
    }

    @PrePersist
    private void setCreatedAt() {
        createdAt = Instant.now();
        isRead = false;
    }

    public UUID getId() {
        return id;
    }

    public User getRecipient() {
        return recipient;
    }

    public User getActor() {
        return actor;
    }

    public NotificationType getType() {
        return type;
    }

    public String getMessage() {
        return message;
    }

    public String getLinkTarget() {
        return linkTarget;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public void setReadAt(Instant readAt) {
        this.readAt = readAt;
    }
}