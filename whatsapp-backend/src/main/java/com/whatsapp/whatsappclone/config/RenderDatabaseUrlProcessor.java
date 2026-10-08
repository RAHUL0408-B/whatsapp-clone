package com.whatsapp.whatsappclone.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Automatically configures Spring Boot for Render cloud deployment:
 * 1. Parses Render's DATABASE_URL / DATABASE_INTERNAL_URL into standard Spring JDBC properties.
 * 2. Provides default PostgreSQL Hibernate dialect to prevent startup crashes when DB metadata check is delayed.
 * 3. Gracefully disables Redis and Kafka on Render free tier unless explicitly enabled.
 * 4. Activates the 'render' profile automatically when running in the Render environment.
 */
public class RenderDatabaseUrlProcessor implements EnvironmentPostProcessor, Ordered {

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment,
                                       SpringApplication application) {
        Map<String, Object> props = new HashMap<>();

        // Check if running on Render or in a containerized cloud environment
        String renderEnv = environment.getProperty("RENDER");
        String renderService = environment.getProperty("RENDER_SERVICE_ID");
        String databaseInternalUrl = environment.getProperty("DATABASE_INTERNAL_URL");
        String databaseUrl = environment.getProperty("DATABASE_URL");

        boolean isRender = "true".equalsIgnoreCase(renderEnv)
                || renderService != null
                || (databaseInternalUrl != null && !databaseInternalUrl.isEmpty())
                || (databaseUrl != null && !databaseUrl.isEmpty());

        // 1. Process Database URL if available
        String rawDbUrl = (databaseInternalUrl != null && !databaseInternalUrl.isEmpty())
                ? databaseInternalUrl : databaseUrl;

        if (rawDbUrl != null && !rawDbUrl.trim().isEmpty()) {
            parseDatabaseUrl(rawDbUrl.trim(), props);
        }

        // 2. Render-specific safety defaults
        if (isRender) {
            // Auto-activate "render" profile if no profile was explicitly specified
            String[] activeProfiles = environment.getActiveProfiles();
            if (activeProfiles == null || activeProfiles.length == 0) {
                environment.addActiveProfile("render");
            }

            // Ensure Hibernate uses PostgreSQL dialect explicitly
            props.put("spring.jpa.properties.hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
            props.put("spring.jpa.database-platform", "org.hibernate.dialect.PostgreSQLDialect");

            // Disable Redis unless explicitly requested
            String redisEnabled = environment.getProperty("REDIS_ENABLED");
            if (!"true".equalsIgnoreCase(redisEnabled)) {
                props.put("app.redis.enabled", "false");
            }

            // Disable Kafka unless explicitly requested
            String kafkaEnabled = environment.getProperty("KAFKA_ENABLED");
            if (!"true".equalsIgnoreCase(kafkaEnabled)) {
                props.put("app.kafka.enabled", "false");
            }

            // Exclude auto-configurations when Redis/Kafka are disabled
            String existingExclude = environment.getProperty("spring.autoconfigure.exclude");
            if (existingExclude == null || existingExclude.trim().isEmpty()) {
                props.put("spring.autoconfigure.exclude",
                        "org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration," +
                        "org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration," +
                        "org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration");
            }
        }

        // Register custom properties with highest priority
        if (!props.isEmpty()) {
            environment.getPropertySources().addFirst(
                    new MapPropertySource("renderDeploymentProperties", props));
        }
    }

    private void parseDatabaseUrl(String dbUrl, Map<String, Object> props) {
        try {
            if (dbUrl.startsWith("jdbc:")) {
                props.put("spring.datasource.url", dbUrl);
                props.put("spring.datasource.driver-class-name", "org.postgresql.Driver");
                return;
            }

            // Strip query parameters for URI parsing (e.g. ?sslmode=require)
            String cleanUrl = dbUrl;
            int queryIndex = cleanUrl.indexOf('?');
            String queryParams = "";
            if (queryIndex != -1) {
                queryParams = cleanUrl.substring(queryIndex + 1);
                cleanUrl = cleanUrl.substring(0, queryIndex);
            }

            String normalized = cleanUrl.replace("postgres://", "postgresql://");
            URI uri = new URI(normalized);

            String host = uri.getHost();
            int port = uri.getPort() > 0 ? uri.getPort() : 5432;
            String database = uri.getPath() != null && uri.getPath().startsWith("/")
                    ? uri.getPath().substring(1) : (uri.getPath() != null ? uri.getPath() : "");

            String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + database;
            props.put("spring.datasource.url", jdbcUrl);
            props.put("spring.datasource.driver-class-name", "org.postgresql.Driver");

            String userInfo = uri.getUserInfo();
            if (userInfo != null && userInfo.contains(":")) {
                String[] parts = userInfo.split(":", 2);
                props.put("spring.datasource.username", URLDecoder.decode(parts[0], StandardCharsets.UTF_8));
                props.put("spring.datasource.password", URLDecoder.decode(parts[1], StandardCharsets.UTF_8));
            }

            // Require SSL for external Render connections
            if (dbUrl.contains(".render.com") || queryParams.contains("sslmode=require")) {
                props.put("spring.datasource.hikari.data-source-properties.sslmode", "require");
            }
        } catch (Exception e) {
            System.err.println("Failed to parse database URL: " + e.getMessage());
        }
    }
}
