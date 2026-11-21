package com.uniconnect.industrial.dto;

import java.util.UUID;

public record IndustrialChatMessageRequest(
        UUID roomId,
        UUID senderId,
        String messageText
) {}