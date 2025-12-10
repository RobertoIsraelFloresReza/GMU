package utez.edu.mx.tdsw.security;

import utez.edu.mx.tdsw.security.jwt.JwtAuthenticationFilter;
import utez.edu.mx.tdsw.security.jwt.JwtProvider;
import utez.edu.mx.tdsw.security.service.UserDetailsImplService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class MainSecurity {
    // Constantes para los roles
    private static final String ADMIN = "ADMIN"; // Rol de los usuarios que ya han creado un grupo
    private static final String DELIVERY_PERSON = "DELIVERY_PERSON"; // Rol de los usuarios que no han creado un grupo
    private static final String[] ALL_ROLES = {ADMIN, DELIVERY_PERSON};

    private final UserDetailsImplService service;
    private final JwtProvider jwtProvider;

    public MainSecurity(UserDetailsImplService service, JwtProvider jwtProvider) {
        this.service = service;
        this.jwtProvider = jwtProvider;
    }

    private final String[] whiteList = {
            "/api/auth/**",
    };

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider dao = new DaoAuthenticationProvider();
        dao.setUserDetailsService(service);
        dao.setPasswordEncoder(passwordEncoder());
        return dao;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public JwtAuthenticationFilter filter() {
        return new JwtAuthenticationFilter(jwtProvider, service);
    }

    // Bean para configurar CORS
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Permitir todos los orígenes para desarrollo y producción
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.cors(Customizer.withDefaults()) // Usará el corsConfigurationSource bean automáticamente
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(req ->
                        req.requestMatchers(whiteList).permitAll()
                                .requestMatchers("/api/users/**").permitAll()
                                .requestMatchers("/api/person/**").hasAnyAuthority(ALL_ROLES)
                                .requestMatchers("/api/grupos/**").hasAnyAuthority(ALL_ROLES)
                                .requestMatchers("/api/miembros/**").hasAnyAuthority(ALL_ROLES)
                                .requestMatchers("/api/categorias/**").permitAll()
                                .requestMatchers("/api/assignments/**").hasAnyAuthority(ALL_ROLES)
                                .requestMatchers("/api/auditoria/**").hasAnyAuthority(ALL_ROLES)
                                .requestMatchers("/api/historialcita/**").hasAnyAuthority(ALL_ROLES)
                                .requestMatchers("/api/bitacora/**").hasAnyAuthority(ALL_ROLES)
                                .requestMatchers("/api/gastos/**").hasAnyAuthority(ALL_ROLES)
                                .requestMatchers("/api/delivery-persons/**").hasAnyAuthority(ALL_ROLES)
                                .requestMatchers("/api/fcm-tokens/**").hasAnyAuthority(ALL_ROLES)
                                .requestMatchers("/api/notifications/**").hasAnyAuthority(ALL_ROLES)
                                .requestMatchers("/api/orders/**").hasAnyAuthority(ALL_ROLES)
                                .requestMatchers("/api/products/**").hasAnyAuthority(ALL_ROLES)
                                .requestMatchers("/api/stores/**").hasAnyAuthority(ALL_ROLES)

                                .anyRequest().authenticated()
                )
                .httpBasic(Customizer.withDefaults())
                .headers(header -> header.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(filter(), UsernamePasswordAuthenticationFilter.class)
                .logout(out -> out.logoutUrl("/api/auth/logout").clearAuthentication(true));
        return http.build();
    }
}