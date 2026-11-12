package com.uniconnect.backend.controller;

import com.uniconnect.backend.dto.UserRequest;
import com.uniconnect.backend.dto.UserResponse;
import com.uniconnect.backend.entity.User;
import com.uniconnect.backend.service.UserService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@Validated
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {

        this.userService = userService;
    }


    // =====================================================
    // CREATE USER
    // =====================================================

    @PostMapping
        public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody UserRequest request) {

        User created =
                userService.createUser(request);

        return ResponseEntity.ok(toResponse(created));
    }


    // =====================================================
    // GET ALL USERS
    // =====================================================

    @GetMapping
        public List<UserResponse> getAllUsers() {

                return userService.getAllUsers().stream()
                                .map(this::toResponse)
                                .toList();
    }


    // =====================================================
    // GET CURRENT LOGGED-IN USER
    // =====================================================

    @GetMapping("/me")
        public ResponseEntity<UserResponse> getCurrentUser(
            @AuthenticationPrincipal
            UserDetails userDetails) {

        User user =
                userService.getUserByEmail(
                        userDetails.getUsername()
                );

        if (user == null) {

            return ResponseEntity
                    .notFound()
                    .build();
        }

        return ResponseEntity.ok(toResponse(user));
    }


    // =====================================================
    // GET USER BY ID
    // =====================================================

    @GetMapping("/{id}")
        public ResponseEntity<UserResponse> getUserById(
            @PathVariable Long id) {

        User user =
                userService.getUserById(id);

        if (user == null) {

            return ResponseEntity
                    .notFound()
                    .build();
        }

        return ResponseEntity.ok(toResponse(user));
    }


    // =====================================================
    // UPDATE USER
    // =====================================================

    @PutMapping("/{id}")
        public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @RequestBody UserRequest request) {

        User updatedUser =
                userService.updateUser(
                        id,
                        request
                );

        if (updatedUser == null) {

            return ResponseEntity
                    .notFound()
                    .build();
        }

        return ResponseEntity.ok(toResponse(updatedUser));
    }


    // =====================================================
    // DELETE USER
    // =====================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long id) {

        userService.deleteUser(id);

        return ResponseEntity
                .noContent()
                .build();
    }

        private UserResponse toResponse(User user) {
                UserResponse response = new UserResponse(
                                user.getId(),
                                user.getName(),
                                user.getEmail(),
                                user.getUniversity(),
                                user.getFaculty(),
                                user.getBatch()
                );
                response.setRole(user.getRole());
                response.setAccountStatus(user.getAccountStatus());
                return response;
        }
}