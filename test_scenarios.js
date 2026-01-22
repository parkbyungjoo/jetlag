// 10가지 여행 시나리오 테스트
// 현재 로직 분석 및 출력 확인

const testScenarios = [
    {
        name: "1. 서울→LA (장거리 동→서, 시차 -17시간)",
        departure: { date: "2026-02-01", time: "18:00" },
        arrival: { date: "2026-02-01", time: "12:00" },
        duration: { hours: 11, minutes: 0 }
    },
    {
        name: "2. LA→서울 (장거리 서→동, 시차 +17시간)",
        departure: { date: "2026-02-10", time: "12:00" },
        arrival: { date: "2026-02-11", time: "17:00" },
        duration: { hours: 12, minutes: 0 }
    },
    {
        name: "3. 뉴욕→런던 (중거리 서→동, 시차 +5시간)",
        departure: { date: "2026-03-01", time: "20:00" },
        arrival: { date: "2026-03-02", time: "08:00" },
        duration: { hours: 7, minutes: 0 }
    },
    {
        name: "4. 런던→뉴욕 (중거리 동→서, 시차 -5시간)",
        departure: { date: "2026-03-10", time: "10:00" },
        arrival: { date: "2026-03-10", time: "13:00" },
        duration: { hours: 8, minutes: 0 }
    },
    {
        name: "5. 도쿄→시드니 (중거리 북→남, 시차 +2시간)",
        departure: { date: "2026-04-01", time: "21:00" },
        arrival: { date: "2026-04-02", time: "08:00" },
        duration: { hours: 9, minutes: 0 }
    },
    {
        name: "6. 파리→두바이 (중거리, 시차 +3시간)",
        departure: { date: "2026-05-01", time: "14:00" },
        arrival: { date: "2026-05-01", time: "23:00" },
        duration: { hours: 6, minutes: 0 }
    },
    {
        name: "7. 싱가포르→홍콩 (단거리, 시차 0시간)",
        departure: { date: "2026-06-01", time: "09:00" },
        arrival: { date: "2026-06-01", time: "13:00" },
        duration: { hours: 4, minutes: 0 }
    },
    {
        name: "8. 샌프란시스코→뉴욕 (국내선, 시차 +3시간)",
        departure: { date: "2026-07-01", time: "08:00" },
        arrival: { date: "2026-07-01", time: "16:30" },
        duration: { hours: 5, minutes: 30 }
    },
    {
        name: "9. 새벽 도착 (서울→방콕, 시차 -2시간)",
        departure: { date: "2026-08-01", time: "23:00" },
        arrival: { date: "2026-08-02", time: "02:00" },
        duration: { hours: 5, minutes: 0 }
    },
    {
        name: "10. 심야 출발 (베이징→서울, 시차 +1시간)",
        departure: { date: "2026-09-01", time: "01:00" },
        arrival: { date: "2026-09-01", time: "05:00" },
        duration: { hours: 3, minutes: 0 }
    }
];

function calculateJetLagPlan(scenario) {
    const { departure, arrival, duration } = scenario;

    // 날짜 객체 생성
    const departureDate = new Date(`${departure.date}T${departure.time}`);
    const arrivalDate = new Date(`${arrival.date}T${arrival.time}`);

    // 비행 시간 계산
    const durationTotalHours = duration.hours + (duration.minutes / 60);

    // 시차 계산 (실제 도착시간 차이 - 비행시간)
    const localDiffHours = (arrivalDate - departureDate) / (1000 * 60 * 60);
    const timezoneOffset = localDiffHours - durationTotalHours;

    // 전략 A: 도착 후 첫 7:30 AM 아침
    let breakfastDestA = new Date(arrivalDate);
    breakfastDestA.setHours(7, 30, 0, 0);
    if (breakfastDestA <= arrivalDate) {
        breakfastDestA.setDate(breakfastDestA.getDate() + 1);
    }
    const fastingStartDestA = new Date(breakfastDestA);
    fastingStartDestA.setHours(fastingStartDestA.getHours() - 16);

    // 전략 B: 하루 뒤
    let breakfastDestB = new Date(breakfastDestA);
    breakfastDestB.setDate(breakfastDestB.getDate() + 1);
    const fastingStartDestB = new Date(breakfastDestB);
    fastingStartDestB.setHours(fastingStartDestB.getHours() - 16);

    // 출발지 시간으로 변환
    const fastingStartOriginA = new Date(fastingStartDestA.getTime() - (timezoneOffset * 60 * 60 * 1000));
    const fastingStartOriginB = new Date(fastingStartDestB.getTime() - (timezoneOffset * 60 * 60 * 1000));

    // 전략 분류
    const isPreFlightA = fastingStartOriginA < departureDate;
    const hoursBufferA = (fastingStartDestA - arrivalDate) / (1000 * 60 * 60);
    const isTightConnectionA = (hoursBufferA < 2.0 && hoursBufferA >= 0);

    let strategyAName;
    if (isPreFlightA) {
        strategyAName = "Option A: Start Before Departure";
    } else if (isTightConnectionA) {
        strategyAName = "Option A: Start In-Flight";
    } else {
        strategyAName = "Option A: Start After Arrival";
    }

    // Option B 표시 여부
    const showOptionB = fastingStartDestA < arrivalDate || isTightConnectionA;

    return {
        departure: departureDate,
        arrival: arrivalDate,
        timezoneOffset: timezoneOffset.toFixed(1),
        durationHours: durationTotalHours.toFixed(1),
        strategyA: {
            name: strategyAName,
            fastingStartDest: fastingStartDestA,
            fastingStartOrigin: fastingStartOriginA,
            breakfastDest: breakfastDestA,
            isPreFlight: isPreFlightA,
            isTightConnection: isTightConnectionA,
            hoursBuffer: hoursBufferA.toFixed(1)
        },
        strategyB: showOptionB ? {
            name: "Option B: Start After Arrival",
            fastingStartDest: fastingStartDestB,
            fastingStartOrigin: fastingStartOriginB,
            breakfastDest: breakfastDestB
        } : null
    };
}

function formatDateTime(date) {
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

// 결과 생성
let output = "=".repeat(80) + "\n";
output += "JET LAG RESET CALCULATOR - 10가지 시나리오 테스트\n";
output += "=".repeat(80) + "\n\n";

output += "📋 로직 설명:\n";
output += "-".repeat(80) + "\n";
output += "1. 시차 계산: (도착시간 - 출발시간) - 비행시간 = 시차\n";
output += "2. 목표 아침식사: 도착 후 첫 7:30 AM (이미 지났으면 다음날)\n";
output += "3. 금식 시작: 목표 아침식사 16시간 전\n";
output += "4. 전략 분류:\n";
output += "   - Before Departure: 금식이 출발 전 시작 (출발지 시간 기준)\n";
output += "   - In-Flight: 금식이 도착 2시간 전~도착 사이 시작\n";
output += "   - After Arrival: 금식이 도착 2시간 이후 시작\n";
output += "5. Option B 표시: Option A가 Before Departure 또는 In-Flight일 때만\n";
output += "=".repeat(80) + "\n\n";

testScenarios.forEach((scenario, index) => {
    const result = calculateJetLagPlan(scenario);

    output += `\n${"=".repeat(80)}\n`;
    output += `${scenario.name}\n`;
    output += `${"=".repeat(80)}\n`;
    output += `출발: ${formatDateTime(result.departure)}\n`;
    output += `도착: ${formatDateTime(result.arrival)}\n`;
    output += `비행시간: ${result.durationHours}시간\n`;
    output += `시차: ${result.timezoneOffset}시간\n`;
    output += `\n`;

    output += `${result.strategyA.name}\n`;
    output += `${"-".repeat(80)}\n`;
    output += `금식 시작 (목적지 시간): ${formatDateTime(result.strategyA.fastingStartDest)}\n`;
    output += `금식 시작 (출발지 시간): ${formatDateTime(result.strategyA.fastingStartOrigin)}\n`;
    output += `아침식사 (목적지 시간): ${formatDateTime(result.strategyA.breakfastDest)}\n`;
    output += `\n`;
    output += `분석:\n`;
    output += `  - 출발 전 금식 시작? ${result.strategyA.isPreFlight ? "예" : "아니오"}\n`;
    output += `  - 도착 직전 금식? ${result.strategyA.isTightConnection ? "예" : "아니오"}\n`;
    output += `  - 도착~금식 간격: ${result.strategyA.hoursBuffer}시간\n`;

    if (result.strategyB) {
        output += `\n${result.strategyB.name}\n`;
        output += `${"-".repeat(80)}\n`;
        output += `금식 시작 (목적지 시간): ${formatDateTime(result.strategyB.fastingStartDest)}\n`;
        output += `금식 시작 (출발지 시간): ${formatDateTime(result.strategyB.fastingStartOrigin)}\n`;
        output += `아침식사 (목적지 시간): ${formatDateTime(result.strategyB.breakfastDest)}\n`;
    } else {
        output += `\nOption B: 표시 안 함 (Option A가 도착 후 시작이므로)\n`;
    }

    output += `\n`;
});

output += "\n" + "=".repeat(80) + "\n";
output += "테스트 완료\n";
output += "=".repeat(80) + "\n";

console.log(output);
