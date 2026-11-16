package com.uniconnect.config;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;

class JwtPropertiesTest {

    private static final ValidatorFactory VALIDATOR_FACTORY =
            Validation.buildDefaultValidatorFactory();
    private static final Validator VALIDATOR = VALIDATOR_FACTORY.getValidator();

    @AfterAll
    static void closeValidatorFactory() {
        VALIDATOR_FACTORY.close();
    }

    @Test
    void acceptsValidBase64SecretOfAtLeast32Bytes() {
        byte[] key = new byte[32];
        Arrays.fill(key, (byte) 7);
        JwtProperties properties = properties(java.util.Base64.getEncoder().encodeToString(key));

        assertTrue(VALIDATOR.validate(properties).isEmpty());
        assertArrayEquals(key, properties.decodeSecret().getEncoded());
    }

    @Test
    void rejectsSecretShorterThan32DecodedBytes() {
        JwtProperties properties = properties(java.util.Base64.getEncoder().encodeToString(new byte[31]));

        IllegalStateException exception =
                assertThrows(IllegalStateException.class, properties::decodeSecret);

        assertTrue(exception.getMessage().contains("at least 32 bytes"));
    }

    @Test
    void rejectsMissingSecretWithAConfigurationViolationAndClearDecodeError() {
        JwtProperties properties = properties("");

        assertTrue(
                violationProperties(properties).contains("secret"));
        assertEquals(
                "JWT signing secret is missing; configure JWT_SECRET_BASE64.",
                assertThrows(IllegalStateException.class, properties::decodeSecret).getMessage());
    }

    @Test
    void rejectsInvalidBase64WithoutIncludingSecretValueInError() {
        String invalidSecret = "not-valid-base64%%%";
        JwtProperties properties = properties(invalidSecret);

        IllegalStateException exception =
                assertThrows(IllegalStateException.class, properties::decodeSecret);

        assertTrue(exception.getMessage().contains("valid Base64"));
        assertTrue(!exception.getMessage().contains(invalidSecret));
    }

    @Test
    void rejectsBlankIssuer() {
        JwtProperties properties = properties(validSecret());
        properties.setIssuer("  ");

        assertTrue(violationProperties(properties).contains("issuer"));
    }

    @Test
    void rejectsNonPositiveTokenLifetime() {
        JwtProperties properties = properties(validSecret());
        properties.setAccessTokenTtlSeconds(0);

        assertTrue(violationProperties(properties).contains("accessTokenTtlSeconds"));
    }

    private static JwtProperties properties(String secret) {
        JwtProperties properties = new JwtProperties();
        properties.setSecret(secret);
        properties.setIssuer("uniconnect-test");
        properties.setAccessTokenTtlSeconds(900);
        return properties;
    }

    private static Set<String> violationProperties(JwtProperties properties) {
        return VALIDATOR.validate(properties).stream()
                .map(violation -> violation.getPropertyPath().toString())
                .collect(Collectors.toSet());
    }

    private static String validSecret() {
        byte[] key = new byte[32];
        Arrays.fill(key, (byte) 7);
        return java.util.Base64.getEncoder().encodeToString(key);
    }
}
