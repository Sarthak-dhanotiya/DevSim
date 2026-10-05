package com.virtualcompany.modules.journey;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.virtualcompany.modules.profile.entity.*;
import com.virtualcompany.common.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
class ChallengeServiceTest {
    @Test void classifiesInvalidKeyWithoutExposingProviderBody(){
        assertThat(ChallengeService.providerFailure(400,"{\"error\":{\"message\":\"API key not valid. Secret credential\",\"reason\":\"API_KEY_INVALID\"}}"))
            .contains("invalid").doesNotContain("Secret credential");
        assertThat(ChallengeService.providerFailure(400,"raw private request")).doesNotContain("raw private request");
        assertThat(ChallengeService.providerFailure(429,"quota")).contains("quota");
    }
    ChallengeService service=new ChallengeService(new ObjectMapper());
    StudentJourney journey(){var j=new StudentJourney();j.setSkills("Java, Redis, Kafka");j.setGoal("Build reliable APIs");return j;}
    StudentProfile profile(){return StudentProfile.builder().experienceLevel(ExperienceLevel.ADVANCED).build();}
    @Test void personalizedFallbackPersistsWithoutLeakingAnswerKeys() throws Exception {
        var j=journey();var p=profile();var view=service.get(j,p);
        assertThat(view.source()).isEqualTo("PROFILE_FALLBACK");
        assertThat(view.questions().get(0).title()).contains("organizations");
        assertThat(service.get(j,p).id()).isEqualTo(view.id());
        assertThat(new ObjectMapper().writeValueAsString(view)).doesNotContain("correct","explanation");
        var stored=new ObjectMapper().readValue(j.getChallengeJson(),ChallengeService.Challenge.class);
        var answers=stored.questions().stream().map(ChallengeService.Item::correct).toList();
        assertThat(service.grade(j,p,new JourneyService.AssessmentRequest(answers,"A design response",view.id())).score()).isEqualTo(100);
        assertThatThrownBy(()->service.grade(j,p,new JourneyService.AssessmentRequest(answers,"response","other"))).isInstanceOf(BadRequestException.class);
        j.setSkills("React");
        assertThatThrownBy(()->service.grade(j,p,new JourneyService.AssessmentRequest(answers,"response",view.id()))).isInstanceOf(BadRequestException.class);
        assertThat(service.get(j,p).questions().get(0).title()).contains("search");
    }
    @Test void hoursAdjustScopeNotExperienceAndInvalidateOldResults(){
        var j=journey();var p=profile();var first=service.get(j,p);j.setAssessmentScore(100);j.setWeeklyHours(2);
        var shortChallenge=service.get(j,p);
        assertThat(shortChallenge.id()).isNotEqualTo(first.id());
        assertThat(shortChallenge.questions()).hasSize(2);
        assertThat(shortChallenge.context()).contains("ADVANCED");
        assertThat(j.getAssessmentScore()).isNull();
        assertThatThrownBy(()->service.grade(j,p,new JourneyService.AssessmentRequest(List.of(-1,0),"response",shortChallenge.id()))).isInstanceOf(BadRequestException.class);
    }
}
