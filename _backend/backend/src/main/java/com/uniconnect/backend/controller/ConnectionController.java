package com.uniconnect.backend.controller;

import com.uniconnect.backend.dto.ConnectionResponse;
import com.uniconnect.backend.service.ConnectionService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/connections")
public class ConnectionController {

    private final ConnectionService connectionService;

    public ConnectionController(
            ConnectionService connectionService) {

        this.connectionService = connectionService;
    }

    // SEND CONNECTION REQUEST
    @PostMapping("/send/{receiverId}")
    public ResponseEntity<ConnectionResponse> sendRequest(
            @PathVariable Long receiverId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                connectionService.sendRequest(
                        receiverId,
                        userDetails
                )
        );
    }

    // GET RECEIVED REQUESTS
    @GetMapping("/received")
    public ResponseEntity<List<ConnectionResponse>> getReceivedRequests(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                connectionService.getReceivedRequests(
                        userDetails
                )
        );
    }

    // GET SENT REQUESTS
    @GetMapping("/sent")
    public ResponseEntity<List<ConnectionResponse>> getSentRequests(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                connectionService.getSentRequests(
                        userDetails
                )
        );
    }

    // ACCEPT CONNECTION REQUEST
    @PutMapping("/{connectionId}/accept")
    public ResponseEntity<ConnectionResponse> acceptRequest(
            @PathVariable Long connectionId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                connectionService.acceptRequest(
                        connectionId,
                        userDetails
                )
        );
    }

    // REJECT CONNECTION REQUEST
    @PutMapping("/{connectionId}/reject")
    public ResponseEntity<ConnectionResponse> rejectRequest(
            @PathVariable Long connectionId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                connectionService.rejectRequest(
                        connectionId,
                        userDetails
                )
        );
    }

    // GET CONNECTION STATUS
    @GetMapping("/status/{userId}")
    public ResponseEntity<String> getConnectionStatus(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                connectionService.getConnectionStatus(
                        userId,
                        userDetails
                )
        );
    }

    // REMOVE ACCEPTED CONNECTION
    @DeleteMapping("/{connectionId}")
    public ResponseEntity<Void> removeConnection(
            @PathVariable Long connectionId,
            @AuthenticationPrincipal UserDetails userDetails) {

        boolean removed =
                connectionService.removeConnection(
                        connectionId,
                        userDetails
                );

        if (!removed) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.noContent().build();
    }

    // CANCEL SENT CONNECTION REQUEST
    @DeleteMapping("/{connectionId}/cancel")
    public ResponseEntity<Void> cancelRequest(
            @PathVariable Long connectionId,
            @AuthenticationPrincipal UserDetails userDetails) {

        boolean cancelled =
                connectionService.cancelRequest(
                        connectionId,
                        userDetails
                );

        if (!cancelled) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.noContent().build();
    }

    // GET MY ACCEPTED CONNECTIONS
    @GetMapping("/my")
    public ResponseEntity<List<ConnectionResponse>> getMyConnections(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                connectionService.getMyConnections(
                        userDetails
                )
        );
    }
}