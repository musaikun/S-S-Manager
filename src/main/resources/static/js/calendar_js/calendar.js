// グローバル変数
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let selectedDates = new Set();
let holidays = {};
let savedTemplate = null;
let previousMonthData = null;
let savedStartTimes = []; // 保存された開始時間
let savedEndTimes = [];   // 保存された終了時間
let savedModifiedDates = []; // 保存されたmodified日付

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    initializeSelectors();
    loadSelectedDatesFromUrl(); // URL パラメータから選択状態を復元
    loadTimeDataFromUrl();      // URL パラメータから時間情報を復元
    removeUnselectedDates();    // 外した日付を未選択状態にする
    loadHolidays().then(() => {
        // 祝日データ読み込み完了後にカレンダーを描画
        renderCalendar();
        updateNextButton();
    });
    setupEventListeners();
});

// URLパラメータから選択状態を復元
function loadSelectedDatesFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const dates = urlParams.get('selectedDates');

    if (dates) {
        const dateArray = dates.split(',');
        dateArray.forEach(date => {
            if (date) {
                selectedDates.add(date);
            }
        });
    }
}

// URLパラメータから時間情報を復元
function loadTimeDataFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    savedStartTimes = urlParams.getAll('startTimes');
    savedEndTimes = urlParams.getAll('endTimes');
    savedModifiedDates = urlParams.getAll('modifiedDates');
}

// 外した日付を未選択状態にする
function removeUnselectedDates() {
    const removedDates = sessionStorage.getItem('removedDates');
    if (removedDates) {
        const removedDateArray = removedDates.split(',');
        removedDateArray.forEach(date => {
            if (date) {
                selectedDates.delete(date);
            }
        });
        // 処理後はセッションストレージをクリア
        sessionStorage.removeItem('removedDates');
    }
}

// 年月セレクターの初期化
function initializeSelectors() {
    const thisMonthBtn = document.getElementById('thisMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    
    const today = new Date();
    const thisYear = today.getFullYear();
    const thisMonth = today.getMonth();
    
    // 今月
    thisMonthBtn.dataset.year = thisYear;
    thisMonthBtn.dataset.month = thisMonth;
    thisMonthBtn.textContent = `${thisMonth + 1}月`;
    
    // 来月
    const nextMonthDate = new Date(thisYear, thisMonth + 1, 1);
    nextMonthBtn.dataset.year = nextMonthDate.getFullYear();
    nextMonthBtn.dataset.month = nextMonthDate.getMonth();
    nextMonthBtn.textContent = `${nextMonthDate.getMonth() + 1}月`;
}

// 祝日データの読み込み
async function loadHolidays() {
    try {
        const response = await fetch('https://holidays-jp.github.io/api/v1/date.json');
        holidays = await response.json();
    } catch (error) {
        console.error('祝日データの取得に失敗しました:', error);
        holidays = {};
    }
}

// 保存データの読み込み
function loadSavedData() {
    // 前月データの読み込み（今は使用しない）
    const prevMonth = localStorage.getItem('previousMonth');
    if (prevMonth) {
        previousMonthData = JSON.parse(prevMonth);
    }
}

// カレンダーのレンダリング
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 空白セルの追加
    for (let i = 0; i < startDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day-cell empty';
        grid.appendChild(emptyCell);
    }
    
    // 日付セルの追加
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateStr = formatDate(date);
        const dayOfWeek = date.getDay();
        
        const cell = document.createElement('div');
        cell.className = 'day-cell';
        cell.textContent = day;
        cell.dataset.date = dateStr;
        
        // 曜日による色分け
        if (dayOfWeek === 0) {
            cell.classList.add('sunday');
        } else if (dayOfWeek === 6) {
            cell.classList.add('saturday');
        }
        
        // 祝日チェック
        if (holidays[dateStr]) {
            cell.classList.add('holiday');
        }
        
        // 過去の日付と今日は選択不可
        if (date <= today) {
            cell.classList.add('disabled');
        } else {
            cell.addEventListener('click', () => toggleDate(dateStr, cell));
        }
        
        // 選択済みの日付
        if (selectedDates.has(dateStr)) {
            cell.classList.add('selected');
        }
        
        grid.appendChild(cell);
    }
    
    updateSelectedList();
}

// 日付のトグル
function toggleDate(dateStr, cell) {
    if (selectedDates.has(dateStr)) {
        selectedDates.delete(dateStr);
        cell.classList.remove('selected');
    } else {
        selectedDates.add(dateStr);
        cell.classList.add('selected');
    }
    updateSelectedList();
}

// 選択リストの更新
function updateSelectedList() {
    const totalDaysSpan = document.getElementById('totalDays');
    totalDaysSpan.textContent = selectedDates.size;
    
    // 月全体の平日・休日日数を計算
    updateMonthInfo();
    
    // 曜日ボタンの状態を更新
    updateWeekdayButtons();
    
    // 全日選択ボタンの状態を更新
    updateSelectAllButton();
    
    // 次へボタンの状態を更新
    updateNextButton();
}

// 月の平日・休日日数を表示
function updateMonthInfo() {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    let weekdayCount = 0;
    let holidayCount = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateStr = formatDate(date);
        const dayOfWeek = date.getDay();
        
        // 祝日かどうかをまずチェック
        if (holidays[dateStr]) {
            // 祝日は休日扱い
            holidayCount++;
        } else if (dayOfWeek === 0 || dayOfWeek === 6) {
            // 祝日ではない土日は休日
            holidayCount++;
        } else {
            // それ以外は平日
            weekdayCount++;
        }
    }
    
    const monthName = currentMonth + 1;
    const monthInfoText = `${monthName}月の平日は${weekdayCount}日、休日は${holidayCount}日です`;
    document.getElementById('monthInfo').textContent = monthInfoText;
}

// 次へボタンの状態更新
function updateNextButton() {
    const nextBtn = document.getElementById('nextBtn');
    if (!nextBtn) return; // 存在しない場合は何もしない
    if (selectedDates.size === 0) {
        nextBtn.disabled = true;
    } else {
        nextBtn.disabled = false;
    }
}

// 曜日ボタンの選択状態を更新
function updateWeekdayButtons() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    document.querySelectorAll('.btn-weekday').forEach(btn => {
        const targetDayOfWeek = parseInt(btn.dataset.day);
        
        // その曜日の日付を収集
        const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
        const targetDates = [];
        for (let day = 1; day <= lastDay; day++) {
            const date = new Date(currentYear, currentMonth, day);
            if (date > today && date.getDay() === targetDayOfWeek) {
                targetDates.push(formatDate(date));
            }
        }
        
        // すべて選択済みかチェック
        if (targetDates.length > 0 && targetDates.every(dateStr => selectedDates.has(dateStr))) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

// 日付フォーマット
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 表示用日付フォーマット
function formatDisplayDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    return `${month}/${day}(${dayOfWeek})`;
}

// イベントリスナーの設定
function setupEventListeners() {
    // 月選択ボタン
    document.getElementById('thisMonthBtn').addEventListener('click', function() {
        currentYear = parseInt(this.dataset.year);
        currentMonth = parseInt(this.dataset.month);
        updateMonthButtons();
        renderCalendar();
    });
    
    document.getElementById('nextMonthBtn').addEventListener('click', function() {
        currentYear = parseInt(this.dataset.year);
        currentMonth = parseInt(this.dataset.month);
        updateMonthButtons();
        renderCalendar();
    });
    
    // 全日選択
    document.getElementById('selectAllBtn').addEventListener('click', toggleSelectAll);
    
    // 選択クリア
    document.getElementById('clearAllBtn').addEventListener('click', async () => {
        if (selectedDates.size === 0) {
            await showCustomAlert('選択された日付がありません');
            return;
        }
        if (await showCustomConfirm('選択をすべてクリアしますか？')) {
            clearAllDates();
        }
    });
    
    // 曜日別選択
    document.querySelectorAll('.btn-weekday').forEach(btn => {
        btn.addEventListener('click', () => {
            const dayOfWeek = parseInt(btn.dataset.day);
            selectByWeekday(dayOfWeek);
        });
    });

    // 確認ダイアログ (存在する場合のみ)
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');
    if (confirmYes) confirmYes.addEventListener('click', clearAllDates);
    if (confirmNo) confirmNo.addEventListener('click', hideConfirmDialog);

    // 提出確認ダイアログ (存在する場合のみ)
    const submitYes = document.getElementById('submitYes');
    const submitNo = document.getElementById('submitNo');
    if (submitYes) submitYes.addEventListener('click', submitShift);
    if (submitNo) submitNo.addEventListener('click', hideSubmitConfirmDialog);

    // 次へボタン (存在する場合のみ)
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) nextBtn.addEventListener('click', showSubmitConfirmDialog);

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
}

// 月選択ボタンの状態更新
function updateMonthButtons() {
    const thisMonthBtn = document.getElementById('thisMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    
    thisMonthBtn.classList.remove('active');
    nextMonthBtn.classList.remove('active');
    
    if (currentYear === parseInt(thisMonthBtn.dataset.year) && 
        currentMonth === parseInt(thisMonthBtn.dataset.month)) {
        thisMonthBtn.classList.add('active');
    } else {
        nextMonthBtn.classList.add('active');
    }
}

// 全日選択/解除のトグル
async function toggleSelectAll() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const allDates = [];

    // その月の選択可能な日付を収集
    for (let day = 1; day <= lastDay; day++) {
        const date = new Date(currentYear, currentMonth, day);
        if (date > today) {
            allDates.push(formatDate(date));
        }
    }

    // すべて選択済みかチェック
    const allSelected = allDates.every(dateStr => selectedDates.has(dateStr));

    if (allSelected) {
        // すべて選択済み → 解除
        if (await showCustomConfirm('全日の選択を解除しますか？')) {
            allDates.forEach(dateStr => selectedDates.delete(dateStr));
            renderCalendar();
        }
    } else {
        // 一部または未選択 → すべて選択
        if (await showCustomConfirm('その月の全日を選択しますか？')) {
            allDates.forEach(dateStr => selectedDates.add(dateStr));
            renderCalendar();
        }
    }
}

// 全日選択ボタンの状態を更新
function updateSelectAllButton() {
    const btn = document.getElementById('selectAllBtn');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const allDates = [];
    
    for (let day = 1; day <= lastDay; day++) {
        const date = new Date(currentYear, currentMonth, day);
        if (date > today) {
            allDates.push(formatDate(date));
        }
    }
    
    if (allDates.length > 0 && allDates.every(dateStr => selectedDates.has(dateStr))) {
        btn.classList.add('selected');
    } else {
        btn.classList.remove('selected');
    }
}

// 曜日別選択/解除
function selectByWeekday(targetDayOfWeek) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // その曜日の日付を収集
    const targetDates = [];
    for (let day = 1; day <= lastDay; day++) {
        const date = new Date(currentYear, currentMonth, day);
        if (date > today && date.getDay() === targetDayOfWeek) {
            targetDates.push(formatDate(date));
        }
    }
    
    // すべて選択済みかチェック
    const allSelected = targetDates.every(dateStr => selectedDates.has(dateStr));
    
    if (allSelected) {
        // すべて選択済み → 解除
        targetDates.forEach(dateStr => selectedDates.delete(dateStr));
    } else {
        // 一部または未選択 → すべて選択
        targetDates.forEach(dateStr => selectedDates.add(dateStr));
    }
    
    renderCalendar();
}

// 確認ダイアログの表示
// 確認ダイアログの非表示
function hideConfirmDialog() {
    document.getElementById('confirmDialog').classList.remove('show');
}

// 全選択クリア
function clearAllDates() {
    selectedDates.clear();
    renderCalendar();
    hideConfirmDialog();
}

// テンプレート保存ダイアログの表示
function showTemplateSaveDialog() {
    if (selectedDates.size === 0) {
        alert('保存する日付を選択してください');
        return;
    }
    document.getElementById('templateSaveDialog').classList.add('show');
}

// テンプレート保存ダイアログの非表示
function hideTemplateSaveDialog() {
    document.getElementById('templateSaveDialog').classList.remove('show');
}

// テンプレート保存
function saveTemplate() {
    // 各日付を「第何週の何曜日」形式で保存
    const templatePattern = [];
    selectedDates.forEach(dateStr => {
        const date = new Date(dateStr + 'T00:00:00');
        const dayOfWeek = date.getDay();
        const weekNumber = getWeekOfMonth(date);
        templatePattern.push({ dayOfWeek, weekNumber });
    });
    
    const template = {
        pattern: templatePattern,
        savedAt: new Date().toISOString()
    };
    localStorage.setItem('shiftTemplate', JSON.stringify(template));
    savedTemplate = template;
    document.getElementById('loadTemplateBtn').disabled = false;
    hideTemplateSaveDialog();
    alert('テンプレートを保存しました！');
}

// 月内で第何週目かを取得
function getWeekOfMonth(date) {
    const day = date.getDate();
    return Math.ceil(day / 7);
}

// テンプレート読み込み
function loadTemplate() {
    if (!savedTemplate) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // テンプレートパターンを現在の月に適用
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    savedTemplate.pattern.forEach(({ dayOfWeek, weekNumber }) => {
        // 指定された週の指定された曜日を探す
        for (let day = 1; day <= lastDay; day++) {
            const date = new Date(currentYear, currentMonth, day);
            if (date > today && 
                date.getDay() === dayOfWeek && 
                getWeekOfMonth(date) === weekNumber) {
                selectedDates.add(formatDate(date));
            }
        }
    });
    
    renderCalendar();
    alert('テンプレートを読み込みました！');
}

// 前月と同じ
function copyPreviousMonth() {
    if (!previousMonthData) {
        alert('前月のデータがありません');
        return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 前月の「第何週の何曜日」パターンを取得
    const prevPattern = [];
    previousMonthData.dates.forEach(dateStr => {
        const date = new Date(dateStr + 'T00:00:00');
        const dayOfWeek = date.getDay();
        const weekNumber = getWeekOfMonth(date);
        prevPattern.push({ dayOfWeek, weekNumber });
    });
    
    // 現在の月で同じパターンを適用
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    prevPattern.forEach(({ dayOfWeek, weekNumber }) => {
        for (let day = 1; day <= lastDay; day++) {
            const date = new Date(currentYear, currentMonth, day);
            if (date > today && 
                date.getDay() === dayOfWeek && 
                getWeekOfMonth(date) === weekNumber) {
                selectedDates.add(formatDate(date));
            }
        }
    });
    
    renderCalendar();
    alert('前月と同じパターンを読み込みました！');
}

// 提出確認ダイアログの表示
function showSubmitConfirmDialog() {
    const dialog = document.getElementById('submitConfirmDialog');
    
    // 月の表示
    document.getElementById('confirmMonth').textContent = `${currentYear}年${currentMonth + 1}月`;
    
    // カレンダープレビューの生成
    renderConfirmCalendar();
    
    // 合計日数
    document.getElementById('confirmTotalDays').textContent = selectedDates.size;
    
    dialog.classList.add('show');
}

// 提出確認ダイアログの非表示
function hideSubmitConfirmDialog() {
    document.getElementById('submitConfirmDialog').classList.remove('show');
}

// 確認カレンダーのレンダリング
function renderConfirmCalendar() {
    const grid = document.getElementById('confirmGrid');
    grid.innerHTML = '';
    
    // 曜日ヘッダーを追加
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    weekdays.forEach((day, index) => {
        const header = document.createElement('div');
        header.className = 'confirm-weekday';
        header.textContent = day;
        
        if (index === 0) {
            header.classList.add('sunday-header');
        } else if (index === 6) {
            header.classList.add('saturday-header');
        }
        
        grid.appendChild(header);
    });
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 空白セル
    for (let i = 0; i < startDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'confirm-day empty';
        grid.appendChild(emptyCell);
    }
    
    // 日付セル
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateStr = formatDate(date);
        const dayOfWeek = date.getDay();
        
        const cell = document.createElement('div');
        cell.className = 'confirm-day';
        cell.textContent = day;
        
        if (dayOfWeek === 0) {
            cell.classList.add('sunday');
        } else if (dayOfWeek === 6) {
            cell.classList.add('saturday');
        }
        
        if (holidays[dateStr]) {
            cell.classList.add('holiday');
        }
        
        if (date < today) {
            cell.classList.add('disabled');
        }
        
        if (selectedDates.has(dateStr)) {
            cell.classList.add('selected');
        }
        
        grid.appendChild(cell);
    }
}

// シフト提出（時間設定画面へ遷移）
function submitShift() {
    // 前月データとして保存
    const monthData = {
        year: currentYear,
        month: currentMonth,
        dates: Array.from(selectedDates),
        submittedAt: new Date().toISOString()
    };
    localStorage.setItem('previousMonth', JSON.stringify(monthData));
    
    hideSubmitConfirmDialog();
    
    // 選択した日付を時間設定画面に渡す
    const sortedDates = Array.from(selectedDates).sort();
    const params = new URLSearchParams();

    sortedDates.forEach(dateStr => {
        params.append('dates', dateStr);
    });

    // 保存された時間情報も含める
    if (savedStartTimes && savedStartTimes.length > 0) {
        savedStartTimes.forEach(time => {
            params.append('startTimes', time);
        });
    }

    if (savedEndTimes && savedEndTimes.length > 0) {
        savedEndTimes.forEach(time => {
            params.append('endTimes', time);
        });
    }

    // 保存されたmodified情報も含める
    if (savedModifiedDates && savedModifiedDates.length > 0) {
        savedModifiedDates.forEach(date => {
            params.append('modifiedDates', date);
        });
    }

    window.location.href = '/time-register?' + params.toString();
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
