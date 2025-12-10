FROM maven:3.9.9-eclipse-temurin-21

WORKDIR /app

COPY . .

RUN mvn clean package -DskipTests && cp target/*.jar app.jar

# Crear directorio para certificados
RUN mkdir -p /app/certs

# Exponer puerto HTTPS
EXPOSE 8080

CMD ["java", "-jar", "app.jar"]