package ru.optimus.crashpusher.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import ru.optimus.crashpusher.discord.DiscordManager;
import ru.optimus.crashpusher.model.Crash;
import ru.optimus.crashpusher.model.UserCrash;
import ru.optimus.crashpusher.repository.CrashRepository;
import ru.optimus.crashpusher.repository.UserCrashRepository;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserCrashService {

    private final UserCrashRepository userCrashRepository;
    private final CrashRepository crashRepository;

    public List<UserCrash> findUsers(String q) {
        if (q == null || q.isEmpty()) {
            return userCrashRepository.findAll();
        }
        return userCrashRepository.findAll()
                .stream()
                .filter(u -> u.getUsername().toLowerCase().contains(q.toLowerCase()))
                .toList();
    }

    public List<Crash> getCrashesByUser(Long userId) {
        return crashRepository.findAllByUserCrashId(userId);
    }

}
