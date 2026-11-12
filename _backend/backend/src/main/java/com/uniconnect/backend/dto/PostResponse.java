package com.uniconnect.backend.dto;

import java.time.LocalDateTime;

public class PostResponse {

    private Long id;
    private String title;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Long userId;
    private String userName;

    // Social media details
    private long likeCount;
    private long commentCount;
    private boolean likedByCurrentUser;
    private String attachmentUrl;
    private String attachmentName;
    private String attachmentType;

    public PostResponse(
            Long id,
            String title,
            String content,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            Long userId,
            String userName,
            long likeCount,
            long commentCount,
            boolean likedByCurrentUser) {

            this(id, title, content, createdAt, updatedAt, userId, userName,
                likeCount, commentCount, likedByCurrentUser, null, null, null);
            }

            public PostResponse(
                Long id,
                String title,
                String content,
                LocalDateTime createdAt,
                LocalDateTime updatedAt,
                Long userId,
                String userName,
                long likeCount,
                long commentCount,
                boolean likedByCurrentUser,
                String attachmentUrl,
                String attachmentName,
                String attachmentType) {

        this.id = id;
        this.title = title;
        this.content = content;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.userId = userId;
        this.userName = userName;

        this.likeCount = likeCount;
        this.commentCount = commentCount;
        this.likedByCurrentUser = likedByCurrentUser;
        this.attachmentUrl = attachmentUrl;
        this.attachmentName = attachmentName;
        this.attachmentType = attachmentType;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
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

    public long getLikeCount() {
        return likeCount;
    }

    public long getCommentCount() {
        return commentCount;
    }

    public boolean isLikedByCurrentUser() {
        return likedByCurrentUser;
    }

    public String getAttachmentUrl() {
        return attachmentUrl;
    }

    public String getAttachmentName() {
        return attachmentName;
    }

    public String getAttachmentType() {
        return attachmentType;
    }
}