package com.uniconnect.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.Date;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwsHeader;

class JwtConfigurationTest {

    private static final String ISSUER = "uniconnect-test";

    @Test
    void encodesAndDecodesJwtWithHs256AndExpectedClaims() {
        JwtProperties properties = properties(new byte[32]);
        JwtConfiguration configuration = new JwtConfiguration();
        SecretKey key = configuration.jwtSigningKey(properties);
        JwtEncoder encoder = configuration.jwtEncoder(key);
        JwtDecoder decoder = configuration.jwtDecoder(key, properties);
        Instant now = Instant.now();

        String token = encode(encoder, ISSUER, now, now.plusSeconds(900));
        Jwt decoded = decoder.decode(token);

        assertEquals(ISSUER, decoded.getClaimAsString("iss"));
        assertEquals("user-123", decoded.getSubject());
        assertEquals(MacAlgorithm.HS256.getName(), decoded.getHeaders().get("alg"));
    }

    @Test
    void rejectsTokenSignedWithDifferentKey() {
        JwtProperties properties = properties(filledBytes(32, (byte) 1));
        JwtConfiguration configuration = new JwtConfiguration();
        JwtDecoder decoder =
                configuration.jwtDecoder(configuration.jwtSigningKey(properties), properties);
        SecretKey otherKey = new SecretKeySpec(filledBytes(32, (byte) 2), "HmacSHA256");
        JwtEncoder otherEncoder = configuration.jwtEncoder(otherKey);
        Instant now = Instant.now();
        String token = encode(otherEncoder, ISSUER, now, now.plusSeconds(900));

        assertThrows(JwtException.class, () -> decoder.decode(token));
    }

    @Test
    void rejectsExpiredToken() {
        JwtProperties properties = properties(filledBytes(32, (byte) 3));
        JwtConfiguration configuration = new JwtConfiguration();
        SecretKey key = configuration.jwtSigningKey(properties);
        JwtDecoder decoder = configuration.jwtDecoder(key, properties);
        JwtEncoder encoder = configuration.jwtEncoder(key);
        Instant issuedAt = Instant.now().minusSeconds(1200);
        String token = encode(encoder, ISSUER, issuedAt, issuedAt.plusSeconds(300));

        assertThrows(JwtException.class, () -> decoder.decode(token));
    }

    @Test
    void rejectsTokenWithWrongIssuer() {
        JwtProperties properties = properties(filledBytes(32, (byte) 4));
        JwtConfiguration configuration = new JwtConfiguration();
        SecretKey key = configuration.jwtSigningKey(properties);
        JwtDecoder decoder = configuration.jwtDecoder(key, properties);
        JwtEncoder encoder = configuration.jwtEncoder(key);
        Instant now = Instant.now();
        String token = encode(encoder, "another-issuer", now, now.plusSeconds(900));

        assertThrows(JwtException.class, () -> decoder.decode(token));
    }

    @Test
    void rejectsUnsupportedHs384Algorithm() throws Exception {
        byte[] keyBytes = filledBytes(48, (byte) 5);
        JwtProperties properties = properties(keyBytes);
        JwtConfiguration configuration = new JwtConfiguration();
        JwtDecoder decoder =
                configuration.jwtDecoder(configuration.jwtSigningKey(properties), properties);
        Instant now = Instant.now();
        JWTClaimsSet claims =
                new JWTClaimsSet.Builder()
                        .issuer(ISSUER)
                        .subject("user-123")
                        .issueTime(Date.from(now))
                        .expirationTime(Date.from(now.plusSeconds(900)))
                        .build();
        SignedJWT token =
                new SignedJWT(new JWSHeader(JWSAlgorithm.HS384), claims);
        token.sign(new MACSigner(keyBytes));

        assertThrows(JwtException.class, () -> decoder.decode(token.serialize()));
    }

    @Test
    void rejectsTokenMissingExpirationClaim() {
        JwtProperties properties = properties(filledBytes(32, (byte) 6));
        JwtConfiguration configuration = new JwtConfiguration();
        SecretKey key = configuration.jwtSigningKey(properties);
        JwtDecoder decoder = configuration.jwtDecoder(key, properties);
        JwtEncoder encoder = configuration.jwtEncoder(key);
        Instant now = Instant.now();
        JwtClaimsSet claims =
                JwtClaimsSet.builder()
                        .issuer(ISSUER)
                        .subject("user-123")
                        .issuedAt(now)
                        .build();
        String token =
                encoder.encode(
                                JwtEncoderParameters.from(
                                        JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                        .getTokenValue();

        assertThrows(JwtException.class, () -> decoder.decode(token));
    }

    private static String encode(
            JwtEncoder encoder, String issuer, Instant issuedAt, Instant expiresAt) {
        JwtClaimsSet claims =
                JwtClaimsSet.builder()
                        .issuer(issuer)
                        .subject("user-123")
                        .issuedAt(issuedAt)
                        .expiresAt(expiresAt)
                        .claim("role", "STUDENT")
                        .build();
        return encoder.encode(
                        JwtEncoderParameters.from(
                                JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();
    }

    private static JwtProperties properties(byte[] key) {
        JwtProperties properties = new JwtProperties();
        properties.setSecret(Base64.getEncoder().encodeToString(key));
        properties.setIssuer(ISSUER);
        properties.setAccessTokenTtlSeconds(900);
        return properties;
    }

    private static byte[] filledBytes(int length, byte value) {
        byte[] bytes = new byte[length];
        Arrays.fill(bytes, value);
        return bytes;
    }
}
