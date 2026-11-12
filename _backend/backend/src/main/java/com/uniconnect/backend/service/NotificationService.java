package com.uniconnect.backend.service;

import com.uniconnect.backend.dto.NotificationResponse;
import com.uniconnect.backend.entity.Notification;
import com.uniconnect.backend.entity.User;
import com.uniconnect.backend.repository.NotificationRepository;
import com.uniconnect.backend.repository.UserRepository;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository) {

        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    // GET ALL MY NOTIFICATIONS
    public List<NotificationResponse> getMyNotifications(
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        return notificationRepository
                .findByUser_EmailOrderByCreatedAtDesc(email)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    // GET MY UNREAD NOTIFICATIONS
    public List<NotificationResponse> getUnreadNotifications(
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        return notificationRepository
                .findByUser_EmailAndIsReadFalseOrderByCreatedAtDesc(email)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    // GET UNREAD COUNT
    public long getUnreadCount(
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        return notificationRepository
                .countByUser_EmailAndIsReadFalse(email);
    }

    // MARK NOTIFICATION AS READ
    @Transactional
    public boolean markAsRead(
            Long notificationId,
            UserDetails userDetails) {

        Notification notification =
                notificationRepository.findById(notificationId)
                        .orElse(null);

        if (notification == null) {
            return false;
        }

        String email = userDetails.getUsername();

        // Make sure notification belongs to current user
        if (!notification.getUser().getEmail().equals(email)) {
            return false;
        }

        notification.setRead(true);

        notificationRepository.save(notification);

        return true;
    }

    // DELETE NOTIFICATION
    @Transactional
    public boolean deleteNotification(
            Long notificationId,
            UserDetails userDetails) {

        Notification notification =
                notificationRepository.findById(notificationId)
                        .orElse(null);

        if (notification == null) {
            return false;
        }

        String email = userDetails.getUsername();

        // Make sure notification belongs to current user
        if (!notification.getUser().getEmail().equals(email)) {
            return false;
        }

        notificationRepository.delete(notification);

        return true;
    }

    // Entity → Response DTO
    private NotificationResponse convertToResponse(
            Notification notification) {

        Long postId = null;

        if (notification.getPost() != null) {
            postId = notification.getPost().getId();
        }

        return new NotificationResponse(
                notification.getId(),
                notification.getMessage(),
                notification.getType(),
                notification.isRead(),
                notification.getCreatedAt(),
                postId
        );
    }
}