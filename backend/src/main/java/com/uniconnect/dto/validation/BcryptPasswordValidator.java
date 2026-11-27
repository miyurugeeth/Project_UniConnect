package com.uniconnect.dto.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.nio.charset.StandardCharsets;

public class BcryptPasswordValidator implements ConstraintValidator<BcryptPassword, CharSequence> {

    private static final int BCRYPT_MAX_PASSWORD_BYTES = 72;

    @Override
    public boolean isValid(CharSequence value, ConstraintValidatorContext context) {
        return value == null
                || value.toString().getBytes(StandardCharsets.UTF_8).length
                        <= BCRYPT_MAX_PASSWORD_BYTES;
    }
}
