package utez.edu.mx.tdsw.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class InitialConfig implements CommandLineRunner {

    private final InitialDataService initialDataService;

    @Override
    public void run(String... args) {
        initialDataService.initializeRolesAndUsers();
    }
}
