package com.uniconnect.controller;

import com.uniconnect.dto.auth.AuthenticationResponse;
import com.uniconnect.dto.auth.LoginRequest;
import com.uniconnect.dto.profile.UserProfileResponse;
import com.uniconnect.dto.registration.ProfessionalRegistrationRequest;
import com.uniconnect.dto.registration.StudentRegistrationRequest;
import com.uniconnect.service.AuthenticationService;
import com.uniconnect.service.RegistrationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final RegistrationService registrationService;
    private final AuthenticationService authenticationService;

    public AuthController(
            RegistrationService registrationService, AuthenticationService authenticationService) {
        this.registrationService = registrationService;
        this.authenticationService = authenticationService;
    }

    @PostMapping("/register/student")
    public ResponseEntity<UserProfileResponse> registerStudent(
            @Valid @RequestBody StudentRegistrationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(registrationService.registerStudent(request));
    }

    @PostMapping("/register/professional")
    public ResponseEntity<UserProfileResponse> registerProfessional(
            @Valid @RequestBody ProfessionalRegistrationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(registrationService.registerProfessional(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authenticationService.authenticate(request));
    }
}
