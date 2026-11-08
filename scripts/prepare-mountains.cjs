// 산림청 원본에서 화면에 필요한 산 정보만 꺼내는 파일입니다.
// 실행: 프로젝트 폴더에서 node scripts/prepare-mountains.cjs
const fs = require('fs');
const path = require('path');
const projectFolder = path.join(__dirname, '..');
const sourcePath = path.join(projectFolder, 'data/산림관광_통합데이터.json');
const sourceText = fs.readFileSync(sourcePath, 'utf8');
const source = JSON.parse(sourceText);
const mountains = [];
const usedIds = new Set();

for (const row of source.mountain_info) {
  const mountainId = 'MT_' + row.산정보ID;
  if (usedIds.has(mountainId)) {
    throw new Error('산 ID가 중복됩니다: ' + mountainId);
  }
  usedIds.add(mountainId);

  // 이 원본은 필드 이름과 실제 내용이 다릅니다.
  // 실제 산 이름은 산정보개요내용, 주소는 산정보관리주체명에 있습니다.
  const name = row.산정보개요내용 || row.산국문명 || '이름 미상';
  const address = row.산정보관리주체명 || null;
  let region = null;
  if (address) {
    region = address.trim().split(/\s+/)[0];
  }

  let height = null;
  if (Number(row.산높이) > 0) {
    height = Number(row.산높이);
  }

  mountains.push({
    course_id: mountainId,
    mountain_code: String(row.산정보ID),
    mountain_name: name,
    course_name: name,
    address: address,
    region: region,
    mountain_height_m: height
  });
  // 원본에 없는 거리·난이도·시간·위경도는 추가하지 않습니다.
}

const outputPath = path.join(projectFolder, 'data/mountains.json');
fs.writeFileSync(outputPath, JSON.stringify(mountains, null, 2));
console.log(mountains.length + '개 산 정보를 저장했습니다.');
