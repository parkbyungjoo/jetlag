import datetime

def simulate_trip(name, dep_str, arr_str, duration_hours):
    # Format: YYYY-MM-DD HH:MM
    fmt = "%Y-%m-%d %H:%M"
    dep = datetime.datetime.strptime(dep_str, fmt)
    arr = datetime.datetime.strptime(arr_str, fmt)
    
    # Logic from script.js
    # localDiffHours = (arr - dep) / hours
    diff_seconds = (arr - dep).total_seconds()
    local_diff_hours = diff_seconds / 3600
    offset = local_diff_hours - duration_hours
    
    # Strategy A: Rapid
    breakfast_dest_a = arr.replace(hour=7, minute=30, second=0, microsecond=0)
    if breakfast_dest_a <= arr:
        breakfast_dest_a += datetime.timedelta(days=1)
        
    fasting_start_dest_a = breakfast_dest_a - datetime.timedelta(hours=16)
    
    # Strategy B: Relaxed
    breakfast_dest_b = breakfast_dest_a + datetime.timedelta(days=1)
    fasting_start_dest_b = breakfast_dest_b - datetime.timedelta(hours=16)
    
    # Calculate Origins
    # Origin = Dest - Offset (JS: originDate.setHours(originDate.getHours() - offset))
    # Python: origin = dest - timedelta(hours=offset)
    
    fasting_start_origin_a = fasting_start_dest_a - datetime.timedelta(hours=offset)
    breakfast_origin_a = breakfast_dest_a - datetime.timedelta(hours=offset)
    
    fasting_start_origin_b = fasting_start_dest_b - datetime.timedelta(hours=offset)
    breakfast_origin_b = breakfast_dest_b - datetime.timedelta(hours=offset)

    print(f"\n--- Scenario: {name} ---")
    print(f"✈️  Flight: {dep.strftime('%H:%M')} -> {arr.strftime('%H:%M')} (Dur: {duration_hours}h)")
    # print(f"    (Calculated Offset: {offset}h)") 
    
    print(f"\n[Option A: 🚀 Rapid Reset]")
    print(f"1. Buffer Meal: 15:00 - 15:30 (Dest Time)")
    print(f"   (Detected as: {fasting_start_dest_a.strftime('%Y-%m-%d %H:%M')})")
    print(f"   => Your Body Clock: {fasting_start_origin_a.strftime('%m/%d %H:%M')}")
    if fasting_start_dest_a < arr:
        if fasting_start_origin_a < dep:
            print("   ⚠️  Status: Before Departure (Start Fasting at Home)")
        else:
            print("   ✈️  Status: During Flight (Skip Airline Meal)")
    else:
        print("   🏨  Status: After Arrival")
        
    print(f"2. Fasting: Until Breakfast")
    print(f"3. Breakfast: {breakfast_dest_a.strftime('%Y-%m-%d %H:%M')} (Dest)")

    print(f"\n[Option B: 😌 Relaxed Reset]")
    print(f"1. Buffer Meal: 15:00 - 15:30 (Dest Time)")
    print(f"   (Detected as: {fasting_start_dest_b.strftime('%Y-%m-%d %H:%M')})")
    print(f"   => Your Body Clock: {fasting_start_origin_b.strftime('%m/%d %H:%M')}")
    print(f"2. Fasting: Until Breakfast")
    print(f"3. Breakfast: {breakfast_dest_b.strftime('%Y-%m-%d %H:%M')} (Dest)")
    print("-" * 50)

# Scenarios
scenarios = [
    ("1. ICN(Seoul) -> JFK(New York) [Morning Arrival]", "2026-05-01 10:00", "2026-05-01 11:00", 14),
    ("2. JFK(New York) -> LHR(London) [Early Arrival]", "2026-05-01 18:00", "2026-05-02 06:00", 7),
    ("3. HND(Tokyo) -> BKK(Bangkok) [Night Arrival]", "2026-05-01 17:00", "2026-05-01 21:30", 6.5),
    ("4. LHR(London) -> ICN(Seoul) [Afternoon Arrival]", "2026-05-01 13:00", "2026-05-02 08:30", 11.5),
    ("5. LAX(LA) -> SYD(Sydney) [Morning Arrival]", "2026-05-01 22:30", "2026-05-03 06:30", 15),
    ("6. CDG(Paris) -> JFK(New York) [Afternoon Arrival]", "2026-05-01 13:00", "2026-05-01 15:30", 8.5),
    ("7. JFK(New York) -> LAX(LA) [Day Flight]", "2026-05-01 07:00", "2026-05-01 10:30", 6.5),
    ("8. ICN(Seoul) -> SFO(San Francisco) [Lunch Arrival]", "2026-05-01 16:30", "2026-05-01 11:00", 10.5),
    ("9. DXB(Dubai) -> AKL(Auckland) [Ultra Long Late Arr]", "2026-05-01 10:00", "2026-05-02 10:00", 16), # Fake times, purely for logic check
    ("10. SIN(Singapore) -> FRA(Frankfurt) [Early Morning]", "2026-05-01 23:55", "2026-05-02 06:30", 13.5)
]

print("Verifying JetLag Reset Logic for 10 Scenarios...\n")
for sc in scenarios:
    simulate_trip(sc[0], sc[1], sc[2], sc[3])
