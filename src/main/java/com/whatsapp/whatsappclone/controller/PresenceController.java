package com.whatsapp.whatsappclone.controller;

import com.whatsapp.whatsappclone.dto.PresenceResponse;
import com.whatsapp.whatsappclone.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/presence")
@RequiredArgsConstructor
public class PresenceController {

    private final PresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    // User comes online — called when user logs in
    @PostMapping("/online")
    public ResponseEntity<PresenceResponse> goOnline(
            @RequestParam String email) {
        presenceService.setUserOnline(email);
        PresenceResponse response = presenceService.getUserPresence(email);

        // Broadcast to everyone that this user is online
        messagingTemplate.convertAndSend(
                "/topic/presence",
                response
        );
        return ResponseEntity.ok(response);
    }

    // User goes offline — called when user logs out
    @PostMapping("/offline")
    public ResponseEntity<PresenceResponse> goOffline(
            @RequestParam String email) {
        presenceService.setUserOffline(email);
        PresenceResponse response = presenceService.getUserPresence(email);

        // Broadcast to everyone that this user is offline
        messagingTemplate.convertAndSend(
                "/topic/presence",
                response
        );
        return ResponseEntity.ok(response);
    }

    // Check if specific user is online
    @GetMapping("/status")
    public ResponseEntity<PresenceResponse> getStatus(
            @RequestParam String email) {
        return ResponseEntity.ok(
                presenceService.getUserPresence(email)
        );
    }

    // Refresh online status (heartbeat)
    @PostMapping("/refresh")
    public ResponseEntity<String> refresh(
            @RequestParam String email) {
        presenceService.refreshOnlineStatus(email);
        return ResponseEntity.ok("Status refreshed");
    }

    // WebSocket typing indicator
    @MessageMapping("/typing")
    public void typing(@Payload String email) {
        messagingTemplate.convertAndSend(
                "/topic/typing",
                email + " is typing..."
        );
    }
}