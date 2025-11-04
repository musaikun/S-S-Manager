document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.querySelector('.main-btn');
  const titleS = document.querySelector('.title-s');
  const titleS2 = document.querySelector('.title-s2');
  const shineX = document.querySelector('.shine-x');
  const loginForm = document.querySelector('.login-form');

  let animationPlayed = false;

  // ボタンクリックイベント
  loginBtn.addEventListener('click', startAnimation);

  /**
   * アニメーション開始関数
   */
  function startAnimation() {
    if (animationPlayed) return;
    animationPlayed = true;

    // ボタンを無効化
    loginBtn.disabled = true;
    loginBtn.style.opacity = '0';
    loginBtn.style.pointerEvents = 'none';

    // SとS2をフェードアウト＆外へ
    titleS.style.transform = 'translateX(-60px)';
    titleS2.style.transform = 'translateX(60px)';
    titleS.style.opacity = '0';
    titleS2.style.opacity = '0';

    // 星分解アニメーション開始（700ms後）
    setTimeout(() => {
      explodeShine();
      showLoginForm();
    }, 700);
  }

  /**
   * × を星に分解するアニメーション
   */
  function explodeShine() {
    const rect = shineX.getBoundingClientRect();
    const xCenter = rect.left + rect.width / 2;
    const yCenter = rect.top + rect.height / 2;

    // 星パーティクルを生成
    const particleCount = 40;
    for (let i = 0; i < particleCount; i++) {
      createParticle(xCenter, yCenter);
    }

    // × 本体をクラス追加でズームアウト＆フェードアウト
    shineX.classList.add('exploding');
  }

  /**
   * パーティクルを生成・アニメーション
   */
  function createParticle(xCenter, yCenter) {
    const star = document.createElement('div');
    star.classList.add('x-star');

    // ランダム方向・距離を計算
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 160 + 40;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    // CSS変数に設定
    star.style.setProperty('--tx', `${tx}px`);
    star.style.setProperty('--ty', `${ty}px`);

    // 位置を設定
    star.style.left = `${xCenter}px`;
    star.style.top = `${yCenter}px`;

    // DOMに追加してアニメーション開始
    document.body.appendChild(star);
    star.style.animation = `starExplode 1.5s ease-out forwards`;
    star.style.opacity = '1';

    // アニメーション終了後にDOM削除
    setTimeout(() => {
      if (star.parentNode) {
        star.remove();
      }
    }, 1600);
  }

  /**
   * ログインフォーム表示
   */
  function showLoginForm() {
    setTimeout(() => {
      loginForm.classList.add('show');
      // フォーカスを最初の入力欄に移動（アクセシビリティ向上）
      const firstInput = loginForm.querySelector('input');
      if (firstInput) {
        firstInput.focus();
      }
    }, 1600);
  }

  // フォーム送信イベント（将来の実装用）
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleFormSubmit();
  });

  /**
   * フォーム送信処理（実装例）
   */
  function handleFormSubmit() {
    const inputs = loginForm.querySelectorAll('input');
    const formData = {
      userId: inputs[0].value,
      password: inputs[1].value,
    };

    console.log('フォーム送信:', formData);
    // ここで実際のログイン処理を実装
  }
});