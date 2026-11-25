package com.uniconnect.dto.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordsMatchValidator
        implements ConstraintValidator<PasswordsMatch, PasswordConfirmation> {

    @Override
    public boolean isValid(PasswordConfirmation value, ConstraintValidatorContext context) {
        if (value == null
                || value.passwordForConfirmation() == null
                || value.confirmationForPassword() == null) {
            return true;
        }

        if (value.passwordForConfirmation().equals(value.confirmationForPassword())) {
            return true;
        }

        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(context.getDefaultConstraintMessageTemplate())
                .addPropertyNode(value.confirmationFieldName())
                .addConstraintViolation();
        return false;
    }
}
