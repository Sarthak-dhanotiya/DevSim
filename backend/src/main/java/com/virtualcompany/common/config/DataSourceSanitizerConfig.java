package com.virtualcompany.common.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSourceSanitizerConfig implements BeanPostProcessor {

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        if (bean instanceof DataSourceProperties properties) {
            String url = properties.getUrl();
            if (url != null && url.contains("sslmode=required")) {
                properties.setUrl(url.replace("sslmode=required", "sslmode=require"));
            }
        }
        if (bean instanceof HikariDataSource hikari) {
            String url = hikari.getJdbcUrl();
            if (url != null && url.contains("sslmode=required")) {
                hikari.setJdbcUrl(url.replace("sslmode=required", "sslmode=require"));
            }
        }
        return bean;
    }
}
