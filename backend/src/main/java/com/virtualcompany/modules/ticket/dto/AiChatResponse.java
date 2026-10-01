package com.virtualcompany.modules.ticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatResponse {
    private String senderName;
    private String senderRole;
    private String response;
    @Builder.Default
    private Instant timestamp = Instant.now();
}
