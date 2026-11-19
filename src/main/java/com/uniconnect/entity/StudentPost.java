package com.uniconnect.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
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
@Table(name = "student_posts", schema = "dbo")
public class StudentPost {

    @Id
    @UuidGenerator
    @Column(name = "post_id", nullable = false, updatable = false)
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "author_user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_student_posts_users"))
    private User author;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "category_code",
            referencedColumnName = "category_code",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_student_posts_post_categories"))
    private PostCategory category;

    @NotBlank
    @Size(max = 5000)
    @Nationalized
    @Column(name = "content", nullable = false, length = 5000)
    private String content;

    @Size(max = 2048)
    @Nationalized
    @Column(name = "image_url", length = 2048)
    private String imageUrl;

    @NotNull
    @JdbcTypeCode(SqlTypes.TIMESTAMP)
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @NotNull
    @JdbcTypeCode(SqlTypes.TIMESTAMP)
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected StudentPost() {
    }

    public StudentPost(
            User author, String content, String imageUrl, PostCategory category) {
        this.author = author;
        this.content = content;
        this.imageUrl = imageUrl;
        this.category = category;
    }

    public StudentPost(
            StudentProfile author, String content, String imageUrl, PostCategory category) {
        this(author.getUser(), content, imageUrl, category);
    }

    @PrePersist
    private void setCreatedAndUpdatedAt() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    private void setUpdatedAt() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public User getAuthor() {
        return author;
    }

    public PostCategory getCategory() {
        return category;
    }

    public void setCategory(PostCategory category) {
        this.category = category;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
