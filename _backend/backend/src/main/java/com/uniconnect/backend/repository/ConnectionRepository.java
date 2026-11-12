package com.uniconnect.backend.repository;

import com.uniconnect.backend.entity.Connection;
import com.uniconnect.backend.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConnectionRepository
        extends JpaRepository<Connection, Long> {

    // Check whether a connection/request already exists
    Optional<Connection> findBySenderAndReceiver(
            User sender,
            User receiver
    );

    // Requests received by a user
    List<Connection> findByReceiver(User receiver);

    // Requests sent by a user
    List<Connection> findBySender(User sender);

    // Check existing connection in either direction
    boolean existsBySenderAndReceiver(
            User sender,
            User receiver
    );

    boolean existsByReceiverAndSender(
            User receiver,
            User sender
    );
}