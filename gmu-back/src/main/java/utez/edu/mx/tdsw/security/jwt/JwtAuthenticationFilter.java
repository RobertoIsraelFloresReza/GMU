package utez.edu.mx.tdsw.security.jwt;

import utez.edu.mx.tdsw.security.service.UserDetailsImplService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtProvider provider;
    private final UserDetailsImplService service;

    public JwtAuthenticationFilter(JwtProvider provider, UserDetailsImplService service) {
        this.provider = provider;
        this.service = service;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String token = provider.resolveToken(request);
            if (token == null) {
                filterChain.doFilter(request, response);
                return;
            }

            Map<String, Claims> claimsMap = provider.resolveClaims(request);
            Claims claims = claimsMap.get("claims");

            if (claims != null && provider.validateClaims(claims, token)) {
                String email = claims.getSubject();
                UserDetails userDetails = service.loadUserByUsername(email);
                Authentication authentication = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
            filterChain.doFilter(request, response);
        } catch (Exception e) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Error de autenticación: " + e.getMessage());
        }
    }
}