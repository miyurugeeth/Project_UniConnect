package com.uniconnect.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.util.Base64;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    @NotBlank(message = "JWT_SECRET_BASE64 must be configured.")
    private String secret;

    @NotBlank(message = "JWT_ISSUER must not be blank.")
    private String issuer;

    @Positive(message = "JWT_ACCESS_TOKEN_TTL_SECONDS must be greater than zero.")
    private long accessTokenTtlSeconds;

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public String getIssuer() {
        return issuer;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }

    public long getAccessTokenTtlSeconds() {
        return accessTokenTtlSeconds;
    }

    public void setAccessTokenTtlSeconds(long accessTokenTtlSeconds) {
        this.accessTokenTtlSeconds = accessTokenTtlSeconds;
    }

    public SecretKey decodeSecret() {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT signing secret is missing; configure JWT_SECRET_BASE64.");
        }

        final byte[] keyBytes;
        try {
            keyBytes = Base64.getDecoder().decode(secret);
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException(
                    "JWT_SECRET_BASE64 must contain valid Base64 data.", exception);
        }

        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET_BASE64 must decode to at least 32 bytes for HS256.");
        }

        return new SecretKeySpec(keyBytes, "HmacSHA256");
    }
}
