package com.uniconnect.backend.dto;

import java.time.LocalDateTime;

public class CommentResponse {

    private Long id;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Long userId;
    private String userName;

    private Long postId;

    public CommentResponse(
            Long id,
            String content,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            Long userId,
            String userName,
            Long postId) {

        this.id = id;
        this.content = content;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.userId = userId;
        this.userName = userName;
        this.postId = postId;
    }

    public Long getId() {
        return id;
    }

    public String getContent() {
        return content;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUserName() {
        return userName;
    }

    public Long getPostId() {
        return postId;
    }
}