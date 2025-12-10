package utez.edu.mx.tdsw.security.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Collections;
import java.util.Date;
import java.util.Map;

@Service
public class JwtProvider {
    // Constantes para headers y tipos de token
    private static final String TOKEN_HEADER = "Authorization";
    private static final String TOKEN_TYPE = "Bearer ";
    private static final String ROLES_CLAIM = "roles";

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    public String generateToken(Authentication auth) {
        UserDetails user = (UserDetails) auth.getPrincipal();
        Claims claims = Jwts.claims().setSubject(user.getUsername());
        claims.put(ROLES_CLAIM, user.getAuthorities());

        Date tokenCreateTime = new Date();
        Date tokenValidity = new Date(tokenCreateTime.getTime() + expiration * 1000);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getUsername())
                .setIssuedAt(tokenCreateTime)
                .setExpiration(tokenValidity)
                .signWith(getSignKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    private Key getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private Claims parseJwtClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public Map<String, Claims> resolveClaims(HttpServletRequest req) {
        String token = resolveToken(req);
        if (token != null) {
            Claims claims = parseJwtClaims(token);
            return Collections.singletonMap("claims", claims);
        }
        return Collections.emptyMap();
    }

    public String resolveToken(HttpServletRequest req) {
        String bearerToken = req.getHeader(TOKEN_HEADER);
        if (bearerToken != null && bearerToken.startsWith(TOKEN_TYPE)) {
            return bearerToken.replace(TOKEN_TYPE, "");
        }
        return null;
    }

    public boolean validateClaims(Claims claims, String token) {
        try {
            parseJwtClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}