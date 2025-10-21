package ru.optimus.crashpusher.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.optimus.crashpusher.model.UserCrash;

import java.util.Optional;

public interface UserCrashRepository extends JpaRepository<UserCrash, Long> {
    Optional<UserCrash> findByUsername(String username);
}
