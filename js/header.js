// 모든 페이지가 함께 쓰는 상단 헤더입니다. (메인, 검색, 상세, 마이페이지)
// 헤더를 넣을 자리에 아래처럼 한 줄만 쓰면 됩니다. 이 파일은 defer 없이 불러와야 합니다.
//   <script src="js/header.js"></script>           (루트의 페이지)
//   <script src="../js/header.js"></script>        (fronted/ 안의 페이지)
// 실행 순서: 주소 계산 → 스타일과 헤더 넣기 → 로그인 상태 확인 → 로그인/로그아웃 버튼 연결

(function () {
  const script = document.currentScript;

  // 이 파일(js/header.js)의 위치를 기준으로 사이트 맨 위 주소를 구합니다.
  // 페이지가 어느 폴더에 있어도 링크가 같은 곳을 가리키게 하기 위해서입니다.
  const root = new URL('../', script.src);
  const url = function (path) {
    return new URL(path, root).href;
  };

  const page = location.pathname.split('/').pop() || 'index.html';
  // 현재 페이지에 해당하는 메뉴를 굵게 표시합니다. (상세 페이지는 코스 검색으로 봅니다.)
  const current = {
    'index.html': 'home',
    'search.html': 'search',
    'detail.html': 'search',
    'mypage.html': 'mypage',
  }[page];

  const css = `
    .sh-nav{display:flex;align-items:center;gap:40px;padding:16px 88px;background:#fff;border-bottom:1px solid #e4e7e3;font-family:"Noto Sans KR",sans-serif;line-height:1.5;word-break:keep-all}
    .sh-nav *{box-sizing:border-box}
    .sh-nav a{color:inherit;text-decoration:none}
    .sh-logo{font-size:24px;font-weight:700;color:#2f5d3a}
    .sh-search{flex:1;min-width:0;display:flex;align-items:center;gap:12px;padding:13px 22px;margin:0;border:1px solid #e4e7e3;border-radius:999px;background:#fff}
    .sh-search img{width:22px;height:22px;flex:none}
    .sh-search input{flex:1;min-width:0;height:auto;padding:0;border:0;outline:0;background:transparent;font:inherit;font-size:15px;color:#1b1f1c}
    .sh-search input::placeholder{color:#9aa19b}
    .sh-search:focus-within{border-color:#2f5d3a}
    .sh-menu{display:flex;align-items:center;gap:28px;font-size:15px;color:#6b736d;white-space:nowrap}
    .sh-menu a:hover{color:#1b1f1c}
    .sh-menu .sh-on{display:inline-flex;align-items:center;gap:4px;font-weight:700;color:#1b1f1c}
    .sh-menu .sh-on img{width:16px;height:16px}
    .sh-btn{padding:8px 20px;font:inherit;font-size:15px;font-weight:500;color:#1b1f1c;background:#fff;border:1px solid #e4e7e3;border-radius:999px;cursor:pointer}
    .sh-btn:hover{background:#f5f5f5}
    @media (max-width:900px){
      .sh-nav{flex-wrap:wrap;gap:16px;padding:16px 20px}
      .sh-search{order:3;flex-basis:100%}
      .sh-menu{margin-left:auto;gap:16px}
      .sh-hide{display:none}
    }
  `;

  // 메뉴 한 칸을 만듭니다. 현재 페이지 메뉴는 굵게 표시하고 aria-current를 붙입니다.
  function menuLink(key, href, text, withArrow) {
    const isCurrent = current === key;
    const classes = 'sh-hide' + (isCurrent ? ' sh-on' : '');
    const arrow = withArrow ? '<img src="' + url('assets/down.svg') + '" alt="" />' : '';
    return (
      '<a href="' + href + '" class="' + classes + '"' +
      (isCurrent ? ' aria-current="page"' : '') + '>' + text + arrow + '</a>'
    );
  }

  const html = `
    <header class="sh-nav" id="siteHeader">
      <a href="${url('fronted/index.html')}" class="sh-logo">SanTa</a>
      <form class="sh-search" action="${url('fronted/search.html')}" role="search">
        <img src="${url('assets/search.svg')}" alt="" />
        <input type="search" class="search-box__input" name="search" aria-label="산 또는 코스 검색" placeholder="찾고 싶은 산이나 코스를 입력해 주세요." />
      </form>
      <nav class="sh-menu" aria-label="헤더 메뉴">
        ${menuLink('home', url('fronted/index.html'), '코스 추천', false)}
        ${menuLink('search', url('fronted/search.html'), '코스 검색', false)}
        ${menuLink('mypage', url('mypage.html'), '내 기록', true)}
        <button type="button" class="sh-btn" id="shAuthBtn">로그인</button>
      </nav>
    </header>
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  script.insertAdjacentHTML('beforebegin', html);

  // 검색 결과 페이지에서는 검색어를 입력창에 그대로 보여 줍니다.
  const keyword = new URLSearchParams(location.search).get('search');
  if (page === 'search.html' && keyword) {
    document.querySelector('#siteHeader input').value = keyword;
  }

  // ---------- 로그인 상태 ----------
  // 상세·마이페이지는 js/auth.js를 이미 불러오고, 메인·검색 페이지는 불러오지 않습니다.
  // 없으면 필요한 파일을 순서대로 불러와서 어느 페이지에서나 같은 방식으로 확인합니다.
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      const tag = document.createElement('script');
      tag.src = src;
      tag.onload = resolve;
      tag.onerror = function () {
        reject(new Error(src + ' 파일을 불러오지 못했습니다.'));
      };
      document.head.append(tag);
    });
  }

  async function ensureAuth() {
    if (window.santaAuthReady) return;
    if (!window.supabase) {
      await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    }
    if (!window.SANTA_CONFIG) await loadScript(url('config.js'));
    await loadScript(url('js/auth.js'));
  }

  function goToLogin() {
    sessionStorage.setItem('returnUrl', location.href);
    location.href = url('logIn.html');
  }

  async function logout() {
    const result = await window.santaClient.auth.signOut();
    if (result.error) {
      alert('로그아웃 실패: ' + result.error.message);
      return;
    }
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    // 내 기록은 로그인해야 볼 수 있으므로 메인으로 보내고, 나머지는 새로고침합니다.
    if (page === 'mypage.html') {
      location.href = url('fronted/index.html');
    } else {
      location.reload();
    }
  }

  // DOMContentLoaded 뒤에 실행해서, 페이지가 직접 불러오는 auth.js가 먼저 준비되게 합니다.
  async function setupAuthButton() {
    const button = document.getElementById('shAuthBtn');
    button.addEventListener('click', goToLogin);

    try {
      await ensureAuth();
      await window.santaAuthReady;
    } catch (error) {
      console.error('로그인 상태를 확인하지 못했습니다.', error);
      return;
    }

    if (window.santaUser) {
      button.textContent = '로그아웃';
      button.removeEventListener('click', goToLogin);
      button.addEventListener('click', logout);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAuthButton);
  } else {
    setupAuthButton();
  }
})();
