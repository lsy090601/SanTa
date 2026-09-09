const fs = require("fs"); //내장 모듈 가져오기
const rawText = fs.readFileSync("./TB_FGDI_WG_MT_WAY_ALL.json", "utf-8");
const geoJsonData = JSON.parse(rawText); //문자열 데이터 객체/배열로 변환

//console.log("전체 레코드 수 : ", geoJsonData.features.length);
console.log("geoJsonData.features[0] 출력 : ", geoJsonData.features[0]);
console.log(
  "geoJsonData.features[0].properties 출력 : ",
  geoJsonData.features[0].properties,
);

const 덕진동1가구간 = geoJsonData.features[0].properties;
console.log(
  "덕진동1가구간 산 이름, 난이도 : ",
  덕진동1가구간.MNTN_NM,
  " ",
  덕진동1가구간.PMNTN_DFFL,
);
// console.log(
//   "geoJsonData.features[0].properties.MNTN_NM 출력 : ",
//   geoJsonData.features[0].properties.MNTN_NM,
// );

//산 기준으로 데이터 가공
const groupedMNTN = geoJsonData.features.reduce((acc, feature) => {
  const mountainCode = feature.properties.MNTN_CODE;

  if (!acc[mountainCode]) {
    acc[mountainCode] = [];
  }
  acc[mountainCode].push(feature);

  return acc;
}, {});
console.log("산 그룹핑 : ", groupedMNTN);

//groupedMNTN 배열로 바꾸기
const mountainArray = Object.entries(groupedMNTN);
//console.log("산 개수 : ", mountainArray.length);
