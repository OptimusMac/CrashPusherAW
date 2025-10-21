package ru.optimus.crashpusher.model;


import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Table(name = "crashes")
@Entity
@Getter
@Setter
public class Crash {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonBackReference
    private UserCrash userCrash;

    @Column(length = Integer.MAX_VALUE)
    private String content;

    @Column(name = "is_fix", nullable = false)
    private boolean fix = false;

    @Column(name = "create_at", nullable = false)
    private LocalDateTime createAt;
}