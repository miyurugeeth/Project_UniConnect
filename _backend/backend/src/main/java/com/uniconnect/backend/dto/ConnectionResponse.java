package com.uniconnect.backend.dto;

import java.time.LocalDateTime;

public class ConnectionResponse {

    private Long id;

    private Long senderId;
    private String senderName;

    private Long receiverId;
    private String receiverName;

    private String status;
    private LocalDateTime createdAt;

    public ConnectionResponse(
            Long id,
            Long senderId,
            String senderName,
            Long receiverId,
            String receiverName,
            String status,
            LocalDateTime createdAt) {

        this.id = id;
        this.senderId = senderId;
        this.senderName = senderName;
        this.receiverId = receiverId;
        this.receiverName = receiverName;
        this.status = status;
        this.createdAt = createdAt;
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

    public String getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}