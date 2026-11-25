package com.uniconnect.dto.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = BcryptPasswordValidator.class)
@Target({
    ElementType.ANNOTATION_TYPE,
    ElementType.FIELD,
    ElementType.PARAMETER,
    ElementType.RECORD_COMPONENT
})
@Retention(RetentionPolicy.RUNTIME)
public @interface BcryptPassword {

    String message() default "Password must not exceed the 72-byte UTF-8 limit for BCrypt";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
