let allCourses = [];

async function renderSearch() {
  //데이터 가져오기
  const courses = await loadCourses();
  allCourses = courses;

  render(allCourses);
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

  // 난이도 필터 적용
  const levels = [];
  if (document.querySelector("#level-easy").checked) levels.push("쉬움");
  if (document.querySelector("#level-medium").checked) levels.push("중간");
  if (document.querySelector("#level-hard").checked) levels.push("어려움");

  // 길이 필터 적용
  maxLength = Number(slider.value);

  const result = allCourses.filter(
    (course) =>
      levels.includes(course.난이도) &&
      (maxLength === 10 || course.코스총거리.toFixed(1) <= maxLength),
  );
  render(result);

  console.log("로그인 버튼 눌림");
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
}
