package com.uniconnect.backend.controller;

import com.uniconnect.backend.dto.MessageRequest;
import com.uniconnect.backend.dto.MessageResponse;
import com.uniconnect.backend.service.MessageService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(
            MessageService messageService) {

        this.messageService = messageService;
    }

    // =========================================================
    // SEND MESSAGE
    // =========================================================
    @PostMapping("/send/{receiverId}")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable Long receiverId,
            @RequestBody MessageRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                messageService.sendMessage(
                        receiverId,
                        request,
                        userDetails
                )
        );
    }

    // =========================================================
    // GET CONVERSATION
    // =========================================================
    @GetMapping("/conversation/{userId}")
    public ResponseEntity<List<MessageResponse>> getConversation(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                messageService.getConversation(
                        userId,
                        userDetails
                )
        );
    }

    // =========================================================
    // GET MY SENT MESSAGES
    // =========================================================
    @GetMapping("/sent")
    public ResponseEntity<List<MessageResponse>> getMySentMessages(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                messageService.getMySentMessages(
                        userDetails
                )
        );
    }

    // =========================================================
    // GET MY RECEIVED MESSAGES
    // =========================================================
    @GetMapping("/received")
    public ResponseEntity<List<MessageResponse>> getMyReceivedMessages(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                messageService.getMyReceivedMessages(
                        userDetails
                )
        );
    }

    // =========================================================
// GET UNREAD MESSAGE COUNT
// =========================================================
@GetMapping("/unread-count")
public ResponseEntity<Long> getUnreadMessageCount(
        @AuthenticationPrincipal UserDetails userDetails) {

    return ResponseEntity.ok(
            messageService.getUnreadMessageCount(
                    userDetails
            )
    );
}

    // =========================================================
    // MARK MESSAGE AS READ
    // =========================================================
    @PatchMapping("/{messageId}/read")
    public ResponseEntity<MessageResponse> markAsRead(
            @PathVariable Long messageId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                messageService.markAsRead(
                        messageId,
                        userDetails
                )
        );
    }

    // =========================================================
// DELETE MESSAGE
// =========================================================
@DeleteMapping("/{messageId}")
public ResponseEntity<Void> deleteMessage(
        @PathVariable Long messageId,
        @AuthenticationPrincipal UserDetails userDetails) {

    boolean deleted =
            messageService.deleteMessage(
                    messageId,
                    userDetails
            );

    if (!deleted) {
        return ResponseEntity.status(403).build();
    }

    return ResponseEntity.noContent().build();
}
}