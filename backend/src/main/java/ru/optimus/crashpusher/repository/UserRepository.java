package ru.optimus.crashpusher.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.optimus.crashpusher.model.User;
import ru.optimus.crashpusher.model.UserCrash;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    List<User> findByUsernameContainingIgnoreCase(String query);

    boolean existsByUsername(String username);

}
