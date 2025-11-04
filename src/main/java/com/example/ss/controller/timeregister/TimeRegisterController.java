package com.example.ss.controller.timeregister;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class TimeRegisterController {

    @GetMapping("/time-register")
    public String showTimeRegister(
            @RequestParam("dates") List<String> dates,
            @RequestParam(value = "removedDates", required = false) String removedDatesParam,
            Model model) {

        // 外されたシフト日付をセットに変換
        Set<String> removedDates = new HashSet<>();
        if (removedDatesParam != null && !removedDatesParam.isEmpty()) {
            String[] removedArray = removedDatesParam.split(",");
            for (String removedDate : removedArray) {
                String trimmedDate = removedDate.trim();
                if (!trimmedDate.isEmpty()) {
                    removedDates.add(trimmedDate);
                }
            }
        }

        // 日付文字列をLocalDateに変換してソート
        List<LocalDate> sortedDates = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (String dateStr : dates) {
            // 外されたシフト日付は除外
            if (!removedDates.contains(dateStr)) {
                sortedDates.add(LocalDate.parse(dateStr, formatter));
            }
        }
        sortedDates.sort(LocalDate::compareTo);

        // 表示用の日付情報を作成
        List<Map<String, String>> dateInfoList = new ArrayList<>();
        for (LocalDate date : sortedDates) {
            Map<String, String> dateInfo = new HashMap<>();
            dateInfo.put("date", date.format(formatter)); // yyyy-MM-dd形式

            // 日本語表記の日付（例：11/15(金)）
            String dayOfWeek = date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.JAPANESE);
            String displayDate = String.format("%d/%d(%s)",
                date.getMonthValue(),
                date.getDayOfMonth(),
                dayOfWeek);
            dateInfo.put("displayDate", displayDate);

            // 曜日番号（0=日曜, 1=月曜, ..., 6=土曜）
            int dayOfWeekNumber = date.getDayOfWeek().getValue() % 7;
            dateInfo.put("dayOfWeek", String.valueOf(dayOfWeekNumber));

            dateInfoList.add(dateInfo);
        }

        // モデルに追加
        model.addAttribute("dateInfoList", dateInfoList);
        model.addAttribute("totalDays", dateInfoList.size());

        return "TimeRegister";
    }

    @PostMapping("/time-register/submit")
    public String submitTimeRegister(
            @RequestParam("dates") List<String> dates,
            @RequestParam("startTimes") List<String> startTimes,
            @RequestParam("endTimes") List<String> endTimes,
            @RequestParam(value = "removedDates", required = false) String removedDatesParam,
            Model model,
            RedirectAttributes redirectAttributes) {

        // ここで実際のシフト提出処理を行う
        // データベースへの保存、LINEへの通知など

        // デバッグ用ログ
        System.out.println("=== シフト提出 ===");
        for (int i = 0; i < dates.size(); i++) {
            System.out.println(String.format("日付: %s, 開始: %s, 終了: %s",
                dates.get(i), startTimes.get(i), endTimes.get(i)));
        }

        // 外されたシフトがあればログ出力
        if (removedDatesParam != null && !removedDatesParam.isEmpty()) {
            System.out.println("外されたシフト: " + removedDatesParam);
        }

        model.addAttribute("message", "シフトを提出しました！");

        // ⑨修正：リダイレクト時に dates と removedDates を正確に渡す
        // 選択されたすべての日付を保持
        if (dates != null && !dates.isEmpty()) {
            for (String date : dates) {
                redirectAttributes.addAttribute("dates", date);
            }
        }
        
        // 外されたシフト日付を渡す
        if (removedDatesParam != null && !removedDatesParam.isEmpty()) {
            redirectAttributes.addAttribute("removedDates", removedDatesParam);
        }

        // カレンダー画面にリダイレクト（日付情報を保持）
        return "redirect:/";
    }
}