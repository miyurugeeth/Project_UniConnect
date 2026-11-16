package com.uniconnect.service;

import com.uniconnect.config.JwtProperties;
import com.uniconnect.dto.auth.AuthenticationResponse;
import com.uniconnect.dto.auth.AuthenticatedUserResponse;
import com.uniconnect.dto.auth.LoginRequest;
import com.uniconnect.entity.User;
import com.uniconnect.exception.InvalidCredentialsException;
import com.uniconnect.repository.UserRepository;
import com.uniconnect.security.JwtTokenService;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;
    private final JwtProperties jwtProperties;
    private final String dummyPasswordHash;

    public AuthenticationService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenService jwtTokenService,
            JwtProperties jwtProperties) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
        this.jwtProperties = jwtProperties;
        this.dummyPasswordHash = passwordEncoder.encode(UUID.randomUUID().toString());
    }

    @Transactional(readOnly = true)
    public AuthenticationResponse authenticate(LoginRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        Optional<User> userResult = userRepository.findByEmail(email);
        if (userResult.isEmpty()) {
            passwordEncoder.matches(request.password(), dummyPasswordHash);
            throw new InvalidCredentialsException();
        }
        User user = userResult.orElseThrow();

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        AuthenticatedUserResponse authenticatedUser =
                new AuthenticatedUserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().getCode(),
                user.getProfileImageUrl());
        String accessToken = jwtTokenService.generateAccessToken(authenticatedUser);

        return new AuthenticationResponse(
                accessToken,
                "Bearer",
                jwtProperties.getAccessTokenTtlSeconds(),
                authenticatedUser.userId(),
                authenticatedUser.role(),
                authenticatedUser.fullName(),
                authenticatedUser.email(),
                authenticatedUser.profileImageUrl());
    }
}
