package com.virtualcompany.modules.github;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.*;
import java.util.UUID;
@Service @RequiredArgsConstructor
public class GithubRepositoryStore {
    private final JdbcTemplate db;
    @Transactional(propagation=Propagation.REQUIRES_NEW)
    public void record(UUID id,String name,String url){db.update("update student_project_enrollments set github_repo_name=?,github_repo_url=? where id=?",name,url,id);}
}
