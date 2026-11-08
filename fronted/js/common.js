// 데이터의 난이도 이름 → 화면에서 쓰는 이름
const levelName = {
  초심자: "쉬움",
  중급자: "중간",
  고수: "어려움",
};

async function loadCourses() {
  //데이터 가져오기
  const response = await fetch("../data/courses.json");
  const data = await response.json();

  // 새 데이터의 영어 이름 → 기존 코드의 한글 이름으로 바꾸기
  const converted = data.map((course) => ({
    id: course.course_id,
    course_id: course.course_id,
    산ID: course.mountain_code,
    산이름: course.mountain_name,
    산높이: course.mountain_height_m,
    코스이름: course.course_name,
    코스총거리: course.distance_km,
    난이도: levelName[course.difficulty] || course.difficulty,
    상행소요시간: course.up_min,
    하행소요시간: course.down_min,
    지역: course.region,
    통제: course.closed,
  }));

  //데이터 정제
  const filteredData = converted.filter((course) => {
    const time = course.상행소요시간 + course.하행소요시간;
    return Number(course.산높이) && course.코스총거리 >= 1 && time > 0;
  });

  // 상세 페이지(detail.html)가 쓰는 코스 ID를 붙임
  // 산ID + 코스이름이 같은 코스를 data/courses.json 에서 찾아 연결하고,
  // 찾지 못하면(코스 이름이 비어 있는 경우 등) 산 정보 페이지(MT_산ID)로 보냄
  const detailIds = await loadDetailIds();
  filteredData.forEach((course) => {
    course.상세ID =
      detailIds.get(`${course.산ID}|${course.코스이름}`) || `MT_${course.산ID}`;
  });

  return filteredData;
}

// "산ID|코스이름" → course_id 대응표 만들기
async function loadDetailIds() {
  const ids = new Map();
  try {
    const response = await fetch("../data/courses.json");
    const courses = await response.json();
    courses.forEach((course) => {
      ids.set(
        `${course.mountain_code}|${course.course_name}`,
        course.course_id,
      );
    });
  } catch (error) {
    // 대응표를 못 불러와도 검색은 계속 쓸 수 있게 함 (모든 링크가 산 정보로 연결됨)
    console.error("상세 페이지 연결 정보를 불러오지 못했어요.", error);
  }
  return ids;
}

// 상세 페이지 주소
const detailUrl = (course) => {
  return `../detail.html?id=${encodeURIComponent(course.상세ID)}`;
};

// 거리 단위 바꾸기
const distance = (course) => {
  return `${course.코스총거리.toFixed(1)}km`;
};

// 분 → "1시간 20분" / "40분"
const formatMinutes = (minutes) => {
  const hour = Math.floor(minutes / 60);
  const min = minutes % 60;

  if (hour) {
    return `${hour}시간 ${min}분`;
  }

  return `${min}분`;
};

// 총 시간
const totalTime = (course) => {
  return formatMinutes(course.상행소요시간 + course.하행소요시간);
};

//카드만들기
const levelClass = {
  쉬움: "badge--easy",
  중간: "badge--medium",
  어려움: "badge--hard",
};

const createCard = (course, isRow) => {
  if (isRow) {
    return `<li>
              <article class="course-card course-card--row">
                <img
                  src="images/course-1.jpg"
                  alt="${course.산이름} 사진"
                  class="course-card__image"
                />
                <div class="course-card__body">
                  <p class="course-card__meta">${course.산이름}</p>
                  <h3 class="course-card__title">${course.코스이름}</h3>
                  <div class="course-card__badges">
                    <span class="badge ${levelClass[course.난이도]}">${course.난이도}</span>
                    <span class="badge">${distance(course)}</span>
                    <span class="badge"></span>
                  </div>
                  <p class="course-card__desc">
                    산 높이 ${course.산높이}m · 상행 ${formatMinutes(course.상행소요시간)} · 하행 ${formatMinutes(course.하행소요시간)}
                  </p>
                </div>
                <a href="${detailUrl(course)}" class="btn btn--outline course-card__link"
                  >자세히 보기</a
                >
              </article>
            </li>
  `;
  } else {
    return `<li>
              <article class="course-card">
                <img
                  src="images/course-1.jpg"
                  alt="${course.산이름} 사진"
                  class="course-card__image"
                />
                <div class="course-card__body">
                  <p class="course-card__meta">${course.산이름} · 높이 ${course.산높이}m</p>
                  <h3 class="course-card__title"><a href="${detailUrl(course)}">${course.코스이름}</a></h3>
                  <div class="course-card__badges">
                    <span class="badge ${levelClass[course.난이도]}">${course.난이도}</span>
                    <span class="badge">${distance(course)}</span>
                    <span class="badge">총 ${totalTime(course)}</span>
                  </div>
                  <p class="course-card__desc">
                    ${distance(course)}, 총 ${totalTime(course)}이면 다녀올 수 있어요.
                  </p>
                </div>
              </article>
            </li>
  `;
  }
};
