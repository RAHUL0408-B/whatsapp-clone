# =====================================================
# WhatsApp Clone - Spring Boot Backend Dockerfile
# Context: repo root (docker build . -f Dockerfile)
# =====================================================

# Stage 1: Build the Spring Boot JAR
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build

# Copy Maven wrapper and pom first (layer cache)
COPY whatsapp-backend/.mvn/ .mvn/
COPY whatsapp-backend/mvnw whatsapp-backend/pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B || true

# Copy source and build
COPY whatsapp-backend/src/ src/
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Minimal JRE runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=builder /build/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
