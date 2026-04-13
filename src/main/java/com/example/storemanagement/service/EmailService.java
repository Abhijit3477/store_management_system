package com.example.storemanagement.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username}")
    private String fromEmail;

    public void sendOtpEmail(String to, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject("Your Store Manager Verification Code");
        message.setText("Hello,\n\nYour verification code is: " + otp + "\n\nThis code will expire in 5 minutes.\n\nBest regards,\nStore Manager Team");
        
        try {
            System.out.println("Attempting to send OTP email to: " + to);
            mailSender.send(message);
            System.out.println("OTP successfully sent to " + to);
        } catch (Exception e) {
            System.err.println("CRITICAL: Failed to send OTP email to " + to);
            System.err.println("Reason: " + e.getMessage());
            e.printStackTrace(); // Print full stack trace to help debug
        }
    }
}
