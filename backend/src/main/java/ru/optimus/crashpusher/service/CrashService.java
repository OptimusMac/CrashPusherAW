package ru.optimus.crashpusher.service;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.optimus.crashpusher.model.Crash;
import ru.optimus.crashpusher.model.UserCrash;
import ru.optimus.crashpusher.repository.CrashRepository;
import ru.optimus.crashpusher.repository.UserCrashRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@AllArgsConstructor
public class CrashService {

    private UserCrashRepository userCrashRepository;
    private CrashRepository crashRepository;


    @Transactional
    public UserCrash appendCrashToUser(String username, Crash crash) {

        UserCrash userCrash = userCrashRepository.findByUsername(username).orElse(null);
        if (userCrash == null) {
            userCrash = new UserCrash();
            userCrash.setUsername(username);
        }
        crash.setCreateAt(LocalDateTime.now());
        crash.setUserCrash(userCrash);
        userCrash.getCrashes().add(crash);
        return userCrashRepository.save(userCrash);
    }

    @Transactional
    public Crash setFix(long id, boolean fix){
        Crash crash = crashRepository.findById(id).orElse(null);
        if(crash == null){
            throw new NullPointerException("Crash is null!");
        }
        crash.setFix(fix);
        return crashRepository.save(crash);
    }



    public List<Crash> getCrashesByUser(Long userId) {
        return crashRepository.findAllByUserCrashId(userId);
    }

    public Crash getCrashById(Long crashId) {
        return crashRepository.findById(crashId).orElse(null);
    }


    public List<Crash> getGlobalCrashes() {
        return crashRepository.findAll();
    }
}
