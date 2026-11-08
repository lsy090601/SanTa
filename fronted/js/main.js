async function getCourses() {
  // 데이터 받기
  const courses = await loadCourses();

  // 난이도 필터
  const filteredLevel = courses.filter((course) => {
    return course.난이도 === "쉬움";
  });

  // 정렬
  const sortedData = filteredLevel.sort((a, b) => {
    const aTime = a.상행소요시간 + a.하행소요시간;
    const bTime = b.상행소요시간 + b.하행소요시간;

    return aTime - bTime;
  });

  // 자르기
  const cuttedData = sortedData.slice(0, 3);

  // 카드 그리기
  const cardResult = cuttedData.map((course) => {
    return createCard(course);
  });

  const cardList = document.querySelector(".recommend__list");
  cardList.innerHTML = cardResult.join("");
}

getCourses();

//card 만들기
/*
1. 난이도 쉬움만 건지기
2. 정렬 : 총 소요 시간 짧은 순
3. 앞에 3개만 자르기
4. 코스 1개 카드 html로 바꾸기
5. ul.recommend_list에 넣기
*/
