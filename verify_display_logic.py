from datetime import datetime, timedelta

def format_time(dt):
    # Returns "3:30 PM" format
    return dt.strftime("%-I:%M %p")

def format_date(dt):
    # Returns "Sat, Jan 17" format
    return dt.strftime("%a, %b %-d")

def generate_step_html_simulation(step, primary_time='dest'):
    # Simulates the HTML generation by printing structured text
    output = []
    
    if step.get('timeDest') and step.get('timeOrigin'):
        main_time = None
        sub_time = None
        main_label = ""
        sub_label = ""
        
        if primary_time == 'origin':
            main_time = step['timeOrigin']
            sub_time = step['timeDest']
            main_label = "YOUR TIME & DATE (Current Location)"
            sub_label = "DESTINATION TIME (Future)"
        else:
            main_time = step['timeDest']
            sub_time = step['timeOrigin']
            main_label = "DESTINATION TIME (Local)"
            sub_label = "YOUR BIOLOGICAL TIME"
            
        output.append(f"   [{main_label}]")
        output.append(f"   ** {format_time(main_time)} **")
        output.append(f"   {format_date(main_time)}")
        output.append(f"   -------------------")
        output.append(f"   [{sub_label}]")
        output.append(f"   {format_time(sub_time)}")
        output.append(f"   {format_date(sub_time)}")
        output.append("")
    
    output.append(f"   {step['icon']} {step['title']}")
    if step.get('subtitle'):
        output.append(f"   SUB: {step['subtitle']}")
    # Clean up description for console print (remove HTML tags)
    desc = step['desc'].replace("<br>", "\n       ").replace("<strong>", "").replace("</strong>", "").replace("<ul>", "").replace("</ul>", "").replace("<li>", "- ").replace("</li>", "").replace("<div style=\"margin-top: 10px; font-size: 0.9rem; background: #fff3cd; padding: 10px; border-radius: 4px; color: #856404;\">", "\n       [TIP BLOCK]: ").replace("</div>", "")
    output.append(f"   DESC: {desc}")
    return "\n".join(output)

def run_test_case(scenario_name, dep_str, arr_str, duration_hm):
    # dep_str: "2026-01-17T10:30" (YYYY-MM-DDTHH:MM)
    # duration_hm: (hours, minutes)
    
    print(f"\n{'='*60}")
    print(f"SCENARIO: {scenario_name}")
    print(f"Departure: {dep_str}")
    print(f"Arrival:   {arr_str}")
    print(f"Flight:    {duration_hm[0]}h {duration_hm[1]}m")
    print(f"{'='*60}")

    dep = datetime.strptime(dep_str, "%Y-%m-%dT%H:%M")
    arr = datetime.strptime(arr_str, "%Y-%m-%dT%H:%M")
    
    dur_total_hours = duration_hm[0] + (duration_hm[1] / 60.0)
    
    # Logic from script.js
    local_diff_hours = (arr - dep).total_seconds() / 3600.0
    # relOffset = localDiffHours - durationTotalHours 
    # (Using Python logic: offset is positive towards East, negative towards West relative to duration?)
    # Wait, in JS script:
    # const localDiffHours = (arrivalDate - departureDate) / (1000 * 60 * 60);
    # const relOffset = localDiffHours - durationTotalHours;
    # getOriginTime logic: originDate.setHours(originDate.getHours() - offset);
    # It subtracts offset from Dest to get Origin.
    
    rel_offset = local_diff_hours - dur_total_hours
    
    def get_origin_time(dest_dt):
        return dest_dt - timedelta(hours=rel_offset)

    # Strategy A
    breakfast_dest_a = arr.replace(hour=7, minute=30, second=0, microsecond=0)
    if breakfast_dest_a <= arr:
        breakfast_dest_a += timedelta(days=1)
        
    fasting_start_dest_a = breakfast_dest_a - timedelta(hours=16)
    
    strategies = []
    
    strategies.append({
        'name': "Rapid Reset (Optimal)",
        'tagline': "Beats Jet Lag Immediately",
        'breakfastDest': breakfast_dest_a,
        'fastingStartDest': fasting_start_dest_a,
        'idx': 0
    })
    
    # Updated Condition from script.js
    # if (fastingStartDestA < arrivalDate || (fastingStartDestA - arrivalDate) < 2 * 60 * 60 * 1000)
    
    diff_seconds = (fasting_start_dest_a - arr).total_seconds()
    
    if fasting_start_dest_a < arr or diff_seconds < 7200:
         # Strategy B
        breakfast_dest_b = breakfast_dest_a + timedelta(days=1)
        fasting_start_dest_b = breakfast_dest_b - timedelta(hours=16)
        strategies.append({
            'name': "Relaxed Reset",
            'tagline': "Easier Transition (Start Day 2)",
            'breakfastDest': breakfast_dest_b,
            'fastingStartDest': fasting_start_dest_b,
            'idx': 1
        })
        
    for strat in strategies:
        fasting_start_origin = get_origin_time(strat['fastingStartDest'])
        breakfast_origin = get_origin_time(strat['breakfastDest'])
        
        is_pre_flight = fasting_start_origin < dep
        
        display_name = strat['name']
        display_tagline = strat['tagline']
        
        if strat['idx'] == 0:
            if is_pre_flight:
                display_name = "🚀 Option A: Start Before Departure"
                display_tagline = "Fasting begins at home (Best for total reset)"
            else:
                display_name = "🚀 Option A: Start After Arrival"
        
        if strat['idx'] == 1:
            display_name = "😌 Option B: Start After Arrival"

        fasting_context = ""
        fasting_tip = ""
        
        if strat['fastingStartDest'] < arr:
            if is_pre_flight:
                fasting_context = "⚠️ BEFORE DEPARTURE"
                fasting_tip = "You must start fasting BEFORE DEPARTURE (At Home)."
            else:
                fasting_context = "✈️ DURING FLIGHT"
                fasting_tip = "Your fasting window begins WHILE IN THE AIR."
        else:
             fasting_context = "🏨 AFTER ARRIVAL"
             fasting_tip = "You can eat normally upon arrival."
             
        fasting_step_primary = 'origin' if (strat['fastingStartDest'] < arr) else 'dest'

        print(f"\n--- {display_name} ---")
        print(f"    ({display_tagline})")
        
        steps = [
            {
                'timeDest': strat['fastingStartDest'],
                'timeOrigin': fasting_start_origin,
                'title': "1. Final Meal & Fasting Start",
                'subtitle': f"{fasting_context} - FINISH EATING BY THIS TIME",
                'desc': f"The Buffer Meal... Fasting Begins... \n       [TIP BLOCK]: {fasting_tip}",
                'icon': "🍽️⛔"
            },
            {
                'timeDest': strat['breakfastDest'],
                'timeOrigin': breakfast_origin,
                'title': "2. Reset Breakfast",
                'subtitle': "THE SIGNAL TO WAKE UP",
                'desc': "Break your fast with a hearty breakfast...",
                'icon': "🍳"
            }
        ]
        
        for step in steps:
            context = 'dest' if "Breakfast" in step['title'] else fasting_step_primary
            print(generate_step_html_simulation(step, context))
            print("")


# 1. LAX -> ICN (West to East Long) 
# Dep: Jan 17, 10:30 AM
# Arr: Jan 18, 5:30 PM
# Flight: 13h
run_test_case("1. LAX -> ICN (Start Before Departure?)", "2026-01-17T10:30", "2026-01-18T17:30", (13, 0))

# 2. ICN -> LAX (East to West Long)
# Dep: Jan 17, 8:00 PM
# Arr: Jan 17, 3:00 PM
# Flight: 11h
run_test_case("2. ICN -> LAX (Start During/After?)", "2026-01-17T20:00", "2026-01-17T15:00", (11, 0))

# 3. NY -> LON (Red Eye)
# Dep: Jan 17, 6:30 PM
# Arr: Jan 18, 6:30 AM
# Flight: 7h
run_test_case("3. NY -> LON (Short Red Eye)", "2026-01-17T18:30", "2026-01-18T06:30", (7, 0))

# 4. LON -> NY (Daytime)
# Dep: Jan 17, 10:00 AM
# Arr: Jan 17, 1:00 PM
# Flight: 8h
run_test_case("4. LON -> NY (Daytime Flight)", "2026-01-17T10:00", "2026-01-17T13:00", (8, 0))

# 5. SYD -> LAX 
# Dep: Jan 17, 11:00 AM
# Arr: Jan 17, 6:00 AM
# Flight: 14h
run_test_case("5. SYD -> LAX (Arrive before you leave)", "2026-01-17T11:00", "2026-01-17T06:00", (14, 0))

# 6. LAX -> SYD
# Dep: Jan 17, 10:30 PM
# Arr: Jan 19, 6:30 AM (2 days later)
# Flight: 15h
run_test_case("6. LAX -> SYD (Lose a day)", "2026-01-17T22:30", "2026-01-19T06:30", (15, 0))

# 7. SFO -> Tokyo
# Dep: Jan 17, 11:00 AM
# Arr: Jan 18, 3:00 PM
# Flight: 11h
run_test_case("7. SFO -> Tokyo", "2026-01-17T11:00", "2026-01-18T15:00", (11, 0))

# 8. Paris -> Dubai
# Dep: Jan 17, 2:00 PM
# Arr: Jan 17, 11:45 PM
# Flight: 6h 45m
run_test_case("8. Paris -> Dubai", "2026-01-17T14:00", "2026-01-17T23:45", (6, 45))

# 9. Dubai -> Singapore
# Dep: Jan 17, 3:00 AM
# Arr: Jan 17, 2:30 PM
# Flight: 7h 30m
run_test_case("9. Dubai -> Singapore", "2026-01-17T03:00", "2026-01-17T14:30", (7, 30))

# 10. Hawaii -> LAX
# Dep: Jan 17, 10:00 PM
# Arr: Jan 18, 5:30 AM
# Flight: 5h 30m
run_test_case("10. Hawaii -> LAX (Red Eye Domestic)", "2026-01-17T22:00", "2026-01-18T05:30", (5, 30))
