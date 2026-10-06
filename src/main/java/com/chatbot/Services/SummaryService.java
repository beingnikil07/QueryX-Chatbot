package com.chatbot.Services;

import com.chatbot.Repository.ChatMessageRepository;
import com.chatbot.models.ChatMessage;
import org.springframework.ai.chat.client.ChatClient;

import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class SummaryService {

    private final ChatClient chatClient;
    private  final ChatMessageRepository chatMessageRepository;

    public SummaryService(ChatClient.Builder builder,ChatMessageRepository chatMessageRepository){
        this.chatClient=builder.build();
        this.chatMessageRepository=chatMessageRepository;
    }


    public String chat(String message,String conversationId){
        // 1. Get previous chat history
        List<ChatMessage> history =
                chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(
                        conversationId
                );

        // 2. Convert DB messages -> Spring AI messages
        List<Message> messages = new ArrayList<>();

        for (ChatMessage chatMessage : history) {

            switch (chatMessage.getRole()) {

                case "USER":
                    messages.add(
                            new UserMessage(chatMessage.getContent())
                    );
                    break;

                case "ASSISTANT":
                    messages.add(
                            new AssistantMessage(chatMessage.getContent())
                    );
                    break;

                case "SYSTEM":
                    messages.add(
                            new SystemMessage(chatMessage.getContent())
                    );
                    break;
            }
        }

        // 3. Add current user message
        messages.add(new UserMessage(message));

        // 4. Send complete conversation to LLM
        String response = chatClient
                .prompt()
                .messages(messages)
                .call()
                .content();

        // 5. Save USER message
        chatMessageRepository.save(
                new ChatMessage(
                        conversationId,
                        "USER",
                        message
                )
        );

        // 6. Save ASSISTANT response
        chatMessageRepository.save(
                new ChatMessage(
                        conversationId,
                        "ASSISTANT",
                        response
                )
        );

        return response;
    }

}
