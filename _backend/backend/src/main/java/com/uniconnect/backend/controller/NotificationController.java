package com.uniconnect.backend.controller;

import com.uniconnect.backend.dto.NotificationResponse;
import com.uniconnect.backend.service.NotificationService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(
            NotificationService notificationService) {

        this.notificationService = notificationService;
    }

    // GET ALL MY NOTIFICATIONS
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                notificationService.getMyNotifications(userDetails)
        );
    }

    // GET UNREAD NOTIFICATIONS
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationResponse>> getUnreadNotifications(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                notificationService.getUnreadNotifications(userDetails)
        );
    }

    // GET UNREAD COUNT
    @GetMapping("/unread/count")
    public ResponseEntity<Long> getUnreadCount(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                notificationService.getUnreadCount(userDetails)
        );
    }

    // MARK AS READ
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal UserDetails userDetails) {

        boolean updated =
                notificationService.markAsRead(
                        notificationId,
                        userDetails
                );

        if (!updated) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.noContent().build();
    }

    // DELETE NOTIFICATION
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal UserDetails userDetails) {

        boolean deleted =
                notificationService.deleteNotification(
                        notificationId,
                        userDetails
                );

        if (!deleted) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.noContent().build();
    }
}