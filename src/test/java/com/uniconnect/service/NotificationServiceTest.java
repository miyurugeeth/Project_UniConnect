package com.uniconnect.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.uniconnect.dto.notification.NotificationResponse;
import com.uniconnect.entity.Notification;
import com.uniconnect.entity.NotificationType;
import com.uniconnect.entity.Role;
import com.uniconnect.entity.RoleCode;
import com.uniconnect.entity.User;
import com.uniconnect.exception.UserNotFoundException;
import com.uniconnect.repository.NotificationRepository;
import com.uniconnect.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private NotificationRepository notificationRepository;
    @InjectMocks private NotificationService notificationService;

    private static final UUID RECIPIENT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID ACTOR_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID NOTIFICATION_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");

    private User recipient() {
        Role role = new Role(RoleCode.STUDENT);
        User user = new User("Recipient", "recipient@example.lk", "hash", role);
        ReflectionTestUtils.setField(user, "id", RECIPIENT_ID);
        return user;
    }

    private User actor() {
        Role role = new Role(RoleCode.STUDENT);
        User user = new User("Actor", "actor@example.lk", "hash", role);
        ReflectionTestUtils.setField(user, "id", ACTOR_ID);
        return user;
    }

    private Notification unreadNotification() {
        Notification notification =
                new Notification(recipient(), actor(), NotificationType.POST_LIKE, "Actor liked your post.", "/student/feed");
        ReflectionTestUtils.setField(notification, "id", NOTIFICATION_ID);
        ReflectionTestUtils.setField(notification, "isRead", false);
        return notification;
    }

    @Test
    void getNotificationsReturnsMappedPageForExistingRecipient() {
        lenient().when(userRepository.findById(RECIPIENT_ID)).thenReturn(Optional.of(recipient()));
        Notification notification = unreadNotification();
        Page<Notification> page = new PageImpl<>(List.of(notification), PageRequest.of(0, 20), 1);
        lenient()
                .when(
                        notificationRepository.findByRecipient_IdOrderByCreatedAtDescIdDesc(
                                eq(RECIPIENT_ID), any()))
                .thenReturn(page);

        Page<NotificationResponse> result = notificationService.getNotifications(RECIPIENT_ID, 0, 20);

        assertEquals(1, result.getTotalElements());
        NotificationResponse response = result.getContent().get(0);
        assertEquals(NOTIFICATION_ID, response.id());
        assertEquals("POST_LIKE", response.type());
        assertEquals("Actor liked your post.", response.message());
        assertEquals("/student/feed", response.linkTarget());
        assertFalse(response.isRead());
        assertEquals(ACTOR_ID, response.actorId());
        assertEquals("Actor", response.actorFullName());
    }

    @Test
    void getNotificationsThrowsWhenRecipientDoesNotExist() {
        lenient().when(userRepository.findById(RECIPIENT_ID)).thenReturn(Optional.empty());

        assertThrows(
                UserNotFoundException.class,
                () -> notificationService.getNotifications(RECIPIENT_ID, 0, 20));
    }

    @Test
    void getUnreadCountReturnsCountForExistingRecipient() {
        lenient().when(userRepository.findById(RECIPIENT_ID)).thenReturn(Optional.of(recipient()));
        lenient()
                .when(
                        notificationRepository.countByRecipient_IdAndIsReadFalse(RECIPIENT_ID))
                .thenReturn(3L);

        long count = notificationService.getUnreadCount(RECIPIENT_ID);

        assertEquals(3L, count);
    }

    @Test
    void markAsReadSetsReadAndReturnsUpdatedNotification() {
        lenient().when(userRepository.findById(RECIPIENT_ID)).thenReturn(Optional.of(recipient()));
        Notification notification = unreadNotification();
        lenient()
                .when(notificationRepository.findById(NOTIFICATION_ID))
                .thenReturn(Optional.of(notification));
        lenient().when(notificationRepository.save(notification)).thenReturn(notification);

        NotificationResponse response = notificationService.markAsRead(NOTIFICATION_ID, RECIPIENT_ID);

        assertTrue(notification.isRead());
        assertEquals(NOTIFICATION_ID, response.id());
        verify(notificationRepository).save(notification);
    }

    @Test
    void markAsReadForbidsWhenNotificationBelongsToAnotherUser() {
        lenient().when(userRepository.findById(RECIPIENT_ID)).thenReturn(Optional.of(recipient()));
        UUID otherId = UUID.fromString("99999999-9999-9999-9999-999999999999");
        Notification notification = unreadNotification();
        lenient()
                .when(notificationRepository.findById(NOTIFICATION_ID))
                .thenReturn(Optional.of(notification));

        assertThrows(
                ResponseStatusException.class,
                () -> notificationService.markAsRead(NOTIFICATION_ID, otherId));
    }

    @Test
    void markAsReadThrowsWhenNotificationNotFound() {
        lenient().when(userRepository.findById(RECIPIENT_ID)).thenReturn(Optional.of(recipient()));
        lenient()
                .when(notificationRepository.findById(NOTIFICATION_ID))
                .thenReturn(Optional.empty());

        assertThrows(
                ResponseStatusException.class,
                () -> notificationService.markAsRead(NOTIFICATION_ID, RECIPIENT_ID));
    }

    @Test
    void markAllAsReadUpdatesAllUnreadNotifications() {
        lenient().when(userRepository.findById(RECIPIENT_ID)).thenReturn(Optional.of(recipient()));
        lenient()
                .when(
                        notificationRepository.markAllAsRead(eq(RECIPIENT_ID), any(Instant.class)))
                .thenReturn(2);

        int updated = notificationService.markAllAsRead(RECIPIENT_ID);

        assertEquals(2, updated);
    }

    @Test
    void deleteNotificationRemovesWhenOwned() {
        lenient()
                .when(
                        notificationRepository.existsByIdAndRecipient_Id(NOTIFICATION_ID,
                                RECIPIENT_ID))
                .thenReturn(true);

        notificationService.deleteNotification(NOTIFICATION_ID, RECIPIENT_ID);

        verify(notificationRepository).deleteById(NOTIFICATION_ID);
    }

    @Test
    void deleteNotificationThrowsWhenNotOwnedOrNotFound() {
        lenient()
                .when(
                        notificationRepository.existsByIdAndRecipient_Id(NOTIFICATION_ID,
                                RECIPIENT_ID))
                .thenReturn(false);

        assertThrows(
                ResponseStatusException.class,
                () -> notificationService.deleteNotification(NOTIFICATION_ID, RECIPIENT_ID));
        verify(notificationRepository, never()).deleteById(NOTIFICATION_ID);
    }

    @Test
    void createNotificationSavesAndReturnsResponse() {
        User recipient = recipient();
        User actor = actor();
        lenient().when(userRepository.findById(RECIPIENT_ID)).thenReturn(Optional.of(recipient));
        lenient().when(userRepository.findById(ACTOR_ID)).thenReturn(Optional.of(actor));
        Notification saved =
                new Notification(
                        recipient,
                        actor,
                        NotificationType.FOLLOW_REQUEST,
                        "Actor started following you.",
                        "/student/profiles/" + ACTOR_ID);
        ReflectionTestUtils.setField(saved, "id", NOTIFICATION_ID);
        lenient()
                .when(notificationRepository.saveAndFlush(any(Notification.class)))
                .thenReturn(saved);

        NotificationResponse response =
                notificationService.createNotification(
                        RECIPIENT_ID, ACTOR_ID, NotificationType.FOLLOW_REQUEST,
                        "Actor started following you.", "/student/profiles/" + ACTOR_ID);

        assertEquals(NOTIFICATION_ID, response.id());
        assertEquals("FOLLOW_REQUEST", response.type());
        assertEquals("Actor started following you.", response.message());
        assertEquals("/student/profiles/" + ACTOR_ID, response.linkTarget());
        assertFalse(response.isRead());
        assertEquals(ACTOR_ID, response.actorId());
        assertEquals("Actor", response.actorFullName());
        verify(notificationRepository).saveAndFlush(any(Notification.class));
    }

    @Test
    void createNotificationThrowsWhenRecipientNotFound() {
        lenient().when(userRepository.findById(RECIPIENT_ID)).thenReturn(Optional.empty());

        assertThrows(
                UserNotFoundException.class,
                () -> notificationService.createNotification(
                        RECIPIENT_ID, ACTOR_ID, NotificationType.POST_LIKE, "msg", "/student/feed"));
    }

    @Test
    void createNotificationThrowsWhenActorNotFound() {
        lenient().when(userRepository.findById(RECIPIENT_ID)).thenReturn(Optional.of(recipient()));
        lenient().when(userRepository.findById(ACTOR_ID)).thenReturn(Optional.empty());

        assertThrows(
                UserNotFoundException.class,
                () -> notificationService.createNotification(
                        RECIPIENT_ID, ACTOR_ID, NotificationType.POST_LIKE, "msg", "/student/feed"));
    }
}
