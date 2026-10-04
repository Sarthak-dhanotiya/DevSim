package com.virtualcompany.modules.journey;
import com.virtualcompany.modules.profile.repository.StudentProfileRepository;
import com.virtualcompany.modules.profile.entity.StudentProfile;
import com.virtualcompany.modules.careertrack.repository.CareerTrackRepository;
import com.virtualcompany.modules.project.repository.ProjectRepository;
import com.virtualcompany.modules.enrollment.service.EnrollmentService;
import com.virtualcompany.modules.enrollment.repository.EnrollmentRepository;
import com.virtualcompany.modules.ticket.repository.*;
import com.virtualcompany.modules.ticket.service.AiTaskGenerationService;
import com.virtualcompany.common.exception.BadRequestException;
import org.junit.jupiter.api.*;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;

class JourneyServiceTest {
    JourneyRepository repo = mock(JourneyRepository.class);
    StudentProfileRepository profiles = mock(StudentProfileRepository.class);
    AiTaskGenerationService generator = mock(AiTaskGenerationService.class);
    ProjectRepository projects = mock(ProjectRepository.class);
    EnrollmentService enroll = mock(EnrollmentService.class);
    JourneyService service = new JourneyService(repo, profiles, mock(CareerTrackRepository.class), projects, enroll, mock(EnrollmentRepository.class), mock(ProjectTicketRepository.class), mock(StudentTicketProgressRepository.class), generator);
    UUID user = UUID.randomUUID(); StudentJourney journey = new StudentJourney();
    @BeforeEach void setup() { journey.setUserId(user); when(repo.findByUserId(user)).thenReturn(Optional.of(journey)); }
    @Test void rejectsIncompleteJourneyBeforeEnrollment() {
        assertThatThrownBy(() -> service.complete(user, UUID.randomUUID())).isInstanceOf(BadRequestException.class);
        verifyNoInteractions(enroll, generator);
    }
    @Test void repeatedCompletionDoesNotGenerateMoreTickets() {
        journey.setStatus("ASSIGNED"); when(profiles.findByUserId(user)).thenReturn(Optional.of(StudentProfile.builder().name("Student").build())); when(projects.findByActiveTrue()).thenReturn(List.of());
        assertThat(service.complete(user, UUID.randomUUID()).journey().getStatus()).isEqualTo("ASSIGNED");
        verifyNoInteractions(enroll, generator);
    }
    @Test void assessmentValidatesAnswersAndLocksAfterSubmission() {
        assertThatThrownBy(() -> service.assess(user, new JourneyService.AssessmentRequest(List.of(1), "return active"))).isInstanceOf(BadRequestException.class);
        assertThat(service.assess(user, new JourneyService.AssessmentRequest(List.of(1,0,2), "if null return []; return data.filter(active)")).score()).isEqualTo(100);
        journey.setStatus("PENDING_REVIEW");
        assertThatThrownBy(() -> service.assess(user, new JourneyService.AssessmentRequest(List.of(1,0,2), "return active"))).isInstanceOf(BadRequestException.class);
    }
    @Test void avoidsSubstringSkillMatches() {
        assertThat(JourneyService.skillMatches("Java", "JavaScript")).isFalse();
        assertThat(JourneyService.skillMatches("Java", "Java 21")).isTrue();
    }
    @Test void skipDoesNotInventAssessmentScoreAndLocksAfterSubmission() {
        when(profiles.findByUserId(user)).thenReturn(Optional.of(StudentProfile.builder().name("Student").build()));
        when(projects.findByActiveTrue()).thenReturn(List.of());
        journey.setAssessmentScore(100);
        service.skipAssessment(user);
        assertThat(journey.isAssessmentSkipped()).isTrue();
        assertThat(journey.getAssessmentScore()).isNull();
        service.assess(user,new JourneyService.AssessmentRequest(List.of(1,0,2),"if null return []; return data.filter(active)"));
        assertThat(journey.isAssessmentSkipped()).isFalse();
        journey.setStatus("PENDING_REVIEW");
        assertThatThrownBy(()->service.skipAssessment(user)).isInstanceOf(BadRequestException.class);
    }
    @Test void cannotApproveRequestTwice() {
        journey.setStatus("ASSIGNED");
        assertThatThrownBy(() -> service.review(user, new JourneyService.ReviewRequest(UUID.randomUUID(), true, ""))).isInstanceOf(BadRequestException.class);
        verifyNoInteractions(enroll, generator);
    }
    @Test void guidedSubmissionKeepsAccessLockedUntilApproval() {
        var track = com.virtualcompany.modules.careertrack.entity.CareerTrack.builder().id(UUID.randomUUID()).name("Java").slug("java").build();
        var project = com.virtualcompany.modules.project.entity.Project.builder().id(UUID.randomUUID()).name("API").slug("api").careerTrack(track).build();
        var profile = StudentProfile.builder().id(UUID.randomUUID()).name("Student").selectedCareerTrack(track).onboardingCompleted(true).build();
        when(profiles.findByUserId(user)).thenReturn(Optional.of(profile));
        when(projects.findById(project.getId())).thenReturn(Optional.of(project));
        when(projects.findByActiveTrue()).thenReturn(List.of(project));
        journey.setSkills("Java"); journey.setGoal("Build APIs"); journey.setAssessmentScore(80); journey.setAssignmentMode("GUIDED");
        assertThat(service.complete(user, project.getId()).journey().getStatus()).isEqualTo("PENDING_REVIEW");
        assertThat(profile.isOnboardingCompleted()).isFalse();
        verifyNoInteractions(enroll, generator);
        assertThat(service.review(user, new JourneyService.ReviewRequest(project.getId(), true, "Approved")).journey().getStatus()).isEqualTo("ASSIGNED");
        assertThat(profile.isOnboardingCompleted()).isTrue();
    }
}
