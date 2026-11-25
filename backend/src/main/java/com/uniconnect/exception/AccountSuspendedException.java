package com.uniconnect.exception;

public class AccountSuspendedException extends RuntimeException {

    public AccountSuspendedException() {
        super("Your account has been suspended. Please contact UniConnect support.");
    }
}
