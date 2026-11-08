async function renderSearch() {
  //데이터 가져오기
  const courses = await loadCourses();
  const slicedCourse = courses.slice(0, 20);

  // 카드 그리기
  const cardResult = slicedCourse.map((course) => {
    return createCard(course, true);
  });

  const cardList = document.querySelector(".result__list");
  cardList.innerHTML = cardResult.join("");

  const resultCount = document.querySelector(".rsult__count");
  resultCount.textContent = slicedCourse.length;
}
renderSearch();
