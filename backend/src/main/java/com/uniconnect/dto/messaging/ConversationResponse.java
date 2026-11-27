package com.uniconnect.dto.messaging;

import java.time.Instant;

public record ConversationResponse(
        ChatContactResponse contact,
        String lastMessage,
        Instant lastMessageAt,
        boolean lastMessageFromCurrentUser) {
}
