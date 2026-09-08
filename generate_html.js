const fs = require("fs");

const data = JSON.parse(
  fs.readFileSync("./data/산림관광_통합데이터.json", "utf8"),
);
const mountains = data.mountain_info.slice(0, 10);

let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>산림관광 통합데이터</title>
</head>
<body>
`;

mountains.forEach((mountain, index) => {
  html += `산정보ID: ${mountain.산정보ID}, 산이름: ${mountain.산정보개요내용}, 산높이: ${mountain.산높이}m<br>\n`;
});

html += `</body>
</html>`;

fs.writeFileSync("./index.html", html);
console.log("HTML 파일이 생성되었습니다: ./index.html");
