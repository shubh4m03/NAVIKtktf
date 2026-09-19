package com.sail.charter.client.mlservice;

public class MlServiceUnavailableException extends RuntimeException {
    public MlServiceUnavailableException(String message) {
        super(message);
    }

    public MlServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
