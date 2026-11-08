async function loadCourses() {
  //데이터 가져오기
  const response = await fetch("data/hikingCourses.json");
  const data = await response.json();

  //데이터 정제
  const filteredData = data.filter((course) => {
    const time = course.상행소요시간 + course.하행소요시간;
    return Number(course.산높이) && course.코스총거리 >= 1 && time > 0;
  });

  return filteredData;
}

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
                    <span class="badge">흙산</span>
                  </div>
                  <p class="course-card__desc">
                    산 높이 ${course.산높이}m · 상행 ${formatMinutes(course.상행소요시간)} · 하행 ${formatMinutes(course.하행소요시간)}
                  </p>
                </div>
                <a href="#" class="btn btn--outline course-card__link">자세히 보기</a>
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
                  <h3 class="course-card__title">${course.코스이름}</h3>
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
