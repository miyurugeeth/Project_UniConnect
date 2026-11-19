package com.uniconnect.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.uniconnect.dto.messaging.DirectMessageResponse;
import com.uniconnect.dto.messaging.SendMessageRequest;
import com.uniconnect.entity.DirectMessage;
import com.uniconnect.entity.Role;
import com.uniconnect.entity.RoleCode;
import com.uniconnect.entity.User;
import com.uniconnect.exception.UserNotFoundException;
import com.uniconnect.repository.DirectMessageRepository;
import com.uniconnect.repository.UserRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class MessagingServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private DirectMessageRepository messageRepository;

    private MessagingService messagingService;

    @BeforeEach
    void setUp() {
        messagingService = new MessagingService(userRepository, messageRepository);
    }

    @Test
    void sendsTrimmedMessageFromTheAuthenticatedUserToTheSelectedRecipient() {
        UUID senderId = UUID.randomUUID();
        UUID recipientId = UUID.randomUUID();
        User sender = user(senderId, "Sender");
        User recipient = user(recipientId, "Recipient");
        UUID messageId = UUID.randomUUID();
        Instant sentAt = Instant.parse("2026-01-01T10:00:00Z");
        when(userRepository.findById(senderId)).thenReturn(Optional.of(sender));
        when(userRepository.findById(recipientId)).thenReturn(Optional.of(recipient));
        when(messageRepository.save(any(DirectMessage.class)))
                .thenAnswer(
                        invocation -> {
                            DirectMessage message = invocation.getArgument(0);
                            ReflectionTestUtils.setField(message, "id", messageId);
                            ReflectionTestUtils.setField(message, "sentAt", sentAt);
                            return message;
                        });

        DirectMessageResponse response =
                messagingService.sendMessage(
                        senderId, recipientId, new SendMessageRequest("  Hello there  "));

        assertEquals(messageId, response.id());
        assertEquals(senderId, response.senderId());
        assertEquals(recipientId, response.recipientId());
        assertEquals("Hello there", response.content());
        assertEquals(sentAt, response.sentAt());
        ArgumentCaptor<DirectMessage> messageCaptor =
                ArgumentCaptor.forClass(DirectMessage.class);
        verify(messageRepository).save(messageCaptor.capture());
        assertEquals(sender, messageCaptor.getValue().getSender());
        assertEquals(recipient, messageCaptor.getValue().getRecipient());
    }

    @Test
    void preventsSendingMessagesToYourselfBeforeAccessingRepositories() {
        UUID userId = UUID.randomUUID();

        ResponseStatusException exception =
                assertThrows(
                        ResponseStatusException.class,
                        () ->
                                messagingService.sendMessage(
                                        userId, userId, new SendMessageRequest("Hello")));

        assertEquals(400, exception.getStatusCode().value());
        verifyNoInteractions(userRepository, messageRepository);
    }

    @Test
    void rejectsMessagesForUnknownRecipients() {
        UUID senderId = UUID.randomUUID();
        UUID missingRecipientId = UUID.randomUUID();
        when(userRepository.findById(senderId)).thenReturn(Optional.of(user(senderId, "Sender")));
        when(userRepository.findById(missingRecipientId)).thenReturn(Optional.empty());

        assertThrows(
                UserNotFoundException.class,
                () ->
                        messagingService.sendMessage(
                                senderId,
                                missingRecipientId,
                                new SendMessageRequest("Hello")));
        verify(messageRepository, org.mockito.Mockito.never()).save(any(DirectMessage.class));
    }

    private static User user(UUID id, String name) {
        User user =
                new User(
                        name,
                        name + "@example.test",
                        "password-hash",
                        new Role(RoleCode.STUDENT));
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }
}
