# SanTa 로컬 지도·후기 연결 (2026-11-02)

## 실행

PowerShell에서 프로젝트 폴더로 이동하고 실행합니다.

```powershell
cd C:\Users\user\Documents\SanTa
node scripts/serve.cjs
```

http://localhost:8080/detail.html?id=PMNTN_00001
산 정보만 보기: http://localhost:8080/detail.html?id=MT_468200101
목록·검색: http://localhost:8080/detail.html
서버는 127.0.0.1에만 바인딩됩니다. 모바일은 390px 브라우저 에뮬레이션으로 확인했으며 실제 휴대폰 접속 검증은 하지 않았습니다.

## 카카오 설정

1. https://developers.kakao.com 에서 사용할 앱을 선택합니다.
2. [앱] → [앱 설정] → [앱] → [플랫폼 키]에서 JavaScript 키를 선택합니다.
3. 해당 키의 JavaScript SDK 도메인에 http://localhost:8080 을 등록합니다. http://127.0.0.1:8080 으로 접속하려면 이 주소도 별도로 등록합니다. 실제 배포 시 사용할 HTTPS origin도 등록합니다. 경로 /detail.html 은 넣지 않습니다.
4. 앱의 Kakao Map 사용 설정이 필요한 경우 활성화합니다. 계정/앱 권한에 따라 콘솔 항목은 달라질 수 있습니다.
5. config.js 의 kakaoJavaScriptKey 에 JavaScript 키를 넣습니다. REST API 키나 Admin 키를 넣지 않습니다.
6. 브라우저에서 새로고침합니다. 키 오류, 도메인 불일치, SDK 차단은 지도 안내와 개발자도구 네트워크의 sdk.js 응답으로 확인합니다.
7. 저장된 WGS84 latitude/longitude가 있으면 마커를 표시합니다. 없으면 지역+산 이름을 검색하며 **후보 주소를 보고 선택해야** 마커가 생깁니다. 검색 위치는 정상·등산로 입구·코스 경로를 보장하지 않습니다.

공식 안내: https://apis.map.kakao.com/web/guide/

## Supabase와 기존 데이터 보존

기존 로그인/회원가입의 URL은 praypaewixxxudsmlxpj, 상세의 URL은 pray0paewixxxudsmlxpj로 서로 다릅니다. 공개 키 문자열도 달랐습니다. 어느 쪽이 유효한지 추정하여 사용하지 않았습니다.

1. 실제 Supabase 프로젝트의 Connect/API 설정에서 Project URL과 publishable key 또는 anon 공개 키를 확인하고 config.js 의 supabaseUrl, supabasePublishableKey 에 넣습니다. service_role/secret 키는 절대로 브라우저에 넣지 않습니다.
2. Authentication에서 이메일/비밀번호 로그인을 설정하고 Site URL과 필요한 리다이렉트 URL을 로컬/배포 주소에 맞춥니다. 이메일 확인이 켜져 있으면 가입 후 확인 메일을 완료해야 로그인됩니다.
3. reviews_auth_migration.sql 상단의 사전 조회 SQL만 먼저 실행하여 실제 컬럼·RLS 활성화·정책을 저장합니다. 로컬 SQL은 배포된 서버 상태의 증거가 아닙니다.
4. 같은 파일의 begin~commit을 검토 후 실행합니다. 이 작업은 이번에 서버에 실행하지 않았습니다. reviews_v2 테이블을 별도로 만들고 user_id/auth.users, mountain_id, text를 사용합니다. mountain_id에는 현재 화면의 PMNTN_* 또는 MT_* ID를 그대로 저장하여 다른 코스 후기가 섞이지 않도록 합니다.
5. 새 테이블은 공개 조회, 인증된 본인만 작성·삭제, 수정 금지입니다. 추가 restrictive 정책으로 이전 permissive 정책이 있어도 소유자 검사를 우회하지 않도록 합니다.
6. 기존 reviews 행·테이블·기존 정책은 삭제하지 않습니다. 마이그레이션은 기존 reviews의 쓰기·수정·삭제를 제한하는 정책을 추가합니다. 과거 후기는 기존 reviews에 남고 새 화면에는 자동으로 복사하거나 합쳐 보여주지 않습니다. 이전 앱 버전의 후기 작성은 중단됩니다.
7. public.users의 예전 RPC 로그인은 Supabase Auth 세션/JWT를 만들지 않습니다. 새 로그인/회원가입은 auth.signInWithPassword / auth.signUp을 사용합니다. 기존 public.users 계정은 자동으로 Auth 계정이 되지 않으므로 확인된 이메일로 Auth 계정을 별도 등록해야 합니다. 기존 password_hash는 실제로 평문 비밀번호를 저장하는 코드였으므로 복사하지 않습니다. 예전 RPC·users_public 뷰의 공개 범위도 관리자 검토가 필요합니다.
8. 과거 후기의 소유권 이전은 검증된 계정 연결 방식을 정한 뒤 별도 작업해야 합니다. 브라우저 localStorage의 이메일을 근거로 소유권을 부여하지 않습니다. 기존 userEmail/userId 값은 로그인 증거로 사용하지 않습니다.
9. 계정 A/B 및 비로그인 상태로 검증합니다: A 작성 성공, B의 A 후기 삭제 거부, 비로그인 작성/삭제 거부, A 자신의 후기 삭제 성공. UI 버튼 숨김만으로 권한 검증을 대신하지 않습니다.

실제 서버 정책 조회/변경, 계정 생성, 기존 후기 이전은 실행하지 않았습니다.
공식 권한 안내: https://supabase.com/docs/guides/database/postgres/row-level-security

## 데이터 확인 결과

- 산림관광_통합데이터.json: mountain_info 4,704 / famous_mountain 1,587 / mountain_image 2,241 / village_forest 1,099건.
- 산 이름=산정보개요내용, 주소=산정보관리주체명, 높이=산높이를 실제 샘플에서 확인했습니다. scripts/prepare-mountains.cjs로 data/mountains.json을 재생성할 수 있습니다.
- 현재 로컬 data/courses.json은 7,645건, 등산로_속성.json은 57,890건입니다. 기존 파일과 preprocess/build_courses.js는 변경하지 않았습니다.
- 기존 전처리는 같은 산/코스명인 구간의 거리·시간을 합산하고 거리+상행시간으로 난이도를 계산합니다. 연결된 단일 코스인지 검증된 값이 아니므로 화면에 추정·구간 합계임을 명시했습니다. 코스 ID도 순번 기반이라 재생성 시 바뀔 수 있습니다. 기존 후기 연결을 위해 ID를 재생성하지 않았습니다.
- TB_FGDI_WG_MT_WAY_ALL.json은 루트에는 없고 _backup_gitignore 폴더에 있습니다. FeatureCollection, 57,890 features, 첫 geometry는 LineString입니다. 첫 좌표는 약 [965642.54,1761089.35]이며 crs 선언이 없습니다. 위경도가 아니므로 실제 경로 선은 그리지 않았습니다. EPSG 코드/원본 메타데이터와 좌표 변환·검증이 필요합니다.
- 전달본 zip은 프로젝트와 Downloads의 이름 검색에서 발견되지 않았습니다. 작업 전 config.js, js/course-map.js, data/mountains.json, MAP_SETUP.md도 없어서 핵심 수정본은 미적용으로 판단했습니다. 다른 위치의 zip 존재 여부는 확인하지 않았습니다.
- assets/logo.svg는 기존에 1바이트라 표시되지 않았습니다. 기존 파일을 보존하고 Figma와 같은 SanTa 텍스트 로고를 사용합니다. 검색/접기/뒤로가기/내기록 아이콘은 Figma 원본 SVG로 추가했습니다.

## 검증과 한계

- 브라우저 1280px PC 및 390px 모바일: 상세 렌더링, 올바른 산 이름·주소, 누락된 거리·시간 표시, 가로 넘침 없음, 패널 접기, 로그인 설정 오류 표시, 확인한 페이지 콘솔 오류 없음.
- VM 실행 검사: 코스/산 데이터 결합, courses 404 시 mountains 대체, 500 시 대체하지 않고 오류 표시, JSON 오류, 없는 ID, HTML 내 모든 script 닫힘 및 문법, 산 ID 4,704개 중복 없음.
- 확인하지 못함: 실제 카카오 인증/타일·장소 검색 응답, Supabase 로그인·가입·후기 작성/삭제·서버 RLS, 실제 휴대폰 및 모든 화면 크기. 카카오 키와 Supabase 설정이 필요합니다.
- Codex config.toml(2717바이트)과 config.toml.bak-20261102-005631(3973바이트)이 현재 존재합니다. 이번 세션의 도구 실행은 가능했지만 Codex 재시작 후 설정 로딩 전체 정상 여부는 검증하지 않았고 설정 파일은 수정하지 않았습니다.

원격 커밋·푸시와 서버 SQL 실행은 하지 않았습니다. 작업 전 추적 파일 git diff는 비어 있었으며 기존 미추적 데이터·전처리·백업 폴더는 보존했습니다.

## 처음 설정할 때 따라 하는 순서

### 1. 카카오 JavaScript 키

1. https://developers.kakao.com 에 로그인합니다.
2. 상단 앱 메뉴에서 팀이 이미 만든 SanTa 앱을 선택합니다. 앱이 없다면 앱 만들기로 생성합니다.
3. 선택한 앱의 카카오맵 → 사용 설정 → 상태를 ON으로 바꿉니다.
4. 앱 설정 → 앱 → 플랫폼 키에서 JavaScript 키를 선택하고 값을 복사합니다. REST API 키는 사용하지 않습니다.
5. 같은 키의 JavaScript SDK 도메인에 http://localhost:8080 을 추가하고 저장합니다. 주소 뒤에 /detail.html 은 붙이지 않습니다.
6. VS Code에서 C:\Users\user\Documents\SanTa 폴더를 열고 config.js를 엽니다.
7. kakaoJavaScriptKey: ''의 작은따옴표 사이에 복사한 값을 넣고 Ctrl+S로 저장합니다.
8. http://localhost:8080/detail.html?id=PMNTN_00001 에서 새로고침합니다.
9. 산 좌표가 없으므로 검색 후보가 나옵니다. 원본 주소와 후보 주소를 비교하고 해당 후보를 누르면 지도가 표시됩니다.

현재 카카오 공식 문서는 개발자 계정에서 처음 활성화한 앱에 무료 쿼터를 제공합니다. 다른 앱을 추가로 만들기 전에 팀의 기존 앱과 무료 쿼터 뱃지를 확인하세요. 두 번째 활성화 앱이나 무료 쿼터 초과 사용은 비즈월렛/유료 API 설정이 필요할 수 있습니다.
https://developers.kakao.com/docs/ko/kakaomap/common

### 2. Supabase URL과 공개 키

1. https://supabase.com/dashboard 에 로그인합니다.
2. 팀이 실제 데이터베이스로 사용하는 SanTa 프로젝트를 선택합니다. 기존 파일의 URL이 서로 달라서 어느 쪽도 추정하여 입력하지 않았습니다.
3. 프로젝트의 Connect 버튼을 누릅니다.
4. 연결 안내에서 Project URL과 Publishable key를 복사합니다. 키를 선택해서 확인하려면 Settings → API Keys를 엽니다. 공개 키가 없다면 해당 메뉴에서 생성합니다.
5. config.js의 supabaseUrl: ''에는 https://프로젝트주소.supabase.co 형태의 URL을 넣습니다. 대시보드 웹주소나 DB 연결 문자열을 넣지 않습니다.
6. supabasePublishableKey: ''에는 보통 sb_publishable_로 시작하는 공개 키를 넣습니다. URL과 키는 반드시 같은 프로젝트에서 가져옵니다.
7. reviewsTable: 'reviews_v2'는 그대로 둡니다.
8. Ctrl+S로 저장합니다. 공개 키는 브라우저에서 쓰도록 만들어진 키입니다. sb_secret_나 service_role 키, 데이터베이스 비밀번호는 이 파일에 넣지 마세요.
https://supabase.com/docs/guides/getting-started/api-keys

### 3. 후기 테이블과 로그인

키를 입력하는 것만으로 후기 테이블과 권한이 만들어지지는 않습니다.

1. Supabase 왼쪽 SQL Editor → New query를 엽니다.
2. 로컬 reviews_auth_migration.sql의 맨 위 사전 조회 SQL들을 먼저 실행합니다. --는 주석이므로 SQL Editor에 복사할 때 조회 문장의 맨 앞 --를 빼고 실행하세요.
3. 실제 테이블/컬럼과 정책을 확인한 뒤 같은 파일의 begin;부터 commit;까지 실행합니다. 기존 reviews_table.sql은 이전 방식이므로 이번 설정에 다시 실행하지 않습니다.
4. 이 SQL은 새 reviews_v2를 만들고 기존 reviews의 쓰기를 막습니다. 기존 users/reviews 행은 삭제하지 않습니다. 과거 후기는 새 테이블로 자동 복사되지 않습니다.
5. Authentication에서 이메일/비밀번호 방식이 활성화되어 있는지 확인합니다. URL Configuration의 Site URL은 로컬 테스트 시 http://localhost:8080 으로 설정합니다. 배포로 사용 중인 프로젝트라면 기존 Site URL을 무작정 바꾸지 말고 Redirect URLs에 필요한 로컬 주소를 추가한 뒤 이메일 인증은 기존 정상 사이트에서도 완료할 수 있습니다.
6. 사이트의 회원가입 화면에서 Auth 계정을 생성합니다. 이메일 확인이 켜져 있으면 받은 메일에서 인증한 다음 로그인합니다.
7. 예전 public.users 계정은 Auth 계정이 아니므로 예전 이메일이 localStorage에 있다는 것만으로 로그인 상태가 되지 않습니다.
8. 로그인 후 상세 페이지의 로그아웃 버튼과 후기 입력창을 확인합니다. 두 계정으로 각자 작성하고 상대방 후기는 삭제할 수 없는지도 확인해야 합니다.

### 설정 예시

아래 값은 예시입니다. 실제 복사한 값으로 바꾸세요.

```javascript
window.SANTA_CONFIG = {
  kakaoJavaScriptKey: '여기에 카카오 JavaScript 키',
  supabaseUrl: 'https://여기에-실제-프로젝트주소.supabase.co',
  supabasePublishableKey: '여기에 Supabase Publishable key',
  reviewsTable: 'reviews_v2'
};
```

### 코드 읽는 순서

- config.js: 연결에 필요한 값
- js/auth.js: Supabase 연결과 로그인 확인
- detail.html의 loadCourses: 데이터 읽기와 선택한 산 찾기
- detail.html의 render: 화면 만들기
- js/course-map.js의 showCourseMap: 지도 또는 위치 후보 표시
- detail.html의 submitReview / deleteReview / loadReviews: 후기 저장·삭제·조회

조건은 if로 풀어 쓰고, 배열은 for 반복문으로 읽기 쉽게 정리했습니다. await는 인터넷 응답이 끝나기를 기다릴 때, try/catch는 실패했을 때 안내하기 위해 사용합니다. SQL 권한 검사는 후기 소유자를 서버에서 보호하는 부분이라 유지했습니다.
