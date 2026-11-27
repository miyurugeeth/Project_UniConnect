package com.uniconnect.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Nationalized;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

@Entity
@Table(
        name = "direct_messages",
        schema = "dbo",
        indexes = {
            @Index(
                    name = "ix_direct_messages_sender_recipient_sent",
                    columnList = "sender_user_id, recipient_user_id, sent_at, message_id"),
            @Index(
                    name = "ix_direct_messages_recipient_sender_sent",
                    columnList = "recipient_user_id, sender_user_id, sent_at, message_id")
        })
public class DirectMessage {

    @Id
    @UuidGenerator
    @Column(name = "message_id", nullable = false, updatable = false)
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "sender_user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_direct_messages_sender"))
    private User sender;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "recipient_user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_direct_messages_recipient"))
    private User recipient;

    @NotBlank
    @Size(max = 2000)
    @Nationalized
    @Column(name = "content", nullable = false, length = 2000)
    private String content;

    @NotNull
    @JdbcTypeCode(SqlTypes.TIMESTAMP)
    @Column(name = "sent_at", nullable = false, updatable = false)
    private Instant sentAt;

    protected DirectMessage() {
    }

    public DirectMessage(User sender, User recipient, String content) {
        this.sender = sender;
        this.recipient = recipient;
        this.content = content;
    }

    @PrePersist
    private void setSentAt() {
        sentAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public User getSender() {
        return sender;
    }

    public User getRecipient() {
        return recipient;
    }

    public String getContent() {
        return content;
    }

    public Instant getSentAt() {
        return sentAt;
    }
}
