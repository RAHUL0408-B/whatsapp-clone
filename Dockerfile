# Stage 1: Build Spring Boot JAR
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build

COPY whatsapp-backend/.mvn/ .mvn/
COPY whatsapp-backend/mvnw whatsapp-backend/pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B || true

COPY whatsapp-backend/src/ src/
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Runtime JRE Image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=builder /build/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
