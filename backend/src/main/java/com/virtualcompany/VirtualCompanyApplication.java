package com.virtualcompany;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class VirtualCompanyApplication {

    public static void main(String[] args) {
        SpringApplication.run(VirtualCompanyApplication.class, args);
    }
}
