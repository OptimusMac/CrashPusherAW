package ru.optimus.crashpusher.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @ElementCollection(fetch = FetchType.EAGER)
    private Set<String> roles = new HashSet<>();

    private String confirmationToken;
    private boolean tokenValidated = false;

    private boolean enabled = true;

    private Long passwordVersion = 1L;

    @Column(name = "password_changed_at")
    private LocalDateTime passwordChangedAt;



    public void updatePassword(String newPassword) {
        this.password = newPassword;
        this.passwordVersion++;
        this.passwordChangedAt = LocalDateTime.now();
    }
}