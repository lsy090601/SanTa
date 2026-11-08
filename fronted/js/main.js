let allCourses = [];

async function getCourses() {
  // 데이터 받기
  const courses = await loadCourses();
  allCourses = courses;

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

const searchInput = document.querySelector(".search-box__input");
const autoList = document.querySelector(".autocomplete");

searchInput.addEventListener("input", () => {
  const input = searchInput.value.trim();

  if (!input) {
    autoList.hidden = true;
    return;
  }

  const filteredCourses = allCourses
    .filter((course) => {
      return course.산이름.includes(input) || course.코스이름.includes(input);
    })
    .slice(0, 4);

  if (filteredCourses.length === 0) {
    autoList.hidden = true;
    return;
  }

  const tags = filteredCourses.map(
    (course) => `
  <li class="autocomplete__item">
    <a href="${detailUrl(course)}" class="autocomplete__link">
      <span class="autocomplete__icon" aria-hidden="true">
        <img src="images/icon-mountain.svg" alt="" />
      </span>
      <div>
        <strong class="autocomplete__name">${course.산이름} ${course.코스이름}</strong>
        <span class="autocomplete__meta">코스길이 ${distance(course)} ${course.지역}</span>
      </div>
    </a>
  </li>
`,
  );
  const tag = tags.join("");
  autoList.innerHTML = tag;
  autoList.hidden = false;
});

//----------------------hero
const slides = document.querySelectorAll(".hero__slide");
const dots = document.querySelectorAll(".hero__dot");
const pauseBtn = document.querySelector(".hero__pause");
let curr = 0;

function showSlide(index) {
  slides.forEach((slide) => slide.classList.remove("hero__slide--active"));
  dots.forEach((dot) => dot.classList.remove("hero__dot--active"));
  slides[index].classList.add("hero__slide--active");
  dots[index].classList.add("hero__dot--active");
  curr = index;
}

// 원하는 거 보여주기
dots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    showSlide(index);
  });
});

function startAuto() {
  timer = setInterval(() => {
    const nextSlide = (curr + 1) % slides.length;
    showSlide(nextSlide);
  }, 5000);
}

startAuto();

let isPlaying = true;

pauseBtn.addEventListener("click", () => {
  if (isPlaying) {
    // 재생 중이면 멈추기
    clearInterval(timer);
    isPlaying = false;
  } else {
    // 멈춰 있으면 다시 재생하기
    timer = setInterval(() => {
      showSlide((curr + 1) % slides.length);
    }, 3000);

    isPlaying = true;
  }
});

//card 만들기
/*
1. 난이도 쉬움만 건지기
2. 정렬 : 총 소요 시간 짧은 순
3. 앞에 3개만 자르기
4. 코스 1개 카드 html로 바꾸기
5. ul.recommend_list에 넣기
*/
