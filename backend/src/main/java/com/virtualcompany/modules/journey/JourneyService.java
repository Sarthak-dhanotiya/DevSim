package com.virtualcompany.modules.journey;

import com.virtualcompany.common.exception.*;
import com.virtualcompany.modules.profile.repository.StudentProfileRepository;
import com.virtualcompany.modules.profile.entity.*;
import com.virtualcompany.modules.careertrack.repository.CareerTrackRepository;
import com.virtualcompany.modules.project.repository.ProjectRepository;
import com.virtualcompany.modules.project.dto.ProjectResponse;
import com.virtualcompany.modules.enrollment.service.EnrollmentService;
import com.virtualcompany.modules.enrollment.dto.EnrollProjectRequest;
import com.virtualcompany.modules.enrollment.repository.EnrollmentRepository;
import com.virtualcompany.modules.enrollment.entity.EnrollmentStatus;
import com.virtualcompany.modules.ticket.repository.*;
import com.virtualcompany.modules.ticket.entity.*;
import com.virtualcompany.modules.ticket.service.AiTaskGenerationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import java.util.*;

@Service @RequiredArgsConstructor
public class JourneyService {
    private final JourneyRepository journeys;
    private final StudentProfileRepository profiles;
    private final CareerTrackRepository tracks;
    private final ProjectRepository projects;
    private final EnrollmentService enrollments;
    private final EnrollmentRepository enrollmentRepository;
    private final ProjectTicketRepository tickets;
    private final StudentTicketProgressRepository progress;
    private final AiTaskGenerationService generator;
    private final ChallengeService challenges;
    @Value("${app.gemini.api-key:}") private String apiKey;
    private StudentJourney journey(UUID userId) {
        return journeys.findByUserId(userId).orElseGet(() -> { var j = new StudentJourney(); j.setUserId(userId); return journeys.save(j); });
    }
    public record Recommendation(ProjectResponse project, int matchScore, List<String> matchedSkills, List<String> learningSkills, String reason) {}
    public record State(StudentJourney journey, List<Recommendation> recommendations, String engine, String assessmentNote) {}
    @Transactional public State state(UUID userId) {
        var j = journey(userId);
        return new State(j, recommendations(userId, j), apiKey == null || apiKey.isBlank() ? "BUILT_IN" : "GEMINI_CONFIGURED", "Starter assessment gives a provisional level; it does not execute code or certify skills.");
    }
    @Transactional public State save(UUID userId, JourneyRequest request) {
        var j = journey(userId);
        if (!j.getStatus().equals("DRAFT") && !j.getStatus().equals("REJECTED")) throw new BadRequestException("Your journey is already submitted. View its current status.");
        var profile = profiles.findByUserId(userId).orElseThrow(() -> new ResourceNotFoundException("Profile", "userId", userId));
        var track = tracks.findById(request.getCareerTrackId()).orElseThrow(() -> new BadRequestException("Choose a valid career track."));
        if (!track.isActive()) throw new BadRequestException("This career track is inactive.");
        profile.setSelectedCareerTrack(track);
        profile.setExperienceLevel(ExperienceLevel.valueOf(request.getExperienceLevel()));
        profiles.save(profile);
        j.setSkills(String.join(", ", request.getSkills().stream().map(String::trim).distinct().toList()));
        j.setGoal(request.getGoal().trim()); j.setWeeklyHours(request.getWeeklyHours());
        j.setAssignmentMode(request.getAssignmentMode()); j.setPreferredProjectId(request.getProjectId());
        j.setRequestNote(request.getRequestNote()); j.setStatus("DRAFT");
        if(j.getChallengeFingerprint()!=null&&!challenges.fingerprint(j,profile).equals(j.getChallengeFingerprint())){j.setChallengeFingerprint(null);j.setChallengeJson(null);j.setAssessmentScore(null);j.setAssessmentAnswer(null);j.setAssessmentSkipped(false);}
        journeys.save(j);
        return state(userId);
    }
    @Transactional public void resume(UUID userId, ResumeParser.ParsedResume result) {
        var j = journey(userId);
        if (!Set.of("DRAFT", "REJECTED").contains(j.getStatus())) throw new BadRequestException("Onboarding is already submitted.");
        j.setChallengeFingerprint(null);j.setAssessmentScore(null);j.setAssessmentAnswer(null);j.setAssessmentSkipped(false);
        j.setResumeName(result.fileName()); j.setResumeSummary(result.summary());
        j.setSkills(String.join(", ", result.skills())); journeys.save(j);
    }
    public record AssessmentRequest(List<Integer> answers, String solution, String challengeId) {}
    @Transactional public ChallengeService.View challenge(UUID userId, boolean retry) { var j=journey(userId); if(retry&&j.getChallengeJson()!=null&&j.getChallengeJson().contains("PROFILE_FALLBACK")){j.setChallengeFingerprint(null);} var p=profiles.findByUserId(userId).orElseThrow(); var view=challenges.get(j,p); journeys.save(j); return view; }
    public record AssessmentResult(int score, String level, String feedback) {}
    @Transactional public AssessmentResult assess(UUID userId, AssessmentRequest request) {
        var j = journey(userId);
        if (!Set.of("DRAFT", "REJECTED").contains(j.getStatus())) throw new BadRequestException("Assessment is already submitted.");
        var result=challenges.grade(j,profiles.findByUserId(userId).orElseThrow(),request);
        j.setAssessmentSkipped(false);j.setAssessmentScore(result.score());j.setAssessmentAnswer(request.solution());journeys.save(j);
        return result;
    }
    @Transactional public State skipAssessment(UUID userId) {var j=journey(userId);if(!Set.of("DRAFT","REJECTED").contains(j.getStatus()))throw new BadRequestException("Journey already submitted");j.setAssessmentSkipped(true);j.setAssessmentScore(null);j.setAssessmentAnswer(null);journeys.save(j);return state(userId);}
    private List<Recommendation> recommendations(UUID userId, StudentJourney j) {
        var profile = profiles.findByUserId(userId).orElseThrow();
        var known = Arrays.stream(j.getSkills().split(",")).map(String::trim).filter(s -> !s.isBlank()).toList();
        String level = startingLevel(j, profile);
        return projects.findByActiveTrue().stream().map(p -> {
            var techs = p.getTechnologies().stream().map(t -> t.getTechnologyName()).toList();
            var matched = techs.stream().filter(t -> known.stream().anyMatch(s -> skillMatches(s, t))).toList();
            var learning = techs.stream().filter(t -> !matched.contains(t)).toList();
            boolean sameTrack = profile.getSelectedCareerTrack() != null && profile.getSelectedCareerTrack().getId().equals(p.getCareerTrack().getId());
            int score = (sameTrack ? 35 : 0) + (techs.isEmpty() ? 0 : (int)Math.round(40.0 * matched.size() / techs.size())) + (p.getDifficulty().name().equals(level) ? 25 : p.getDifficulty().name().equals("ADVANCED") && level.equals("BEGINNER") ? 0 : 10);
            String reason = (sameTrack ? "Matches your career track. " : "Explore a different career track. ") + (matched.isEmpty() ? "A learning-first project with new technologies. " : "Uses " + String.join(", ", matched) + ". ") + "Suggested starting level: " + level.toLowerCase() + ".";
            return new Recommendation(ProjectResponse.fromEntity(p), score, matched, learning, reason);
        }).sorted(Comparator.comparingInt(Recommendation::matchScore).reversed().thenComparing(r -> r.project().getName())).limit(3).toList();
    }
    static boolean skillMatches(String skill, String technology) {
        String s = skill.toLowerCase(Locale.ROOT).trim(), t = technology.toLowerCase(Locale.ROOT).trim();
        return t.equals(s) || t.startsWith(s + " ") || t.startsWith(s + ".") || t.startsWith(s + "-");
    }
    private String startingLevel(StudentJourney j, StudentProfile p) {
        if (j.getAssessmentScore() == null || j.getAssessmentScore() < 80) return "BEGINNER";
        return p.getExperienceLevel() == ExperienceLevel.BEGINNER ? "BEGINNER" : "INTERMEDIATE";
    }
    @Transactional public State complete(UUID userId, UUID projectId) {
        var j = journey(userId);
        if (Set.of("ASSIGNED", "PENDING_REVIEW").contains(j.getStatus())) return state(userId);
        if (j.getSkills().isBlank() || j.getGoal().isBlank() || (j.getAssessmentScore() == null && !j.isAssessmentSkipped())) throw new BadRequestException("Confirm skills, career goal and finish the starter assessment first.");
        if (projectId == null) throw new BadRequestException("Choose a project.");
        var p = projects.findById(projectId).orElseThrow(() -> new BadRequestException("Project does not exist."));
        if (!p.isActive()) throw new BadRequestException("Project is inactive.");
        j.setPreferredProjectId(projectId);
        if (j.getAssignmentMode().equals("GUIDED")) j.setStatus("PENDING_REVIEW");
        else assign(j, projectId);
        var profile = profiles.findByUserId(userId).orElseThrow();
        profile.setOnboardingCompleted(j.getStatus().equals("ASSIGNED")); profiles.save(profile); journeys.save(j);
        return state(userId);
    }
    private void assign(StudentJourney j, UUID projectId) {
        var profile = profiles.findByUserId(j.getUserId()).orElseThrow();
        enrollments.enroll(j.getUserId(), new EnrollProjectRequest(projectId));
        if (tickets.findByProjectIdAndTargetUserIdOrderByOrderIndexAsc(projectId, j.getUserId()).isEmpty())
            generator.generatePersonalizedTasks(j.getUserId(), projectId, startingLevel(j, profile), "Goal: " + j.getGoal() + "; confirmed skills: " + j.getSkills() + "; weekly hours: " + j.getWeeklyHours(), 3);
        j.setStatus("ASSIGNED"); j.setPreferredProjectId(projectId);
        profile.setOnboardingCompleted(true); profiles.save(profile);
    }
    public record ReviewRequest(UUID projectId, boolean approve, String note) {}
    @Transactional public State review(UUID userId, ReviewRequest request) {
        var j = journey(userId);
        if (!j.getStatus().equals("PENDING_REVIEW")) throw new BadRequestException("This request has already been reviewed.");
        if (request.note() != null && request.note().length() > 2000) throw new BadRequestException("Note is too long.");
        j.setAdminNote(request.note());
        if (request.approve()) {
            var p = projects.findById(Optional.ofNullable(request.projectId()).orElse(j.getPreferredProjectId())).orElseThrow(() -> new BadRequestException("Choose a project."));
            if (!p.isActive()) throw new BadRequestException("Project is inactive.");
            assign(j, p.getId());
        } else {
            if (request.note() == null || request.note().isBlank()) throw new BadRequestException("Add a reason so the student can revise their request.");
            j.setStatus("REJECTED");
            var p = profiles.findByUserId(userId).orElseThrow(); p.setOnboardingCompleted(false); profiles.save(p);
        }
        journeys.save(j); return state(userId);
    }
    public record RequestItem(UUID userId, String name, String email, StudentJourney journey) {}
    @Transactional public List<RequestItem> requests() {
        return journeys.findByStatusOrderByUpdatedAtAsc("PENDING_REVIEW").stream().map(j -> {
            var p = profiles.findByUserId(j.getUserId()).orElseThrow();
            return new RequestItem(j.getUserId(), p.getName(), p.getUser().getEmail(), j);
        }).toList();
    }
    @Transactional public Map<String, Object> nextSprint(UUID userId) {
        var j = journey(userId);
        if (!j.getStatus().equals("ASSIGNED")) throw new BadRequestException("A project assignment is required.");
        var profile = profiles.findByUserId(userId).orElseThrow();
        var enrollment = enrollmentRepository.findByStudentIdAndProjectId(profile.getId(), j.getPreferredProjectId()).orElseThrow();
        var ownTickets = tickets.findByProjectIdAndTargetUserIdOrderByOrderIndexAsc(j.getPreferredProjectId(), userId);
        var records = progress.findByEnrollmentId(enrollment.getId()).stream().filter(p -> ownTickets.stream().anyMatch(t -> t.getId().equals(p.getTicket().getId()))).toList();
        if (records.size() < ownTickets.size() || records.isEmpty() || records.stream().anyMatch(p -> p.getStatus() != TicketStatus.DONE)) throw new BadRequestException("Finish your current sprint before unlocking the next one.");
        double average = records.stream().mapToInt(p -> p.getReviewScore() == null ? 0 : p.getReviewScore()).average().orElse(0);
        double attempts = records.stream().mapToInt(StudentTicketProgress::getReviewAttempts).average().orElse(0);
        double hints = records.stream().mapToInt(StudentTicketProgress::getHintsUsed).average().orElse(0);
        String previous = ownTickets.get(ownTickets.size() - 1).getDifficultyLevel();
        String difficulty = average >= 85 && attempts <= 2 && hints <= 1 ? ("BEGINNER".equals(previous) ? "INTERMEDIATE" : "ADVANCED") : (average < 75 || attempts > 3 ? "BEGINNER" : previous);
        String focus = average >= 85 ? "Testing and reliability; performance; " + j.getGoal() : "Validation, tests and smaller tasks; " + j.getGoal();
        var generated = generator.generatePersonalizedTasks(userId, j.getPreferredProjectId(), difficulty, focus, 3);
        enrollment.setStatus(EnrollmentStatus.IN_PROGRESS); enrollment.setCompletedAt(null); enrollmentRepository.save(enrollment);
        return Map.of("tickets", generated, "difficulty", difficulty, "reason", "Next sprint uses review score, revision attempts and hints. Average review score: " + Math.round(average) + "/100; provisional feedback, not executed test results.");
    }
    @Transactional public Map<String, Object> evidence(UUID userId) {
        var profile = profiles.findByUserId(userId).orElseThrow();
        var items = new ArrayList<Map<String, Object>>();
        for (var enrollment : enrollmentRepository.findByStudentId(profile.getId())) {
            for (var p : progress.findByEnrollmentId(enrollment.getId())) if (p.getStatus() == TicketStatus.DONE) {
                var row = new LinkedHashMap<String, Object>();
                row.put("project", enrollment.getProject().getName()); row.put("ticket", p.getTicket().getTicketKey());
                row.put("title", p.getTicket().getTitle()); row.put("criteria", p.getTicket().getAcceptanceCriteria());
                row.put("score", p.getReviewScore()); row.put("completedAt", p.getCompletedAt()); row.put("source", p.getTicket().getGenerationSource());
                row.put("feedback", p.getAiReviewFeedback()); items.add(row);
            }
        }
        return Map.of("name", profile.getName(), "skills", journey(userId).getSkills(), "completedTickets", items, "verification", "AI or heuristic review of submitted text. No code execution, repository merge or test pass certification.");
    }
}
