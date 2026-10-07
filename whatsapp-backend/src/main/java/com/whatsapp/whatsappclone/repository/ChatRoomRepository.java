package com.whatsapp.whatsappclone.repository;

import com.whatsapp.whatsappclone.entity.ChatRoom;
import com.whatsapp.whatsappclone.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    List<ChatRoom> findByMembersContaining(User user);

    @org.springframework.data.jpa.repository.Query("SELECT r FROM ChatRoom r WHERE SIZE(r.members) = 2 AND :u1 MEMBER OF r.members AND :u2 MEMBER OF r.members")
    java.util.Optional<ChatRoom> findDirectRoomBetweenUsers(
            @org.springframework.data.repository.query.Param("u1") User u1,
            @org.springframework.data.repository.query.Param("u2") User u2
    );
}