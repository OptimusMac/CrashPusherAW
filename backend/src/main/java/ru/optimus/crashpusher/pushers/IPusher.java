package ru.optimus.crashpusher.pushers;

import java.util.Map;

public interface IPusher {

    void push(Map<String, String> data);
}
