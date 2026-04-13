package com.example.storemanagement.controller;

import com.example.storemanagement.entity.User;
import com.example.storemanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@Transactional
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public User getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername()).orElse(null);
    }

    @PutMapping
    public User updateProfile(@AuthenticationPrincipal UserDetails userDetails, @RequestBody User profileDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
        if (user != null) {
            user.setFullName(profileDetails.getFullName());
            user.setPhoneNumber(profileDetails.getPhoneNumber());
            user.setAddress(profileDetails.getAddress());
            // In a real app, handle profile image upload separately
            return userRepository.save(user);
        }
        return null;
    }
}
