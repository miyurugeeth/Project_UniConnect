package com.uniconnect.backend.dto;

import java.time.LocalDateTime;

public class LikeResponse {

    private Long id;
    private Long userId;
    private String userName;
    private Long postId;
    private LocalDateTime createdAt;

    public LikeResponse(
            Long id,
            Long userId,
            String userName,
            Long postId,
            LocalDateTime createdAt) {

        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.postId = postId;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}