package com.uniconnect.controller;

import com.uniconnect.dto.messaging.ChatContactResponse;
import com.uniconnect.dto.messaging.ConversationResponse;
import com.uniconnect.dto.messaging.DirectMessageResponse;
import com.uniconnect.dto.messaging.SendMessageRequest;
import com.uniconnect.service.MessagingService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/messages")
public class MessagingController {

    private final MessagingService messagingService;

    public MessagingController(MessagingService messagingService) {
        this.messagingService = messagingService;
    }

    @GetMapping("/users")
    public Page<ChatContactResponse> searchUsers(
            @AuthenticationPrincipal Jwt principal,
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return messagingService.searchUsers(currentUserId(principal), q, page, size);
    }

    @GetMapping("/conversations")
    public List<ConversationResponse> getConversations(
            @AuthenticationPrincipal Jwt principal) {
        return messagingService.getConversations(currentUserId(principal));
    }

    @GetMapping("/conversations/{contactId}")
    public Page<DirectMessageResponse> getConversation(
            @AuthenticationPrincipal Jwt principal,
            @PathVariable UUID contactId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return messagingService.getConversation(
                currentUserId(principal), contactId, page, size);
    }

    @PostMapping("/conversations/{contactId}")
    public DirectMessageResponse sendMessage(
            @AuthenticationPrincipal Jwt principal,
            @PathVariable UUID contactId,
            @Valid @RequestBody SendMessageRequest request) {
        return messagingService.sendMessage(
                currentUserId(principal), contactId, request);
    }

    private static UUID currentUserId(Jwt principal) {
        return UUID.fromString(principal.getSubject());
    }
}
