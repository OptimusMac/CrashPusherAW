// User.java - обновленная модель
package ru.optimus.crashpusher.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "users_crash")
@Getter
@Setter
@NoArgsConstructor
public class UserCrash {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @OneToMany(mappedBy = "userCrash", cascade = CascadeType.ALL, orphanRemoval = true) // ← Измените на userCrash
    @JsonManagedReference
    private List<Crash> crashes = new ArrayList<>();


}