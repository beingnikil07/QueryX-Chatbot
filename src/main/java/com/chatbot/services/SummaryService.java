package com.chatbot.services;

import com.chatbot.models.ChatMessage;
import com.chatbot.models.Conversation;

import com.chatbot.repository.ChatMessageRepository;
import com.chatbot.repository.ConversationRepository;

import org.springframework.ai.chat.client.ChatClient;

import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Service
public class SummaryService {

    private final ChatClient chatClient;

    private final ChatMessageRepository chatMessageRepository;

    private final ConversationRepository conversationRepository;


    public SummaryService(
            ChatClient.Builder builder,
            ChatMessageRepository chatMessageRepository,
            ConversationRepository conversationRepository
    ) {

        this.chatClient =
                builder.build();

        this.chatMessageRepository =
                chatMessageRepository;

        this.conversationRepository =
                conversationRepository;
    }


    public String chat(
            String message,
            String conversationId
    ) {

        // 1. Find conversation

        Conversation conversation =
                conversationRepository
                        .findById(conversationId)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Conversation not found"
                                )
                        );


        // 2. Get previous messages

        List<ChatMessage> history =
                chatMessageRepository
                        .findByConversation_IdOrderByCreatedAtAsc(
                                conversationId
                        );


        // 3. Spring AI messages

        List<Message> messages =
                new ArrayList<>();


        // System prompt

        messages.add(
                new SystemMessage(
                        """
                        You are QueryX, a customer support
                        query summarizer for a food delivery app.

                        Your job is to summarize customer queries
                        in a short and clear way.

                        Include only important information.

                        Focus on issues such as:
                        - delayed order
                        - missing items
                        - wrong items
                        - cold or damaged food
                        - payment problems
                        - refund requests
                        - cancellation
                        - delivery partner issues

                        Do not invent any information.

                        Keep the summary concise.
                        """
                )
        );


        // 4. Previous history

        for (ChatMessage chatMessage : history) {

            switch (chatMessage.getRole()) {

                case "USER":

                    messages.add(
                            new UserMessage(
                                    chatMessage.getContent()
                            )
                    );

                    break;


                case "ASSISTANT":

                    messages.add(
                            new AssistantMessage(
                                    chatMessage.getContent()
                            )
                    );

                    break;
            }
        }


        // 5. Current customer query

        messages.add(
                new UserMessage(message)
        );


        // 6. Call LLM

        String response =
                chatClient
                        .prompt()
                        .messages(messages)
                        .call()
                        .content();


        // 7. Save customer query

        chatMessageRepository.save(

                new ChatMessage(
                        conversation,
                        "USER",
                        message
                )
        );


        // 8. Save AI summary

        chatMessageRepository.save(

                new ChatMessage(
                        conversation,
                        "ASSISTANT",
                        response
                )
        );


        // 9. First query becomes sidebar title

        if (history.isEmpty()) {

            String title = message;

            if (title.length() > 40) {

                title =
                        title.substring(
                                0,
                                40
                        ) + "...";
            }

            conversation.setTitle(title);
        }


        // 10. Update last activity

        conversation.setUpdatedAt(
                LocalDateTime.now()
        );


        conversationRepository.save(
                conversation
        );


        return response;
    }


    public List<ChatMessage>
    getConversationHistory(
            String conversationId
    ) {

        return chatMessageRepository
                .findByConversation_IdOrderByCreatedAtAsc(
                        conversationId
                );
    }
}