package com.uniconnect.service;

import com.uniconnect.dto.notification.NotificationResponse;
import com.uniconnect.entity.Notification;
import com.uniconnect.entity.NotificationType;
import com.uniconnect.entity.User;
import com.uniconnect.exception.UserNotFoundException;
import com.uniconnect.repository.NotificationRepository;
import com.uniconnect.repository.UserRepository;
import java.time.Instant;
import java.util.List;
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
public class NotificationService {

    private static final int MAX_PAGE_SIZE = 50;

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public NotificationService(
            UserRepository userRepository, NotificationRepository notificationRepository) {
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(
            UUID recipientId, int page, int size) {
        requireUser(recipientId);
        Pageable pageable =
                PageRequest.of(
                        page,
                        Math.min(size, MAX_PAGE_SIZE),
                        Sort.by(Sort.Direction.DESC, "createdAt")
                                .and(Sort.by(Sort.Direction.DESC, "id")));
        return notificationRepository
                .findByRecipient_IdOrderByCreatedAtDescIdDesc(recipientId, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID recipientId) {
        requireUser(recipientId);
        return notificationRepository.countByRecipient_IdAndIsReadFalse(recipientId);
    }

    @Transactional
    public NotificationResponse markAsRead(UUID notificationId, UUID recipientId) {
        Notification notification =
                notificationRepository
                        .findById(notificationId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found."));
        if (!notification.getRecipient().getId().equals(recipientId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot access this notification.");
        }
        notification.setRead(true);
        notification.setReadAt(Instant.now());
        return toResponse(notificationRepository.save(notification));
    }

    @Transactional
    public int markAllAsRead(UUID recipientId) {
        requireUser(recipientId);
        return notificationRepository.markAllAsRead(recipientId, Instant.now());
    }

    @Transactional
    public void deleteNotification(UUID notificationId, UUID recipientId) {
        if (!notificationRepository.existsByIdAndRecipient_Id(notificationId, recipientId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Notification not found.");
        }
        notificationRepository.deleteById(notificationId);
    }

    @Transactional
    public NotificationResponse createNotification(
            UUID recipientId, UUID actorId, NotificationType type, String message, String linkTarget) {
        User recipient = requireUser(recipientId);
        User actor = requireUser(actorId);
        Notification notification = new Notification(recipient, actor, type, message, linkTarget);
        return toResponse(notificationRepository.saveAndFlush(notification));
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId).orElseThrow(UserNotFoundException::new);
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType().name(),
                notification.getMessage(),
                notification.getLinkTarget(),
                notification.isRead(),
                notification.getCreatedAt(),
                notification.getActor().getId(),
                notification.getActor().getFullName(),
                notification.getActor().getProfileImageUrl());
    }
}