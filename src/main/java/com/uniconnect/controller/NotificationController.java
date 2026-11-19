package com.uniconnect.controller;

import com.uniconnect.dto.notification.NotificationResponse;
import com.uniconnect.service.NotificationService;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public Page<NotificationResponse> getNotifications(
            @AuthenticationPrincipal Jwt principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return notificationService.getNotifications(currentUserId(principal), page, size);
    }

    @GetMapping("/unread-count")
    public long getUnreadCount(@AuthenticationPrincipal Jwt principal) {
        return notificationService.getUnreadCount(currentUserId(principal));
    }

    @PutMapping("/{notificationId}/read")
    public NotificationResponse markAsRead(
            @AuthenticationPrincipal Jwt principal, @PathVariable UUID notificationId) {
        return notificationService.markAsRead(notificationId, currentUserId(principal));
    }

    @PutMapping("/read-all")
    @ResponseStatus(HttpStatus.OK)
    public int markAllAsRead(@AuthenticationPrincipal Jwt principal) {
        return notificationService.markAllAsRead(currentUserId(principal));
    }

    @DeleteMapping("/{notificationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteNotification(
            @AuthenticationPrincipal Jwt principal, @PathVariable UUID notificationId) {
        notificationService.deleteNotification(notificationId, currentUserId(principal));
    }

    private static UUID currentUserId(Jwt principal) {
        return UUID.fromString(principal.getSubject());
    }
}