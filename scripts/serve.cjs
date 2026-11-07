// 로컬에서 HTML과 JSON을 함께 열기 위한 간단한 웹 서버입니다.
// 실행: node scripts/serve.cjs
// 종료: 실행 중인 터미널에서 Ctrl+C
const http = require('http');
const fs = require('fs');
const path = require('path');
const projectFolder = path.resolve(__dirname, '..');

// 브라우저에 보내는 파일 종류를 알려 줍니다.
const fileTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

const server = http.createServer(function (request, response) {
  let requestedPath;
  try {
    const url = new URL(request.url, 'http://localhost');
    requestedPath = decodeURIComponent(url.pathname);
  } catch (error) {
    response.writeHead(400);
    response.end('잘못된 주소입니다.');
    return;
  }

  if (requestedPath === '/') {
    requestedPath = '/detail.html';
  }

  const filePath = path.resolve(projectFolder, '.' + requestedPath);
  const relativePath = path.relative(projectFolder, filePath);
  const folders = relativePath.split(path.sep);
  const hiddenFile = folders.some(function (folder) {
    return folder.startsWith('.');
  });

  // 프로젝트 밖의 파일, .git, 백업 원본, 서버 스크립트는 보내지 않습니다.
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath) ||
      hiddenFile || relativePath.startsWith('_backup') || folders[0] === 'scripts') {
    response.writeHead(403);
    response.end('접근할 수 없는 파일입니다.');
    return;
  }

  fs.readFile(filePath, function (error, contents) {
    if (error) {
      response.writeHead(404);
      response.end('파일을 찾을 수 없습니다.');
      return;
    }

    const extension = path.extname(filePath);
    const contentType = fileTypes[extension] || 'application/octet-stream';
    response.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store'
    });
    response.end(contents);
  });
});

// 같은 포트에서 서버를 두 번 실행하면 발생하는 오류를 안내합니다.
// 실행 중인 다른 프로그램을 임의로 종료하지 않습니다.
server.on('error', function (error) {
  if (error.code === 'EADDRINUSE') {
    console.log('8080 포트가 이미 사용 중입니다.');
    console.log('SanTa 서버를 이미 실행했다면 아래 주소를 그대로 여세요.');
    console.log('http://localhost:8080/detail.html');
    console.log('다른 프로그램이 사용 중이라면 그 프로그램을 확인해 주세요.');
  } else {
    console.error('서버 실행 실패:', error.message);
  }
  process.exitCode = 1;
});

// 내 컴퓨터에서만 접속할 수 있게 127.0.0.1로 실행합니다.
server.listen(8080, '127.0.0.1', function () {
  console.log('SanTa: http://localhost:8080/detail.html');
});
