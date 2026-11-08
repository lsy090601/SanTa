/**
 * courses.json 생성 스크립트
 *
 * 입력: data/등산로_속성.json   (등산로 GeoJSON에서 좌표 제거한 속성만)
 *       data/산정보_목록.json    (산정보 OpenAPI - 높이/소재지)
 *       data/산이미지_정보.json  (산이미지 OpenAPI - 사진 파일명)
 * 출력: data/courses.json
 *
 * 실행: node preprocess/build_courses.js
 */
const fs = require("fs");

const IMG_BASE = "https://www.forest.go.kr/images/data/down/mountain/";

// 이상치 기준 (구간 합산 오류로 비정상 값이 섞여 있음)
const MAX_KM = 30;
const MAX_MIN = 720; // 12시간

// 난이도 점수식: 거리(km) + 상행시간(분)/20
const LEVEL_EASY = 4;
const LEVEL_MID = 9;

const rows = JSON.parse(fs.readFileSync("data/등산로_속성.json", "utf8"));
const list = JSON.parse(fs.readFileSync("data/산정보_목록.json", "utf8"));
const imgs = JSON.parse(fs.readFileSync("data/산이미지_정보.json", "utf8"));

// 산코드 -> 산정보
const info = new Map(list.map((r) => [String(r.산정보ID), r]));

// 산코드 -> 대표 이미지 1장 (순번이 빠른 것)
const imgBy = new Map();
for (const i of imgs) {
  const k = String(i.산정보ID);
  const prev = imgBy.get(k);
  if (!prev || Number(i.산첨부이미지순번) < Number(prev.산첨부이미지순번)) {
    imgBy.set(k, i);
  }
}

// 재질 텍스트 -> 지형타입 라벨
function terrainOf(text) {
  if (!text) return null;
  const rock = /암|전석|바위|너덜/.test(text);
  const soil = /토|흙|마사/.test(text);
  if (rock && soil) return "혼합";
  if (rock) return "돌산";
  if (soil) return "흙산";
  return null;
}

// 소재지 -> 광역시도
function regionOf(m) {
  const addr = m && (m.산정보관리주체명 || m.산정보소재지);
  if (!addr) return null;
  return String(addr).trim().split(/\s+/)[0] || null;
}

// 1) 구간(row)을 코스 단위로 합산 — 코스명 없는 행은 제외
const group = new Map();
let noName = 0;
for (const r of rows) {
  if (!r.PMNTN_NM) {
    noName++;
    continue;
  }
  const key = r.MNTN_CODE + "|" + r.PMNTN_NM;
  if (!group.has(key)) {
    group.set(key, {
      code: String(r.MNTN_CODE),
      mountain: r.MNTN_NM,
      course: r.PMNTN_NM,
      km: 0,
      up: 0,
      down: 0,
      terrain: [],
      risk: [],
      closed: false,
    });
  }
  const g = group.get(key);
  g.km += r.PMNTN_LT || 0;
  g.up += r.PMNTN_UPPL || 0;
  g.down += r.PMNTN_GODN || 0;
  if (r.PMNTN_MTRQ) g.terrain.push(r.PMNTN_MTRQ);
  if (r.PMNTN_RISK) g.risk.push(r.PMNTN_RISK);
  if (r.PMNTN_CNRL || r.PMNTN_CLS) g.closed = true;
}

// 2) 이상치 제거 + 산정보 조인 + 난이도 계산
const courses = [];
const dropped = { zero: 0, outlier: 0 };
let seq = 0;

for (const g of group.values()) {
  const total = g.up + g.down;
  if (g.km <= 0 || total <= 0) {
    dropped.zero++;
    continue;
  }
  if (g.km > MAX_KM || total > MAX_MIN) {
    dropped.outlier++;
    continue;
  }

  const m = info.get(g.code);
  const img = imgBy.get(g.code);
  const score = g.km + g.up / 20;
  const difficulty =
    score < LEVEL_EASY ? "초심자" : score < LEVEL_MID ? "중급자" : "고수";

  courses.push({
    course_id: "PMNTN_" + String(++seq).padStart(5, "0"),
    mountain_code: g.code,
    mountain_name: g.mountain,
    mountain_height_m: m && Number(m.산높이) > 0 ? Number(m.산높이) : null,
    mountain_image_url: img ? IMG_BASE + img.이미지파일명 : null,
    course_name: g.course,
    region: regionOf(m),
    distance_km: Math.round(g.km * 10) / 10,
    difficulty,
    difficulty_score: Math.round(score * 10) / 10,
    up_min: g.up,
    down_min: g.down,
    terrain_type: terrainOf(g.terrain.join("/")),
    closed: g.closed,
    risk_note: g.risk[0] || "",
  });
}

fs.writeFileSync("data/courses.json", JSON.stringify(courses, null, 1));

// 3) 결과 리포트
const pct = (n) => Math.round((n / courses.length) * 100) + "%";
const count = (f) => courses.filter(f).length;
console.log("코스명 없어 제외한 구간 :", noName.toLocaleString());
console.log("거리/시간 0으로 제외    :", dropped.zero);
console.log("이상치로 제외           :", dropped.outlier);
console.log("");
console.log("=== courses.json 생성 완료:", courses.length.toLocaleString(), "개 코스 ===");
console.log("파일 크기:", (fs.statSync("data/courses.json").size / 1024 / 1024).toFixed(1) + "MB");
console.log("");
console.log("난이도 분포");
for (const d of ["초심자", "중급자", "고수"]) {
  const n = count((c) => c.difficulty === d);
  console.log("  " + d.padEnd(4), String(n).padStart(5), pct(n));
}
console.log("");
console.log("필드 채움률");
console.log("  높이      ", pct(count((c) => c.mountain_height_m)));
console.log("  사진      ", pct(count((c) => c.mountain_image_url)));
console.log("  지역      ", pct(count((c) => c.region)));
console.log("  지형타입  ", pct(count((c) => c.terrain_type)));
console.log("");
console.log("지역 상위 8곳");
const reg = {};
courses.forEach((c) => c.region && (reg[c.region] = (reg[c.region] || 0) + 1));
Object.entries(reg).sort((a, b) => b[1] - a[1]).slice(0, 8)
  .forEach(([k, v]) => console.log("  " + k.padEnd(9), v));
