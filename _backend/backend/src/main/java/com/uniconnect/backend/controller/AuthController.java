package com.uniconnect.backend.controller;

import com.uniconnect.backend.dto.LoginRequest;
import com.uniconnect.backend.dto.UserRequest;
import com.uniconnect.backend.dto.UserResponse;
import com.uniconnect.backend.service.AuthService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // =====================================================
    // LOGIN
    // =====================================================

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request) {

        try {

            String token =
                    authService.login(request);

            Map<String, String> response =
                    new HashMap<>();

            response.put("token", token);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(401)
                    .body(e.getMessage());
        }
    }


    // =====================================================
    // STUDENT REGISTRATION
    // =====================================================

    @PostMapping("/register/student")
    public ResponseEntity<?> registerStudent(
            @Valid @RequestBody UserRequest request) {

        try {

            UserResponse response =
                    authService.registerStudent(request);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }


}