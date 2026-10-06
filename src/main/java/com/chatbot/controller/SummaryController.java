package com.chatbot.controller;

import com.chatbot.dto.ChatMessageResponse;
import com.chatbot.models.ChatMessage;
import com.chatbot.services.SummaryService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class SummaryController {

    private final SummaryService summaryService;


    public SummaryController(SummaryService summaryService) {

        this.summaryService = summaryService;
    }

    @PostMapping("/chat")
    public String chat(@RequestBody String message, @RequestParam String conversationId) {

        return summaryService.chat(message, conversationId);
    }


    @GetMapping("/chat/{conversationId}/messages")
    public List<ChatMessageResponse> getMessages(@PathVariable String conversationId) {

        List<ChatMessage> messages = summaryService.getConversationHistory(conversationId);

        return messages
                .stream()
                .map(
                        message ->
                                new ChatMessageResponse(

                                        message.getId(),

                                        message.getRole(),

                                        message.getContent(),

                                        message.getCreatedAt()
                                )
                )
                .toList();
    }
}