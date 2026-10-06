package com.chatbot.Controller;
import com.chatbot.Services.SummaryService;
import org.springframework.web.bind.annotation.*;

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
}
