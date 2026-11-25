package com.uniconnect.exception;

public class InvalidAdminBootstrapKeyException extends RuntimeException {

    public InvalidAdminBootstrapKeyException() {
        super("The initial administrator setup key is invalid.");
    }
}
