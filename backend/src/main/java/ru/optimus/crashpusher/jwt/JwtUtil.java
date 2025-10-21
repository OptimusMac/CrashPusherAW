// JwtUtil.java
package ru.optimus.crashpusher.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import ru.optimus.crashpusher.model.User;
import ru.optimus.crashpusher.repository.UserRepository;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtUtil {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpirationMs;

    private final UserRepository userRepository;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateToken(String username, List<String> roles) {
        // Получаем пользователя и его версию пароля
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        String token = Jwts.builder()
                .setSubject(username)
                .claim("roles", roles)
                .claim("pwdVer", user.getPasswordVersion())
                .claim("userId", user.getId())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey())
                .compact();

        System.out.println("🔄 Generated new token for user: " + username +
                " with roles: " + roles +
                " and password version: " + user.getPasswordVersion());

        return token;
    }

    public String getUsernameFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public String extractUsername(String token) {
        try {
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }

            return getUsernameFromToken(token);
        } catch (Exception e) {
            System.out.println("❌ Error extracting username from token: " + e.getMessage());
            throw new RuntimeException("Invalid token");
        }
    }

    public List<String> getRolesFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.get("roles", List.class);
    }

    public boolean validateToken(String token) {
        try {
            // Базовая проверка JWT
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            // Дополнительная проверка версии пароля
            return isPasswordVersionValid(claims);

        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private boolean isPasswordVersionValid(Claims claims) {
        try {
            String username = claims.getSubject();
            Long tokenPasswordVersion = claims.get("pwdVer", Long.class);

            if (username == null || tokenPasswordVersion == null) {
                return false;
            }

            // Получаем актуальную версию пароля из базы
            User user = userRepository.findByUsername(username)
                    .orElse(null);

            if (user == null) {
                return false; // Пользователь не найден
            }

            // Токен валиден только если версия пароля совпадает
            boolean isValid = tokenPasswordVersion.equals(user.getPasswordVersion());

            if (!isValid) {
                System.out.println("❌ Token invalid: password version mismatch for user " + username +
                        ". Token version: " + tokenPasswordVersion +
                        ", Current version: " + user.getPasswordVersion());
            }

            return isValid;

        } catch (Exception e) {
            System.out.println("❌ Error validating password version: " + e.getMessage());
            return false;
        }
    }

    // Метод для получения версии пароля из токена (для отладки)
    public Long getPasswordVersionFromToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            return claims.get("pwdVer", Long.class);
        } catch (Exception e) {
            return null;
        }
    }
}