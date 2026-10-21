package com.virtualcompany.common.service;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class EmailServiceTest {
    @Test void productionWithoutApiKeyNeverAttemptsSmtp() {
        var smtp = mock(JavaMailSender.class);
        var service = new EmailService(smtp);
        ReflectionTestUtils.setField(service, "provider", "resend");
        ReflectionTestUtils.setField(service, "mailUsername", "smtp-user");
        service.sendEmailAsync("user@example.com", "Verify", "code").join();
        verifyNoInteractions(smtp);
    }

    @Test void rejectedHttpsRequestNeverFallsBackToSmtp() throws Exception {
        var smtp = mock(JavaMailSender.class);
        var http = mock(HttpClient.class);
        @SuppressWarnings("unchecked")
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(403);
        when(http.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(response);
        var service = new EmailService(smtp);
        ReflectionTestUtils.setField(service, "httpClient", http);
        ReflectionTestUtils.setField(service, "provider", "resend");
        ReflectionTestUtils.setField(service, "resendApiKey", "test-key");
        ReflectionTestUtils.setField(service, "resendFrom", "DevSim <mail@example.com>");
        ReflectionTestUtils.setField(service, "mailUsername", "smtp-user");
        service.sendEmailAsync("user@example.com", "Verify", "code").join();
        verify(http).send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class));
        verifyNoInteractions(smtp);
    }
}
