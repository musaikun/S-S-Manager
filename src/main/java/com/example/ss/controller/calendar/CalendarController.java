package com.example.ss.controller.calendar;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class CalendarController {

	@GetMapping("/")
	public String showCalendar(
			@RequestParam(value = "dates", required = false) List<String> dates,
			@RequestParam(value = "removedDates", required = false) String removedDatesParam,
			Model model) {
		
		// 前回選択されていた日付を保持するためのセット
		Set<String> selectedDates = new HashSet<>();
		
		// URLパラメータから日付を復元
		if (dates != null && !dates.isEmpty()) {
			selectedDates.addAll(dates);
		}
		
		// 外されたシフト日付を除外
		if (removedDatesParam != null && !removedDatesParam.isEmpty()) {
			String[] removedArray = removedDatesParam.split(",");
			for (String removedDate : removedArray) {
				String trimmedDate = removedDate.trim();
				if (!trimmedDate.isEmpty()) {
					selectedDates.remove(trimmedDate);
				}
			}
		}
		
		// モデルに選択日付を追加
		model.addAttribute("selectedDates", selectedDates);
		
		return "index"; // templates/index.html を返す
	}

}