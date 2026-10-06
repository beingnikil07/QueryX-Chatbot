package com.chatbot.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "conversation_id",
            nullable = false
    )
    private Conversation conversation;

    @Column(nullable = false)
    private String role;

    @Column(
            columnDefinition = "TEXT",
            nullable = false
    )
    private String content;

    @Column(nullable = false)
    private LocalDateTime createdAt;


    public ChatMessage() {
    }


    public ChatMessage(
            Conversation conversation,
            String role,
            String content
    ) {
        this.conversation = conversation;
        this.role = role;
        this.content = content;
        this.createdAt = LocalDateTime.now();
    }


    public Long getId() {
        return id;
    }

    public Conversation getConversation() {
        return conversation;
    }

    public void setConversation(Conversation conversation) {
        this.conversation = conversation;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}