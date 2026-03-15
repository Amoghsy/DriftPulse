package com.driftpulse.backend.repository;

import com.driftpulse.backend.model.AlertRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertRepository extends JpaRepository<AlertRecord, Long> {
	List<AlertRecord> findTop300ByOrderByTimestampDesc();
}
