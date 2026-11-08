const fs = require("fs"); //내장 모듈 가져오기
const rawText = fs.readFileSync("./TB_FGDI_WG_MT_WAY_ALL.json", "utf-8");
const geoJsonData = JSON.parse(rawText); //문자열 데이터 객체/배열로 변환

//console.log("전체 레코드 수 : ", geoJsonData.features.length);
// console.log("geoJsonData.features[0] 출력 : ", geoJsonData.features[0]);
// console.log(
//   "geoJsonData.features[0].properties 출력 : ",
//   geoJsonData.features[0].properties,
// );

// const 덕진동1가구간 = geoJsonData.features[0].properties;
// console.log(
//   "덕진동1가구간 산 이름, 난이도 : ",
//   덕진동1가구간.MNTN_NM,
//   " ",
//   덕진동1가구간.PMNTN_DFFL,
// );

//산 코드(MNTN_CODE), 코스이름(PMNTN_NM) 기준으로 그룹핑
const groupedMNTN = geoJsonData.features.reduce((acc, feature) => {
  const key = feature.properties.MNTN_CODE + "_" + feature.properties.PMNTN_NM;

  if (!acc[key]) {
    acc[key] = [];
  }
  acc[key].push(feature);

  return acc;
}, {});
//console.log("산 그룹핑 : ", groupedMNTN);

//groupedMNTN 배열로 바꾸기
const mountainArray = Object.entries(groupedMNTN);
//console.log("산 개수 : ", mountainArray.length);

//-------------------------------------------------------------

const forestTourRaw = fs.readFileSync(
  "./data/산림관광_통합데이터.json",
  "utf-8",
);
const forestTourData = JSON.parse(forestTourRaw);

const hikingData = mountainArray.map(([key, segments]) => {
  // 코스 총거리 구하기
  const totalDistance = segments.reduce((sum, segment) => {
    return sum + segment.properties.PMNTN_LT;
  }, 0);

  const totalUp = segments.reduce((sum, segment) => {
    return sum + segment.properties.PMNTN_UPPL;
  }, 0);

  const totalDown = segments.reduce((sum, segment) => {
    return sum + segment.properties.PMNTN_GODN;
  }, 0);

  const matchedMtCode = forestTourData.mountain_info.find(
    (item) => item.산정보ID === segments[0].properties.MNTN_CODE,
  );

  return {
    산ID: segments[0].properties.MNTN_CODE,
    산이름: segments[0].properties.MNTN_NM,
    산높이: matchedMtCode ? matchedMtCode.산높이 : null,
    코스이름: segments[0].properties.PMNTN_NM,
    코스총거리: totalDistance,
    난이도: segments[0].properties.PMNTN_DFFL,
    상행소요시간: totalUp,
    하행소요시간: totalDown,
  };
});
console.log(hikingData[0]);

// 파일로 만들기
fs.writeFileSync("hikingCourses.json", JSON.stringify(hikingData, null, 2));
