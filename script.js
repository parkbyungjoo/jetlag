document.addEventListener('DOMContentLoaded', () => {
    const modeBtns = document.querySelectorAll('.mode-btn');
    const sections = document.querySelectorAll('.form-section');
    const travelForm = document.getElementById('travel-form');
    const resetForm = document.getElementById('reset-form');
    const solutionBox = document.getElementById('solution-box');

    // Switch between Travel and Routine Reset modes
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const mode = btn.dataset.mode;
            sections.forEach(sec => {
                if (sec.id === `${mode}-section`) {
                    sec.classList.add('active');
                } else {
                    sec.classList.remove('active');
                }
            });
            solutionBox.classList.remove('active');
        });
    });

    // Print functionality
    document.getElementById('print-btn').addEventListener('click', () => {
        window.print();
    });

    // Travel Logic
    travelForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Departure Data
        const depDate = travelForm.querySelector('input[name="dep_date"]').value;
        const depHour = travelForm.querySelector('select[name="dep_hour"]').value;
        const depMin = travelForm.querySelector('select[name="dep_min"]').value;

        // Arrival Data
        const arrDate = travelForm.querySelector('input[name="arr_date"]').value;
        const arrHour = travelForm.querySelector('select[name="arr_hour"]').value;
        const arrMin = travelForm.querySelector('select[name="arr_min"]').value;

        // Duration Data
        const durationHours = parseInt(travelForm.querySelector('select[name="duration_hours"]').value) || 0;
        const durationMinutes = parseInt(travelForm.querySelector('select[name="duration_minutes"]').value) || 0;

        if (!depDate || !depHour || !depMin || !arrDate || !arrHour || !arrMin) {
            alert("Please fill in all date and time fields.");
            return;
        }

        try {

            // Construct Date Objects (YYYY-MM-DDTHH:mm)
            const departureDate = new Date(`${depDate}T${depHour}:${depMin}`);
            const arrivalDate = new Date(`${arrDate}T${arrHour}:${arrMin}`);

            // Precise duration calculation
            const durationTotalHours = durationHours + (durationMinutes / 60);

            // Calculate Timezone Offset Hours
            // Formula: Actual Arrival Time Difference - Flight Duration
            const localDiffHours = (arrivalDate - departureDate) / (1000 * 60 * 60);
            const relOffset = localDiffHours - durationTotalHours;

            // --- Strategy A: Rapid/Optimal (First possible 7:30 AM) ---
            let breakfastDestA = new Date(arrivalDate);
            breakfastDestA.setHours(7, 30, 0, 0);
            // If 7:30 AM is already passed upon arrival (or very close), shift to tomorrow?
            // Logic: specific 7:30 check. 
            // If arrival is 6:00 AM, 7:30 AM is today. 
            // If arrival is 8:00 AM, 7:30 AM is tomorrow.
            if (breakfastDestA <= arrivalDate) {
                breakfastDestA.setDate(breakfastDestA.getDate() + 1);
            }
            const fastingStartDestA = new Date(breakfastDestA);
            fastingStartDestA.setHours(fastingStartDestA.getHours() - 16);

            // Calculate origin time for Strategy A
            const fastingStartOriginA = new Date(fastingStartDestA.getTime() - (relOffset * 60 * 60 * 1000));

            // --- Strategy B: Relaxed (One day later) ---
            let breakfastDestB = new Date(breakfastDestA);
            breakfastDestB.setDate(breakfastDestB.getDate() + 1);
            const fastingStartDestB = new Date(breakfastDestB);
            fastingStartDestB.setHours(fastingStartDestB.getHours() - 16);

            // --- Strategy Logic: Smart Display ---
            // User Insight: If Rapid Reset falls comfortably AFTER arrival, don't show Relaxed Reset (TMI).
            // Only show Relaxed Reset if Rapid Reset is "hard" (starts before/during flight).

            const strategies = [];

            // 1. Always add Rapid/Optimal
            strategies.push({
                name: "🚀 Rapid Reset (Optimal)",
                tagline: "Optimizes Metabolic Reset",
                breakfastDest: breakfastDestA,
                fastingStartDest: fastingStartDestA,
                offset: relOffset,
                isRecommended: true
            });

            // 2. Conditionally add Relaxed (Only if Rapid is hard)
            // Hard definition: Fasting starts BEFORE arrival (or very tight, e.g. < 2 hour after)
            // Updated to include "Start In-Flight" scenarios as "Hard".
            const isInFlightA = (fastingStartDestA < arrivalDate && fastingStartOriginA >= departureDate);
            if (fastingStartDestA < arrivalDate || isInFlightA || (fastingStartDestA - arrivalDate) < 2 * 60 * 60 * 1000) {
                strategies.push({
                    name: "😌 Relaxed Reset",
                    tagline: "Easier Transition (Start Day 2)",
                    breakfastDest: breakfastDestB,
                    fastingStartDest: fastingStartDestB,
                    offset: relOffset,
                    isRecommended: false
                });
            }

            showSolution('travel', {
                departureDate,
                arrivalDate,
                strategies: strategies,
                durationTotalHours: durationTotalHours
            });
        } catch (error) {
            console.error("Calculation Error", error);
            alert("Calculation Error: " + error.message + "\n\nSee console for details.");
        }
    });

    // Reset Logic
    resetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showSolution('reset');
    });

    function formatTime(date) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }

    function formatDate(date) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
    }

    function getOriginTime(destDate, offset) {
        const originDate = new Date(destDate);
        // Use milliseconds for precision (offset is in hours)
        originDate.setTime(originDate.getTime() - (offset * 60 * 60 * 1000));
        return originDate;
    }

    function generateStepHTML(step, primaryTime = 'dest') {
        let timeLabel = '';
        if (step.timeDest && step.timeOrigin) {
            let mainTime, subTime, mainLabel, subLabel;

            if (primaryTime === 'origin') {
                mainTime = step.timeOrigin;
                subTime = step.timeDest;
                mainLabel = "YOUR TIME & DATE (Current Location)";
                subLabel = "DESTINATION TIME (Future)";
            } else {
                mainTime = step.timeDest;
                subTime = step.timeOrigin;
                mainLabel = "DESTINATION TIME (Local)";
                subLabel = "YOUR BIOLOGICAL TIME";
            }

            timeLabel = `
                <div class="time-container">
                    <div class="time-block main-time">
                        <span class="label">${mainLabel}</span>
                        <span class="value">${formatTime(mainTime)}</span>
                        <span class="date">${formatDate(mainTime)}</span>
                    </div>
                    <div class="time-block sub-time">
                        <span class="label">${subLabel}</span>
                        <span class="value">${formatTime(subTime)}</span>
                        <span class="date">${formatDate(subTime)}</span>
                    </div>
                </div>
            `;
        }

        return `
            <div class="timeline-item">
                <div class="icon">${step.icon}</div>
                <div class="content">
                    ${timeLabel}
                    <p style="font-weight: 700; color: var(--accent); margin-bottom: 5px; font-size: 1.15rem;">${step.title}</p>
                    ${step.subtitle ? `<p style="color: var(--primary); font-weight: 600; font-size: 0.9rem; margin-bottom: 8px;">${step.subtitle}</p>` : ''}
                    <p style="font-size: 0.95rem; color: var(--text-dim); line-height: 1.5;">${step.desc}</p>
                </div>
            </div>
        `;
    }

    function showSolution(type, data = {}) {
        const timeline = document.getElementById('solution-timeline');
        const proTip = document.getElementById('pro-tip');
        const printBtn = document.getElementById('print-btn');
        timeline.innerHTML = '';

        // Show/hide print button based on mode
        if (type === 'travel') {
            printBtn.style.display = 'inline-block';
        } else {
            printBtn.style.display = 'none';
        }

        if (type === 'travel') {
            const { departureDate, arrivalDate, strategies, durationTotalHours } = data;

            // Inject Flight Summary for Print/Display
            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'print-summary';
            summaryDiv.innerHTML = `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #eee;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; text-align: center;">
                        <div>
                            <div style="font-size: 0.8rem; color: #888; font-weight: bold; margin-bottom: 3px;">DEPARTURE</div>
                            <div style="font-weight: 700;">${formatDate(departureDate)}</div>
                            <div style="font-size: 1.1rem;">${formatTime(departureDate)}</div>
                        </div>
                        <div style="border-left: 1px solid #ddd; border-right: 1px solid #ddd;">
                            <div style="font-size: 0.8rem; color: #888; font-weight: bold; margin-bottom: 3px;">ARRIVAL</div>
                            <div style="font-weight: 700;">${formatDate(arrivalDate)}</div>
                            <div style="font-size: 1.1rem;">${formatTime(arrivalDate)}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.8rem; color: #888; font-weight: bold; margin-bottom: 3px;">FLIGHT DURATION</div>
                            <div style="font-weight: 700;">
                                ${Math.round(durationTotalHours * 10) / 10}h
                            </div>
                        </div>
                    </div>
                </div>
            `;
            timeline.appendChild(summaryDiv);

            proTip.innerHTML = "💡 <strong>Traveler's Pro Tip:</strong> If your jet lag is severe, repeat the 3:30 PM fasting routine for 2-3 days after arrival to fully anchor your rhythm.";

            strategies.forEach((strat, index) => {
                const fastingStartOrigin = getOriginTime(strat.fastingStartDest, strat.offset);
                const breakfastOrigin = getOriginTime(strat.breakfastDest, strat.offset);

                let fastingContext = "";
                let fastingTip = "";
                // Logic to confirm if "Start Before Departure"
                const isPreFlight = fastingStartOrigin < departureDate;

                // Rename Strategy dynamically based on timing context
                let displayName = strat.name;
                let displayTagline = strat.tagline;

                // Calculate hours difference between Arrival and Fasting Start
                const hoursBuffer = (strat.fastingStartDest - arrivalDate) / (1000 * 60 * 60);
                const isTightConnection = (hoursBuffer < 2.0 && hoursBuffer >= 0);
                const isInFlight = (strat.fastingStartDest < arrivalDate && !isPreFlight);

                // Determine if we should show Option B
                const shouldShowOptionB = isPreFlight || isInFlight || isTightConnection;

                if (index === 0) {
                    if (isPreFlight) {
                        displayName = shouldShowOptionB ? "🚀 Option A: Start Before Departure" : "🚀 Start Before Departure";
                        displayTagline = "Fasting begins at home (Best for total reset)";
                    } else if (isInFlight || isTightConnection) {
                        displayName = shouldShowOptionB ? "🚀 Option A: Start In-Flight" : "🚀 Start In-Flight";
                        displayTagline = "Fasting begins on the plane (Before Landing)";
                    } else {
                        displayName = "🚀 Your Reset Plan";
                        displayTagline = "Fasting begins after arrival";
                    }
                }

                if (index === 1) { // Relaxed is always post-arrival if shown
                    displayName = "😌 Option B: Start After Arrival";
                }

                // Analyze timing relative to flight for the context Tip

                if (strat.fastingStartDest < arrivalDate) {
                    if (isPreFlight) {
                        fastingContext = "⚠️ BEFORE DEPARTURE";
                        fastingTip = "You must start fasting <strong>before you even get on the plane</strong>.";
                    } else {
                        fastingContext = "✈️ DURING FLIGHT";
                        fastingTip = "Your fasting window begins <strong>while you are in the air</strong>.";
                    }
                } else if (hoursBuffer < 2.0) {
                    // Fasting starts very shortly after landing (< 2 hours).
                    // User won't have time to clear customs and eat.
                    fastingContext = "🛬 BEFORE LANDING";
                    fastingTip = "Fasting starts almost immediately upon arrival. <strong>Eat your final meal ON THE PLANE</strong> before you land to avoid hunger during immigration.";
                } else {
                    fastingContext = "🏨 AFTER ARRIVAL";
                    fastingTip = "You can eat normally upon arrival. Fasting starts later locally.";
                }

                // Determine Primary Time for Fasting Step
                // If Fasting starts BEFORE arrival OR within the tight landing buffer, show Biological/Origin Time logic.
                // Actually, if it's "Before Landing", it's effectively In-Flight logic.
                // Let's decide: If it's "Before Landing", the user is still in transit mode.
                // Should we show Origin? Or Destination? Destination is probably physically closer, but Origin is biological.
                // Let's stick to Origin for anything flight-associated to be safe, OR show Destination but with the warning.
                // Simpler Rule: If it's NOT "After Arrival" (safe), use Origin as primary or emphasize the transition.
                // Re-using the same condition:
                // Re-using the same condition (Already calculated above as isTightConnection)
                const fastingStepPrimary = (strat.fastingStartDest < arrivalDate || isTightConnection) ? 'origin' : 'dest';

                const steps = [
                    {
                        timeDest: strat.fastingStartDest,
                        timeOrigin: fastingStartOrigin,
                        title: "1. Final Meal & Fasting Start",
                        subtitle: `${fastingContext} - FINISH EATING BY THIS TIME`,
                        desc: `
                            <ul style="margin: 0; padding-left: 20px; color: var(--text-dim);">
                                <li style="margin-bottom: 8px;"><strong>The Buffer Meal:</strong> Even if full, eat a light snack (banana, yogurt) 30 mins before this time to prevent hunger.</li>
                                <li><strong>Fasting Begins:</strong> Immediately after this time, <strong>STOP EATING</strong>. Water only.</li>
                            </ul>
                            <div style="margin-top: 10px; font-size: 0.9rem; background: #fff3cd; padding: 10px; border-radius: 4px; color: #856404;">
                                ${fastingTip}
                            </div>
                        `,
                        icon: "🍽️⛔"
                    },
                    {
                        timeDest: strat.breakfastDest,
                        timeOrigin: breakfastOrigin,
                        title: "2. Reset Breakfast",
                        subtitle: "THE SIGNAL TO WAKE UP",
                        desc: "Break your fast with a hearty breakfast. Use light exposure + heavy food to anchor your new rhythm.",
                        icon: "🍳"
                    }
                ];

                // Create Strategy Container
                const stratDiv = document.createElement('div');
                stratDiv.className = index === 0 ? 'strategy-block first-strategy' : 'strategy-block';
                stratDiv.innerHTML = `
                    <div style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
                        <h4 style="color: var(--primary); margin-bottom: 5px;">${displayName}</h4>
                        <p style="color: var(--text-dim); font-size: 0.9rem;">${displayTagline}</p>
                    </div>
                `;

                steps.forEach(step => {
                    // Pass the dynamic primaryTime context
                    // For Breakfast, it's always Destination context.
                    // For Fasting, it depends on 'fastingStepPrimary' logic derived above.
                    const context = (step.title.includes("Breakfast")) ? 'dest' : fastingStepPrimary;
                    stratDiv.innerHTML += generateStepHTML(step, context);
                });

                timeline.appendChild(stratDiv);
            });

        } else {
            // Routine Reset
            proTip.innerHTML = "💡 <strong>Daily Reset Tip:</strong> Consistency is key. Once you reset, try to wake up at the same time every day to maintain the rhythm.";

            const steps = [
                {
                    timeDest: new Date().setHours(15, 0),
                    title: "Buffer Meal",
                    desc: "Eat your breakfast and lunch as usual. Then, between 3:00 PM and 3:30 PM, have a final light meal or snack to prepare for the fast.",
                    icon: "🥗"
                },
                {
                    timeDest: new Date().setHours(15, 30),
                    title: "Start Fasting",
                    desc: "Stop eating completely at 3:30 PM today.",
                    icon: "🤐"
                },
                {
                    timeDest: new Date().setHours(31, 30), // 7:30 AM next day
                    title: "Reset Breakfast",
                    desc: "Eat a hearty breakfast at 7:30 AM tomorrow to wake up your brain.",
                    icon: "☀️"
                }
            ];
            steps.forEach(step => {
                timeline.innerHTML += generateStepHTML(step);
            });
        }

        solutionBox.classList.add('active');
        solutionBox.scrollIntoView({ behavior: 'smooth' });
    }
});
