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
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

@Entity
@Table(
        name = "student_follows",
        schema = "dbo",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uq_student_follows_follower_following",
                        columnNames = {"follower_user_id", "following_user_id"}))
public class StudentFollow {

    @Id
    @UuidGenerator
    @Column(name = "follow_id", nullable = false, updatable = false)
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "follower_user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_student_follows_follower"))
    private StudentProfile follower;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "following_user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_student_follows_following"))
    private StudentProfile following;

    @NotNull
    @Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private FollowStatus status;

    @NotNull
    @JdbcTypeCode(SqlTypes.TIMESTAMP)
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected StudentFollow() {
        this.status = FollowStatus.PENDING;
    }

    public StudentFollow(StudentProfile follower, StudentProfile following) {
        this.follower = follower;
        this.following = following;
        this.status = FollowStatus.PENDING;
    }

    @PrePersist
    private void setCreatedAt() {
        createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public StudentProfile getFollower() {
        return follower;
    }

    public StudentProfile getFollowing() {
        return following;
    }

    public FollowStatus getStatus() {
        return status;
    }

    public void setStatus(FollowStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
