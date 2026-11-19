package com.uniconnect.service;

import com.uniconnect.dto.messaging.ChatContactResponse;
import com.uniconnect.dto.messaging.ConversationResponse;
import com.uniconnect.dto.messaging.DirectMessageResponse;
import com.uniconnect.dto.messaging.SendMessageRequest;
import com.uniconnect.entity.DirectMessage;
import com.uniconnect.entity.User;
import com.uniconnect.exception.UserNotFoundException;
import com.uniconnect.repository.DirectMessageRepository;
import com.uniconnect.repository.UserRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MessagingService {

    private static final int MAX_PAGE_SIZE = 50;

    private final UserRepository userRepository;
    private final DirectMessageRepository messageRepository;

    public MessagingService(
            UserRepository userRepository, DirectMessageRepository messageRepository) {
        this.userRepository = userRepository;
        this.messageRepository = messageRepository;
    }

    @Transactional(readOnly = true)
    public Page<ChatContactResponse> searchUsers(
            UUID currentUserId, String query, int page, int size) {
        String normalizedQuery = query == null ? "" : query.trim();
        if (normalizedQuery.length() < 2) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Enter at least two characters to search.");
        }

        return userRepository
                .findByFullNameContainingIgnoreCaseAndIdNot(
                        normalizedQuery, currentUserId, pageRequest(page, size, "fullName"))
                .map(MessagingService::toContactResponse);
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversations(UUID currentUserId) {
        Set<UUID> contactIds = new HashSet<>(messageRepository.findDistinctRecipientIds(currentUserId));
        contactIds.addAll(messageRepository.findDistinctSenderIds(currentUserId));
        if (contactIds.isEmpty()) {
            return List.of();
        }

        List<ConversationResponse> conversations = new ArrayList<>();
        for (UUID contactId : contactIds) {
            Page<DirectMessage> latestMessagePage =
                    messageRepository.findConversation(
                            currentUserId,
                            contactId,
                            PageRequest.of(
                                    0,
                                    1,
                                    Sort.by(Sort.Direction.DESC, "sentAt")
                                            .and(Sort.by(Sort.Direction.DESC, "id"))));
            if (latestMessagePage.isEmpty()) {
                continue;
            }

            DirectMessage latestMessage = latestMessagePage.getContent().getFirst();
            User contact =
                    userRepository.findById(contactId).orElseThrow(UserNotFoundException::new);
            conversations.add(
                    new ConversationResponse(
                            toContactResponse(contact),
                            latestMessage.getContent(),
                            latestMessage.getSentAt(),
                            latestMessage.getSender().getId().equals(currentUserId)));
        }
        conversations.sort(
                Comparator.comparing(ConversationResponse::lastMessageAt).reversed());
        return conversations;
    }

    @Transactional(readOnly = true)
    public Page<DirectMessageResponse> getConversation(
            UUID currentUserId, UUID contactId, int page, int size) {
        requireDifferentUsers(currentUserId, contactId);
        requireUser(contactId);
        return messageRepository
                .findConversation(
                        currentUserId,
                        contactId,
                        pageRequest(page, size, "sentAt"))
                .map(MessagingService::toMessageResponse);
    }

    @Transactional
    public DirectMessageResponse sendMessage(
            UUID senderId, UUID recipientId, SendMessageRequest request) {
        requireDifferentUsers(senderId, recipientId);
        User sender = requireUser(senderId);
        User recipient = requireUser(recipientId);
        String content = request.content().trim();

        return toMessageResponse(
                messageRepository.save(new DirectMessage(sender, recipient, content)));
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId).orElseThrow(UserNotFoundException::new);
    }

    private static void requireDifferentUsers(UUID userId, UUID contactId) {
        if (userId.equals(contactId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "You cannot send a message to yourself.");
        }
    }

    private static Pageable pageRequest(int page, int size, String sortProperty) {
        if (page < 0 || size < 1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Page must be zero or greater and size must be positive.");
        }
        return PageRequest.of(
                page,
                Math.min(size, MAX_PAGE_SIZE),
                Sort.by(Sort.Direction.DESC, sortProperty)
                        .and(Sort.by(Sort.Direction.DESC, "id")));
    }

    private static ChatContactResponse toContactResponse(User user) {
        return new ChatContactResponse(
                user.getId(),
                user.getFullName(),
                user.getProfileImageUrl(),
                user.getRole().getCode());
    }

    private static DirectMessageResponse toMessageResponse(DirectMessage message) {
        return new DirectMessageResponse(
                message.getId(),
                message.getSender().getId(),
                message.getRecipient().getId(),
                message.getContent(),
                message.getSentAt());
    }
}
