package com.whatsapp.whatsappclone.service;

import com.whatsapp.whatsappclone.dto.PresenceResponse;
import com.whatsapp.whatsappclone.entity.User;
import com.whatsapp.whatsappclone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class PresenceService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final UserRepository userRepository;

    // Key prefixes in Redis
    private static final String ONLINE_KEY = "online:";
    private static final String LAST_SEEN_KEY = "lastSeen:";

    // User comes online
    public void setUserOnline(String email) {
        // Set online flag — expires in 5 minutes
        redisTemplate.opsForValue().set(
                ONLINE_KEY + email,
                "true",
                5,
                TimeUnit.MINUTES
        );

        // Update user in PostgreSQL too
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setOnline(true);
            userRepository.save(user);
        });
    }

    // User goes offline
    public void setUserOffline(String email) {
        // Remove online flag
        redisTemplate.delete(ONLINE_KEY + email);

        // Save last seen time
        String lastSeen = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        redisTemplate.opsForValue().set(LAST_SEEN_KEY + email, lastSeen);

        // Update user in PostgreSQL
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setOnline(false);
            userRepository.save(user);
        });
    }

    // Check if user is online
    public boolean isUserOnline(String email) {
        return redisTemplate.hasKey(ONLINE_KEY + email);
    }

    // Get last seen time
    public String getLastSeen(String email) {
        Object lastSeen = redisTemplate.opsForValue()
                .get(LAST_SEEN_KEY + email);
        return lastSeen != null ? lastSeen.toString() : "Never";
    }

    // Get full presence info
    public PresenceResponse getUserPresence(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean online = isUserOnline(email);
        String lastSeen = online ? "Now" : getLastSeen(email);

        return PresenceResponse.builder()
                .email(email)
                .username(user.getUsername())
                .online(online)
                .lastSeen(lastSeen)
                .build();
    }

    // Refresh online status (called every few minutes by client)
    public void refreshOnlineStatus(String email) {
        if (isUserOnline(email)) {
            // Reset the 5 minute timer
            redisTemplate.expire(
                    ONLINE_KEY + email,
                    5,
                    TimeUnit.MINUTES
            );
        }
    }
}