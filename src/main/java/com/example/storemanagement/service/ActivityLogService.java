package com.example.storemanagement.service;

import com.example.storemanagement.entity.ActivityLog;
import com.example.storemanagement.repository.ActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ActivityLogService {

    @Autowired
    private ActivityLogRepository activityLogRepository;

    public void log(String username, String action, String details, String ipAddress) {
        ActivityLog log = new ActivityLog(username, action, details, ipAddress);
        activityLogRepository.save(log);
    }

    public List<ActivityLog> getAllLogs() {
        return activityLogRepository.findAllByOrderByTimestampDesc();
    }

    public List<ActivityLog> getLogsByUsername(String username) {
        return activityLogRepository.findByUsernameOrderByTimestampDesc(username);
    }
}
