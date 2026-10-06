package com.chatbot.Controller;
import com.chatbot.Services.SummaryService;
import com.chatbot.models.ChatMessage;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class SummaryController {

    private SummaryService summaryService;

    public SummaryController(SummaryService summaryService){
        this.summaryService=summaryService;
    }

    @PostMapping("/chat")
    public String chat(@RequestBody String message, @RequestParam String conversationId){
        return summaryService.chat(message,conversationId);
    }

    @GetMapping("/{conversationId}/messages")
    public List<ChatMessage> getMessages(
            @PathVariable String conversationId) {

        return summaryService.getConversationHistory(conversationId);
    }

}
