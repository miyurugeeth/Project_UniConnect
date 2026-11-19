package com.uniconnect.repository;

import com.uniconnect.entity.Notification;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @EntityGraph(attributePaths = {"actor"})
    Page<Notification> findByRecipient_IdOrderByCreatedAtDescIdDesc(
            UUID recipientId, Pageable pageable);

    long countByRecipient_IdAndIsReadFalse(UUID recipientId);

    @Transactional
    @Modifying
    @Query(
            """
            update Notification n
            set n.isRead = true, n.readAt = :now
            where n.recipient.id = :recipientId and n.isRead = false
            """)
    int markAllAsRead(@Param("recipientId") UUID recipientId, @Param("now") java.time.Instant now);

    boolean existsByIdAndRecipient_Id(UUID notificationId, UUID recipientId);
}