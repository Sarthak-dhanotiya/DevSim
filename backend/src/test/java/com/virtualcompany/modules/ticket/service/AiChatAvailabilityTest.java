package com.virtualcompany.modules.ticket.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.virtualcompany.modules.ticket.dto.AiChatRequest;
import com.virtualcompany.modules.ticket.repository.ProjectTicketRepository;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.http.HttpStatus;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class AiChatAvailabilityTest {
    AiTechLeadService service() throws Exception {
        var service = spy(new AiTechLeadService(mock(ProjectTicketRepository.class), new ObjectMapper()));
        ReflectionTestUtils.setField(service, "geminiApiKey", "test-key");
        doNothing().when(service).pauseBeforeRetry(anyInt());
        return service;
    }
    AiChatRequest request() { return new AiChatRequest(null, "Explain optimistic locking"); }
    @Test void missingKeyIsExplicitlyOfflineWithoutFabricatedAnswer() throws Exception {
        var service = service(); ReflectionTestUtils.setField(service, "geminiApiKey", "");
        var result = service.respondToStudent(request());
        assertThat(result.getSource()).isEqualTo("OFFLINE");
        assertThat(result.getAttempts()).isZero();
        assertThat(result.isRetryable()).isFalse();
        assertThat(result.getResponse()).doesNotContain("Pessimistic", "Hey");
        verify(service, never()).callGeminiApi(anyString(), any());
    }
    @Test void transientFailureCanRecoverOnThirdAttempt() throws Exception {
        var service = service();
        doThrow(new HttpServerErrorException(HttpStatus.SERVICE_UNAVAILABLE))
            .doThrow(new HttpServerErrorException(HttpStatus.SERVICE_UNAVAILABLE))
            .doReturn("Real answer").when(service).callGeminiApi(anyString(), any());
        var result = service.respondToStudent(request());
        assertThat(result.getSource()).isEqualTo("GEMINI");
        assertThat(result.getAttempts()).isEqualTo(3);
        assertThat(result.getResponse()).isEqualTo("Real answer");
        verify(service, times(2)).pauseBeforeRetry(anyInt());
    }
    @Test void persistent503StopsAfterTwoRetriesWithoutFallback() throws Exception {
        var service = service();
        doThrow(new HttpServerErrorException(HttpStatus.SERVICE_UNAVAILABLE)).when(service).callGeminiApi(anyString(), any());
        var result = service.respondToStudent(request());
        assertThat(result.getSource()).isEqualTo("UNAVAILABLE");
        assertThat(result.getReason()).isEqualTo("PROVIDER_BUSY");
        assertThat(result.isRetryable()).isTrue();
        verify(service, times(3)).callGeminiApi(anyString(), any());
    }
    @Test void invalidCredentialsAreNotRetried() throws Exception {
        var service = service();
        doThrow(new HttpClientErrorException(HttpStatus.FORBIDDEN)).when(service).callGeminiApi(anyString(), any());
        var result = service.respondToStudent(request());
        assertThat(result.getReason()).isEqualTo("CONFIGURATION_ERROR");
        assertThat(result.isRetryable()).isFalse();
        verify(service, times(1)).callGeminiApi(anyString(), any());
        verify(service, never()).pauseBeforeRetry(anyInt());
    }
    @Test void emptyResponseIsNotReportedAsLiveAI() throws Exception {
        var service = service(); doReturn(null).when(service).callGeminiApi(anyString(), any());
        var result = service.respondToStudent(request());
        assertThat(result.getSource()).isEqualTo("UNAVAILABLE");
        assertThat(result.getReason()).isEqualTo("EMPTY_RESPONSE");
    }
}
