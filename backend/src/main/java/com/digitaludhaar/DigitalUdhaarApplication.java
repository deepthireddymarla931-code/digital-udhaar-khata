package com.digitaludhaar;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DigitalUdhaarApplication {

    public static void main(String[] args) {
        SpringApplication.run(DigitalUdhaarApplication.class, args);
        System.out.println("🚀 Digital Udhaar Khata Backend Service is up and running!");
    }
}
