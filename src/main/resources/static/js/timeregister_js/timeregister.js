// グローバル変数
let currentModal = null;
let bulkStartTime = '09:00';
let bulkEndTime = '18:00';
let pendingBulkAction = null;
let selectedStartHour = 9;
let selectedStartMinute = 0;
let selectedEndHour = 18;
let selectedEndMinute = 0;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    initializeTimePicker();
    setupEventListeners();
    initializeAllCards();
    updateCardDisplay(); // カードのレイアウトを初期化
    updateTotalHours();
});

// イベントリスナーの設定
function setupEventListeners() {
    // アコーディオン
    const bulkAccordionBtn = document.getElementById('bulkAccordionBtn');
    if (bulkAccordionBtn) {
        bulkAccordionBtn.addEventListener('click', () => {
            const accordion = bulkAccordionBtn.closest('.accordion');
            accordion.classList.toggle('open');
        });
    }

    // 一括設定の時間ボタン (存在する場合のみ)
    const bulkStartTimeBtn = document.getElementById('bulkStartTimeBtn');
    if (bulkStartTimeBtn) bulkStartTimeBtn.addEventListener('click', () => {
        openBulkTimePicker('start');
    });

    const bulkEndTimeBtn = document.getElementById('bulkEndTimeBtn');
    if (bulkEndTimeBtn) bulkEndTimeBtn.addEventListener('click', () => {
        openBulkTimePicker('end');
    });

    // 一括適用ボタン (存在する場合のみ)
    const applyAllBtn = document.getElementById('applyAllBtn');
    if (applyAllBtn) applyAllBtn.addEventListener('click', async () => {
        if (await showCustomConfirm('両方まとめて適用してもいいですか？')) {
            applyBulk('both');
        }
    });
    const applyStartBtn = document.getElementById('applyStartBtn');
    if (applyStartBtn) applyStartBtn.addEventListener('click', async () => {
        if (await showCustomConfirm('開始時間のみ適用してもいいですか？')) {
            applyBulk('start');
        }
    });
    const applyEndBtn = document.getElementById('applyEndBtn');
    if (applyEndBtn) applyEndBtn.addEventListener('click', async () => {
        if (await showCustomConfirm('終了時間のみ適用してもいいですか？')) {
            applyBulk('end');
        }
    });
    
    // 曜日別適用 - セレクタを修正
    document.querySelectorAll('.btn-weekday-compact').forEach(btn => {
        btn.addEventListener('click', async () => {
            const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];
            const dayOfWeek = parseInt(btn.dataset.day);
            const dayLabel = dayLabels[dayOfWeek];

            if (await showCustomConfirm(`${dayLabel}曜日に適用してもいいですか？`)) {
                applyToWeekday(dayOfWeek);
            }
        });
    });
    
    // 個別カードのクリック
    document.querySelectorAll('.time-card').forEach(card => {
        card.addEventListener('click', () => {
            const index = parseInt(card.dataset.index);
            openCardTimePicker(index);
        });
    });
    
    // 3択ダイアログ (存在する場合のみ)
    const choiceModifiedOnly = document.getElementById('choiceModifiedOnly');
    if (choiceModifiedOnly) choiceModifiedOnly.addEventListener('click', () => handleThreeChoice('modifiedOnly'));
    const choiceAll = document.getElementById('choiceAll');
    if (choiceAll) choiceAll.addEventListener('click', () => handleThreeChoice('all'));
    const choiceCancel = document.getElementById('choiceCancel');
    if (choiceCancel) choiceCancel.addEventListener('click', hideThreeChoiceDialog);

    // 提出ボタン (存在する場合のみ)
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.addEventListener('click', showConfirmDialog);

    // カレンダーに戻るボタン (存在する場合のみ)
    const backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.addEventListener('click', () => {
        // 現在の時間設定を保存してカレンダーに戻る
        const form = document.getElementById('backForm');
        const cards = document.querySelectorAll('.time-card:not([data-removed="true"])');

        // 既存の時間パラメータをクリア
        form.querySelectorAll('input[name="startTimes"], input[name="endTimes"], input[name="modifiedDates"]').forEach(input => input.remove());

        // 各カードの時間情報とmodified状態をフォームに追加
        cards.forEach(card => {
            const startTime = card.querySelector('.start-time-value').value;
            const endTime = card.querySelector('.end-time-value').value;

            const startInput = document.createElement('input');
            startInput.type = 'hidden';
            startInput.name = 'startTimes';
            startInput.value = startTime;
            form.appendChild(startInput);

            const endInput = document.createElement('input');
            endInput.type = 'hidden';
            endInput.name = 'endTimes';
            endInput.value = endTime;
            form.appendChild(endInput);

            // modified状態も保存
            if (card.classList.contains('modified')) {
                const date = card.querySelector('.date-value').value;
                const modifiedInput = document.createElement('input');
                modifiedInput.type = 'hidden';
                modifiedInput.name = 'modifiedDates';
                modifiedInput.value = date;
                form.appendChild(modifiedInput);
            }
        });

        form.submit();
    });


    // 確認ダイアログ (存在する場合のみ)
    const cancelSubmit = document.getElementById('cancelSubmit');
    if (cancelSubmit) cancelSubmit.addEventListener('click', hideConfirmDialog);
    const finalSubmit = document.getElementById('finalSubmit');
    if (finalSubmit) finalSubmit.addEventListener('click', submitShift);
    
    // 休憩チェックボックス
    const breakCheckbox = document.getElementById('breakCheckbox');
    if (breakCheckbox) {
        breakCheckbox.addEventListener('change', () => {
            updateTotalHours();
            updateCardDisplay();
        });
    }
    
    // ヘルプボタン
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const helpOverlay = document.getElementById('helpOverlay');
            helpOverlay.style.display = 'flex';
        });
    }
    
    // ×ボタンでヘルプを閉じる
    const helpClose = document.getElementById('helpClose');
    if (helpClose) {
        helpClose.addEventListener('click', (e) => {
            e.stopPropagation();
            const helpOverlay = document.getElementById('helpOverlay');
            if (helpOverlay) {
                helpOverlay.style.display = 'none';
            }
        });
    }

    // カスタムダイアログのイベントリスナー
    const customDialogOk = document.getElementById('customDialogOk');
    if (customDialogOk) customDialogOk.addEventListener('click', () => {
        if (customDialogResolve) {
            customDialogResolve(true);
            customDialogResolve = null;
        }
        hideCustomDialog();
    });

    const customDialogCancel = document.getElementById('customDialogCancel');
    if (customDialogCancel) customDialogCancel.addEventListener('click', () => {
        if (customDialogResolve) {
            customDialogResolve(false);
            customDialogResolve = null;
        }
        hideCustomDialog();
    });

    const customDialogClose = document.getElementById('customDialogClose');
    if (customDialogClose) customDialogClose.addEventListener('click', () => {
        if (customDialogResolve) {
            customDialogResolve(false);
            customDialogResolve = null;
        }
        hideCustomDialog();
    });

    // オーバーレイのクリックで閉じる
    const helpOverlay = document.getElementById('helpOverlay');
    if (helpOverlay) {
        helpOverlay.addEventListener('click', (e) => {
            if (e.target === helpOverlay) {
                helpOverlay.style.display = 'none';
            }
        });
    }
}

// タイムピッカーの初期化
function initializeTimePicker() {
    // スライド式トグルスイッチ (存在する場合のみ)
    const startPeriodToggle = document.getElementById('startPeriodToggle');
    if (startPeriodToggle) startPeriodToggle.addEventListener('change', (e) => {
        const period = e.target.checked ? 'pm' : 'am';
        updateHourButtons('start', period);
    });

    const endPeriodToggle = document.getElementById('endPeriodToggle');
    if (endPeriodToggle) endPeriodToggle.addEventListener('change', (e) => {
        const period = e.target.checked ? 'pm' : 'am';
        updateHourButtons('end', period);
    });

    // キャンセルボタン (存在する場合のみ)
    const modalCancel = document.getElementById('modalCancel');
    if (modalCancel) modalCancel.addEventListener('click', closeTimePicker);

    // 設定するボタン (存在する場合のみ)
    const modalConfirm = document.getElementById('modalConfirm');
    if (modalConfirm) modalConfirm.addEventListener('click', confirmTime);

    // シフトを外すボタン (存在する場合のみ)
    const removeShiftBtn = document.getElementById('removeShiftBtn');
    if (removeShiftBtn) removeShiftBtn.addEventListener('click', removeShift);


    // オーバーレイクリックで閉じる (存在する場合のみ)
    const modal = document.getElementById('timePickerModal');
    if (modal) modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeTimePicker();
        }
    });
}

// 時間ボタンの更新
function updateHourButtons(target, period) {
    const selector = target === 'start' ? 'startHourSelector' : 'endHourSelector';
    const hourSelector = document.getElementById(selector);
    hourSelector.innerHTML = '';
    
    const start = period === 'am' ? 0 : 12;
    const end = period === 'am' ? 11 : 23;
    
    for (let i = start; i <= end; i++) {
        const btn = document.createElement('button');
        btn.className = 'hour-btn-inline';
        btn.textContent = i;
        btn.dataset.hour = i;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            hourSelector.querySelectorAll('.hour-btn-inline').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (target === 'start') {
                selectedStartHour = i;
            } else {
                selectedEndHour = i;
            }
            
            updatePreview(target);
            updateModalWorkHours();
        });
        hourSelector.appendChild(btn);
    }
    
    // 現在の時刻にアクティブクラスを付与
    const currentHour = target === 'start' ? selectedStartHour : selectedEndHour;
    setTimeout(() => {
        const activeBtn = hourSelector.querySelector(`[data-hour="${currentHour}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            // スクロールして選択中の時間を表示
            activeBtn.scrollIntoView({ behavior: 'auto', block: 'nearest' });
        }
    }, 10);
}

// 分ボタンのイベント設定 - ③修正：end時の分ボタン初期化
function setupMinuteButtons(target = 'both') {
    // targetが指定されていない場合は両方、指定されている場合は該当するもののみ
    const targets = target === 'both' ? ['start', 'end'] : [target];
    
    targets.forEach(t => {
        document.querySelectorAll(`.minute-btn-inline[data-target="${t}"]`).forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const btnTarget = newBtn.dataset.target;
                const minute = parseInt(newBtn.dataset.minute);
                
                // 同じtargetの他のボタンを非アクティブに
                document.querySelectorAll(`.minute-btn-inline[data-target="${btnTarget}"]`).forEach(b => {
                    b.classList.remove('active');
                });
                newBtn.classList.add('active');
                
                if (btnTarget === 'start') {
                    selectedStartMinute = minute;
                } else {
                    selectedEndMinute = minute;
                }
                
                updatePreview(btnTarget);
                updateModalWorkHours();
            });
        });
    });
}

// プレビュー更新
function updatePreview(target) {
    const hour = target === 'start' ? selectedStartHour : selectedEndHour;
    const minute = target === 'start' ? selectedStartMinute : selectedEndMinute;
    
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    
    if (target === 'start') {
        document.getElementById('startTimePreview').textContent = timeStr;
    } else {
        document.getElementById('endTimePreview').textContent = timeStr;
    }
}

// モーダル内の勤務時間を更新
function updateModalWorkHours() {
    const startMinutes = selectedStartHour * 60 + selectedStartMinute;
    const endMinutes = selectedEndHour * 60 + selectedEndMinute;
    
    let diffMinutes = endMinutes - startMinutes;
    if (diffMinutes < 0) {
        diffMinutes += 24 * 60;
    }
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    const hoursText = minutes === 0 ? `${hours}時間` : `${hours}時間${minutes}分`;
    document.getElementById('modalWorkHours').textContent = hoursText;
}

// 一括設定用タイムピッカーを開く - ③修正：終了時間時の分ボタン初期化
function openBulkTimePicker(type) {
    currentModal = { type: 'bulk', field: type };
    
    const time = type === 'start' ? bulkStartTime : bulkEndTime;
    const [hour, minute] = time.split(':').map(Number);
    
    selectedStartHour = hour;
    selectedStartMinute = minute;
    selectedEndHour = hour;
    selectedEndMinute = minute;
    
    const title = type === 'start' ? '一括設定：開始時間' : '一括設定：終了時間';
    document.getElementById('modalTitle').textContent = title;
    
    // シフトを外すボタンを非表示
    document.getElementById('removeShiftBtn').style.display = 'none';
    
    // 開始時間のみ表示、終了時間は非表示
    if (type === 'start') {
        document.querySelectorAll('.modal-section')[0].style.display = 'block';
        document.querySelectorAll('.modal-section')[1].style.display = 'none';
    } else {
        document.querySelectorAll('.modal-section')[0].style.display = 'none';
        document.querySelectorAll('.modal-section')[1].style.display = 'block';
    }
    
    document.querySelector('.modal-work-hours').style.display = 'none';
    
    const period = hour < 12 ? 'am' : 'pm';
    
    // 開始時間のトグル設定
    document.getElementById('startPeriodToggle').checked = (period === 'pm');
    updateHourButtons('start', period);
    
    // 終了時間のトグル設定（③修正：終了時間時の初期化を追加）
    if (type === 'end') {
        const endPeriod = hour < 12 ? 'am' : 'pm';
        document.getElementById('endPeriodToggle').checked = (endPeriod === 'pm');
        updateHourButtons('end', endPeriod);
    }
    
    // ③修正：该当するtargetの分ボタンのみ初期化
    setupMinuteButtons(type === 'start' ? 'start' : 'end');
    
    setTimeout(() => {
        const hourSelector = type === 'start' ? 'startHourSelector' : 'endHourSelector';
        const hourBtn = document.querySelector(`#${hourSelector} .hour-btn-inline[data-hour="${hour}"]`);
        const minuteBtn = document.querySelector(`.minute-btn-inline[data-target="${type}"][data-minute="${String(minute).padStart(2, '0')}"]`);
        
        if (hourBtn) {
            hourBtn.classList.add('active');
            // スクロールして選択中の時間を表示
            hourBtn.scrollIntoView({ behavior: 'auto', block: 'nearest' });
        }
        if (minuteBtn) minuteBtn.classList.add('active');
        
        updatePreview(type === 'start' ? 'start' : 'end');
    }, 50);
    
    document.getElementById('timePickerModal').classList.add('show');
}

// 個別カード用タイムピッカーを開く
function openCardTimePicker(index) {
    const card = document.querySelector(`.time-card[data-index="${index}"]`);
    const startTime = card.querySelector('.start-time-value').value;
    const endTime = card.querySelector('.end-time-value').value;
    const dateText = card.querySelector('.card-date').textContent;
    
    currentModal = { type: 'card', index: index };
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    selectedStartHour = startHour;
    selectedStartMinute = startMinute;
    selectedEndHour = endHour;
    selectedEndMinute = endMinute;
    
    document.getElementById('modalTitle').textContent = `${dateText} の勤務時間`;
    
    // シフトを外すボタンを表示
    document.getElementById('removeShiftBtn').style.display = 'block';
    
    // 両方のセクションを表示
    document.querySelectorAll('.modal-section')[0].style.display = 'block';
    document.querySelectorAll('.modal-section')[1].style.display = 'block';
    document.querySelector('.modal-work-hours').style.display = 'block';
    
    // 開始時間の設定
    const startPeriod = startHour < 12 ? 'am' : 'pm';
    document.getElementById('startPeriodToggle').checked = (startPeriod === 'pm');
    updateHourButtons('start', startPeriod);
    
    // 終了時間の設定
    const endPeriod = endHour < 12 ? 'am' : 'pm';
    document.getElementById('endPeriodToggle').checked = (endPeriod === 'pm');
    updateHourButtons('end', endPeriod);
    
    setupMinuteButtons('both');
    
    setTimeout(() => {
        const startHourBtn = document.querySelector(`#startHourSelector .hour-btn-inline[data-hour="${startHour}"]`);
        const startMinuteBtn = document.querySelector(`.minute-btn-inline[data-target="start"][data-minute="${String(startMinute).padStart(2, '0')}"]`);
        const endHourBtn = document.querySelector(`#endHourSelector .hour-btn-inline[data-hour="${endHour}"]`);
        const endMinuteBtn = document.querySelector(`.minute-btn-inline[data-target="end"][data-minute="${String(endMinute).padStart(2, '0')}"]`);
        
        if (startHourBtn) startHourBtn.classList.add('active');
        if (startMinuteBtn) startMinuteBtn.classList.add('active');
        if (endHourBtn) endHourBtn.classList.add('active');
        if (endMinuteBtn) endMinuteBtn.classList.add('active');
        
        updatePreview('start');
        updatePreview('end');
        updateModalWorkHours();
        
        // スクロールして選択中の時間を表示
        if (startHourBtn) {
            startHourBtn.scrollIntoView({ behavior: 'auto', block: 'nearest' });
        }
        if (endHourBtn) {
            endHourBtn.scrollIntoView({ behavior: 'auto', block: 'nearest' });
        }
    }, 50);
    
    document.getElementById('timePickerModal').classList.add('show');
}

// タイムピッカーを閉じる
function closeTimePicker() {
    document.getElementById('timePickerModal').classList.remove('show');
    currentModal = null;
}

// 時間確定
function confirmTime() {
    if (!currentModal) return;
    
    const startTime = `${String(selectedStartHour).padStart(2, '0')}:${String(selectedStartMinute).padStart(2, '0')}`;
    const endTime = `${String(selectedEndHour).padStart(2, '0')}:${String(selectedEndMinute).padStart(2, '0')}`;
    
    if (currentModal.type === 'bulk') {
        if (currentModal.field === 'start') {
            bulkStartTime = startTime;
            document.getElementById('bulkStartTimeDisplay').textContent = startTime;
        } else {
            bulkEndTime = endTime;
            document.getElementById('bulkEndTimeDisplay').textContent = endTime;
        }
    } else if (currentModal.type === 'card') {
        const card = document.querySelector(`.time-card[data-index="${currentModal.index}"]`);
        
        card.querySelector('.start-time-value').value = startTime;
        card.querySelector('.end-time-value').value = endTime;
        card.querySelector('.start-display').textContent = startTime;
        card.querySelector('.end-display').textContent = endTime;
        
        card.classList.add('modified');
        card.dataset.modified = 'true';
        
        updateCardHours(card);
        updateTotalHours();
    }
    
    closeTimePicker();
}

// シフトを外す
async function removeShift() {
    if (!currentModal || currentModal.type !== 'card') return;

    if (!await showCustomConfirm('この日のシフトを外しますか？')) {
        return;
    }
    
    const card = document.querySelector(`.time-card[data-index="${currentModal.index}"]`);
    const date = card.querySelector('.date-value').value;
    
    // 外した日付をセッションストレージに保存（カレンダーで未選択にするため）
    let removedDates = sessionStorage.getItem('removedDates');
    removedDates = removedDates ? removedDates.split(',') : [];
    if (!removedDates.includes(date)) {
        removedDates.push(date);
    }
    sessionStorage.setItem('removedDates', removedDates.join(','));
    
    // カードを非表示に
    card.style.display = 'none';
    card.dataset.removed = 'true';
    
    updateTotalHours();
    closeTimePicker();
}

// 全てのカードを初期化
function initializeAllCards() {
    document.querySelectorAll('.time-card').forEach(card => {
        updateCardHours(card);
    });
}

// カードの勤務時間を更新
function updateCardHours(card) {
    const startTime = card.querySelector('.start-time-value').value;
    const endTime = card.querySelector('.end-time-value').value;
    const hoursText = card.querySelector('.hours-text');
    
    if (!startTime || !endTime) {
        hoursText.textContent = '-';
        return;
    }
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    let diffMinutes = endMinutes - startMinutes;
    if (diffMinutes < 0) {
        diffMinutes += 24 * 60;
    }
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    if (minutes === 0) {
        hoursText.textContent = `${hours}時間`;
    } else {
        hoursText.textContent = `${hours}時間${minutes}分`;
    }
}

// 合計勤務時間の更新
function updateTotalHours() {
    let totalMinutes = 0;
    let totalBreakMinutes = 0;
    let activeDays = 0;
    
    document.querySelectorAll('.time-card').forEach(card => {
        if (card.dataset.removed === 'true') return;
        
        const startTime = card.querySelector('.start-time-value').value;
        const endTime = card.querySelector('.end-time-value').value;
        
        if (startTime && endTime) {
            const [startHour, startMin] = startTime.split(':').map(Number);
            const [endHour, endMin] = endTime.split(':').map(Number);
            
            const startMinutesOfDay = startHour * 60 + startMin;
            const endMinutesOfDay = endHour * 60 + endMin;
            
            let diffMinutes = endMinutesOfDay - startMinutesOfDay;
            if (diffMinutes < 0) {
                diffMinutes += 24 * 60;
            }
            
            totalMinutes += diffMinutes;
            activeDays++;
            
            // 休憩時間を計算
            const hours = Math.floor(diffMinutes / 60);
            let breakMinutes = 0;
            if (hours < 6) {
                breakMinutes = 0;
            } else if (hours < 8) {
                breakMinutes = 45;
            } else {
                breakMinutes = 60;
            }
            totalBreakMinutes += breakMinutes;
        }
    });
    
    // 勤務時間を表示（常に表示）
    const totalHoursElement = document.getElementById('totalHours');
    
    if (totalMinutes === 0) {
        totalHoursElement.textContent = '0時間';
    } else {
        const wholeHours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        if (minutes === 0) {
            totalHoursElement.textContent = `${wholeHours}時間`;
        } else {
            totalHoursElement.textContent = `${wholeHours}時間${minutes}分`;
        }
    }
    
    // チェック時の表示切り替え
    const breakCheckbox = document.getElementById('breakCheckbox');
    const normalWorkHoursItem = document.getElementById('normalWorkHoursItem');
    const actualWorkHoursItem = document.getElementById('actualWorkHoursItem');
    const actualHours = document.getElementById('actualHours');
    const totalBreakItem = document.getElementById('totalBreakItem');
    const totalBreakTime = document.getElementById('totalBreakTime');
    
    if (breakCheckbox && breakCheckbox.checked) {
        // チェック時：実労働時間と休憩時間を表示
        normalWorkHoursItem.style.display = 'none';
        actualWorkHoursItem.style.display = 'block';
        totalBreakItem.style.display = 'block';
        
        // summary-sectionにクラスを追加（3列レイアウト、小さいフォント）
        document.querySelector('.summary-section').classList.add('break-mode');
        
        // 実労働時間 = 勤務時間 - 休憩時間
        const actualMinutes = totalMinutes - totalBreakMinutes;
        const actualHoursValue = Math.floor(actualMinutes / 60);
        const actualMinsValue = actualMinutes % 60;
        
        if (actualMinsValue === 0) {
            actualHours.textContent = `${actualHoursValue}時間`;
        } else {
            actualHours.textContent = `${actualHoursValue}時間${actualMinsValue}分`;
        }
        
        // 休憩時間を時間分で表示
        const breakHours = Math.floor(totalBreakMinutes / 60);
        const breakMins = totalBreakMinutes % 60;
        
        if (breakHours === 0) {
            totalBreakTime.textContent = `${breakMins}分`;
        } else if (breakMins === 0) {
            totalBreakTime.textContent = `${breakHours}時間`;
        } else {
            totalBreakTime.textContent = `${breakHours}時間${breakMins}分`;
        }
    } else {
        // チェック外：勤務時間のみ表示
        normalWorkHoursItem.style.display = 'block';
        actualWorkHoursItem.style.display = 'none';
        totalBreakItem.style.display = 'none';
        
        // summary-sectionからクラスを削除（2列レイアウト、大きいフォント）
        document.querySelector('.summary-section').classList.remove('break-mode');
    }
    
    // 合計日数も更新
    const summaryValue = document.querySelector('.summary-section .summary-value');
    if (summaryValue) {
        summaryValue.textContent = `${activeDays}日`;
    }
    
    // カード表示も更新（休憩チェック時）
    updateCardDisplay();
}

// カード表示の更新（⑰番）
function updateCardDisplay() {
    const breakCheckbox = document.getElementById('breakCheckbox');
    if (!breakCheckbox) return;

    const isBreakMode = breakCheckbox.checked;

    document.querySelectorAll('.time-card').forEach(card => {
        const startTime = card.querySelector('.start-time-value').value;
        const endTime = card.querySelector('.end-time-value').value;

        if (!startTime || !endTime) return;

        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        const startMinutesOfDay = startHour * 60 + startMin;
        const endMinutesOfDay = endHour * 60 + endMin;

        let diffMinutes = endMinutesOfDay - startMinutesOfDay;
        if (diffMinutes < 0) {
            diffMinutes += 24 * 60;
        }

        const hours = Math.floor(diffMinutes / 60);
        let breakMinutes = 0;
        if (hours < 6) {
            breakMinutes = 0;
        } else if (hours < 8) {
            breakMinutes = 45;
        } else {
            breakMinutes = 60;
        }

        // card-hoursを card-hours-section でラップ（初回のみ）
        let cardHours = card.querySelector('.card-hours');
        let hoursSection = card.querySelector('.card-hours-section');

        if (cardHours && !hoursSection) {
            // 新しいsectionを作成
            hoursSection = document.createElement('div');
            hoursSection.className = 'card-hours-section';

            // card-hoursをsectionでラップ
            cardHours.parentNode.insertBefore(hoursSection, cardHours);
            hoursSection.appendChild(cardHours);
        }

        // 休憩時間表示の有無を切り替え
        let breakRow = card.querySelector('.card-break-row');
        if (isBreakMode) {
            if (!breakRow && hoursSection) {
                breakRow = document.createElement('div');
                breakRow.className = 'card-break-row';
                hoursSection.appendChild(breakRow);
            }
            if (breakRow) {
                breakRow.innerHTML = `<span class="break-icon">⏰</span><span class="break-text">休憩 ${breakMinutes}分</span>`;
            }
        } else {
            if (breakRow) {
                breakRow.remove();
            }
        }
    });
}

// 一括適用
function applyBulk(type) {
    const allCards = document.querySelectorAll('.time-card:not([data-removed="true"])');
    const modifiedCards = document.querySelectorAll('.time-card.modified:not([data-removed="true"])');
    
    if (modifiedCards.length > 0) {
        // 個別設定済みの日付がある場合は3択ダイアログ表示
        pendingBulkAction = { type: type, target: 'all' };
        showThreeChoiceDialog(modifiedCards.length);
    } else {
        // 個別設定がない場合は直接適用
        executeBulkApply(type, allCards, false);
    }
}

// 3択ダイアログの表示
function showThreeChoiceDialog(modifiedCount) {
    const message = `個別に設定した日が ${modifiedCount} 日あります。\nどのように変更しますか？`;
    document.getElementById('threeChoiceMessage').textContent = message;
    document.getElementById('threeChoiceDialog').classList.add('show');
}

// 3択ダイアログの非表示
function hideThreeChoiceDialog() {
    document.getElementById('threeChoiceDialog').classList.remove('show');
    pendingBulkAction = null;
}

// 3択の選択処理
async function handleThreeChoice(choice) {
    if (!pendingBulkAction) {
        console.error('pendingBulkAction is null');
        hideThreeChoiceDialog();
        return;
    }

    const type = pendingBulkAction.type;
    const target = pendingBulkAction.target;

    if (choice === 'all') {
        if (target === 'all') {
            executeBulkApply(type, document.querySelectorAll('.time-card:not([data-removed="true"])'), true);
        } else if (target === 'weekday') {
            const cards = pendingBulkAction.cards;
            executeBulkApply(type, cards, true);
        }
    } else if (choice === 'modifiedOnly') {
        if (target === 'all') {
            const unmodifiedCards = document.querySelectorAll('.time-card:not(.modified):not([data-removed="true"])');
            if (unmodifiedCards.length === 0) {
                await showCustomAlert('変更する日付がありません（全て個別設定済みです）');
                hideThreeChoiceDialog();
                return;
            }
            executeBulkApply(type, unmodifiedCards, false);
        } else if (target === 'weekday') {
            const cards = pendingBulkAction.cards;
            const unmodifiedCards = Array.from(cards).filter(card => !card.classList.contains('modified'));
            if (unmodifiedCards.length === 0) {
                await showCustomAlert('変更する日付がありません（全て個別設定済みです）');
                hideThreeChoiceDialog();
                return;
            }
            executeBulkApply(type, unmodifiedCards, false);
        }
    }
    
    hideThreeChoiceDialog();
}

// 一括適用の実行
function executeBulkApply(type, cards, clearModified) {
    cards.forEach(card => {
        if (type === 'both' || type === 'start') {
            card.querySelector('.start-time-value').value = bulkStartTime;
            card.querySelector('.start-display').textContent = bulkStartTime;
        }
        
        if (type === 'both' || type === 'end') {
            card.querySelector('.end-time-value').value = bulkEndTime;
            card.querySelector('.end-display').textContent = bulkEndTime;
        }
        
        if (clearModified) {
            card.classList.remove('modified');
            delete card.dataset.modified;
        }
        
        updateCardHours(card);
    });
    
    updateTotalHours();
}

// 曜日別に適用
async function applyToWeekday(targetDayOfWeek) {
    const targetCards = Array.from(document.querySelectorAll('.time-card:not([data-removed="true"])')).filter(card => {
        const dayOfWeek = parseInt(card.querySelector('.dayofweek-value').value);
        return dayOfWeek === targetDayOfWeek;
    });

    if (targetCards.length === 0) {
        await showCustomAlert('該当する曜日がありません');
        return;
    }
    
    const modifiedTargets = targetCards.filter(card => card.classList.contains('modified'));
    
    if (modifiedTargets.length > 0) {
        // 個別設定済みの日がある場合は3択ダイアログ表示
        pendingBulkAction = { type: 'both', target: 'weekday', cards: targetCards };
        showThreeChoiceDialog(modifiedTargets.length);
    } else {
        // 個別設定がない場合は直接適用
        executeBulkApply('both', targetCards, false);
    }
}

// 確認ダイアログの表示
async function showConfirmDialog() {
    const confirmList = document.getElementById('confirmList');
    confirmList.innerHTML = '';

    let totalMinutes = 0;
    let totalDays = 0;

    // 先にバリデーションチェック
    for (const card of document.querySelectorAll('.time-card')) {
        if (card.dataset.removed === 'true') continue;

        const startTime = card.querySelector('.start-time-value').value;
        const endTime = card.querySelector('.end-time-value').value;

        if (!startTime || !endTime) {
            await showCustomAlert('全ての日付に時間を設定してください');
            return;
        }
    }

    // ダイアログの内容を作成
    document.querySelectorAll('.time-card').forEach(card => {
        if (card.dataset.removed === 'true') return;

        const dateText = card.querySelector('.card-date').textContent;
        const startTime = card.querySelector('.start-time-value').value;
        const endTime = card.querySelector('.end-time-value').value;
        
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        const startMinutesOfDay = startHour * 60 + startMin;
        const endMinutesOfDay = endHour * 60 + endMin;
        
        let diffMinutes = endMinutesOfDay - startMinutesOfDay;
        if (diffMinutes < 0) {
            diffMinutes += 24 * 60;
        }
        
        totalMinutes += diffMinutes;
        totalDays++;
        
        const confirmItem = document.createElement('div');
        confirmItem.className = 'confirm-item';
        confirmItem.innerHTML = `
            <span class="confirm-date">${dateText}</span>
            <span class="confirm-time">${startTime} 〜 ${endTime}</span>
        `;
        confirmList.appendChild(confirmItem);
    });
    
    document.getElementById('confirmTotalDays').textContent = `${totalDays}日`;
    
    const wholeHours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (minutes === 0) {
        document.getElementById('confirmTotalHours').textContent = `${wholeHours}時間`;
    } else {
        document.getElementById('confirmTotalHours').textContent = `${wholeHours}時間${minutes}分`;
    }
    
    document.getElementById('confirmDialog').classList.add('show');
}

// 確認ダイアログの非表示
function hideConfirmDialog() {
    document.getElementById('confirmDialog').classList.remove('show');
}

// シフト提出
function submitShift() {
    // 外したシフトの日付を収集
    const removedDates = [];
    document.querySelectorAll('.time-card[data-removed="true"]').forEach(card => {
        removedDates.push(card.querySelector('.date-value').value);
    });
    
    // 現在のカードのデータを一度POSTで提出
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/time-register/submit';
    
    document.querySelectorAll('.time-card:not([data-removed="true"])').forEach(card => {
        const date = card.querySelector('.date-value').value;
        const startTime = card.querySelector('.start-time-value').value;
        const endTime = card.querySelector('.end-time-value').value;
        
        const dateInput = document.createElement('input');
        dateInput.type = 'hidden';
        dateInput.name = 'dates';
        dateInput.value = date;
        form.appendChild(dateInput);
        
        const startInput = document.createElement('input');
        startInput.type = 'hidden';
        startInput.name = 'startTimes';
        startInput.value = startTime;
        form.appendChild(startInput);
        
        const endInput = document.createElement('input');
        endInput.type = 'hidden';
        endInput.name = 'endTimes';
        endInput.value = endTime;
        form.appendChild(endInput);
    });
    
    // 外した日付もパラメータとして送信（カレンダーから削除するため）
    if (removedDates.length > 0) {
        const removedInput = document.createElement('input');
        removedInput.type = 'hidden';
        removedInput.name = 'removedDates';
        removedInput.value = removedDates.join(',');
        form.appendChild(removedInput);
    }
    
    document.body.appendChild(form);
    form.submit();
}

// カスタムダイアログ関数
function showCustomConfirm(message) {
    return new Promise((resolve) => {
        customDialogResolve = resolve;
        document.getElementById('customDialogMessage').textContent = message;
        document.getElementById('customDialogCancel').style.display = 'block';
        document.getElementById('customDialog').style.display = 'flex';
    });
}

function showCustomAlert(message) {
    return new Promise((resolve) => {
        customDialogResolve = resolve;
        document.getElementById('customDialogMessage').textContent = message;
        document.getElementById('customDialogCancel').style.display = 'none';
        document.getElementById('customDialog').style.display = 'flex';
    });
}

function hideCustomDialog() {
    document.getElementById('customDialog').style.display = 'none';
}