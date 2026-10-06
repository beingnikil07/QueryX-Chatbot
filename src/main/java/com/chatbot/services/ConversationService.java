package com.chatbot.services;

import com.chatbot.models.Conversation;
import com.chatbot.repository.ConversationRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConversationService {

    private final ConversationRepository conversationRepository;


    public ConversationService(
            ConversationRepository conversationRepository
    ) {
        this.conversationRepository =
                conversationRepository;
    }


    public Conversation createConversation() {

        Conversation conversation =
                new Conversation(
                        "New Customer Query"
                );

        return conversationRepository.save(
                conversation
        );
    }


    public List<Conversation> getAllConversations() {

        return conversationRepository
                .findAllByOrderByUpdatedAtDesc();
    }


    public Conversation getConversation(
            String conversationId
    ) {

        return conversationRepository
                .findById(conversationId)
                .orElseThrow(
                        () -> new RuntimeException(
                                "Conversation not found"
                        )
                );
    }
}