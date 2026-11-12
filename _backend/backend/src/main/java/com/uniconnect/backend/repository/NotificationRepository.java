package com.uniconnect.backend.repository;

import com.uniconnect.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    // Get all notifications of a user
    List<Notification> findByUser_EmailOrderByCreatedAtDesc(
            String email
    );

    // Get unread notifications
    List<Notification> findByUser_EmailAndIsReadFalseOrderByCreatedAtDesc(
            String email
    );

    // Count unread notifications
    long countByUser_EmailAndIsReadFalse(
            String email
    );

        void deleteByPost_Id(Long postId);
}