package com.uniconnect.backend.service;

import com.uniconnect.backend.dto.MessageRequest;
import com.uniconnect.backend.dto.MessageResponse;
import com.uniconnect.backend.entity.Message;
import com.uniconnect.backend.entity.User;
import com.uniconnect.backend.repository.MessageRepository;
import com.uniconnect.backend.repository.UserRepository;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public MessageService(
            MessageRepository messageRepository,
            UserRepository userRepository) {

        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    // =========================================================
    // SEND MESSAGE
    // =========================================================
    public MessageResponse sendMessage(
            Long receiverId,
            MessageRequest request,
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        User sender = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() ->
                        new RuntimeException("Receiver not found"));

        // Cannot send message to yourself
        if (sender.getId().equals(receiver.getId())) {
            throw new RuntimeException(
                    "You cannot send a message to yourself");
        }

        // Check empty message
        if (request.getContent() == null ||
                request.getContent().trim().isEmpty()) {

            throw new RuntimeException(
                    "Message content cannot be empty");
        }

        Message message = new Message();

        message.setSender(sender);
        message.setReceiver(receiver);
        message.setContent(request.getContent());
        message.setCreatedAt(LocalDateTime.now());
        message.setRead(false);

        Message savedMessage =
                messageRepository.save(message);

        return convertToResponse(savedMessage);
    }

    // =========================================================
    // GET CONVERSATION
    // =========================================================
    public List<MessageResponse> getConversation(
            Long userId,
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        User otherUser = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return messageRepository
                .findBySenderAndReceiverOrReceiverAndSenderOrderByCreatedAtAsc(
                        currentUser,
                        otherUser,
                        currentUser,
                        otherUser
                )
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    // =========================================================
    // GET MY SENT MESSAGES
    // =========================================================
    public List<MessageResponse> getMySentMessages(
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return messageRepository
                .findBySender(currentUser)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    // =========================================================
    // GET MY RECEIVED MESSAGES
    // =========================================================
    public List<MessageResponse> getMyReceivedMessages(
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return messageRepository
                .findByReceiver(currentUser)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    // =========================================================
    // MARK MESSAGE AS READ
    // =========================================================
    public MessageResponse markAsRead(
            Long messageId,
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() ->
                        new RuntimeException("Message not found"));

        // Only the receiver can mark the message as read
        if (!message.getReceiver().getId()
                .equals(currentUser.getId())) {

            throw new RuntimeException(
                    "You are not allowed to mark this message as read");
        }

        message.setRead(true);

        Message updatedMessage =
                messageRepository.save(message);

        return convertToResponse(updatedMessage);
    }

    // =========================================================
// DELETE MESSAGE
// =========================================================
public boolean deleteMessage(
        Long messageId,
        UserDetails userDetails) {

    String email = userDetails.getUsername();

    User currentUser = userRepository.findByEmail(email)
            .orElseThrow(() ->
                    new RuntimeException("User not found"));

    Message message = messageRepository.findById(messageId)
            .orElseThrow(() ->
                    new RuntimeException("Message not found"));

    // Only the sender can delete the message
    if (!message.getSender().getId()
            .equals(currentUser.getId())) {

        return false;
    }

    messageRepository.delete(message);

    return true;
}

    // =========================================================
// GET UNREAD MESSAGE COUNT
// =========================================================
public long getUnreadMessageCount(
        UserDetails userDetails) {

    String email = userDetails.getUsername();

    User currentUser = userRepository.findByEmail(email)
            .orElseThrow(() ->
                    new RuntimeException("User not found"));

    return messageRepository
            .countByReceiverAndIsReadFalse(currentUser);
}

    // =========================================================
    // ENTITY → RESPONSE DTO
    // =========================================================
    private MessageResponse convertToResponse(
            Message message) {

        return new MessageResponse(
                message.getId(),

                message.getSender().getId(),
                message.getSender().getName(),

                message.getReceiver().getId(),
                message.getReceiver().getName(),

                message.getContent(),
                message.getCreatedAt(),
                message.isRead()
        );
    }
}