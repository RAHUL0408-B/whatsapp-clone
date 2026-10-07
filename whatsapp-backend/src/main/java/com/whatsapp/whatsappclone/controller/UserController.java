package com.whatsapp.whatsappclone.controller;

import com.whatsapp.whatsappclone.dto.UserDto;
import com.whatsapp.whatsappclone.entity.User;
import com.whatsapp.whatsappclone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    // Get contacts (all users except current user) with optional search filter
    @GetMapping("/contacts")
    public ResponseEntity<List<UserDto>> getContacts(
            @RequestParam String email,
            @RequestParam(required = false) String search) {

        List<User> users;
        if (search != null && !search.trim().isEmpty()) {
            users = userRepository.findByUsernameContainingIgnoreCaseAndEmailNot(search.trim(), email);
        } else {
            users = userRepository.findByEmailNot(email);
        }

        List<UserDto> dtos = users.stream().map(u -> UserDto.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .about(u.getAbout())
                .isOnline(u.isOnline())
                .avatarUrl(u.getAvatarUrl())
                .build()
        ).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
}
