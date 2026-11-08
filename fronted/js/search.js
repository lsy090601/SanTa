let allCourses = [];

// 검색어 가져오기
const params = new URLSearchParams(location.search);
const search = params.get("search") || ""; // "red"

const searchInput = document.querySelector(".search-box__input");
searchInput.value = search;

async function renderSearch() {
  //데이터 가져오기
  const courses = await loadCourses();
  allCourses = courses;

  //검색어가 있는 경우
  if (search) {
    const result = allCourses.filter(
      (course) =>
        course.산이름.includes(search) || course.코스이름.includes(search),
    );
    render(result);
  } else {
    render(allCourses);
  }
}
renderSearch();

//슬라이더
const slider = document.querySelector("#length");

//글자
const slideText = document.querySelector(".filter__range-value");

slider.addEventListener("input", () => {
  if (slider.value === "10") {
    slideText.textContent = "10km 이상";
  } else {
    slideText.textContent = "최대 " + slider.value + "km";
  }
});

//버튼 동작 확인
const filterForm = document.querySelector("#filter-form");

filterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const keyWord = searchInput.value.trim();

  // 난이도 필터 적용
  const levels = [];
  if (document.querySelector("#level-easy").checked) levels.push("쉬움");
  if (document.querySelector("#level-medium").checked) levels.push("중간");
  if (document.querySelector("#level-hard").checked) levels.push("어려움");

  // 길이 필터 적용
  const maxLength = Number(slider.value);

  // 시간 필터 적용
  let minTime = 0;
  let maxTime = Infinity;
  if (document.querySelector("#time-1").checked) {
    minTime = 0;
    maxTime = 60;
  }
  if (document.querySelector("#time-2").checked) {
    ((minTime = 60), (maxTime = 120));
  }
  if (document.querySelector("#time-3").checked) {
    minTime = 120;
    maxTime = 180;
  }
  if (document.querySelector("#time-4").checked) {
    minTime = 180;
    maxTime = Infinity;
  }

  const result = allCourses.filter((course) => {
    const totalTime = course.상행소요시간 + course.하행소요시간;

    return (
      (levels.length === 0 || levels.includes(course.난이도)) &&
      (maxLength === 10 || course.코스총거리 <= maxLength) &&
      totalTime < maxTime &&
      totalTime >= minTime &&
      (course.산이름.includes(keyWord) || course.코스이름.includes(keyWord))
    );
  });

  render(result);

  console.log({ keyWord, levels, maxLength, minTime, maxTime }, result.length);
});

// 카드 그리기
function render(list) {
  const cardResult = list.slice(0, 20).map((course) => {
    return createCard(course, true);
  });

  const cardList = document.querySelector(".result__list");
  cardList.innerHTML = cardResult.join("");

  const resultCount = document.querySelector(".result__count");
  resultCount.textContent = list.length;

  const emptyResult = document.querySelector(".result__empty");
  if (list.length === 0) {
    emptyResult.hidden = false;
  } else {
    emptyResult.hidden = true; //숨기기
  }
}

// 검색 기능 초기화
filterForm.addEventListener("reset", () => {
  slideText.textContent = "10km 이상";
  render(allCourses);
});
