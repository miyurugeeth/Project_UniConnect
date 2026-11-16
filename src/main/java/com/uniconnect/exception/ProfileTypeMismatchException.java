package com.uniconnect.exception;

public class ProfileTypeMismatchException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public ProfileTypeMismatchException() {
        super("This profile update is not valid for the user's role.");
    }
}
