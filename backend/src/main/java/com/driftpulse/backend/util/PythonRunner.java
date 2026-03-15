package com.driftpulse.backend.util;

import java.io.BufferedReader;
import java.io.InputStreamReader;

public class PythonRunner {

    public static String runAnalysis() throws Exception {

        ProcessBuilder processBuilder = new ProcessBuilder(
                "python",
                "../aiml/pipeline/analyze_device.py"
        );

        Process process = processBuilder.start();

        BufferedReader reader =
                new BufferedReader(new InputStreamReader(process.getInputStream()));

        StringBuilder output = new StringBuilder();

        String line;

        while ((line = reader.readLine()) != null) {
            output.append(line);
        }

        return output.toString();
    }
}