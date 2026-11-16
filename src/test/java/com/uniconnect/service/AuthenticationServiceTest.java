package com.uniconnect.service;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.uniconnect.config.JwtConfiguration;
import com.uniconnect.config.JwtProperties;
import com.uniconnect.dto.auth.AuthenticatedUserResponse;
import com.uniconnect.dto.auth.AuthenticationResponse;
import com.uniconnect.dto.auth.LoginRequest;
import com.uniconnect.entity.Role;
import com.uniconnect.entity.RoleCode;
import com.uniconnect.entity.User;
import com.uniconnect.exception.InvalidCredentialsException;
import com.uniconnect.repository.UserRepository;
import com.uniconnect.security.JwtTokenService;
import java.lang.reflect.RecordComponent;
import java.time.Duration;
import java.util.Arrays;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    private static final String ISSUER = "uniconnect-auth-test";
    private static final long TOKEN_TTL_SECONDS = 900;

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;

    private AuthenticationService authenticationService;
    private JwtTokenService jwtTokenService;
    private JwtDecoder jwtDecoder;

    @BeforeEach
    void setUp() {
        when(passwordEncoder.encode(anyString())).thenReturn("dummy-bcrypt-hash");

        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setSecret(Base64.getEncoder().encodeToString(new byte[32]));
        jwtProperties.setIssuer(ISSUER);
        jwtProperties.setAccessTokenTtlSeconds(TOKEN_TTL_SECONDS);

        JwtConfiguration jwtConfiguration = new JwtConfiguration();
        var signingKey = jwtConfiguration.jwtSigningKey(jwtProperties);
        JwtEncoder jwtEncoder = jwtConfiguration.jwtEncoder(signingKey);
        jwtDecoder = jwtConfiguration.jwtDecoder(signingKey, jwtProperties);
        jwtTokenService = spy(new JwtTokenService(jwtEncoder, jwtProperties));
        authenticationService =
                new AuthenticationService(
                        userRepository, passwordEncoder, jwtTokenService, jwtProperties);
    }

    @Test
    void authenticatesWithNormalizedEmailAndReturnsValidSafeJwtResponse() {
        UUID userId = UUID.randomUUID();
        User user = createUser(userId);
        when(userRepository.findByEmail("student@example.lk")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("PlainPassword123", "$2a$hashed-password"))
                .thenReturn(true);

        AuthenticationResponse response =
                authenticationService.authenticate(
                        new LoginRequest("  Student@Example.LK  ", "PlainPassword123"));
        Jwt decodedToken = jwtDecoder.decode(response.accessToken());

        assertNotNull(response.accessToken());
        assertEquals("Bearer", response.tokenType());
        assertEquals(TOKEN_TTL_SECONDS, response.expiresInSeconds());
        assertEquals(userId, response.userId());
        assertEquals(RoleCode.STUDENT, response.role());
        assertEquals("A Student", response.fullName());
        assertEquals("student@example.lk", response.email());
        assertEquals("https://example.lk/profile.png", response.profileImageUrl());
        assertEquals(userId.toString(), decodedToken.getSubject());
        assertEquals(RoleCode.STUDENT.name(), decodedToken.getClaimAsString("role"));
        assertEquals(ISSUER, decodedToken.getClaimAsString("iss"));
        assertEquals(
                TOKEN_TTL_SECONDS,
                Duration.between(decodedToken.getIssuedAt(), decodedToken.getExpiresAt())
                        .getSeconds());

        verify(userRepository).findByEmail("student@example.lk");
        verify(passwordEncoder).matches("PlainPassword123", "$2a$hashed-password");
        verify(jwtTokenService).generateAccessToken(
                new AuthenticatedUserResponse(
                        userId,
                        "A Student",
                        "student@example.lk",
                        RoleCode.STUDENT,
                        "https://example.lk/profile.png"));
        assertArrayEquals(
                new String[] {
                    "accessToken",
                    "tokenType",
                    "expiresInSeconds",
                    "userId",
                    "role",
                    "fullName",
                    "email",
                    "profileImageUrl"
                },
                Arrays.stream(AuthenticationResponse.class.getRecordComponents())
                        .map(RecordComponent::getName)
                        .toArray(String[]::new));
        assertFalse(
                Arrays.stream(AuthenticationResponse.class.getRecordComponents())
                        .anyMatch(component -> component.getName().equals("passwordHash")));
    }

    @Test
    void doesNotGenerateTokenForIncorrectPassword() {
        User user = createUser(UUID.randomUUID());
        when(userRepository.findByEmail("student@example.lk")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPassword123", "$2a$hashed-password"))
                .thenReturn(false);

        InvalidCredentialsException exception =
                assertThrows(
                        InvalidCredentialsException.class,
                        () ->
                                authenticationService.authenticate(
                                        new LoginRequest(
                                                "student@example.lk", "WrongPassword123")));

        assertEquals("Invalid email or password.", exception.getMessage());
        verify(jwtTokenService, never())
                .generateAccessToken(any(AuthenticatedUserResponse.class));
    }

    @Test
    void doesNotGenerateTokenForUnknownEmailAndUsesDummyPasswordComparison() {
        when(userRepository.findByEmail("unknown@example.lk")).thenReturn(Optional.empty());

        InvalidCredentialsException exception =
                assertThrows(
                        InvalidCredentialsException.class,
                        () ->
                                authenticationService.authenticate(
                                        new LoginRequest(
                                                "unknown@example.lk", "PlainPassword123")));

        assertEquals("Invalid email or password.", exception.getMessage());
        verify(passwordEncoder).matches("PlainPassword123", "dummy-bcrypt-hash");
        verify(jwtTokenService, never())
                .generateAccessToken(any(AuthenticatedUserResponse.class));
    }

    private static User createUser(UUID userId) {
        User user =
                new User(
                        "A Student",
                        "student@example.lk",
                        "$2a$hashed-password",
                        new Role(RoleCode.STUDENT));
        ReflectionTestUtils.setField(user, "id", userId);
        user.setProfileImageUrl("https://example.lk/profile.png");
        return user;
    }
}
