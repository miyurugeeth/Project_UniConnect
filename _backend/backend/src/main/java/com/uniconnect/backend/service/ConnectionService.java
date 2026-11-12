package com.uniconnect.backend.service;

import com.uniconnect.backend.dto.ConnectionResponse;
import com.uniconnect.backend.entity.Connection;
import com.uniconnect.backend.entity.User;
import com.uniconnect.backend.repository.ConnectionRepository;
import com.uniconnect.backend.repository.UserRepository;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ConnectionService {

    private final ConnectionRepository connectionRepository;
    private final UserRepository userRepository;

    public ConnectionService(
            ConnectionRepository connectionRepository,
            UserRepository userRepository) {

        this.connectionRepository = connectionRepository;
        this.userRepository = userRepository;
    }

    // =========================================================
    // SEND CONNECTION REQUEST
    // =========================================================
    public ConnectionResponse sendRequest(
            Long receiverId,
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        User sender = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() ->
                        new RuntimeException("Receiver not found"));

        // Cannot send request to yourself
        if (sender.getId().equals(receiver.getId())) {
            throw new RuntimeException(
                    "You cannot send a connection request to yourself");
        }

        // Check sender -> receiver
        boolean exists =
                connectionRepository.existsBySenderAndReceiver(
                        sender,
                        receiver
                );

        // Check receiver -> sender
        boolean reverseExists =
                connectionRepository.existsByReceiverAndSender(
                        sender,
                        receiver
                );

        if (exists || reverseExists) {
            throw new RuntimeException(
                    "Connection already exists");
        }

        Connection connection = new Connection();

        connection.setSender(sender);
        connection.setReceiver(receiver);
        connection.setStatus("PENDING");
        connection.setCreatedAt(LocalDateTime.now());

        Connection savedConnection =
                connectionRepository.save(connection);

        return convertToResponse(savedConnection);
    }

    // =========================================================
    // GET RECEIVED REQUESTS
    // =========================================================
    public List<ConnectionResponse> getReceivedRequests(
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return connectionRepository
                .findByReceiver(currentUser)
                .stream()
                .filter(connection ->
                        connection.getStatus().equals("PENDING"))
                .map(this::convertToResponse)
                .toList();
    }

    // =========================================================
    // GET SENT REQUESTS
    // =========================================================
    public List<ConnectionResponse> getSentRequests(
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return connectionRepository
                .findBySender(currentUser)
                .stream()
                .filter(connection ->
                        connection.getStatus().equals("PENDING"))
                .map(this::convertToResponse)
                .toList();
    }

    // =========================================================
    // ACCEPT CONNECTION REQUEST
    // =========================================================
    public ConnectionResponse acceptRequest(
            Long connectionId,
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Connection connection =
                connectionRepository.findById(connectionId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Connection not found"));

        // Only receiver can accept
        if (!connection.getReceiver()
                .getId()
                .equals(currentUser.getId())) {

            throw new RuntimeException(
                    "You are not allowed to accept this request");
        }

        // Only PENDING requests can be accepted
        if (!connection.getStatus().equals("PENDING")) {

            throw new RuntimeException(
                    "Connection request is not pending");
        }

        connection.setStatus("ACCEPTED");

        Connection updatedConnection =
                connectionRepository.save(connection);

        return convertToResponse(updatedConnection);
    }

    // =========================================================
    // REJECT CONNECTION REQUEST
    // =========================================================
    public ConnectionResponse rejectRequest(
            Long connectionId,
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Connection connection =
                connectionRepository.findById(connectionId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Connection not found"));

        // Only receiver can reject
        if (!connection.getReceiver()
                .getId()
                .equals(currentUser.getId())) {

            throw new RuntimeException(
                    "You are not allowed to reject this request");
        }

        // Only PENDING requests can be rejected
        if (!connection.getStatus().equals("PENDING")) {

            throw new RuntimeException(
                    "Connection request is not pending");
        }

        connection.setStatus("REJECTED");

        Connection updatedConnection =
                connectionRepository.save(connection);

        return convertToResponse(updatedConnection);
    }

    // =========================================================
    // GET CONNECTION STATUS
    // =========================================================
    public String getConnectionStatus(
            Long userId,
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        User otherUser = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        // Current user -> Other user
        var connection =
                connectionRepository.findBySenderAndReceiver(
                        currentUser,
                        otherUser
                );

        if (connection.isPresent()) {
            return connection.get().getStatus();
        }

        // Other user -> Current user
        var reverseConnection =
                connectionRepository.findBySenderAndReceiver(
                        otherUser,
                        currentUser
                );

        if (reverseConnection.isPresent()) {
            return reverseConnection.get().getStatus();
        }

        return "NOT_CONNECTED";
    }

    // =========================================================
    // REMOVE ACCEPTED CONNECTION
    // =========================================================
    public boolean removeConnection(
            Long connectionId,
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Connection connection =
                connectionRepository.findById(connectionId)
                        .orElse(null);

        if (connection == null) {
            return false;
        }

        boolean isSender =
                connection.getSender()
                        .getId()
                        .equals(currentUser.getId());

        boolean isReceiver =
                connection.getReceiver()
                        .getId()
                        .equals(currentUser.getId());

        // User must be part of the connection
        if (!isSender && !isReceiver) {
            return false;
        }

        // Only ACCEPTED connections can be removed
        if (!connection.getStatus().equals("ACCEPTED")) {
            return false;
        }

        connectionRepository.delete(connection);

        return true;
    }

    // =========================================================
    // CANCEL SENT CONNECTION REQUEST
    // =========================================================
    public boolean cancelRequest(
            Long connectionId,
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Connection connection =
                connectionRepository.findById(connectionId)
                        .orElse(null);

        if (connection == null) {
            return false;
        }

        // Only sender can cancel
        if (!connection.getSender()
                .getId()
                .equals(currentUser.getId())) {

            return false;
        }

        // Only PENDING requests can be cancelled
        if (!connection.getStatus().equals("PENDING")) {
            return false;
        }

        connectionRepository.delete(connection);

        return true;
    }

    // =========================================================
    // GET MY ACCEPTED CONNECTIONS
    // =========================================================
    public List<ConnectionResponse> getMyConnections(
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        List<ConnectionResponse> connections =
                new ArrayList<>();

        // Current user is sender
        List<Connection> sentConnections =
                connectionRepository
                        .findBySender(currentUser);

        sentConnections
                .stream()
                .filter(connection ->
                        connection.getStatus().equals("ACCEPTED"))
                .map(this::convertToResponse)
                .forEach(connections::add);

        // Current user is receiver
        List<Connection> receivedConnections =
                connectionRepository
                        .findByReceiver(currentUser);

        receivedConnections
                .stream()
                .filter(connection ->
                        connection.getStatus().equals("ACCEPTED"))
                .map(this::convertToResponse)
                .forEach(connections::add);

        return connections;
    }

    // =========================================================
    // ENTITY -> RESPONSE DTO
    // =========================================================
    private ConnectionResponse convertToResponse(
            Connection connection) {

        return new ConnectionResponse(
                connection.getId(),

                connection.getSender().getId(),
                connection.getSender().getName(),

                connection.getReceiver().getId(),
                connection.getReceiver().getName(),

                connection.getStatus(),
                connection.getCreatedAt()
        );
    }
}