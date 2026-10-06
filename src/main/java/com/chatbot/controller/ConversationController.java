package com.chatbot.controller;

import com.chatbot.models.Conversation;
import com.chatbot.services.ConversationService;

import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/conversations")
public class ConversationController {
    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @PostMapping
    public Conversation createConversation() {
        return conversationService
                .createConversation();
    }


    @GetMapping
    public List<Conversation> getConversations() {
        return conversationService.getAllConversations();
    }
}