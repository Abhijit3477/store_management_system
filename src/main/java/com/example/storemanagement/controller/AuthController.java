package com.example.storemanagement.controller;

import com.example.storemanagement.entity.User;
import com.example.storemanagement.entity.Role;
import com.example.storemanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import com.example.storemanagement.service.AuthService;
import com.example.storemanagement.service.ActivityLogService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private ActivityLogService activityLogService;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @GetMapping("/dashboard")
    public String showDashboard() {
        return "index";
    }

    @GetMapping("/otp-check")
    public String initiateOtp(Authentication authentication) {
        String username = authentication.getName();
        authService.generateAndSaveOtp(username);
        return "redirect:/otp-verification";
    }

    @GetMapping("/otp-verification")
    public String showOtpVerificationForm() {
        return "otp-verification";
    }

    @GetMapping("/resend-otp")
    public String resendOtp(Authentication authentication) {
        String username = authentication.getName();
        authService.generateAndSaveOtp(username);
        return "redirect:/otp-verification?resent";
    }

    @PostMapping("/verify-otp")
    public String verifyOtp(@RequestParam String otp, Authentication authentication, Model model) {
        String username = authentication.getName();
        if (authService.verifyOtp(username, otp)) {
            activityLogService.log(username, "LOGIN_SUCCESS", "Successfully logged in with OTP", "local");
            return "redirect:/dashboard";
        }
        model.addAttribute("error", "Invalid or expired OTP");
        return "otp-verification";
    }

    @GetMapping("/register")
    public String showRegisterForm(Model model) {
        model.addAttribute("user", new User());
        return "register";
    }

    @GetMapping("/login")
    public String showLoginForm() {
        return "login";
    }

    @PostMapping("/register")
    public String registerUser(@RequestParam String username,
                               @RequestParam String password,
                               @RequestParam String email,
                               @RequestParam Role role,
                               Model model) {
        if (userRepository.findByUsername(username).isPresent()) {
            model.addAttribute("error", "Username already exists");
            return "register";
        }
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setEmail(email);
        user.setRole(role);
        userRepository.save(user);
        return "redirect:/login";
    }

    @GetMapping("/forgot-password")
    public String showForgotPasswordForm() {
        return "forgot-password";
    }

    @PostMapping("/forgot-password")
    public String processForgotPassword(@RequestParam String username,
                                        @RequestParam String newPassword,
                                        Model model) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            model.addAttribute("error", "Username not found");
            return "forgot-password";
        }
        
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        return "redirect:/login?resetSuccess";
    }
}