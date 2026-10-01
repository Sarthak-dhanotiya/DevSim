package com.virtualcompany;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class VirtualCompanyApplication {

    public static void main(String[] args) {
        // PostgreSQL JDBC driver requires sslmode=require (not "required")
        String dbSslMode = System.getenv("DB_SSL_MODE");
        if (dbSslMode != null && dbSslMode.equalsIgnoreCase("required")) {
            System.setProperty("DB_SSL_MODE", "require");
        }

        String dsUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (dsUrl != null && dsUrl.contains("sslmode=required")) {
            System.setProperty("spring.datasource.url", dsUrl.replace("sslmode=required", "sslmode=require"));
        }

        String dbUrl = System.getenv("DATABASE_URL");
        if (dbUrl != null && dbUrl.contains("sslmode=required")) {
            System.setProperty("DATABASE_URL", dbUrl.replace("sslmode=required", "sslmode=require"));
        }

        SpringApplication.run(VirtualCompanyApplication.class, args);
    }
}
