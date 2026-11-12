package com.uniconnect.backend.repository;

import com.uniconnect.backend.entity.Message;
import com.uniconnect.backend.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository
        extends JpaRepository<Message, Long> {

    // Messages sent by a user
    List<Message> findBySender(User sender);

    // Messages received by a user
    List<Message> findByReceiver(User receiver);

    // Unread messages received by a user
    long countByReceiverAndIsReadFalse(User receiver);

    // Conversation between two users
    List<Message> findBySenderAndReceiverOrReceiverAndSenderOrderByCreatedAtAsc(
            User sender,
            User receiver,
            User receiver2,
            User sender2
    );
}