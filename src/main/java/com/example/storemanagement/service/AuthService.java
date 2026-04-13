package com.example.storemanagement.service;

import com.example.storemanagement.entity.User;
import com.example.storemanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    public String generateAndSaveOtp(String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            String otp = String.format("%06d", new Random().nextInt(1000000));
            user.setOtp(otp);
            user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
            userRepository.save(user);

            // Send actual email
            if (user.getEmail() != null) {
                emailService.sendOtpEmail(user.getEmail(), otp);
            }

            // Log as fallback
            System.out.println("OTP for user " + username + ": " + otp);
            return otp;
        }
        return null;
    }

    public boolean verifyOtp(String username, String enteredOtp) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null && user.getOtp() != null && user.getOtp().equals(enteredOtp)) {
            if (user.getOtpExpiry().isAfter(LocalDateTime.now())) {
                user.setOtp(null);
                user.setOtpExpiry(null);
                userRepository.save(user);
                return true;
            }
        }
        return false;
    }
}
