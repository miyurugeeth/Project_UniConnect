package com.uniconnect.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Id;
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
        name = "student_post_likes",
        schema = "dbo",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uq_student_post_likes_post_student",
                        columnNames = {"post_id", "student_user_id"}))
public class StudentPostLike {

    @Id
    @UuidGenerator
    @Column(name = "like_id", nullable = false, updatable = false)
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "post_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_student_post_likes_posts"))
    private StudentPost post;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "student_user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_student_post_likes_students"))
    private StudentProfile student;

    @NotNull
    @JdbcTypeCode(SqlTypes.TIMESTAMP)
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected StudentPostLike() {
    }

    public StudentPostLike(StudentPost post, StudentProfile student) {
        this.post = post;
        this.student = student;
    }

    @PrePersist
    private void setCreatedAt() {
        createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public StudentPost getPost() {
        return post;
    }

    public StudentProfile getStudent() {
        return student;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
