package com.uniconnect.backend.dto;

import java.time.LocalDateTime;

public class MessageResponse {

    private Long id;

    private Long senderId;
    private String senderName;

    private Long receiverId;
    private String receiverName;

    private String content;

    private LocalDateTime createdAt;

    private boolean isRead;

    public MessageResponse(
            Long id,
            Long senderId,
            String senderName,
            Long receiverId,
            String receiverName,
            String content,
            LocalDateTime createdAt,
            boolean isRead) {

        this.id = id;
        this.senderId = senderId;
        this.senderName = senderName;
        this.receiverId = receiverId;
        this.receiverName = receiverName;
        this.content = content;
        this.createdAt = createdAt;
        this.isRead = isRead;
    }

    public Long getId() {
        return id;
    }

    public Long getSenderId() {
        return senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public Long getReceiverId() {
        return receiverId;
    }

    public String getReceiverName() {
        return receiverName;
    }

    public String getContent() {
        return content;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public boolean isRead() {
        return isRead;
    }
}