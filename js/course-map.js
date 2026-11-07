// 카카오맵을 화면에 표시하는 파일입니다.
// 실행 순서: 지도 프로그램 불러오기 → 좌표 확인 → 지도 또는 검색 후보 표시

let kakaoLoadTask = null;

// 1. 카카오 지도 프로그램(SDK)을 불러옵니다.
// 인터넷에서 파일을 받는 동안 기다려야 하므로 Promise를 사용합니다.
function loadKakaoMap() {
  // 이미 불러오는 중이면 같은 작업이 끝나기를 기다립니다.
  if (kakaoLoadTask !== null) {
    return kakaoLoadTask;
  }

  kakaoLoadTask = new Promise(function (resolve, reject) {
    const key = window.SANTA_CONFIG.kakaoJavaScriptKey;

    if (key === '') {
      reject(new Error('지도를 보려면 config.js에 카카오 JavaScript 키를 입력해 주세요.'));
      return;
    }

    // 응답이 없을 때 계속 기다리지 않도록 12초 뒤 오류를 표시합니다.
    const timer = setTimeout(function () {
      reject(new Error('지도 응답이 지연됩니다. 키·도메인·네트워크를 확인해 주세요.'));
    }, 12000);

    const script = document.createElement('script');
    script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=';
    script.src += encodeURIComponent(key);
    script.src += '&autoload=false&libraries=services';
    // services는 산 이름을 검색할 때 필요한 기능입니다.

    script.onerror = function () {
      clearTimeout(timer);
      reject(new Error('지도 파일을 불러오지 못했습니다. 키·도메인·Kakao Map 사용 설정을 확인해 주세요.'));
    };

    script.onload = function () {
      if (!window.kakao || !window.kakao.maps) {
        clearTimeout(timer);
        reject(new Error('카카오 지도 인증에 실패했습니다.'));
        return;
      }

      kakao.maps.load(function () {
        clearTimeout(timer);
        resolve(); // 이제 지도를 사용할 준비가 끝났습니다.
      });
    };

    document.head.append(script);
  });

  // 실패하면 값을 비워서 '다시 시도' 버튼으로 재시도할 수 있게 합니다.
  kakaoLoadTask = kakaoLoadTask.catch(function (error) {
    kakaoLoadTask = null;
    throw error;
  });

  return kakaoLoadTask;
}

// 2. 현재 선택한 산이나 코스의 지도를 준비합니다.
async function showCourseMap(course) {
  const mapBox = document.getElementById('courseMap');
  const messageBox = document.getElementById('mapMessage');
  let map = null;
  let marker = null;

  // 안내 문구를 바꾸는 일을 여러 곳에서 하므로 함수로 만들었습니다.
  function showMessage(text) {
    messageBox.replaceChildren();
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    messageBox.append(paragraph);
  }

  // 3. 좌표를 받아 지도를 만들고 위치 표시(마커)를 올립니다.
  function showMarker(latitude, longitude, label) {
    const position = new kakao.maps.LatLng(latitude, longitude);

    if (map === null) {
      map = new kakao.maps.Map(mapBox, {
        center: position,
        level: 5
      });
    }

    if (marker !== null) {
      marker.setMap(null); // 이전에 선택한 마커를 지웁니다.
    }

    marker = new kakao.maps.Marker({
      position: position,
      map: map
    });
    map.setCenter(position);

    showMessage(label + ' · 실제 등산로 선이 아닌 위치 표시입니다.');

    const link = document.createElement('a');
    link.textContent = '카카오맵에서 보기';
    link.href = 'https://map.kakao.com/link/map/';
    link.href += encodeURIComponent(course.mountain_name);
    link.href += ',' + latitude + ',' + longitude;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    messageBox.append(link);

    showRouteButton(latitude, longitude);

    // PC에서는 왼쪽 패널이 마커를 가리지 않도록 중심을 조금 옮깁니다.
    if (window.matchMedia('(min-width: 901px)').matches) {
      map.panBy(-190, 0);
    }
  }

  // 길찾기 버튼: 누르면 내 위치에서 이 산까지 가는 방법을 카카오맵 페이지로 엽니다.
  // 버튼은 지도 위에 한 번만 만들고, 목적지가 바뀌면 좌표만 새로 저장합니다.
  let routeButton = null;
  let destination = null;

  function showRouteButton(latitude, longitude) {
    destination = { latitude: latitude, longitude: longitude };

    if (routeButton !== null) {
      return;
    }

    routeButton = document.createElement('button');
    routeButton.className = 'route-btn';
    routeButton.textContent = '길찾기';
    routeButton.onclick = openRoute;
    mapBox.append(routeButton);
  }

  function openRoute() {
    const target = destination.latitude + ',' + destination.longitude;
    const name = encodeURIComponent(course.mountain_name);
    // 출발지를 못 정했을 때: 도착지만 정해서 열면 카카오맵에서 출발지를 직접 입력합니다.
    const toOnlyUrl = 'https://map.kakao.com/link/to/' + name + ',' + target;

    // 위치를 기다리는 동안 팝업 차단이 되지 않도록 새 창을 먼저 엽니다.
    const tab = window.open('about:blank', '_blank');
    if (tab === null) {
      alert('팝업이 차단되어 있어요. 팝업을 허용한 뒤 다시 눌러 주세요.');
      return;
    }
    tab.opener = null;

    if (!navigator.geolocation) {
      tab.location.href = toOnlyUrl;
      return;
    }

    routeButton.disabled = true;
    routeButton.textContent = '내 위치 확인 중...';

    navigator.geolocation.getCurrentPosition(
      function (position) {
        const here = position.coords.latitude + ',' + position.coords.longitude;
        tab.location.href = 'https://map.kakao.com/link/from/'
          + encodeURIComponent('내 위치') + ',' + here
          + '/to/' + name + ',' + target;
        resetRouteButton();
      },
      function () {
        // 위치 권한을 거절했거나 위치를 못 찾은 경우입니다.
        tab.location.href = toOnlyUrl;
        resetRouteButton();
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }

  function resetRouteButton() {
    routeButton.disabled = false;
    routeButton.textContent = '길찾기';
  }

  // 4. 좌표가 없다면 지역과 산 이름으로 검색합니다.
  function searchMountain() {
    let query = course.mountain_name;
    if (course.region) {
      query = course.region + ' ' + course.mountain_name;
    }

    let address = '미제공';
    if (course.address) {
      address = course.address;
    }
    showMessage('저장된 좌표가 없습니다. 후보 주소를 확인하고 선택해 주세요. 원본 주소: ' + address);

    const places = new kakao.maps.services.Places();
    const timer = setTimeout(function () {
      showMessage('위치 검색 응답이 없습니다. 네트워크와 카카오 설정을 확인해 주세요.');
    }, 12000);

    places.keywordSearch(query, function (results, status) {
      clearTimeout(timer);

      // 검색 도중 다른 화면으로 이동했다면 더 이상 화면을 바꾸지 않습니다.
      if (!mapBox.isConnected) {
        return;
      }

      if (status !== kakao.maps.services.Status.OK || results.length === 0) {
        showMessage('위치 검색 결과가 없습니다. 산 이름과 지역을 확인해 주세요.');
        return;
      }

      // 이름이 같은 산이 있을 수 있어서 첫 결과를 자동 선택하지 않습니다.
      for (const place of results) {
        const button = document.createElement('button');
        let placeAddress = place.address_name;
        if (place.road_address_name) {
          placeAddress = place.road_address_name;
        }
        button.textContent = place.place_name + ' — ' + placeAddress;

        button.onclick = function () {
          // 카카오 검색 결과의 y는 위도, x는 경도입니다.
          showMarker(Number(place.y), Number(place.x),
            '선택한 위치: ' + place.place_name + ' / ' + place.address_name);
        };
        messageBox.append(button);
      }
    }, { size: 10 });
  }

  showMessage('지도를 불러오는 중...');

  try {
    await loadKakaoMap();

    if (!mapBox.isConnected) {
      return;
    }

    const latitude = Number(course.latitude);
    const longitude = Number(course.longitude);

    // 우리 데이터는 한국의 산이므로 한국 주변 범위의 위경도인지 확인합니다.
    // 값이 없거나 미터 단위의 다른 좌표계이면 검색으로 넘어갑니다.
    const hasCoordinates = course.latitude != null && course.longitude != null;
    const validLatitude = Number.isFinite(latitude) && latitude >= 33 && latitude <= 39.5;
    const validLongitude = Number.isFinite(longitude) && longitude >= 124 && longitude <= 132;

    if (hasCoordinates && validLatitude && validLongitude) {
      showMarker(latitude, longitude, '저장된 산 좌표');
    } else {
      searchMountain();
    }

    // 브라우저 크기가 바뀌면 카카오 지도 크기도 다시 계산합니다.
    const observer = new ResizeObserver(function () {
      if (map !== null) {
        const center = map.getCenter();
        map.relayout();
        map.setCenter(center);
      }
    });
    observer.observe(mapBox);
  } catch (error) {
    showMessage(error.message);

    const button = document.createElement('button');
    button.textContent = '지도 다시 시도';
    button.onclick = function () {
      showCourseMap(course);
    };
    messageBox.append(button);
  }
}
