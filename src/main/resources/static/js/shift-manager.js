// ========================================
// シフト管理統合スクリプト
// calendar.jsとtimeregister.jsを統合し、
// スライドビュー機能を追加
// ========================================

// グローバル変数の拡張
let currentView = 'calendar'; // 現在のビュー
let timeCardsData = []; // 時間設定カードのデータ

// ========================================
// 初期化（DOMContentLoaded後に実行）
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // ビュー切り替え機能の初期化を遅延実行
    setTimeout(() => {
        initializeViewSwitching();
        updateProgressIndicator();
    }, 100);
});

// ========================================
// ビュー切り替え機能
// ========================================
function initializeViewSwitching() {
    // 既存のnextBtnの動作を上書き
    const nextToTimeBtn = document.getElementById('nextToTimeBtn');
    if (nextToTimeBtn) {
        // 既存のイベントリスナーをクリア（clone + replaceで）
        const newBtn = nextToTimeBtn.cloneNode(true);
        nextToTimeBtn.parentNode.replaceChild(newBtn, nextToTimeBtn);

        newBtn.addEventListener('click', showTimeView);
    }

    // カレンダーに戻るボタン
    const backToCalendarBtn = document.getElementById('backToCalendarBtn');
    if (backToCalendarBtn) {
        const newBackBtn = backToCalendarBtn.cloneNode(true);
        backToCalendarBtn.parentNode.replaceChild(newBackBtn, backToCalendarBtn);

        newBackBtn.addEventListener('click', showCalendarView);
    }
}

function showTimeView() {
    if (selectedDates.size === 0) return;

    // 選択された日付から時間カードデータを生成
    generateTimeCardsFromSelectedDates();

    // ビューを切り替え
    const wrapper = document.getElementById('viewWrapper');
    wrapper.classList.add('animating');
    wrapper.classList.add('show-time');
    currentView = 'time';

    setTimeout(() => {
        wrapper.classList.remove('animating');
    }, 400);

    updateProgressIndicator();
}

function showCalendarView() {
    const wrapper = document.getElementById('viewWrapper');
    wrapper.classList.add('animating');
    wrapper.classList.remove('show-time');
    currentView = 'calendar';

    setTimeout(() => {
        wrapper.classList.remove('animating');
    }, 400);

    updateProgressIndicator();
}

// ========================================
// 進捗インジケーター更新
// ========================================
function updateProgressIndicator() {
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');

    if (!step1 || !step2 || !step3) return;

    // リセット
    step1.classList.remove('active', 'completed');
    step2.classList.remove('active', 'completed');
    step3.classList.remove('active', 'completed');

    if (currentView === 'calendar') {
        step1.classList.add('active');
    } else if (currentView === 'time') {
        step1.classList.add('completed');
        step2.classList.add('active');
    }
}

// ========================================
// 時間カードデータ生成
// ========================================
function generateTimeCardsFromSelectedDates() {
    const sortedDates = Array.from(selectedDates).sort();
    timeCardsData = sortedDates.map((dateStr, index) => {
        const date = new Date(dateStr + 'T00:00:00');
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dayOfWeek = date.getDay();
        const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];

        return {
            index: index,
            date: dateStr,
            displayDate: `${month}/${day}(${dayLabels[dayOfWeek]})`,
            dayOfWeek: dayOfWeek,
            startTime: bulkStartTime,
            endTime: bulkEndTime,
            modified: false
        };
    });

    renderTimeCards();
    if (typeof updateTotalHours === 'function') {
        updateTotalHours();
    }
}

function renderTimeCards() {
    const timeList = document.getElementById('timeList');
    if (!timeList) return;

    timeList.innerHTML = '';

    timeCardsData.forEach((data, index) => {
        const card = document.createElement('div');
        card.className = 'time-card';
        if (data.modified) card.classList.add('modified');
        card.dataset.index = index;

        card.innerHTML = `
            <input type="hidden" class="date-value" value="${data.date}">
            <input type="hidden" class="dayofweek-value" value="${data.dayOfWeek}">
            <input type="hidden" class="start-time-value" value="${data.startTime}">
            <input type="hidden" class="end-time-value" value="${data.endTime}">

            <div class="card-content-horizontal">
                <div class="card-date">${data.displayDate}</div>
                <div class="card-time-section">
                    <span class="time-value start-display">${data.startTime}</span>
                    <span class="time-separator">～</span>
                    <span class="time-value end-display">${data.endTime}</span>
                </div>
            </div>
            <div class="card-hours">
                <span class="hours-icon">💼</span>
                <span class="hours-text">-</span>
            </div>
        `;

        card.addEventListener('click', () => {
            if (typeof openCardTimePicker === 'function') {
                openCardTimePicker(index);
            }
        });
        timeList.appendChild(card);

        if (typeof updateCardHours === 'function') {
            updateCardHours(card);
        }
    });

    // 出勤日数を更新
    const totalWorkDays = document.getElementById('totalWorkDays');
    if (totalWorkDays) {
        totalWorkDays.textContent = timeCardsData.length;
    }
}

// ========================================
// removeShift関数の上書き（確認ダイアログなし）
// ========================================
// DOMContentLoaded後に上書き
setTimeout(() => {
    if (typeof removeShift !== 'undefined') {
        window.removeShift = function() {
            if (!currentModal || currentModal.type !== 'card') return;

            const card = document.querySelector(`.time-card[data-index="${currentModal.index}"]`);
            if (!card) return;

            // 確認なしで即座に削除
            card.style.display = 'none';
            card.dataset.removed = 'true';

            if (typeof updateTotalHours === 'function') {
                updateTotalHours();
            }
            if (typeof closeTimePicker === 'function') {
                closeTimePicker();
            }
        };
    }
}, 200);

// ========================================
// シフト提出処理
// ========================================
// submitShift関数を拡張して、確認ダイアログ表示のみに変更
setTimeout(() => {
    // 既存のsubmitBtn動作を上書き
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        const newSubmitBtn = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);

        newSubmitBtn.addEventListener('click', async () => {
            // バリデーション
            const cards = document.querySelectorAll('.time-card:not([data-removed="true"])');
            for (const card of cards) {
                const startTime = card.querySelector('.start-time-value').value;
                const endTime = card.querySelector('.end-time-value').value;

                if (!startTime || !endTime) {
                    if (typeof showCustomAlert === 'function') {
                        await showCustomAlert('全ての日付に時間を設定してください');
                    } else {
                        alert('全ての日付に時間を設定してください');
                    }
                    return;
                }
            }

            // 確認ダイアログ表示
            if (typeof showConfirmDialog === 'function') {
                showConfirmDialog();
            }
        });
    }

    // 最終提出ボタン
    const finalSubmit = document.getElementById('finalSubmit');
    if (finalSubmit) {
        const newFinalSubmit = finalSubmit.cloneNode(true);
        finalSubmit.parentNode.replaceChild(newFinalSubmit, finalSubmit);

        newFinalSubmit.addEventListener('click', () => {
            alert('シフトを提出しました！（実装中）');
            // TODO: サーバーへの送信処理
        });
    }

    // キャンセルボタン
    const cancelSubmit = document.getElementById('cancelSubmit');
    if (cancelSubmit) {
        const newCancelSubmit = cancelSubmit.cloneNode(true);
        cancelSubmit.parentNode.replaceChild(newCancelSubmit, cancelSubmit);

        newCancelSubmit.addEventListener('click', () => {
            if (typeof hideConfirmDialog === 'function') {
                hideConfirmDialog();
            }
        });
    }
}, 200);

// ========================================
// 確認ダイアログ表示関数
// ========================================
function showConfirmDialog() {
    const confirmList = document.getElementById('confirmList');
    const confirmDialog = document.getElementById('confirmDialog');

    if (!confirmList || !confirmDialog) return;

    confirmList.innerHTML = '';

    let totalMinutes = 0;
    let totalDays = 0;

    document.querySelectorAll('.time-card:not([data-removed="true"])').forEach(card => {
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

    document.getElementById('confirmTotalDays').textContent = totalDays;

    const wholeHours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (minutes === 0) {
        document.getElementById('confirmTotalHours').textContent = `${wholeHours}時間`;
    } else {
        document.getElementById('confirmTotalHours').textContent = `${wholeHours}時間${minutes}分`;
    }

    confirmDialog.classList.add('show');
}

function hideConfirmDialog() {
    const confirmDialog = document.getElementById('confirmDialog');
    if (confirmDialog) {
        confirmDialog.classList.remove('show');
    }
}
