package com.uniconnect.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.uniconnect.config.JwtConfiguration;
import com.uniconnect.config.JwtProperties;
import com.uniconnect.dto.auth.AuthenticatedUserResponse;
import com.uniconnect.entity.RoleCode;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;

class JwtTokenServiceTest {

    private static final String ISSUER = "uniconnect-test";
    private static final long TOKEN_TTL_SECONDS = 900;

    private JwtTokenService jwtTokenService;
    private JwtDecoder jwtDecoder;

    @BeforeEach
    void setUp() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret(Base64.getEncoder().encodeToString(new byte[32]));
        properties.setIssuer(ISSUER);
        properties.setAccessTokenTtlSeconds(TOKEN_TTL_SECONDS);

        JwtConfiguration configuration = new JwtConfiguration();
        var signingKey = configuration.jwtSigningKey(properties);
        JwtEncoder jwtEncoder = configuration.jwtEncoder(signingKey);
        jwtDecoder = configuration.jwtDecoder(signingKey, properties);
        jwtTokenService = new JwtTokenService(jwtEncoder, properties);
    }

    @Test
    void generatesSignedTokenWithUserIdentityRoleIssuerAndTimestamps() {
        UUID userId = UUID.randomUUID();
        AuthenticatedUserResponse user = authenticatedUser(userId, RoleCode.STUDENT);

        String token = jwtTokenService.generateAccessToken(user);
        Jwt decoded = jwtDecoder.decode(token);

        assertNotNull(token);
        assertEquals(userId.toString(), decoded.getSubject());
        assertEquals(RoleCode.STUDENT.name(), decoded.getClaimAsString("role"));
        assertEquals(ISSUER, decoded.getClaimAsString("iss"));
        assertNotNull(decoded.getIssuedAt());
        assertNotNull(decoded.getExpiresAt());
        assertEquals(
                TOKEN_TTL_SECONDS,
                Duration.between(decoded.getIssuedAt(), decoded.getExpiresAt()).getSeconds());

        Instant now = Instant.now();
        assertTrue(!decoded.getIssuedAt().isAfter(now));
        assertTrue(!decoded.getIssuedAt().isBefore(now.minusSeconds(5)));
    }

    @Test
    void generatesTokensWithEachUsersOwnIdentity() {
        UUID firstUserId = UUID.randomUUID();
        UUID secondUserId = UUID.randomUUID();

        Jwt firstToken =
                jwtDecoder.decode(
                        jwtTokenService.generateAccessToken(
                                authenticatedUser(firstUserId, RoleCode.STUDENT)));
        Jwt secondToken =
                jwtDecoder.decode(
                        jwtTokenService.generateAccessToken(
                                authenticatedUser(secondUserId, RoleCode.PROFESSIONAL)));

        assertNotEquals(firstUserId, secondUserId);
        assertEquals(firstUserId.toString(), firstToken.getSubject());
        assertEquals(secondUserId.toString(), secondToken.getSubject());
        assertEquals(RoleCode.STUDENT.name(), firstToken.getClaimAsString("role"));
        assertEquals(RoleCode.PROFESSIONAL.name(), secondToken.getClaimAsString("role"));
    }

    private static AuthenticatedUserResponse authenticatedUser(UUID userId, RoleCode role) {
        return new AuthenticatedUserResponse(
                userId, "Test User", "test@example.com", role, null);
    }
}
