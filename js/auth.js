// 이 파일은 로그인, 회원가입, 상세 페이지가 함께 사용합니다.
// config.js를 먼저 불러와야 아래 설정을 읽을 수 있습니다.

// 아직 Supabase에 연결하지 않았으므로 처음 값은 null입니다.
window.santaClient = null;

// 로그인한 사용자가 없을 때도 null을 사용합니다.
window.santaUser = null;

const settings = window.SANTA_CONFIG;

// URL과 공개 키가 모두 있을 때만 연결합니다.
// 설정을 아직 입력하지 않아도 산 정보와 상세 화면은 볼 수 있습니다.
if (settings.supabaseUrl && settings.supabasePublishableKey && window.supabase) {
  try {
    window.santaClient = supabase.createClient(
      settings.supabaseUrl,
      settings.supabasePublishableKey
    );
  } catch (error) {
    console.error("Supabase 연결 설정을 확인해 주세요.", error);
  }
}

// localStorage의 이메일은 사용자가 직접 바꿀 수 있습니다.
// 그래서 로그인 여부는 Supabase 서버가 확인해 준 사용자로 판단합니다.
async function checkLogin() {
  if (window.santaClient === null) {
    return;
  }

  try {
    const result = await window.santaClient.auth.getUser();

    if (result.error === null) {
      window.santaUser = result.data.user;
    }
  } catch (error) {
    console.error("로그인 상태를 확인하지 못했습니다.", error);
  }
}

// 상세 페이지는 이 작업이 끝난 다음 로그인 버튼과 후기 폼을 그립니다.
window.santaAuthReady = checkLogin();
