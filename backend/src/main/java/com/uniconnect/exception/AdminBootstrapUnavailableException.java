package com.uniconnect.exception;

public class AdminBootstrapUnavailableException extends RuntimeException {

    public AdminBootstrapUnavailableException() {
        super("Initial administrator setup is no longer available.");
    }
}
