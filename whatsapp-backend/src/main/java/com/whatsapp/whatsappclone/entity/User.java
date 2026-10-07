package com.whatsapp.whatsappclone.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(nullable = false)
    private String password;

    @Column(name = "about")
    @Builder.Default
    private String about = "Hey there! I am using WhatsApp.";

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "is_online")
    private boolean isOnline;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.isOnline = false;
        if (this.about == null) {
            this.about = "Hey there! I am using WhatsApp.";
        }
    }
}