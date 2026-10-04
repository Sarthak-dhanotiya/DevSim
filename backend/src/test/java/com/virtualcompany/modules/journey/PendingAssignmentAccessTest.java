package com.virtualcompany.modules.journey;

import com.virtualcompany.common.security.UserPrincipal;
import com.virtualcompany.modules.enrollment.repository.EnrollmentRepository;
import com.virtualcompany.modules.enrollment.service.EnrollmentService;
import com.virtualcompany.modules.profile.repository.StudentProfileRepository;
import com.virtualcompany.modules.project.repository.ProjectRepository;
import com.virtualcompany.modules.ticket.controller.WorkspaceController;
import com.virtualcompany.modules.ticket.dto.AiChatRequest;
import com.virtualcompany.modules.ticket.repository.*;
import com.virtualcompany.modules.ticket.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PendingAssignmentAccessTest {
    @Test void pendingRequestBlocksOldWorkspaceHintsAndMentor() {
        var journeys = mock(JourneyRepository.class);
        var enrollments = mock(EnrollmentRepository.class);
        var ticketService = mock(TicketService.class);
        var mentor = mock(AiTechLeadService.class);
        var user = mock(UserPrincipal.class);
        UUID id = UUID.randomUUID(); when(user.getId()).thenReturn(id);
        when(journeys.existsByUserIdAndStatus(id, "PENDING_REVIEW")).thenReturn(true);
        var controller = new WorkspaceController(enrollments, mock(ProjectTicketRepository.class), mock(StudentTicketProgressRepository.class), journeys, ticketService, mentor);
        assertThatThrownBy(() -> controller.getWorkspace(user, UUID.randomUUID())).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> controller.hint(user, UUID.randomUUID(), UUID.randomUUID())).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> controller.chatWithTechLead(user, new AiChatRequest(null, "Hello"))).isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(enrollments, ticketService, mentor);
    }
    @Test void pendingRequestHidesPreviouslyEnrolledProjects() {
        var journeys = mock(JourneyRepository.class);
        var enrollments = mock(EnrollmentRepository.class);
        var profiles = mock(StudentProfileRepository.class);
        var service = new EnrollmentService(enrollments, profiles, mock(ProjectRepository.class), journeys);
        UUID id = UUID.randomUUID(); when(journeys.existsByUserIdAndStatus(id, "PENDING_REVIEW")).thenReturn(true);
        assertThat(service.getCurrentEnrollment(id)).isNull();
        assertThat(service.getStudentEnrollments(id)).isEmpty();
        verifyNoInteractions(enrollments, profiles);
    }
}
