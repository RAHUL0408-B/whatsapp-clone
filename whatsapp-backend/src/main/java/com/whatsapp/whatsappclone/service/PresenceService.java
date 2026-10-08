package com.whatsapp.whatsappclone.service;

import com.whatsapp.whatsappclone.dto.PresenceResponse;
import com.whatsapp.whatsappclone.entity.User;
import com.whatsapp.whatsappclone.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class PresenceService {

    private final UserRepository userRepository;

    // Optional — not available when Redis is disabled (e.g. Render free tier)
    @Autowired(required = false)
    private RedisTemplate<String, Object> redisTemplate;

    @Value("${app.redis.enabled:true}")
    private boolean redisEnabled;

    private static final String ONLINE_KEY = "online:";
    private static final String LAST_SEEN_KEY = "lastSeen:";

    public PresenceService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    private boolean isRedisAvailable() {
        return redisEnabled && redisTemplate != null;
    }

    public void setUserOnline(String email) {
        // Always update PostgreSQL
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setOnline(true);
            userRepository.save(user);
        });

        // Update Redis if available
        if (isRedisAvailable()) {
            try {
                redisTemplate.opsForValue().set(ONLINE_KEY + email, "true", 5, TimeUnit.MINUTES);
            } catch (Exception e) {
                log.warn("Redis unavailable, falling back to DB-only presence: {}", e.getMessage());
            }
        }
    }

    public void setUserOffline(String email) {
        // Always update PostgreSQL
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setOnline(false);
            userRepository.save(user);
        });

        // Update Redis if available
        if (isRedisAvailable()) {
            try {
                redisTemplate.delete(ONLINE_KEY + email);
                String lastSeen = LocalDateTime.now()
                        .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                redisTemplate.opsForValue().set(LAST_SEEN_KEY + email, lastSeen);
            } catch (Exception e) {
                log.warn("Redis unavailable for offline status: {}", e.getMessage());
            }
        }
    }

    public boolean isUserOnline(String email) {
        // Try Redis first
        if (isRedisAvailable()) {
            try {
                return Boolean.TRUE.equals(redisTemplate.hasKey(ONLINE_KEY + email));
            } catch (Exception e) {
                log.warn("Redis unavailable, falling back to DB for online check");
            }
        }
        // Fallback: use PostgreSQL is_online column
        return userRepository.findByEmail(email)
                .map(User::isOnline)
                .orElse(false);
    }

    public String getLastSeen(String email) {
        if (isRedisAvailable()) {
            try {
                Object lastSeen = redisTemplate.opsForValue().get(LAST_SEEN_KEY + email);
                if (lastSeen != null) return lastSeen.toString();
            } catch (Exception e) {
                log.warn("Redis unavailable for lastSeen lookup");
            }
        }
        return "Recently";
    }

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

    public void refreshOnlineStatus(String email) {
        if (isRedisAvailable()) {
            try {
                if (Boolean.TRUE.equals(redisTemplate.hasKey(ONLINE_KEY + email))) {
                    redisTemplate.expire(ONLINE_KEY + email, 5, TimeUnit.MINUTES);
                }
            } catch (Exception e) {
                log.warn("Redis unavailable for refresh");
            }
        }
    }
}