```javascript
// ======================================================
// Study Planner
// app.js
// ======================================================


// ======================================================
// 0. Supabase 설정
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

// 이메일을 저장하는 용도로 사용
let currentUser = null;

// 실제 Supabase Auth 사용자 ID
let currentUserId = null;


// ======================================================
// 2. 데이터
// ======================================================

let plans = [];

let ddays = [];

let copyingPlanId = null;


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


// ======================================================
// 4. 날짜 관련 함수
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
// 5. 시간 계산
// ======================================================
//
// 핵심 수정 부분
//
// 예:
// 09:00 ~ 11:00 = 120분
// 23:00 ~ 01:00 = 120분
// 22:30 ~ 00:30 = 120분
// 23:30 ~ 00:10 = 40분
//
// 종료 시간이 시작 시간보다 작거나 같으면
// 다음 날로 넘어간 것으로 처리
// ======================================================

function calculateStudyMinutes(start, end) {

    if (
        !start ||
        !end
    ) {

        return 0;

    }


    const startParts =
        start.split(":");

    const endParts =
        end.split(":");


    if (
        startParts.length !== 2 ||
        endParts.length !== 2
    ) {

        return 0;

    }


    const startMinutes =

        Number(startParts[0]) * 60 +
        Number(startParts[1]);


    let endMinutes =

        Number(endParts[0]) * 60 +
        Number(endParts[1]);


    if (
        Number.isNaN(startMinutes) ||
        Number.isNaN(endMinutes)
    ) {

        return 0;

    }


    // 자정 넘어가는 경우
    if (
        endMinutes <= startMinutes
    ) {

        endMinutes += 24 * 60;

    }


    return (
        endMinutes -
        startMinutes
    );

}


// ======================================================
// 6. 분 → 시간 표시
// ======================================================

function formatStudyTime(totalMinutes) {

    const hours =
        Math.floor(
            totalMinutes / 60
        );

    const minutes =
        totalMinutes % 60;


    return (

        hours +
        "시간 " +
        minutes +
        "분"

    );

}


// ======================================================
// 7. 월요일 구하기
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

        result.getDate()
        +
        difference

    );


    result.setHours(
        0,
        0,
        0,
        0
    );


    return result;

}


// ======================================================
// 8. 로그인 사용자 정보 가져오기
// ======================================================

async function getCurrentAuthUser() {

    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .getUser();


    if (error) {

        console.error(
            "사용자 정보 확인 실패:",
            error
        );

        return null;

    }


    return data.user || null;

}


// ======================================================
// 9. 데이터 불러오기
// ======================================================

async function loadData() {

    const user =
        await getCurrentAuthUser();


    if (!user) {

        currentUser = null;

        currentUserId = null;

        plans = [];

        ddays = [];

        return;

    }


    currentUser =
        user.email;

    currentUserId =
        user.id;


    // ==================================================
    // 계획 불러오기
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
                user.id
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

        alert(
            "계획 데이터를 불러오지 못했습니다."
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
                user.id
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

        alert(
            "D-Day 데이터를 불러오지 못했습니다."
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
                        user.email,

                    userId:
                        plan.user_id,

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
                        Boolean(
                            plan.completed
                        )

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
                        user.email,

                    userId:
                        dday.user_id,

                    title:
                        dday.title,

                    date:
                        dday.date

                };

            }

        );

}


// ======================================================
// 10. 로그인
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

            console.error(
                "로그인 실패:",
                error
            );

            loginMessage.textContent =
                "로그인 실패: " +
                error.message;

            return;

        }


        if (
            !data ||
            !data.user
        ) {

            loginMessage.textContent =
                "로그인 정보를 가져오지 못했습니다.";

            return;

        }


        currentUser =
            data.user.email;

        currentUserId =
            data.user.id;


        localStorage.setItem(
            "studyPlannerUser",
            data.user.email
        );


        await loadData();


        loginMessage.textContent =
            "";


        showApp();

    }

);


// ======================================================
// 11. 회원가입
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

            console.error(
                "회원가입 실패:",
                error
            );

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
                "회원가입 완료! 이메일 인증 후 로그인해주세요.";

            return;

        }


        if (
            data.user &&
            data.session
        ) {

            currentUser =
                data.user.email;

            currentUserId =
                data.user.id;


            localStorage.setItem(
                "studyPlannerUser",
                data.user.email
            );


            await loadData();


            loginMessage.textContent =
                "";


            showApp();

        }

    }

);


// ======================================================
// 12. 로그아웃
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

            console.error(
                "로그아웃 실패:",
                error
            );

            alert(
                "로그아웃에 실패했습니다."
            );

            return;

        }


        currentUser =
            null;

        currentUserId =
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
// 13. 로그인 화면
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
// 14. 앱 화면
// ======================================================

function showApp() {

    loginPage
        .classList
        .add("hidden");


    appPage
        .classList
        .remove("hidden");


    updateViewButtons();


    renderAll();

}


// ======================================================
// 15. 이전 날짜
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
// 16. 다음 날짜
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
// 17. 오늘
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
// 18. 일간 / 주간 / 월간
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
// 19. 계획 추가
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


        const user =
            await getCurrentAuthUser();


        if (!user) {

            alert(
                "로그인 정보가 없습니다. 다시 로그인해주세요."
            );

            showLogin();

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

            console.error(
                "계획 저장 실패:",
                error
            );

            alert(
                "계획 저장에 실패했습니다.\n" +
                error.message
            );

            return;

        }


        await loadData();


        planForm.reset();


        renderAll();

    }

);


// ======================================================
// 20. 계획 완료/취소
// ======================================================

async function togglePlan(id) {

    const plan =
        plans.find(

            function(item) {

                return (
                    String(item.id) ===
                    String(id)
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
            )

            .eq(
                "user_id",
                currentUserId
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
// 21. 계획 삭제
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
            )

            .eq(
                "user_id",
                currentUserId
            );


    if (error) {

        console.error(
            "계획 삭제 실패:",
            error
        );

        alert(
            "계획 삭제에 실패했습니다."
        );

        return;

    }


    await loadData();


    renderAll();

}


// ======================================================
// 22. 계획 수정
// ======================================================

async function editPlan(id) {

    const plan =
        plans.find(

            function(item) {

                return (
                    String(item.id) ===
                    String(id)
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
            "시작 시간을 수정하세요.\n예: 23:00",
            plan.start || ""
        );


    if (
        newStart === null
    ) {

        return;

    }


    const newEnd =
        prompt(
            "종료 시간을 수정하세요.\n예: 01:00",
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
            )

            .eq(
                "user_id",
                currentUserId
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
// 23. 계획 복사 모달
// ======================================================

function copyPlan(id) {

    const plan =
        plans.find(

            function(item) {

                return (
                    String(item.id) ===
                    String(id)
                );

            }

        );


    if (!plan) {

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
// 24. 계획 카드
// ======================================================

function createPlanCard(plan) {

    const card =
        document.createElement("div");

    card.className =
        "plan-card";


    if (
        plan.completed
    ) {

        card.classList.add(
            "completed"
        );

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


    content.appendChild(
        title
    );

    content.appendChild(
        detail
    );


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

            togglePlan(
                plan.id
            );

        };


    const editButton =
        document.createElement("button");

    editButton.textContent =
        "✏️";

    editButton.title =
        "계획 수정";


    editButton.onclick =
        function() {

            editPlan(
                plan.id
            );

        };


    const copyButton =
        document.createElement("button");

    copyButton.textContent =
        "📋";

    copyButton.title =
        "다른 날짜로 복사";


    copyButton.onclick =
        function() {

            copyPlan(
                plan.id
            );

        };


    const deleteButton =
        document.createElement("button");

    deleteButton.textContent =
        "🗑️";

    deleteButton.title =
        "삭제";


    deleteButton.onclick =
        function() {

            deletePlan(
                plan.id
            );

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


    card.appendChild(
        time
    );

    card.appendChild(
        content
    );

    card.appendChild(
        actions
    );


    return card;

}


// ======================================================
// 25. 일간 보기
// ======================================================

function renderDay() {

    const dateKey =
        formatDateKey(
            currentDate
        );


    const todayPlans =
        plans.filter(

            function(plan) {

                return (
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

                createPlanCard(
                    plan
                )

            );

        }

    );

}


// ======================================================
// 26. 주간 보기
// ======================================================

function renderWeek() {

    const monday =
        getMonday(
            currentDate
        );


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

            monday.getDate() + i

        );


        const dateKey =
            formatDateKey(
                date
            );


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


        dayBox.appendChild(
            header
        );


        const dayPlans =
            plans.filter(

                function(plan) {

                    return (
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

                    item.classList.add(
                        "completed"
                    );

                }


                item.textContent =

                    (
                        plan.start
                            ? plan.start + " "
                            : ""
                    )
                    +
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


                dayBox.appendChild(
                    item
                );

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


            dayBox.appendChild(
                empty
            );

        }


        grid.appendChild(
            dayBox
        );

    }


    planner.appendChild(
        grid
    );

}


// ======================================================
// 27. 월간 보기
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


            weekdayRow.appendChild(
                element
            );

        }

    );


    calendar.appendChild(
        weekdayRow
    );


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


        daysContainer.appendChild(
            empty
        );

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
            formatDateKey(
                date
            );


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


        box.appendChild(
            number
        );


        const dayPlans =
            plans.filter(

                function(plan) {

                    return (
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


                    box.appendChild(
                        item
                    );

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


        daysContainer.appendChild(
            box
        );

    }


    calendar.appendChild(
        daysContainer
    );


    planner.appendChild(
        calendar
    );

}


// ======================================================
// 28. D-Day 추가
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


        const user =
            await getCurrentAuthUser();


        if (!user) {

            alert(
                "로그인 정보가 없습니다."
            );

            showLogin();

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
                        user.id,

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


        renderAll();

    }

);


// ======================================================
// 29. D-Day 렌더링
// ======================================================

function renderDDays() {

    ddayList.innerHTML =
        "";


    const userDDays =
        ddays.filter(

            function(dday) {

                return (
                    dday.userId ===
                    currentUserId
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
                parseDate(
                    dday.date
                );


            const difference =

                Math.ceil(

                    (
                        target.getTime()
                        -
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
                    Math.abs(
                        difference
                    );

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
                            )

                            .eq(
                                "user_id",
                                currentUserId
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


            ddayList.appendChild(
                item
            );

        }

    );

}


// ======================================================
// 30. 전체 통계
// ======================================================

function renderStatistics() {

    const userPlans =
        plans.filter(

            function(plan) {

                return (
                    plan.userId ===
                    currentUserId
                );

            }

        );


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

                calculateStudyMinutes(

                    plan.start,

                    plan.end

                );

        }

    );


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

        formatStudyTime(
            totalMinutes
        );


    achievementElement.textContent =

        achievement +
        "%";

}


// ======================================================
// 31. 과목별 통계
// ======================================================

function renderSubjectStatistics() {

    const container =
        document.getElementById(
            "subject-statistics"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    const userPlans =
        plans.filter(

            function(plan) {

                return (
                    plan.userId ===
                    currentUserId
                );

            }

        );


    const subjectData = {};


    userPlans.forEach(

        function(plan) {

            const subject =
                plan.subject.trim();


            if (
                !subject
            ) {

                return;

            }


            if (
                !subjectData[subject]
            ) {

                subjectData[subject] = {

                    total: 0,

                    completed: 0,

                    minutes: 0

                };

            }


            subjectData[subject].total++;


            if (
                plan.completed
            ) {

                subjectData[subject].completed++;

            }


            subjectData[subject].minutes +=

                calculateStudyMinutes(

                    plan.start,

                    plan.end

                );

        }

    );


    const title =
        document.createElement("h3");


    title.textContent =
        "📚 과목별 통계";


    container.appendChild(
        title
    );


    if (
        Object.keys(
            subjectData
        ).length === 0
    ) {

        const empty =
            document.createElement("p");


        empty.textContent =
            "아직 등록된 공부 계획이 없습니다.";


        container.appendChild(
            empty
        );


        return;

    }


    const cards =
        document.createElement("div");


    cards.className =
        "subject-statistics-grid";


    Object.keys(subjectData)
        .sort()
        .forEach(

            function(subject) {

                const data =
                    subjectData[subject];


                const achievement =

                    data.total === 0

                        ? 0

                        : Math.round(

                            data.completed /
                            data.total *
                            100

                        );


                const card =
                    document.createElement("div");


                card.className =
                    "subject-stat-card";


                const subjectTitle =
                    document.createElement("h4");


                subjectTitle.textContent =
                    subject;


                const total =
                    document.createElement("p");


                total.textContent =

                    "전체 계획: " +
                    data.total +
                    "개";


                const completed =
                    document.createElement("p");


                completed.textContent =

                    "완료: " +
                    data.completed +
                    "개";


                const studyTime =
                    document.createElement("p");


                studyTime.textContent =

                    "공부 시간: " +
                    formatStudyTime(
                        data.minutes
                    );


                const achievementText =
                    document.createElement("p");


                achievementText.textContent =

                    "달성률: " +
                    achievement +
                    "%";


                const progressBackground =
                    document.createElement("div");


                progressBackground.className =
                    "subject-progress";


                const progress =
                    document.createElement("div");


                progress.className =
                    "subject-progress-bar";


                progress.style.width =
                    achievement +
                    "%";


                progressBackground.appendChild(
                    progress
                );


                card.appendChild(
                    subjectTitle
                );

                card.appendChild(
                    total
                );

                card.appendChild(
                    completed
                );

                card.appendChild(
                    studyTime
                );

                card.appendChild(
                    achievementText
                );

                card.appendChild(
                    progressBackground
                );


                cards.appendChild(
                    card
                );

            }

        );


    container.appendChild(
        cards
    );

}


// ======================================================
// 32. 주간 공부 시간 그래프
// ======================================================
//
// 현재 선택된 날짜가 속한 주의
// 월요일 ~ 일요일 공부 시간을 표시
//
// 자정 넘어가는 계획도 calculateStudyMinutes()
// 를 사용해서 정상적으로 계산
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
        "📊 주간 공부 시간";


    chart.appendChild(
        title
    );


    const monday =
        getMonday(
            currentDate
        );


    const days = [

        "월",
        "화",
        "수",
        "목",
        "금",
        "토",
        "일"

    ];


    const container =
        document.createElement("div");


    container.className =
        "chart-container";


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const date =
            new Date(monday);


        date.setDate(

            monday.getDate() + i

        );


        const dateKey =
            formatDateKey(
                date
            );


        const dayPlans =
            plans.filter(

                function(plan) {

                    return (
                        plan.userId ===
                        currentUserId &&

                        plan.date ===
                        dateKey
                    );

                }

            );


        let minutes =
            0;


        dayPlans.forEach(

            function(plan) {

                minutes +=

                    calculateStudyMinutes(

                        plan.start,

                        plan.end

                    );

            }

        );


        const barWrapper =
            document.createElement("div");


        barWrapper.className =
            "chart-bar-wrapper";


        const bar =
            document.createElement("div");


        bar.className =
            "chart-bar";


        // 10시간을 최대 높이로 설정
        const height =

            Math.min(

                100,

                minutes /
                600 *
                100

            );


        bar.style.height =

            Math.max(
                minutes > 0
                    ? 5
                    : 0,

                height

            ) +
            "%";


        const time =
            document.createElement("small");


        time.textContent =

            formatStudyTime(
                minutes
            );


        const label =
            document.createElement("span");


        label.textContent =
            days[i];


        bar.appendChild(
            time
        );


        barWrapper.appendChild(
            bar
        );


        barWrapper.appendChild(
            label
        );


        container.appendChild(
            barWrapper
        );

    }


    chart.appendChild(
        container
    );

}


// ======================================================
// 33. 다크모드
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


if (darkModeButton) {

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

}


// ======================================================
// 34. PDF
// ======================================================

if (pdfButton) {

    pdfButton.addEventListener(

        "click",

        function() {

            window.print();

        }

    );

}


// ======================================================
// 35. 보기 버튼 상태
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
// 36. 복사 모달 닫기
// ======================================================

function closeCopyModalWindow() {

    copyModal
        .classList
        .add("hidden");


    copyingPlanId =
        null;

}


if (closeCopyModal) {

    closeCopyModal.addEventListener(

        "click",

        function() {

            closeCopyModalWindow();

        }

    );

}


// ======================================================
// 37. 계획 복사
// ======================================================

if (confirmCopyButton) {

    confirmCopyButton.addEventListener(

        "click",

        async function() {

            if (
                copyingPlanId === null
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


            const user =
                await getCurrentAuthUser();


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

                            String(plan.id) ===
                            String(copyingPlanId)

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


            renderAll();


            alert(
                "📋 계획을 복사했습니다!"
            );

        }

    );

}


// ======================================================
// 38. 전체 렌더링
// ======================================================

function renderAll() {

    if (!currentUserId) {

        return;

    }


    currentDateElement.textContent =

        formatKoreanDate(
            currentDate
        );


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

    renderStatistics();

    renderSubjectStatistics();

    renderChart();

}


// ======================================================
// 39. Supabase Auth 상태 감지
// ======================================================

supabaseClient
    .auth
    .onAuthStateChange(

        async function(
            event,
            session
        ) {

            if (
                session &&
                session.user
            ) {

                currentUser =
                    session.user.email;

                currentUserId =
                    session.user.id;


                localStorage.setItem(

                    "studyPlannerUser",

                    session.user.email

                );


                await loadData();


                showApp();

            }

            else {

                currentUser =
                    null;

                currentUserId =
                    null;

                plans = [];

                ddays = [];


                localStorage.removeItem(

                    "studyPlannerUser"

                );


                showLogin();

            }

        }

    );


// ======================================================
// 40. 최초 로그인 상태 확인
// ======================================================

async function checkAuth() {

    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .getSession();


    if (error) {

        console.error(
            "세션 확인 실패:",
            error
        );

        showLogin();

        return;

    }


    const session =
        data.session;


    if (
        session &&
        session.user
    ) {

        currentUser =
            session.user.email;

        currentUserId =
            session.user.id;


        localStorage.setItem(

            "studyPlannerUser",

            session.user.email

        );


        await loadData();


        showApp();

    }

    else {

        currentUser =
            null;

        currentUserId =
            null;

        plans = [];

        ddays = [];


        showLogin();

    }

}


// ======================================================
// 41. 앱 시작
// ======================================================

checkAuth();
```
