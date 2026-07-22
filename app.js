// ======================================================
// Study Planner
// app.js
// ======================================================


// ======================================================
// Supabase
// ======================================================

const SUPABASE_URL =
    "https://wgailyvwmeqwspiaicak.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_rui7M4DzueEiEKj-Ab5YcA_ueQwfYCW";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


// ======================================================
// 1. 앱 상태
// ======================================================

let currentDate = new Date();

let currentView = "day";

let currentUser =
    localStorage.getItem("studyPlannerUser") || null;


// 통계 기간
// day   = 일간
// week  = 주간
// month = 월간
let statisticsPeriod = "week";


// ======================================================
// 2. 데이터
// ======================================================

let plans = [];

let ddays = [];


// ======================================================
// 3. HTML 요소
// ======================================================

const loginPage =
    document.getElementById("login-page");

const appPage =
    document.getElementById("app-page");

const loginForm =
    document.getElementById("login-form");

const signupButton =
    document.getElementById("signup-button");

const logoutButton =
    document.getElementById("logout-button");

const loginMessage =
    document.getElementById("login-message");

const previousDateButton =
    document.getElementById("previous-date");

const nextDateButton =
    document.getElementById("next-date");

const todayButton =
    document.getElementById("today-button");

const currentDateElement =
    document.getElementById("current-date");

const planner =
    document.getElementById("planner");

const planForm =
    document.getElementById("plan-form");

const ddayForm =
    document.getElementById("dday-form");

const ddayList =
    document.getElementById("dday-list");

const darkModeButton =
    document.getElementById("dark-mode-button");

const pdfButton =
    document.getElementById("pdf-button");

const copyModal =
    document.getElementById("copy-modal");

const closeCopyModal =
    document.getElementById("close-copy-modal");

const confirmCopyButton =
    document.getElementById("confirm-copy-button");

const copyTargetDate =
    document.getElementById("copy-target-date");

const totalPlansElement =
    document.getElementById("total-plans");

const completedPlansElement =
    document.getElementById("completed-plans");

const studyTimeElement =
    document.getElementById("study-time");

const achievementElement =
    document.getElementById("achievement");

const viewButtons =
    document.querySelectorAll(".view-button");

let copyingPlanId = null;


// ======================================================
// 4. 날짜 함수
// ======================================================

function formatDateKey(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return (
        year +
        "-" +
        month +
        "-" +
        day
    );

}


function parseDate(dateString) {

    const parts =
        dateString.split("-");

    return new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );

}


function formatKoreanDate(date) {

    const days = [

        "일요일",
        "월요일",
        "화요일",
        "수요일",
        "목요일",
        "금요일",
        "토요일"

    ];

    return (

        date.getFullYear() +
        "년 " +

        (date.getMonth() + 1) +
        "월 " +

        date.getDate() +
        "일 " +

        days[date.getDay()]

    );

}


// ======================================================
// 5. Supabase 데이터 불러오기
// ======================================================

async function loadData() {

    if (!currentUser) {

        plans = [];

        ddays = [];

        return;

    }


    const {
        data: userData
    } =
        await supabaseClient
            .auth
            .getUser();


    if (
        !userData ||
        !userData.user
    ) {

        return;

    }


    const userId =
        userData.user.id;


    // ==================================================
    // 공부 계획 불러오기
    // ==================================================

    const {
        data: planData,
        error: planError
    } =
        await supabaseClient

            .from("plans")

            .select("*")

            .eq(
                "user_id",
                userId
            )

            .order(
                "date",
                {
                    ascending: true
                }
            );


    if (planError) {

        console.error(
            "계획 불러오기 실패:",
            planError
        );

        return;

    }


    // ==================================================
    // D-Day 불러오기
    // ==================================================

    const {
        data: ddayData,
        error: ddayError
    } =
        await supabaseClient

            .from("ddays")

            .select("*")

            .eq(
                "user_id",
                userId
            )

            .order(
                "date",
                {
                    ascending: true
                }
            );


    if (ddayError) {

        console.error(
            "D-Day 불러오기 실패:",
            ddayError
        );

        return;

    }


    // ==================================================
    // 데이터 변환
    // ==================================================

    plans =
        (planData || []).map(

            function(plan) {

                return {

                    id:
                        plan.id,

                    user:
                        currentUser,

                    date:
                        plan.date,

                    subject:
                        plan.subject,

                    detail:
                        plan.detail || "",

                    start:
                        plan.start_time || "",

                    end:
                        plan.end_time || "",

                    completed:
                        plan.completed

                };

            }

        );


    ddays =
        (ddayData || []).map(

            function(dday) {

                return {

                    id:
                        dday.id,

                    user:
                        currentUser,

                    title:
                        dday.title,

                    date:
                        dday.date

                };

            }

        );

}


// ======================================================
// 6. 로그인
// ======================================================

loginForm.addEventListener(

    "submit",

    async function(event) {

        event.preventDefault();


        const email =
            document
                .getElementById("email")
                .value
                .trim();


        const password =
            document
                .getElementById("password")
                .value
                .trim();


        if (
            email === "" ||
            password === ""
        ) {

            loginMessage.textContent =
                "이메일과 비밀번호를 입력해주세요.";

            return;

        }


        loginMessage.textContent =
            "로그인 중...";


        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .signInWithPassword({

                    email:
                        email,

                    password:
                        password

                });


        if (error) {

            console.error(error);

            loginMessage.textContent =
                "로그인 실패: " +
                error.message;

            return;

        }


        currentUser =
            data.user.email;


        localStorage.setItem(
            "studyPlannerUser",
            currentUser
        );


        loginMessage.textContent =
            "";


        await loadData();


        showApp();

    }

);


// ======================================================
// 7. 회원가입
// ======================================================

signupButton.addEventListener(

    "click",

    async function() {

        const email =
            document
                .getElementById("email")
                .value
                .trim();


        const password =
            document
                .getElementById("password")
                .value
                .trim();


        if (
            email === "" ||
            password === ""
        ) {

            loginMessage.textContent =
                "이메일과 비밀번호를 먼저 입력해주세요.";

            return;

        }


        if (
            password.length < 6
        ) {

            loginMessage.textContent =
                "비밀번호는 6자 이상이어야 합니다.";

            return;

        }


        loginMessage.textContent =
            "회원가입 중...";


        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .signUp({

                    email:
                        email,

                    password:
                        password

                });


        if (error) {

            console.error(error);

            loginMessage.textContent =
                "회원가입 실패: " +
                error.message;

            return;

        }


        if (
            data.user &&
            !data.session
        ) {

            loginMessage.textContent =
                "회원가입 완료! 이메일을 확인해주세요.";

            return;

        }


        if (
            data.user &&
            data.session
        ) {

            currentUser =
                data.user.email;


            localStorage.setItem(
                "studyPlannerUser",
                currentUser
            );


            await loadData();


            loginMessage.textContent =
                "";


            showApp();

        }

    }

);


// ======================================================
// 8. 로그아웃
// ======================================================

logoutButton.addEventListener(

    "click",

    async function() {

        const {
            error
        } =
            await supabaseClient
                .auth
                .signOut();


        if (error) {

            console.error(error);

            return;

        }


        currentUser =
            null;

        plans = [];

        ddays = [];


        localStorage.removeItem(
            "studyPlannerUser"
        );


        showLogin();

    }

);


// ======================================================
// 9. 로그인 화면
// ======================================================

function showLogin() {

    loginPage
        .classList
        .remove("hidden");


    appPage
        .classList
        .add("hidden");

}


// ======================================================
// 10. 메인 화면
// ======================================================

function showApp() {

    loginPage
        .classList
        .add("hidden");


    appPage
        .classList
        .remove("hidden");


    renderAll();

}


// ======================================================
// 11. 이전 날짜
// ======================================================

previousDateButton.addEventListener(

    "click",

    function() {

        if (
            currentView === "day"
        ) {

            currentDate.setDate(

                currentDate.getDate() - 1

            );

        }

        else if (
            currentView === "week"
        ) {

            currentDate.setDate(

                currentDate.getDate() - 7

            );

        }

        else {

            currentDate.setMonth(

                currentDate.getMonth() - 1

            );

        }


        renderAll();

    }

);


// ======================================================
// 12. 다음 날짜
// ======================================================

nextDateButton.addEventListener(

    "click",

    function() {

        if (
            currentView === "day"
        ) {

            currentDate.setDate(

                currentDate.getDate() + 1

            );

        }

        else if (
            currentView === "week"
        ) {

            currentDate.setDate(

                currentDate.getDate() + 7

            );

        }

        else {

            currentDate.setMonth(

                currentDate.getMonth() + 1

            );

        }


        renderAll();

    }

);


// ======================================================
// 13. 오늘
// ======================================================

todayButton.addEventListener(

    "click",

    function() {

        currentDate =
            new Date();


        renderAll();

    }

);


// ======================================================
// 14. 일간 / 주간 / 월간 보기
// ======================================================

viewButtons.forEach(

    function(button) {

        button.addEventListener(

            "click",

            function() {

                currentView =
                    button.dataset.view;


                updateViewButtons();


                renderAll();

            }

        );

    }

);


// ======================================================
// 15. 계획 추가
// ======================================================

planForm.addEventListener(

    "submit",

    async function(event) {

        event.preventDefault();


        const subject =
            document
                .getElementById("plan-subject")
                .value
                .trim();


        const detail =
            document
                .getElementById("plan-detail")
                .value
                .trim();


        const start =
            document
                .getElementById("plan-start")
                .value;


        const end =
            document
                .getElementById("plan-end")
                .value;


        if (
            subject === ""
        ) {

            alert(
                "과목을 입력해주세요."
            );

            return;

        }


        const {
            data: userData
        } =
            await supabaseClient
                .auth
                .getUser();


        if (
            !userData ||
            !userData.user
        ) {

            alert(
                "로그인 정보가 없습니다."
            );

            return;

        }


        const {
            error
        } =
            await supabaseClient

                .from("plans")

                .insert({

                    id:
                        Date.now(),

                    user_id:
                        userData.user.id,

                    date:
                        formatDateKey(
                            currentDate
                        ),

                    subject:
                        subject,

                    detail:
                        detail,

                    start_time:
                        start || null,

                    end_time:
                        end || null,

                    completed:
                        false

                });


        if (error) {

            console.error(error);

            alert(
                "계획 저장에 실패했습니다."
            );

            return;

        }


        await loadData();


        planForm.reset();


        renderAll();

    }

);


// ======================================================
// 16. 계획 완료
// ======================================================

async function togglePlan(id) {

    const plan =
        plans.find(

            function(item) {

                return (

                    item.id === id &&

                    item.user === currentUser

                );

            }

        );


    if (!plan) {

        return;

    }


    const {
        error
    } =
        await supabaseClient

            .from("plans")

            .update({

                completed:
                    !plan.completed

            })

            .eq(
                "id",
                id
            );


    if (error) {

        console.error(error);

        alert(
            "계획 수정에 실패했습니다."
        );

        return;

    }


    await loadData();


    renderAll();

}


// ======================================================
// 17. 계획 삭제
// ======================================================

async function deletePlan(id) {

    const {
        error
    } =
        await supabaseClient

            .from("plans")

            .delete()

            .eq(
                "id",
                id
            );


    if (error) {

        console.error(error);

        alert(
            "계획 삭제에 실패했습니다."
        );

        return;

    }


    await loadData();


    renderAll();

}


// ======================================================
// 18. 계획 복사 모달
// ======================================================

function copyPlan(id) {

    const original =
        plans.find(

            function(plan) {

                return (

                    plan.id === id &&

                    plan.user === currentUser

                );

            }

        );


    if (!original) {

        return;

    }


    copyingPlanId =
        id;


    copyTargetDate.value =
        "";


    copyModal
        .classList
        .remove("hidden");

}


// ======================================================
// 19. 계획 카드
// ======================================================

function createPlanCard(plan) {

    const card =
        document.createElement("div");

    card.className =
        "plan-card";


    if (
        plan.completed
    ) {

        card.classList.add("completed");

    }


    const time =
        document.createElement("div");

    time.className =
        "plan-time";

    time.textContent =

        (plan.start || "--:--") +
        " ~ " +
        (plan.end || "--:--");


    const content =
        document.createElement("div");

    content.className =
        "plan-content";


    const title =
        document.createElement("h3");

    title.textContent =
        plan.subject;


    const detail =
        document.createElement("p");

    detail.textContent =

        plan.detail ||
        "세부 내용 없음";


    content.appendChild(title);

    content.appendChild(detail);


    const actions =
        document.createElement("div");

    actions.className =
        "plan-actions";


    const completeButton =
        document.createElement("button");

    completeButton.textContent =

        plan.completed
            ? "↩️"
            : "✅";

    completeButton.title =
        "완료";


    completeButton.onclick =
        function() {

            togglePlan(plan.id);

        };


    const editButton =
        document.createElement("button");

    editButton.textContent =
        "✏️";

    editButton.title =
        "계획 수정";


    editButton.onclick =
        function() {

            editPlan(plan.id);

        };


    const copyButton =
        document.createElement("button");

    copyButton.textContent =
        "📋";

    copyButton.title =
        "다른 날짜로 복사";


    copyButton.onclick =
        function() {

            copyPlan(plan.id);

        };


    const deleteButton =
        document.createElement("button");

    deleteButton.textContent =
        "🗑️";

    deleteButton.title =
        "삭제";


    deleteButton.onclick =
        function() {

            deletePlan(plan.id);

        };


    actions.appendChild(
        completeButton
    );

    actions.appendChild(
        editButton
    );

    actions.appendChild(
        copyButton
    );

    actions.appendChild(
        deleteButton
    );


    card.appendChild(time);

    card.appendChild(content);

    card.appendChild(actions);


    return card;

}


// ======================================================
// 20. 일간 보기
// ======================================================

function renderDay() {

    const dateKey =
        formatDateKey(currentDate);


    const todayPlans =
        plans.filter(

            function(plan) {

                return (

                    plan.user === currentUser &&

                    plan.date === dateKey

                );

            }

        );


    todayPlans.sort(

        function(a, b) {

            return (

                (a.start || "")
                    .localeCompare(
                        b.start || ""
                    )

            );

        }

    );


    if (
        todayPlans.length === 0
    ) {

        planner.innerHTML =

            "<div class='empty-plan'>" +

            "<div class='empty-icon'>📚</div>" +

            "<h3>오늘의 계획이 없습니다.</h3>" +

            "<p>위에서 공부 계획을 추가해보세요.</p>" +

            "</div>";

        return;

    }


    todayPlans.forEach(

        function(plan) {

            planner.appendChild(

                createPlanCard(plan)

            );

        }

    );

}


// ======================================================
// 21. 주간 보기
// ======================================================

function getMonday(date) {

    const result =
        new Date(date);


    const day =
        result.getDay();


    const difference =

        day === 0

            ? -6

            : 1 - day;


    result.setDate(

        result.getDate() +
        difference

    );


    return result;

}


function renderWeek() {

    const monday =
        getMonday(currentDate);


    const grid =
        document.createElement("div");

    grid.className =
        "week-grid";


    const dayNames = [

        "월요일",
        "화요일",
        "수요일",
        "목요일",
        "금요일",
        "토요일",
        "일요일"

    ];


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const date =
            new Date(monday);


        date.setDate(

            monday.getDate() +
            i

        );


        const dateKey =
            formatDateKey(date);


        const dayBox =
            document.createElement("div");

        dayBox.className =
            "week-day";


        const header =
            document.createElement("div");

        header.className =
            "week-day-header";


        header.textContent =

            dayNames[i] +
            " " +
            (date.getMonth() + 1) +
            "/" +
            date.getDate();


        dayBox.appendChild(header);


        const dayPlans =
            plans.filter(

                function(plan) {

                    return (

                        plan.user === currentUser &&

                        plan.date === dateKey

                    );

                }

            );


        dayPlans.forEach(

            function(plan) {

                const item =
                    document.createElement("div");


                item.className =
                    "week-plan";


                if (
                    plan.completed
                ) {

                    item.classList.add("completed");

                }


                item.textContent =

                    (

                        plan.start

                            ? plan.start + " "

                            : ""

                    ) +

                    plan.subject;


                item.onclick =
                    function() {

                        currentDate =
                            new Date(date);


                        currentView =
                            "day";


                        updateViewButtons();


                        renderAll();

                    };


                dayBox.appendChild(item);

            }

        );


        if (
            dayPlans.length === 0
        ) {

            const empty =
                document.createElement("span");


            empty.className =
                "no-plan";


            empty.textContent =
                "계획 없음";


            dayBox.appendChild(empty);

        }


        grid.appendChild(dayBox);

    }


    planner.appendChild(grid);

}


// ======================================================
// 22. 월간 보기
// ======================================================

function renderMonth() {

    const year =
        currentDate.getFullYear();


    const month =
        currentDate.getMonth();


    const firstDay =
        new Date(
            year,
            month,
            1
        );


    const lastDay =
        new Date(
            year,
            month + 1,
            0
        );


    const calendar =
        document.createElement("div");

    calendar.className =
        "month-calendar";


    const weekdays = [

        "일",
        "월",
        "화",
        "수",
        "목",
        "금",
        "토"

    ];


    const weekdayRow =
        document.createElement("div");

    weekdayRow.className =
        "month-weekdays";


    weekdays.forEach(

        function(day) {

            const element =
                document.createElement("span");


            element.textContent =
                day;


            weekdayRow.appendChild(element);

        }

    );


    calendar.appendChild(weekdayRow);


    const daysContainer =
        document.createElement("div");

    daysContainer.className =
        "month-days";


    for (
        let i = 0;
        i < firstDay.getDay();
        i++
    ) {

        const empty =
            document.createElement("div");


        empty.className =
            "month-day empty-day";


        daysContainer.appendChild(empty);

    }


    for (
        let day = 1;
        day <= lastDay.getDate();
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );


        const dateKey =
            formatDateKey(date);


        const box =
            document.createElement("div");

        box.className =
            "month-day";


        const number =
            document.createElement("div");

        number.className =
            "month-day-number";


        number.textContent =
            day;


        box.appendChild(number);


        const dayPlans =
            plans.filter(

                function(plan) {

                    return (

                        plan.user === currentUser &&

                        plan.date === dateKey

                    );

                }

            );


        dayPlans
            .slice(0, 3)
            .forEach(

                function(plan) {

                    const item =
                        document.createElement("div");


                    item.className =
                        "month-plan";


                    item.textContent =
                        plan.subject;


                    box.appendChild(item);

                }

            );


        box.onclick =
            function() {

                currentDate =
                    new Date(date);


                currentView =
                    "day";


                updateViewButtons();


                renderAll();

            };


        daysContainer.appendChild(box);

    }


    calendar.appendChild(daysContainer);


    planner.appendChild(calendar);

}


// ======================================================
// 23. D-Day 추가
// ======================================================

ddayForm.addEventListener(

    "submit",

    async function(event) {

        event.preventDefault();


        const title =
            document
                .getElementById("dday-title")
                .value
                .trim();


        const date =
            document
                .getElementById("dday-date")
                .value;


        if (
            title === "" ||
            date === ""
        ) {

            return;

        }


        const {
            data: userData
        } =
            await supabaseClient
                .auth
                .getUser();


        if (
            !userData ||
            !userData.user
        ) {

            alert(
                "로그인 정보가 없습니다."
            );

            return;

        }


        const {
            error
        } =
            await supabaseClient

                .from("ddays")

                .insert({

                    id:
                        Date.now(),

                    user_id:
                        userData.user.id,

                    title:
                        title,

                    date:
                        date

                });


        if (error) {

            console.error(
                "D-Day 저장 실패:",
                error
            );

            alert(
                "D-Day 저장에 실패했습니다."
            );

            return;

        }


        await loadData();


        ddayForm.reset();


        renderDDays();

    }

);


// ======================================================
// 24. D-Day 렌더링
// ======================================================

function renderDDays() {

    ddayList.innerHTML =
        "";


    const userDDays =
        ddays.filter(

            function(dday) {

                return (

                    dday.user === currentUser

                );

            }

        );


    userDDays.sort(

        function(a, b) {

            return (

                a.date.localeCompare(
                    b.date
                )

            );

        }

    );


    userDDays.forEach(

        function(dday) {

            const today =
                new Date();


            today.setHours(
                0,
                0,
                0,
                0
            );


            const target =
                parseDate(dday.date);


            const difference =

                Math.ceil(

                    (

                        target.getTime() -
                        today.getTime()

                    )
                    /
                    86400000

                );


            let text;


            if (
                difference > 0
            ) {

                text =
                    "D-" +
                    difference;

            }

            else if (
                difference === 0
            ) {

                text =
                    "D-DAY";

            }

            else {

                text =
                    "D+" +
                    Math.abs(difference);

            }


            const item =
                document.createElement("div");


            item.className =
                "dday-item";


            item.innerHTML =

                "<div>" +

                "<strong>" +

                dday.title +

                "</strong>" +

                "<small>" +

                dday.date +

                "</small>" +

                "</div>" +

                "<div class='dday-actions'>" +

                "<strong>" +

                text +

                "</strong>" +

                "<button class='dday-delete-button'>" +

                "🗑️" +

                "</button>" +

                "</div>";


            const deleteButton =
                item.querySelector(
                    ".dday-delete-button"
                );


            deleteButton.onclick =
                async function() {

                    const confirmed =
                        confirm(

                            "'" +
                            dday.title +
                            "' D-Day를 삭제할까요?"

                        );


                    if (
                        !confirmed
                    ) {

                        return;

                    }


                    const {
                        error
                    } =
                        await supabaseClient

                            .from("ddays")

                            .delete()

                            .eq(
                                "id",
                                dday.id
                            );


                    if (error) {

                        console.error(

                            "D-Day 삭제 실패:",

                            error

                        );


                        alert(

                            "D-Day 삭제에 실패했습니다."

                        );


                        return;

                    }


                    await loadData();


                    renderAll();

                };


            ddayList.appendChild(item);

        }

    );

}


// ======================================================
// 25. 시간 계산 함수
// ======================================================

function getPlanMinutes(plan) {

    if (
        !plan.start ||
        !plan.end
    ) {

        return 0;

    }


    const start =
        plan.start.split(":");


    const end =
        plan.end.split(":");


    const startMinutes =

        Number(start[0]) * 60 +
        Number(start[1]);


    const endMinutes =

        Number(end[0]) * 60 +
        Number(end[1]);


    let duration =

        endMinutes -
        startMinutes;


    // ==================================================
    // 자정 넘김 처리
    //
    // 예:
    // 23:00 → 01:00
    // 01:00 - 23:00 = -1320
    // -1320 + 1440 = 120분
    //
    // 결과: 2시간
    // ==================================================

    if (
        duration < 0
    ) {

        duration += 24 * 60;

    }


    return duration;

}

// ======================================================
// 26. 날짜 범위 계산
// ======================================================

function getStatisticsRange() {

    const start =
        new Date(currentDate);


    const end =
        new Date(currentDate);


    if (
        statisticsPeriod === "day"
    ) {

        return {

            start:
                formatDateKey(start),

            end:
                formatDateKey(end)

        };

    }


    if (
        statisticsPeriod === "week"
    ) {

        const monday =
            getMonday(currentDate);


        const sunday =
            new Date(monday);


        sunday.setDate(
            monday.getDate() + 6
        );


        return {

            start:
                formatDateKey(monday),

            end:
                formatDateKey(sunday)

        };

    }


    if (
        statisticsPeriod === "month"
    ) {

        const firstDay =
            new Date(

                currentDate.getFullYear(),

                currentDate.getMonth(),

                1

            );


        const lastDay =
            new Date(

                currentDate.getFullYear(),

                currentDate.getMonth() + 1,

                0

            );


        return {

            start:
                formatDateKey(firstDay),

            end:
                formatDateKey(lastDay)

        };

    }

}


// ======================================================
// 27. 선택 기간 통계 계획
// ======================================================

function getStatisticsPlans() {

    const range =
        getStatisticsRange();


    return plans.filter(

        function(plan) {

            return (

                plan.user === currentUser &&

                plan.date >= range.start &&

                plan.date <= range.end

            );

        }

    );

}


// ======================================================
// 28. 통계 기간 버튼 생성
// ======================================================

function renderStatisticsPeriodButtons() {

    const statisticsSection =
        document.querySelector(
            ".statistics-section"
        );


    if (!statisticsSection) {

        return;

    }


    let periodContainer =
        document.getElementById(
            "statistics-period-buttons"
        );


    if (!periodContainer) {

        periodContainer =
            document.createElement("div");


        periodContainer.id =
            "statistics-period-buttons";


        periodContainer.className =
            "statistics-period-buttons";


        const statisticsTitle =
            statisticsSection.querySelector(
                "h2"
            );


        if (
            statisticsTitle
        ) {

            statisticsTitle.insertAdjacentElement(

                "afterend",

                periodContainer

            );

        }

    }


    periodContainer.innerHTML =
        "";


    const periods = [

        {
            key: "day",
            text: "일간"
        },

        {
            key: "week",
            text: "주간"
        },

        {
            key: "month",
            text: "월간"
        }

    ];


    periods.forEach(

        function(period) {

            const button =
                document.createElement("button");


            button.type =
                "button";


            button.textContent =
                period.text;


            button.className =
                "statistics-period-button";


            if (
                statisticsPeriod === period.key
            ) {

                button.classList.add(
                    "active"
                );

            }


            button.onclick =
                function() {

                    statisticsPeriod =
                        period.key;


                    renderStatistics();

                    renderChart();

                    renderSubjectStatistics();

                };


            periodContainer.appendChild(button);

        }

    );

}


// ======================================================
// 29. 기간별 통계
// ======================================================

function renderStatistics() {

    renderStatisticsPeriodButtons();


    const userPlans =
        getStatisticsPlans();


    const total =
        userPlans.length;


    const completed =
        userPlans.filter(

            function(plan) {

                return plan.completed;

            }

        ).length;


    let totalMinutes =
        0;


    userPlans.forEach(

        function(plan) {

            totalMinutes +=
                getPlanMinutes(plan);

        }

    );


    const hours =
        Math.floor(
            totalMinutes / 60
        );


    const minutes =
        totalMinutes % 60;


    const achievement =

        total === 0

            ? 0

            : Math.round(

                completed /
                total *
                100

            );


    totalPlansElement.textContent =
        total;


    completedPlansElement.textContent =
        completed;


    studyTimeElement.textContent =

        hours +
        "시간 " +
        minutes +
        "분";


    achievementElement.textContent =

        achievement +
        "%";

}


/* =====================================================
   과목별 공부 시간 원형 그래프
===================================================== */

.subject-pie {

    position:
        relative;

    width:
        240px;

    height:
        240px;

    border-radius:
        50%;

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    box-shadow:
        0 8px 25px
        rgba(15, 23, 42, 0.08);

}


/* 원형 그래프 중앙 구멍 */

.subject-pie::before {

    content:
        "";

    position:
        absolute;

    width:
        145px;

    height:
        145px;

    border-radius:
        50%;

    background:
        var(--card);

}


/* 중앙 텍스트 */

.subject-pie-center {

    position:
        relative;

    z-index:
        2;

    display:
        flex;

    flex-direction:
        column;

    align-items:
        center;

    justify-content:
        center;

    text-align:
        center;

}


.subject-pie-center strong {

    font-size:
        20px;

    font-weight:
        800;

    color:
        var(--text);

}


.subject-pie-center span {

    margin-top:
        5px;

    font-size:
        11px;

    color:
        var(--sub-text);

}


/* 과목별 통계 항목 */

.subject-statistics-list {

    display:
        flex;

    flex-direction:
        column;

    gap:
        10px;

}


/* 과목별 한 줄 */

.subject-stat-item {

    display:
        flex;

    align-items:
        center;

    justify-content:
        space-between;

    padding:
        13px 15px;

    background:
        var(--bg);

    border:
        1px solid var(--border);

    border-radius:
        12px;

    transition:
        all 0.2s ease;

}


.subject-stat-item:hover {

    border-color:
        #c7d2fe;

    transform:
        translateY(-1px);

}


/* 과목명 */

.subject-stat-name {

    display:
        flex;

    align-items:
        center;

    gap:
        9px;

    font-size:
        14px;

    font-weight:
        700;

}


/* 원형 그래프 색상 */

.subject-stat-color {

    width:
        11px;

    height:
        11px;

    border-radius:
        50%;

    flex-shrink:
        0;

}


/* 시간 + 퍼센트 */

.subject-stat-time {

    color:
        var(--text);

    font-size:
        13px;

    font-weight:
        700;

}


.subject-stat-detail {

    min-width:
        45px;

    text-align:
        right;

    color:
        var(--sub-text);

    font-size:
        12px;

}


/* =====================================================
   과목별 통계 모바일
===================================================== */

@media (
    max-width: 768px
) {

    .subject-statistics-content {

        grid-template-columns:
            1fr;

    }


    .subject-pie {

        width:
            210px;

        height:
            210px;

    }


    .subject-pie::before {

        width:
            125px;

        height:
            125px;

    }


    .subject-pie-center strong {

        font-size:
            17px;

    }

}


// ======================================================
// 31. 주간 공부 시간 그래프
// ======================================================

function renderChart() {

    const chart =
        document.getElementById(
            "statistics-chart"
        );


    if (!chart) {

        return;

    }


    chart.innerHTML =
        "";


    const title =
        document.createElement("h3");


    title.textContent =

        statisticsPeriod === "day"

            ? "오늘 공부 시간"

            : statisticsPeriod === "week"

                ? "이번 주 공부 시간"

                : "이번 달 공부 시간";


    chart.appendChild(title);


    const container =
        document.createElement("div");


    container.className =
        "chart-container";


    // ==================================================
    // 일간
    // ==================================================

    if (
        statisticsPeriod === "day"
    ) {

        const dateKey =
            formatDateKey(currentDate);


        const dayPlans =
            plans.filter(

                function(plan) {

                    return (

                        plan.user === currentUser &&

                        plan.date === dateKey

                    );

                }

            );


        let minutes =
            0;


        dayPlans.forEach(

            function(plan) {

                minutes +=
                    getPlanMinutes(plan);

            }

        );


        const bar =
            document.createElement("div");


        bar.className =
            "chart-bar";


        const height =

            Math.min(

                100,

                minutes /
                600 *
                100

            );


        bar.style.height =

            Math.max(
                5,
                height
            ) +
            "%";


        const label =
            document.createElement("span");


        label.textContent =
            "오늘";


        const time =
            document.createElement("small");


        time.textContent =

            Math.floor(
                minutes / 60
            ) +
            "h " +
            minutes % 60 +
            "m";


        bar.appendChild(label);

        bar.appendChild(time);


        container.appendChild(bar);

    }


    // ==================================================
    // 주간
    // ==================================================

    else if (
        statisticsPeriod === "week"
    ) {

        const monday =
            getMonday(currentDate);


        const days = [

            "월",
            "화",
            "수",
            "목",
            "금",
            "토",
            "일"

        ];


        for (
            let i = 0;
            i < 7;
            i++
        ) {

            const date =
                new Date(monday);


            date.setDate(

                monday.getDate() +
                i

            );


            const dateKey =
                formatDateKey(date);


            const dayPlans =
                plans.filter(

                    function(plan) {

                        return (

                            plan.user === currentUser &&

                            plan.date === dateKey

                        );

                    }

                );


            let minutes =
                0;


            dayPlans.forEach(

                function(plan) {

                    minutes +=
                        getPlanMinutes(plan);

                }

            );


            const bar =
                document.createElement("div");


            bar.className =
                "chart-bar";


            const height =

                Math.min(

                    100,

                    minutes /
                    600 *
                    100

                );


            bar.style.height =

                Math.max(
                    5,
                    height
                ) +
                "%";


            const label =
                document.createElement("span");


            label.textContent =
                days[i];


            const time =
                document.createElement("small");


            time.textContent =

                Math.floor(
                    minutes / 60
                ) +
                "h " +
                minutes % 60 +
                "m";


            bar.appendChild(label);

            bar.appendChild(time);


            container.appendChild(bar);

        }

    }


    // ==================================================
    // 월간
    // ==================================================

    else if (
        statisticsPeriod === "month"
    ) {

        const year =
            currentDate.getFullYear();


        const month =
            currentDate.getMonth();


        const lastDay =
            new Date(

                year,

                month + 1,

                0

            );


        const totalDays =
            lastDay.getDate();


        for (
            let day = 1;
            day <= totalDays;
            day++
        ) {

            const date =
                new Date(

                    year,

                    month,

                    day

                );


            const dateKey =
                formatDateKey(date);


            const dayPlans =
                plans.filter(

                    function(plan) {

                        return (

                            plan.user === currentUser &&

                            plan.date === dateKey

                        );

                    }

                );


            let minutes =
                0;


            dayPlans.forEach(

                function(plan) {

                    minutes +=
                        getPlanMinutes(plan);

                }

            );


            const bar =
                document.createElement("div");


            bar.className =
                "chart-bar month-chart-bar";


            const height =

                Math.min(

                    100,

                    minutes /
                    600 *
                    100

                );


            bar.style.height =

                Math.max(
                    3,
                    height
                ) +
                "%";


            const label =
                document.createElement("span");


            label.textContent =
                day;


            const time =
                document.createElement("small");


            time.textContent =

                Math.floor(
                    minutes / 60
                ) +
                "h " +
                minutes % 60 +
                "m";


            bar.appendChild(label);

            bar.appendChild(time);


            container.appendChild(bar);

        }

    }


    chart.appendChild(container);

}


// ======================================================
// 32. 다크모드
// ======================================================

darkModeButton.addEventListener(

    "click",

    function() {

        document
            .body
            .classList
            .toggle("dark");


        const isDark =

            document
                .body
                .classList
                .contains("dark");


        localStorage.setItem(

            "studyPlannerDark",

            isDark

        );

    }

);


// ======================================================
// 33. PDF 저장
// ======================================================

pdfButton.addEventListener(

    "click",

    function() {

        window.print();

    }

);


// ======================================================
// 34. 보기 버튼 상태
// ======================================================

function updateViewButtons() {

    viewButtons.forEach(

        function(button) {

            button
                .classList
                .toggle(

                    "active",

                    button.dataset.view ===
                    currentView

                );

        }

    );

}


// ======================================================
// 35. 전체 렌더링
// ======================================================

function renderAll() {

    currentDateElement.textContent =

        formatKoreanDate(currentDate);


    planner.innerHTML =
        "";


    if (
        currentView === "day"
    ) {

        renderDay();

    }

    else if (
        currentView === "week"
    ) {

        renderWeek();

    }

    else if (
        currentView === "month"
    ) {

        renderMonth();

    }


    renderDDays();


    // 기간별 전체 통계
    renderStatistics();


    // 기간별 과목 통계
    renderSubjectStatistics();


    // 기간별 공부 시간 그래프
    renderChart();

}


// ======================================================
// 36. 다크모드 복원
// ======================================================

if (

    localStorage.getItem(
        "studyPlannerDark"
    ) === "true"

) {

    document
        .body
        .classList
        .add("dark");

}


// ======================================================
// 37. 로그인 상태 확인
// ======================================================

async function checkAuth() {

    const {
        data
    } =
        await supabaseClient
            .auth
            .getSession();


    const session =
        data.session;


    if (
        session &&
        session.user
    ) {

        currentUser =
            session.user.email;


        localStorage.setItem(
            "studyPlannerUser",
            currentUser
        );


        await loadData();


        showApp();

    }

    else {

        currentUser =
            null;


        plans = [];


        ddays = [];


        showLogin();

    }

}


checkAuth();


// ======================================================
// 38. 계획 수정
// ======================================================

async function editPlan(id) {

    const plan =
        plans.find(

            function(item) {

                return (

                    item.id === id &&

                    item.user === currentUser

                );

            }

        );


    if (!plan) {

        return;

    }


    const newSubject =
        prompt(

            "과목을 수정하세요.",

            plan.subject

        );


    if (
        newSubject === null
    ) {

        return;

    }


    const newDetail =
        prompt(

            "세부 내용을 수정하세요.",

            plan.detail || ""

        );


    if (
        newDetail === null
    ) {

        return;

    }


    const newStart =
        prompt(

            "시작 시간을 수정하세요.\n예: 09:00",

            plan.start || ""

        );


    if (
        newStart === null
    ) {

        return;

    }


    const newEnd =
        prompt(

            "종료 시간을 수정하세요.\n예: 11:00",

            plan.end || ""

        );


    if (
        newEnd === null
    ) {

        return;

    }


    const {
        error
    } =
        await supabaseClient

            .from("plans")

            .update({

                subject:
                    newSubject.trim(),

                detail:
                    newDetail.trim(),

                start_time:
                    newStart.trim() || null,

                end_time:
                    newEnd.trim() || null

            })

            .eq(
                "id",
                id
            );


    if (error) {

        console.error(

            "계획 수정 실패:",

            error

        );


        alert(

            "계획 수정에 실패했습니다."

        );


        return;

    }


    await loadData();


    renderAll();

}


// ======================================================
// 39. 복사 모달 닫기
// ======================================================

closeCopyModal.addEventListener(

    "click",

    function() {

        closeCopyModalWindow();

    }

);


// ======================================================
// 40. 계획 복사
// ======================================================

confirmCopyButton.addEventListener(

    "click",

    async function() {

        if (
            !copyingPlanId
        ) {

            return;

        }


        const targetDate =
            copyTargetDate.value;


        if (
            !targetDate
        ) {

            alert(

                "복사할 날짜를 선택해주세요."

            );

            return;

        }


        const {
            data: {
                user
            }
        } =
            await supabaseClient
                .auth
                .getUser();


        if (!user) {

            alert(

                "로그인 정보를 확인할 수 없습니다."

            );

            return;

        }


        const original =
            plans.find(

                function(plan) {

                    return (

                        plan.id === copyingPlanId &&

                        plan.user === currentUser

                    );

                }

            );


        if (!original) {

            alert(

                "복사할 계획을 찾을 수 없습니다."

            );


            closeCopyModalWindow();


            return;

        }


        const {
            error
        } =
            await supabaseClient

                .from("plans")

                .insert({

                    id:
                        Date.now(),

                    user_id:
                        user.id,

                    date:
                        targetDate,

                    subject:
                        original.subject,

                    detail:
                        original.detail,

                    start_time:
                        original.start || null,

                    end_time:
                        original.end || null,

                    completed:
                        false

                });


        if (error) {

            console.error(

                "계획 복사 실패:",

                error

            );


            alert(

                "계획 복사에 실패했습니다."

            );


            return;

        }


        await loadData();


        closeCopyModalWindow();


        alert(

            "📋 계획을 복사했습니다!"

        );


        renderAll();

    }

);


// ======================================================
// 41. 복사 모달 닫기 함수
// ======================================================

function closeCopyModalWindow() {

    copyModal
        .classList
        .add("hidden");


    copyingPlanId =
        null;

}
