package com.uniconnect.security;

import com.uniconnect.config.JwtProperties;
import com.uniconnect.dto.auth.AuthenticatedUserResponse;
import java.time.Instant;
import java.util.Objects;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

@Service
public class JwtTokenService {

    private final JwtEncoder jwtEncoder;
    private final JwtProperties jwtProperties;

    public JwtTokenService(JwtEncoder jwtEncoder, JwtProperties jwtProperties) {
        this.jwtEncoder = jwtEncoder;
        this.jwtProperties = jwtProperties;
    }

    public String generateAccessToken(AuthenticatedUserResponse user) {
        Objects.requireNonNull(user, "Authenticated user must not be null.");
        Objects.requireNonNull(user.userId(), "Authenticated user ID must not be null.");
        Objects.requireNonNull(user.role(), "Authenticated user role must not be null.");

        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plusSeconds(jwtProperties.getAccessTokenTtlSeconds());
        JwtClaimsSet claims =
                JwtClaimsSet.builder()
                        .issuer(jwtProperties.getIssuer())
                        .subject(user.userId().toString())
                        .issuedAt(issuedAt)
                        .expiresAt(expiresAt)
                        .claim("role", user.role().name())
                        .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();

        return jwtEncoder
                .encode(JwtEncoderParameters.from(header, claims))
                .getTokenValue();
    }
}
