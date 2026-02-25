
create table if not exists public.workout_plan_configs (
  schema_version text primary key,
  config jsonb not null,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create table if not exists public.plan_levels (
  id serial primary key,
  code text unique not null check (code in ('Beginner', 'Intermediate', 'Advanced')),
  portion_multiplier numeric(4,2) not null,
  training_multiplier numeric(4,2) not null,
  notes text
);

insert into public.plan_levels (code, portion_multiplier, training_multiplier, notes)
values
  ('Beginner', 1.00, 1.00, 'Days 1-30'),
  ('Intermediate', 1.10, 1.15, 'Days 31-60 (+10% portions, +15% burn)'),
  ('Advanced', 1.20, 1.30, 'Days 61-90 (+20% portions, +30% burn)')
on conflict (code) do update
set portion_multiplier = excluded.portion_multiplier,
    training_multiplier = excluded.training_multiplier,
    notes = excluded.notes;

insert into public.workout_plan_configs (schema_version, config)
values (
  '1.0',
  $${
  "schemaVersion": "1.0",
  "levels": [
    "Beginner",
    "Intermediate",
    "Advanced"
  ],
  "rules": {
    "levelByDay": {
      "1-30": "Beginner",
      "31-60": "Intermediate",
      "61-90": "Advanced"
    },
    "progression": {
      "Beginner": {
        "weeklyIncrementPct": 5,
        "maxPct": 15
      },
      "Intermediate": {
        "weeklyIncrementPct": 7,
        "maxPct": 21
      },
      "Advanced": {
        "weeklyIncrementPct": 10,
        "maxPct": 30
      }
    },
    "burnMultipliers": {
      "Beginner": 1.0,
      "Intermediate": 1.15,
      "Advanced": 1.3
    },
    "note": "Use these 7-day seed weeks and apply weekly progression + burn multipliers to auto-generate 90 days."
  },
  "plan": {
    "Lose Weight": {
      "seedWeek": {
        "Beginner": {
          "Mon": {
            "workouts": [
              {
                "exercise": "Jumping Jacks",
                "prescription": "3x30s",
                "video": "https://www.youtube.com/watch?v=RO_iZNEB9IU", "thumbnail": "https://i.ytimg.com/vi/RO_iZNEB9IU/hqdefault.jpg"
              },
              {
                "exercise": "High Knees",
                "prescription": "3x30s",
                "video": "https://www.youtube.com/watch?v=y5nNMQSGbBQ", "thumbnail": "https://i.ytimg.com/vi/y5nNMQSGbBQ/hqdefault.jpg"
              },
              {
                "exercise": "Mountain Climbers",
                "prescription": "3x25s",
                "video": "https://www.youtube.com/watch?v=nmwgirgXLYM", "thumbnail": "https://i.ytimg.com/vi/nmwgirgXLYM/hqdefault.jpg"
              },
              {
                "exercise": "Plank",
                "prescription": "3x25s",
                "video": "https://www.youtube.com/watch?v=dnERKMqkd3k", "thumbnail": "https://i.ytimg.com/vi/dnERKMqkd3k/hqdefault.jpg"
              }
            ],
            "baseBurn": 320
          },
          "Tue": {
            "workouts": [
              {
                "exercise": "Bodyweight Squats",
                "prescription": "3x15",
                "video": "https://www.youtube.com/watch?v=aclHkVaku9U", "thumbnail": "https://i.ytimg.com/vi/aclHkVaku9U/hqdefault.jpg"
              },
              {
                "exercise": "Forward Lunges",
                "prescription": "3x10/leg",
                "video": "https://www.youtube.com/watch?v=_PQm64POLOk", "thumbnail": "https://i.ytimg.com/vi/_PQm64POLOk/hqdefault.jpg"
              },
              {
                "exercise": "Glute Bridges",
                "prescription": "3x15",
                "video": "https://www.youtube.com/watch?v=wPM8icPu6H8", "thumbnail": "https://i.ytimg.com/vi/wPM8icPu6H8/hqdefault.jpg"
              },
              {
                "exercise": "Side Plank",
                "prescription": "3x20s/side",
                "video": "https://www.youtube.com/watch?v=UrAUan4fPYE", "thumbnail": "https://i.ytimg.com/vi/UrAUan4fPYE/hqdefault.jpg"
              }
            ],
            "baseBurn": 300
          },
          "Wed": {
            "workouts": [
              {
                "exercise": "Brisk Walk / March in Place",
                "prescription": "25 min",
                "video": "https://www.youtube.com/watch?v=y5nNMQSGbBQ", "thumbnail": "https://i.ytimg.com/vi/y5nNMQSGbBQ/hqdefault.jpg"
              },
              {
                "exercise": "Dynamic Stretching",
                "prescription": "10 min",
                "video": "https://www.youtube.com/watch?v=M6NDLs-ORiU", "thumbnail": "https://i.ytimg.com/vi/M6NDLs-ORiU/hqdefault.jpg"
              }
            ],
            "baseBurn": 180
          },
          "Thu": {
            "workouts": [
              {
                "exercise": "Jump Squats",
                "prescription": "3x12",
                "video": "https://www.youtube.com/watch?v=U4s4mEQ5VqU", "thumbnail": "https://i.ytimg.com/vi/U4s4mEQ5VqU/hqdefault.jpg"
              },
              {
                "exercise": "Push-ups",
                "prescription": "3x10",
                "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8", "thumbnail": "https://i.ytimg.com/vi/_l3ySVKYVJ8/hqdefault.jpg"
              },
              {
                "exercise": "Burpees",
                "prescription": "3x8",
                "video": "https://www.youtube.com/watch?v=EmXaVk2k0GM", "thumbnail": "https://i.ytimg.com/vi/EmXaVk2k0GM/hqdefault.jpg"
              },
              {
                "exercise": "Plank Shoulder Taps",
                "prescription": "3x16",
                "video": "https://www.youtube.com/watch?v=KM46AG4YuNM", "thumbnail": "https://i.ytimg.com/vi/KM46AG4YuNM/hqdefault.jpg"
              }
            ],
            "baseBurn": 350
          },
          "Fri": {
            "workouts": [
              {
                "exercise": "Crunches",
                "prescription": "3x18",
                "video": "https://www.youtube.com/watch?v=EAyx9zvSTfc", "thumbnail": "https://i.ytimg.com/vi/EAyx9zvSTfc/hqdefault.jpg"
              },
              {
                "exercise": "Bicycle Crunches",
                "prescription": "3x16",
                "video": "https://www.youtube.com/watch?v=9FGilxCbdz8", "thumbnail": "https://i.ytimg.com/vi/9FGilxCbdz8/hqdefault.jpg"
              },
              {
                "exercise": "Flutter Kicks",
                "prescription": "3x25s",
                "video": "https://www.youtube.com/watch?v=KM46AG4YuNM", "thumbnail": "https://i.ytimg.com/vi/KM46AG4YuNM/hqdefault.jpg"
              },
              {
                "exercise": "Russian Twists",
                "prescription": "3x18",
                "video": "https://www.youtube.com/watch?v=wkD8rjkodUI", "thumbnail": "https://i.ytimg.com/vi/wkD8rjkodUI/hqdefault.jpg"
              }
            ],
            "baseBurn": 280
          },
          "Sat": {
            "workouts": [
              {
                "exercise": "Full Body Circuit (Squat \u2192 Push-up \u2192 Lunge \u2192 Plank)",
                "prescription": "3 rounds",
                "video": "https://www.youtube.com/watch?v=UBMk30rjy0o", "thumbnail": "https://i.ytimg.com/vi/UBMk30rjy0o/hqdefault.jpg"
              }
            ],
            "baseBurn": 360
          },
          "Sun": {
            "workouts": [
              {
                "exercise": "Yoga / Stretch Recovery",
                "prescription": "20-30 min",
                "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE", "thumbnail": "https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg"
              }
            ],
            "baseBurn": 160
          }
        },
        "Intermediate": {
          "Mon": {
            "workouts": [
              {
                "exercise": "Jumping Jacks",
                "prescription": "4x35s",
                "video": "https://www.youtube.com/watch?v=RO_iZNEB9IU", "thumbnail": "https://i.ytimg.com/vi/RO_iZNEB9IU/hqdefault.jpg"
              },
              {
                "exercise": "High Knees",
                "prescription": "4x35s",
                "video": "https://www.youtube.com/watch?v=y5nNMQSGbBQ", "thumbnail": "https://i.ytimg.com/vi/y5nNMQSGbBQ/hqdefault.jpg"
              },
              {
                "exercise": "Mountain Climbers",
                "prescription": "4x30s",
                "video": "https://www.youtube.com/watch?v=nmwgirgXLYM", "thumbnail": "https://i.ytimg.com/vi/nmwgirgXLYM/hqdefault.jpg"
              },
              {
                "exercise": "Plank",
                "prescription": "3x35s",
                "video": "https://www.youtube.com/watch?v=dnERKMqkd3k", "thumbnail": "https://i.ytimg.com/vi/dnERKMqkd3k/hqdefault.jpg"
              }
            ],
            "baseBurn": 380
          },
          "Tue": {
            "workouts": [
              {
                "exercise": "Bodyweight Squats",
                "prescription": "4x18",
                "video": "https://www.youtube.com/watch?v=aclHkVaku9U", "thumbnail": "https://i.ytimg.com/vi/aclHkVaku9U/hqdefault.jpg"
              },
              {
                "exercise": "Forward Lunges",
                "prescription": "4x12/leg",
                "video": "https://www.youtube.com/watch?v=_PQm64POLOk", "thumbnail": "https://i.ytimg.com/vi/_PQm64POLOk/hqdefault.jpg"
              },
              {
                "exercise": "Glute Bridges",
                "prescription": "4x18",
                "video": "https://www.youtube.com/watch?v=wPM8icPu6H8", "thumbnail": "https://i.ytimg.com/vi/wPM8icPu6H8/hqdefault.jpg"
              },
              {
                "exercise": "Side Plank",
                "prescription": "3x30s/side",
                "video": "https://www.youtube.com/watch?v=UrAUan4fPYE", "thumbnail": "https://i.ytimg.com/vi/UrAUan4fPYE/hqdefault.jpg"
              }
            ],
            "baseBurn": 345
          },
          "Wed": {
            "workouts": [
              {
                "exercise": "Brisk Walk / March in Place",
                "prescription": "30 min",
                "video": "https://www.youtube.com/watch?v=y5nNMQSGbBQ", "thumbnail": "https://i.ytimg.com/vi/y5nNMQSGbBQ/hqdefault.jpg"
              },
              {
                "exercise": "Mobility Flow",
                "prescription": "12 min",
                "video": "https://www.youtube.com/watch?v=M6NDLs-ORiU", "thumbnail": "https://i.ytimg.com/vi/M6NDLs-ORiU/hqdefault.jpg"
              }
            ],
            "baseBurn": 210
          },
          "Thu": {
            "workouts": [
              {
                "exercise": "Jump Squats",
                "prescription": "4x12",
                "video": "https://www.youtube.com/watch?v=U4s4mEQ5VqU", "thumbnail": "https://i.ytimg.com/vi/U4s4mEQ5VqU/hqdefault.jpg"
              },
              {
                "exercise": "Push-ups",
                "prescription": "4x12",
                "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8", "thumbnail": "https://i.ytimg.com/vi/_l3ySVKYVJ8/hqdefault.jpg"
              },
              {
                "exercise": "Burpees",
                "prescription": "3x10",
                "video": "https://www.youtube.com/watch?v=EmXaVk2k0GM", "thumbnail": "https://i.ytimg.com/vi/EmXaVk2k0GM/hqdefault.jpg"
              },
              {
                "exercise": "Plank Shoulder Taps",
                "prescription": "3x20",
                "video": "https://www.youtube.com/watch?v=KM46AG4YuNM", "thumbnail": "https://i.ytimg.com/vi/KM46AG4YuNM/hqdefault.jpg"
              }
            ],
            "baseBurn": 400
          },
          "Fri": {
            "workouts": [
              {
                "exercise": "Crunches",
                "prescription": "4x20",
                "video": "https://www.youtube.com/watch?v=EAyx9zvSTfc", "thumbnail": "https://i.ytimg.com/vi/EAyx9zvSTfc/hqdefault.jpg"
              },
              {
                "exercise": "Bicycle Crunches",
                "prescription": "4x18",
                "video": "https://www.youtube.com/watch?v=9FGilxCbdz8", "thumbnail": "https://i.ytimg.com/vi/9FGilxCbdz8/hqdefault.jpg"
              },
              {
                "exercise": "Flutter Kicks",
                "prescription": "4x30s",
                "video": "https://www.youtube.com/watch?v=KM46AG4YuNM", "thumbnail": "https://i.ytimg.com/vi/KM46AG4YuNM/hqdefault.jpg"
              },
              {
                "exercise": "Russian Twists",
                "prescription": "4x20",
                "video": "https://www.youtube.com/watch?v=wkD8rjkodUI", "thumbnail": "https://i.ytimg.com/vi/wkD8rjkodUI/hqdefault.jpg"
              }
            ],
            "baseBurn": 320
          },
          "Sat": {
            "workouts": [
              {
                "exercise": "Full Body Circuit (Squat \u2192 Push-up \u2192 Lunge \u2192 Plank)",
                "prescription": "4 rounds",
                "video": "https://www.youtube.com/watch?v=UBMk30rjy0o", "thumbnail": "https://i.ytimg.com/vi/UBMk30rjy0o/hqdefault.jpg"
              }
            ],
            "baseBurn": 420
          },
          "Sun": {
            "workouts": [
              {
                "exercise": "Yoga / Stretch Recovery",
                "prescription": "25-35 min",
                "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE", "thumbnail": "https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg"
              }
            ],
            "baseBurn": 170
          }
        },
        "Advanced": {
          "Mon": {
            "workouts": [
              {
                "exercise": "Jumping Jacks",
                "prescription": "5x40s",
                "video": "https://www.youtube.com/watch?v=RO_iZNEB9IU", "thumbnail": "https://i.ytimg.com/vi/RO_iZNEB9IU/hqdefault.jpg"
              },
              {
                "exercise": "High Knees",
                "prescription": "5x40s",
                "video": "https://www.youtube.com/watch?v=y5nNMQSGbBQ", "thumbnail": "https://i.ytimg.com/vi/y5nNMQSGbBQ/hqdefault.jpg"
              },
              {
                "exercise": "Mountain Climbers",
                "prescription": "4x40s",
                "video": "https://www.youtube.com/watch?v=nmwgirgXLYM", "thumbnail": "https://i.ytimg.com/vi/nmwgirgXLYM/hqdefault.jpg"
              },
              {
                "exercise": "Plank",
                "prescription": "3x45s",
                "video": "https://www.youtube.com/watch?v=dnERKMqkd3k", "thumbnail": "https://i.ytimg.com/vi/dnERKMqkd3k/hqdefault.jpg"
              }
            ],
            "baseBurn": 416
          },
          "Tue": {
            "workouts": [
              {
                "exercise": "Bodyweight Squats",
                "prescription": "5x20",
                "video": "https://www.youtube.com/watch?v=aclHkVaku9U", "thumbnail": "https://i.ytimg.com/vi/aclHkVaku9U/hqdefault.jpg"
              },
              {
                "exercise": "Forward Lunges",
                "prescription": "4x14/leg",
                "video": "https://www.youtube.com/watch?v=_PQm64POLOk", "thumbnail": "https://i.ytimg.com/vi/_PQm64POLOk/hqdefault.jpg"
              },
              {
                "exercise": "Glute Bridges",
                "prescription": "4x20",
                "video": "https://www.youtube.com/watch?v=wPM8icPu6H8", "thumbnail": "https://i.ytimg.com/vi/wPM8icPu6H8/hqdefault.jpg"
              },
              {
                "exercise": "Side Plank",
                "prescription": "3x40s/side",
                "video": "https://www.youtube.com/watch?v=UrAUan4fPYE", "thumbnail": "https://i.ytimg.com/vi/UrAUan4fPYE/hqdefault.jpg"
              }
            ],
            "baseBurn": 390
          },
          "Wed": {
            "workouts": [
              {
                "exercise": "Tempo Walk/Jog",
                "prescription": "35 min",
                "video": "https://www.youtube.com/watch?v=y5nNMQSGbBQ", "thumbnail": "https://i.ytimg.com/vi/y5nNMQSGbBQ/hqdefault.jpg"
              },
              {
                "exercise": "Mobility Flow",
                "prescription": "12 min",
                "video": "https://www.youtube.com/watch?v=M6NDLs-ORiU", "thumbnail": "https://i.ytimg.com/vi/M6NDLs-ORiU/hqdefault.jpg"
              }
            ],
            "baseBurn": 230
          },
          "Thu": {
            "workouts": [
              {
                "exercise": "Jump Squats",
                "prescription": "5x12",
                "video": "https://www.youtube.com/watch?v=U4s4mEQ5VqU", "thumbnail": "https://i.ytimg.com/vi/U4s4mEQ5VqU/hqdefault.jpg"
              },
              {
                "exercise": "Push-ups",
                "prescription": "4x15",
                "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8", "thumbnail": "https://i.ytimg.com/vi/_l3ySVKYVJ8/hqdefault.jpg"
              },
              {
                "exercise": "Burpees",
                "prescription": "4x10",
                "video": "https://www.youtube.com/watch?v=EmXaVk2k0GM", "thumbnail": "https://i.ytimg.com/vi/EmXaVk2k0GM/hqdefault.jpg"
              },
              {
                "exercise": "Plank Shoulder Taps",
                "prescription": "4x20",
                "video": "https://www.youtube.com/watch?v=KM46AG4YuNM", "thumbnail": "https://i.ytimg.com/vi/KM46AG4YuNM/hqdefault.jpg"
              }
            ],
            "baseBurn": 455
          },
          "Fri": {
            "workouts": [
              {
                "exercise": "Crunches",
                "prescription": "4x24",
                "video": "https://www.youtube.com/watch?v=EAyx9zvSTfc", "thumbnail": "https://i.ytimg.com/vi/EAyx9zvSTfc/hqdefault.jpg"
              },
              {
                "exercise": "Bicycle Crunches",
                "prescription": "4x22",
                "video": "https://www.youtube.com/watch?v=9FGilxCbdz8", "thumbnail": "https://i.ytimg.com/vi/9FGilxCbdz8/hqdefault.jpg"
              },
              {
                "exercise": "Flutter Kicks",
                "prescription": "4x35s",
                "video": "https://www.youtube.com/watch?v=KM46AG4YuNM", "thumbnail": "https://i.ytimg.com/vi/KM46AG4YuNM/hqdefault.jpg"
              },
              {
                "exercise": "Russian Twists",
                "prescription": "4x24",
                "video": "https://www.youtube.com/watch?v=wkD8rjkodUI", "thumbnail": "https://i.ytimg.com/vi/wkD8rjkodUI/hqdefault.jpg"
              }
            ],
            "baseBurn": 365
          },
          "Sat": {
            "workouts": [
              {
                "exercise": "Full Body Circuit (Squat \u2192 Push-up \u2192 Lunge \u2192 Plank)",
                "prescription": "5 rounds",
                "video": "https://www.youtube.com/watch?v=UBMk30rjy0o", "thumbnail": "https://i.ytimg.com/vi/UBMk30rjy0o/hqdefault.jpg"
              }
            ],
            "baseBurn": 468
          },
          "Sun": {
            "workouts": [
              {
                "exercise": "Yoga / Stretch Recovery",
                "prescription": "25-35 min",
                "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE", "thumbnail": "https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg"
              }
            ],
            "baseBurn": 175
          }
        }
      }
    },
    "Build Muscle": {
      "seedWeek": {
        "Beginner": {
          "Mon": {
            "workouts": [
              { "exercise": "Push-ups", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8", "thumbnail": "https://i.ytimg.com/vi/_l3ySVKYVJ8/hqdefault.jpg" },
              { "exercise": "Bodyweight Rows (table)", "prescription": "4x8", "video": "https://www.youtube.com/watch?v=6kALZikXxLc", "thumbnail": "https://i.ytimg.com/vi/6kALZikXxLc/hqdefault.jpg" },
              { "exercise": "Squats", "prescription": "4x18", "video": "https://www.youtube.com/watch?v=601fB5fQvjE", "thumbnail": "https://i.ytimg.com/vi/601fB5fQvjE/hqdefault.jpg" },
              { "exercise": "Chair Dips", "prescription": "3x10", "video": "https://www.youtube.com/watch?v=0326dy_-CzM", "thumbnail": "https://i.ytimg.com/vi/0326dy_-CzM/hqdefault.jpg" }
            ],
            "baseBurn": 340
          },
          "Tue": {
            "workouts": [
              { "exercise": "Lunges", "prescription": "4x10/leg", "video": "https://www.youtube.com/watch?v=YZbyE7U6Gos", "thumbnail": "https://i.ytimg.com/vi/YZbyE7U6Gos/hqdefault.jpg" },
              { "exercise": "Glute Bridges", "prescription": "4x18", "video": "https://www.youtube.com/watch?v=wPM8icPu6H8", "thumbnail": "https://i.ytimg.com/vi/wPM8icPu6H8/hqdefault.jpg" },
              { "exercise": "Leg Raises", "prescription": "3x12", "video": "https://www.youtube.com/watch?v=JB2oyawG9KI", "thumbnail": "https://i.ytimg.com/vi/JB2oyawG9KI/hqdefault.jpg" }
            ],
            "baseBurn": 300
          },
          "Wed": {
            "workouts": [
              { "exercise": "Yoga Mobility", "prescription": "20 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE", "thumbnail": "https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg" }
            ],
            "baseBurn": 150
          },
          "Thu": {
            "workouts": [
              { "exercise": "Diamond Push-ups", "prescription": "3x8", "video": "https://www.youtube.com/watch?v=J0DnG1_S92I", "thumbnail": "https://i.ytimg.com/vi/J0DnG1_S92I/hqdefault.jpg" },
              { "exercise": "Tricep Dips", "prescription": "3x12", "video": "https://www.youtube.com/watch?v=zFCMz1NkwQo", "thumbnail": "https://i.ytimg.com/vi/zFCMz1NkwQo/hqdefault.jpg" },
              { "exercise": "Mountain Climbers", "prescription": "3x30s", "video": "https://www.youtube.com/watch?v=nmwgirgXLYM", "thumbnail": "https://i.ytimg.com/vi/nmwgirgXLYM/hqdefault.jpg" }
            ],
            "baseBurn": 320
          },
          "Fri": {
            "workouts": [
              { "exercise": "Pull-ups", "prescription": "3x6", "video": "https://www.youtube.com/watch?v=eGo4IYlbE5g", "thumbnail": "https://i.ytimg.com/vi/eGo4IYlbE5g/hqdefault.jpg" },
              { "exercise": "Calf Raises", "prescription": "3x18", "video": "https://www.youtube.com/watch?v=-M4-G8p8fmc", "thumbnail": "https://i.ytimg.com/vi/-M4-G8p8fmc/hqdefault.jpg" },
              { "exercise": "Squats", "prescription": "3x18", "video": "https://www.youtube.com/watch?v=601fB5fQvjE", "thumbnail": "https://i.ytimg.com/vi/601fB5fQvjE/hqdefault.jpg" }
            ],
            "baseBurn": 330
          },
          "Sat": {
            "workouts": [
              { "exercise": "Full Body Strength Circuit", "prescription": "3 rounds", "video": "https://www.youtube.com/watch?v=UItWltVZZmE", "thumbnail": "https://i.ytimg.com/vi/UItWltVZZmE/hqdefault.jpg" }
            ],
            "baseBurn": 360
          },
          "Sun": {
            "workouts": [
              { "exercise": "Active Stretch", "prescription": "20-30 min", "video": "https://www.youtube.com/watch?v=sTANio_2E0Q", "thumbnail": "https://i.ytimg.com/vi/sTANio_2E0Q/hqdefault.jpg" }
            ],
            "baseBurn": 140
          }
        },
        "Intermediate": {
          "Mon": {
            "workouts": [
              { "exercise": "Push-ups", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8", "thumbnail": "https://i.ytimg.com/vi/_l3ySVKYVJ8/hqdefault.jpg" },
              { "exercise": "Bodyweight Rows (table)", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=6kALZikXxLc", "thumbnail": "https://i.ytimg.com/vi/6kALZikXxLc/hqdefault.jpg" },
              { "exercise": "Squats", "prescription": "4x22", "video": "https://www.youtube.com/watch?v=601fB5fQvjE", "thumbnail": "https://i.ytimg.com/vi/601fB5fQvjE/hqdefault.jpg" },
              { "exercise": "Chair Dips", "prescription": "3x12", "video": "https://www.youtube.com/watch?v=0326dy_-CzM", "thumbnail": "https://i.ytimg.com/vi/0326dy_-CzM/hqdefault.jpg" }
            ],
            "baseBurn": 390
          },
          "Tue": {
            "workouts": [
              { "exercise": "Lunges", "prescription": "4x12/leg", "video": "https://www.youtube.com/watch?v=YZbyE7U6Gos", "thumbnail": "https://i.ytimg.com/vi/YZbyE7U6Gos/hqdefault.jpg" },
              { "exercise": "Glute Bridges", "prescription": "4x20", "video": "https://www.youtube.com/watch?v=wPM8icPu6H8", "thumbnail": "https://i.ytimg.com/vi/wPM8icPu6H8/hqdefault.jpg" },
              { "exercise": "Leg Raises", "prescription": "3x15", "video": "https://www.youtube.com/watch?v=JB2oyawG9KI", "thumbnail": "https://i.ytimg.com/vi/JB2oyawG9KI/hqdefault.jpg" }
            ],
            "baseBurn": 340
          },
          "Wed": {
            "workouts": [
              { "exercise": "Yoga Mobility", "prescription": "25 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE", "thumbnail": "https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg" }
            ],
            "baseBurn": 170
          },
          "Thu": {
            "workouts": [
              { "exercise": "Diamond Push-ups", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=J0DnG1_S92I", "thumbnail": "https://i.ytimg.com/vi/J0DnG1_S92I/hqdefault.jpg" },
              { "exercise": "Tricep Dips", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=zFCMz1NkwQo", "thumbnail": "https://i.ytimg.com/vi/zFCMz1NkwQo/hqdefault.jpg" },
              { "exercise": "Mountain Climbers", "prescription": "4x30s", "video": "https://www.youtube.com/watch?v=nmwgirgXLYM", "thumbnail": "https://i.ytimg.com/vi/nmwgirgXLYM/hqdefault.jpg" }
            ],
            "baseBurn": 360
          },
          "Fri": {
            "workouts": [
              { "exercise": "Pull-ups", "prescription": "3x8", "video": "https://www.youtube.com/watch?v=eGo4IYlbE5g", "thumbnail": "https://i.ytimg.com/vi/eGo4IYlbE5g/hqdefault.jpg" },
              { "exercise": "Calf Raises", "prescription": "4x20", "video": "https://www.youtube.com/watch?v=-M4-G8p8fmc", "thumbnail": "https://i.ytimg.com/vi/-M4-G8p8fmc/hqdefault.jpg" },
              { "exercise": "Squats", "prescription": "4x20", "video": "https://www.youtube.com/watch?v=601fB5fQvjE", "thumbnail": "https://i.ytimg.com/vi/601fB5fQvjE/hqdefault.jpg" }
            ],
            "baseBurn": 380
          },
          "Sat": {
            "workouts": [
              { "exercise": "Full Body Strength Circuit", "prescription": "4 rounds", "video": "https://www.youtube.com/watch?v=UItWltVZZmE", "thumbnail": "https://i.ytimg.com/vi/UItWltVZZmE/hqdefault.jpg" }
            ],
            "baseBurn": 420
          },
          "Sun": {
            "workouts": [
              { "exercise": "Active Stretch", "prescription": "25-30 min", "video": "https://www.youtube.com/watch?v=sTANio_2E0Q", "thumbnail": "https://i.ytimg.com/vi/sTANio_2E0Q/hqdefault.jpg" }
            ],
            "baseBurn": 155
          }
        },
        "Advanced": {
          "Mon": {
            "workouts": [
              { "exercise": "Push-ups", "prescription": "5x15", "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8", "thumbnail": "https://i.ytimg.com/vi/_l3ySVKYVJ8/hqdefault.jpg" },
              { "exercise": "Bodyweight Rows (table)", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=6kALZikXxLc", "thumbnail": "https://i.ytimg.com/vi/6kALZikXxLc/hqdefault.jpg" },
              { "exercise": "Squats", "prescription": "5x22", "video": "https://www.youtube.com/watch?v=601fB5fQvjE", "thumbnail": "https://i.ytimg.com/vi/601fB5fQvjE/hqdefault.jpg" },
              { "exercise": "Chair Dips", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=0326dy_-CzM", "thumbnail": "https://i.ytimg.com/vi/0326dy_-CzM/hqdefault.jpg" }
            ],
            "baseBurn": 450
          },
          "Tue": {
            "workouts": [
              { "exercise": "Lunges", "prescription": "5x12/leg", "video": "https://www.youtube.com/watch?v=YZbyE7U6Gos", "thumbnail": "https://i.ytimg.com/vi/YZbyE7U6Gos/hqdefault.jpg" },
              { "exercise": "Glute Bridges", "prescription": "5x20", "video": "https://www.youtube.com/watch?v=wPM8icPu6H8", "thumbnail": "https://i.ytimg.com/vi/wPM8icPu6H8/hqdefault.jpg" },
              { "exercise": "Leg Raises", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=JB2oyawG9KI", "thumbnail": "https://i.ytimg.com/vi/JB2oyawG9KI/hqdefault.jpg" }
            ],
            "baseBurn": 390
          },
          "Wed": {
            "workouts": [
              { "exercise": "Yoga Mobility", "prescription": "25-35 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE", "thumbnail": "https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg" }
            ],
            "baseBurn": 180
          },
          "Thu": {
            "workouts": [
              { "exercise": "Diamond Push-ups", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=J0DnG1_S92I", "thumbnail": "https://i.ytimg.com/vi/J0DnG1_S92I/hqdefault.jpg" },
              { "exercise": "Tricep Dips", "prescription": "4x14", "video": "https://www.youtube.com/watch?v=zFCMz1NkwQo", "thumbnail": "https://i.ytimg.com/vi/zFCMz1NkwQo/hqdefault.jpg" },
              { "exercise": "Mountain Climbers", "prescription": "4x40s", "video": "https://www.youtube.com/watch?v=nmwgirgXLYM", "thumbnail": "https://i.ytimg.com/vi/nmwgirgXLYM/hqdefault.jpg" }
            ],
            "baseBurn": 405
          },
          "Fri": {
            "workouts": [
              { "exercise": "Pull-ups", "prescription": "4x8", "video": "https://www.youtube.com/watch?v=eGo4IYlbE5g", "thumbnail": "https://i.ytimg.com/vi/eGo4IYlbE5g/hqdefault.jpg" },
              { "exercise": "Calf Raises", "prescription": "4x24", "video": "https://www.youtube.com/watch?v=-M4-G8p8fmc", "thumbnail": "https://i.ytimg.com/vi/-M4-G8p8fmc/hqdefault.jpg" },
              { "exercise": "Squats", "prescription": "4x24", "video": "https://www.youtube.com/watch?v=601fB5fQvjE", "thumbnail": "https://i.ytimg.com/vi/601fB5fQvjE/hqdefault.jpg" }
            ],
            "baseBurn": 430
          },
          "Sat": {
            "workouts": [
              { "exercise": "Full Body Strength Circuit", "prescription": "5 rounds", "video": "https://www.youtube.com/watch?v=UItWltVZZmE", "thumbnail": "https://i.ytimg.com/vi/UItWltVZZmE/hqdefault.jpg" }
            ],
            "baseBurn": 468
          },
          "Sun": {
            "workouts": [
              { "exercise": "Active Stretch", "prescription": "25-35 min", "video": "https://www.youtube.com/watch?v=sTANio_2E0Q", "thumbnail": "https://i.ytimg.com/vi/sTANio_2E0Q/hqdefault.jpg" }
            ],
            "baseBurn": 160
          }
        }
      }
    },
    "Improve Endurance": {
      "seedWeek": {
        "Beginner": {
          "Mon": {
            "workouts": [
              { "exercise": "Jump Rope (or mimic)", "prescription": "5x45s", "video": "https://www.youtube.com/watch?v=y5nNMQSGbBQ", "thumbnail": "https://i.ytimg.com/vi/y5nNMQSGbBQ/hqdefault.jpg" },
              { "exercise": "Burpees", "prescription": "3x10", "video": "https://www.youtube.com/watch?v=EmXaVk2k0GM", "thumbnail": "https://i.ytimg.com/vi/EmXaVk2k0GM/hqdefault.jpg" },
              { "exercise": "Mountain Climbers", "prescription": "3x25s", "video": "https://www.youtube.com/watch?v=nmwgirgXLYM", "thumbnail": "https://i.ytimg.com/vi/nmwgirgXLYM/hqdefault.jpg" },
              { "exercise": "Plank", "prescription": "3x35s", "video": "https://www.youtube.com/watch?v=dnERKMqkd3k", "thumbnail": "https://i.ytimg.com/vi/dnERKMqkd3k/hqdefault.jpg" }
            ],
            "baseBurn": 360
          },
          "Tue": {
            "workouts": [
              { "exercise": "Jog in Place", "prescription": "18 min", "video": "https://www.youtube.com/watch?v=c3ZGl4pAwZ4", "thumbnail": "https://i.ytimg.com/vi/c3ZGl4pAwZ4/hqdefault.jpg" },
              { "exercise": "Squats", "prescription": "3x18", "video": "https://www.youtube.com/watch?v=601fB5fQvjE", "thumbnail": "https://i.ytimg.com/vi/601fB5fQvjE/hqdefault.jpg" }
            ],
            "baseBurn": 300
          },
          "Wed": {
            "workouts": [
              { "exercise": "High Knees", "prescription": "4x25s", "video": "https://www.youtube.com/watch?v=y5nNMQSGbBQ", "thumbnail": "https://i.ytimg.com/vi/y5nNMQSGbBQ/hqdefault.jpg" },
              { "exercise": "Butt Kicks", "prescription": "4x25s", "video": "https://www.youtube.com/watch?v=vc1E5CfRfos", "thumbnail": "https://i.ytimg.com/vi/vc1E5CfRfos/hqdefault.jpg" },
              { "exercise": "Jumping Jacks", "prescription": "4x25s", "video": "https://www.youtube.com/watch?v=RO_iZNEB9IU", "thumbnail": "https://i.ytimg.com/vi/RO_iZNEB9IU/hqdefault.jpg" }
            ],
            "baseBurn": 320
          },
          "Thu": {
            "workouts": [
              { "exercise": "Bird-dog", "prescription": "3x12/side", "video": "https://www.youtube.com/watch?v=wiFNA3sqjCA", "thumbnail": "https://i.ytimg.com/vi/wiFNA3sqjCA/hqdefault.jpg" },
              { "exercise": "Leg Raises", "prescription": "3x12", "video": "https://www.youtube.com/watch?v=JB2oyawG9KI", "thumbnail": "https://i.ytimg.com/vi/JB2oyawG9KI/hqdefault.jpg" }
            ],
            "baseBurn": 220
          },
          "Fri": {
            "workouts": [
              { "exercise": "Walk/Jog", "prescription": "22 min", "video": "https://www.youtube.com/watch?v=y5nNMQSGbBQ", "thumbnail": "https://i.ytimg.com/vi/y5nNMQSGbBQ/hqdefault.jpg" },
              { "exercise": "Stretch", "prescription": "10 min", "video": "https://www.youtube.com/watch?v=sTANio_2E0Q", "thumbnail": "https://i.ytimg.com/vi/sTANio_2E0Q/hqdefault.jpg" }
            ],
            "baseBurn": 240
          },
          "Sat": {
            "workouts": [
              { "exercise": "Burpees", "prescription": "3x10", "video": "https://www.youtube.com/watch?v=EmXaVk2k0GM", "thumbnail": "https://i.ytimg.com/vi/EmXaVk2k0GM/hqdefault.jpg" },
              { "exercise": "Jumping Jacks", "prescription": "3x25s", "video": "https://www.youtube.com/watch?v=RO_iZNEB9IU", "thumbnail": "https://i.ytimg.com/vi/RO_iZNEB9IU/hqdefault.jpg" },
              { "exercise": "Squats", "prescription": "3x18", "video": "https://www.youtube.com/watch?v=601fB5fQvjE", "thumbnail": "https://i.ytimg.com/vi/601fB5fQvjE/hqdefault.jpg" }
            ],
            "baseBurn": 360
          },
          "Sun": {
            "workouts": [
              { "exercise": "Yoga / Active Stretch", "prescription": "20-30 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE", "thumbnail": "https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg" }
            ],
            "baseBurn": 160
          }
        },
        "Intermediate": {
          "Mon": {
            "workouts": [
              { "exercise": "Jump Rope (or mimic)", "prescription": "6x50s", "video": "https://www.youtube.com/watch?v=y5nNMQSGbBQ", "thumbnail": "https://i.ytimg.com/vi/y5nNMQSGbBQ/hqdefault.jpg" },
              { "exercise": "Burpees", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=EmXaVk2k0GM", "thumbnail": "https://i.ytimg.com/vi/EmXaVk2k0GM/hqdefault.jpg" },
              { "exercise": "Mountain Climbers", "prescription": "4x30s", "video": "https://www.youtube.com/watch?v=nmwgirgXLYM", "thumbnail": "https://i.ytimg.com/vi/nmwgirgXLYM/hqdefault.jpg" },
              { "exercise": "Plank", "prescription": "3x45s", "video": "https://www.youtube.com/watch?v=dnERKMqkd3k", "thumbnail": "https://i.ytimg.com/vi/dnERKMqkd3k/hqdefault.jpg" }
            ],
            "baseBurn": 410
          },
          "Tue": {
            "workouts": [
              { "exercise": "Jog in Place", "prescription": "22 min", "video": "https://www.youtube.com/watch?v=c3ZGl4pAwZ4", "thumbnail": "https://i.ytimg.com/vi/c3ZGl4pAwZ4/hqdefault.jpg" },
              { "exercise": "Squats", "prescription": "4x20", "video": "https://www.youtube.com/watch?v=601fB5fQvjE", "thumbnail": "https://i.ytimg.com/vi/601fB5fQvjE/hqdefault.jpg" }
            ],
            "baseBurn": 340
          },
          "Wed": {
            "workouts": [
              { "exercise": "High Knees", "prescription": "5x30s", "video": "https://www.youtube.com/watch?v=y5nNMQSGbBQ", "thumbnail": "https://i.ytimg.com/vi/y5nNMQSGbBQ/hqdefault.jpg" },
              { "exercise": "Butt Kicks", "prescription": "5x30s", "video": "https://www.youtube.com/watch?v=vc1E5CfRfos", "thumbnail": "https://i.ytimg.com/vi/vc1E5CfRfos/hqdefault.jpg" },
              { "exercise": "Jumping Jacks", "prescription": "5x30s", "video": "https://www.youtube.com/watch?v=RO_iZNEB9IU", "thumbnail": "https://i.ytimg.com/vi/RO_iZNEB9IU/hqdefault.jpg" }
            ],
            "baseBurn": 360
          },
          "Thu": {
            "workouts": [
              { "exercise": "Bird-dog", "prescription": "4x15/side", "video": "https://www.youtube.com/watch?v=wiFNA3sqjCA", "thumbnail": "https://i.ytimg.com/vi/wiFNA3sqjCA/hqdefault.jpg" },
              { "exercise": "Leg Raises", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=JB2oyawG9KI", "thumbnail": "https://i.ytimg.com/vi/JB2oyawG9KI/hqdefault.jpg" }
            ],
            "baseBurn": 260
          },
          "Fri": {
            "workouts": [
              { "exercise": "Continuous Walk/Jog", "prescription": "28 min", "video": "https://www.youtube.com/watch?v=y5nNMQSGbBQ", "thumbnail": "https://i.ytimg.com/vi/y5nNMQSGbBQ/hqdefault.jpg" },
              { "exercise": "Stretch", "prescription": "12 min", "video": "https://www.youtube.com/watch?v=sTANio_2E0Q", "thumbnail": "https://i.ytimg.com/vi/sTANio_2E0Q/hqdefault.jpg" }
            ],
            "baseBurn": 280
          },
          "Sat": {
            "workouts": [
              { "exercise": "Burpees", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=EmXaVk2k0GM", "thumbnail": "https://i.ytimg.com/vi/EmXaVk2k0GM/hqdefault.jpg" },
              { "exercise": "Jumping Jacks", "prescription": "4x30s", "video": "https://www.youtube.com/watch?v=RO_iZNEB9IU", "thumbnail": "https://i.ytimg.com/vi/RO_iZNEB9IU/hqdefault.jpg" },
              { "exercise": "Squats", "prescription": "4x20", "video": "https://www.youtube.com/watch?v=601fB5fQvjE", "thumbnail": "https://i.ytimg.com/vi/601fB5fQvjE/hqdefault.jpg" }
            ],
            "baseBurn": 410
          },
          "Sun": {
            "workouts": [
              { "exercise": "Yoga / Active Stretch", "prescription": "25-35 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE", "thumbnail": "https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg" }
            ],
            "baseBurn": 170
          }
        },
        "Advanced": {
          "Mon": {
            "workouts": [
              { "exercise": "Jump Rope (or mimic)", "prescription": "7x60s", "video": "https://www.youtube.com/watch?v=y5nNMQSGbBQ", "thumbnail": "https://i.ytimg.com/vi/y5nNMQSGbBQ/hqdefault.jpg" },
              { "exercise": "Burpees", "prescription": "5x12", "video": "https://www.youtube.com/watch?v=EmXaVk2k0GM", "thumbnail": "https://i.ytimg.com/vi/EmXaVk2k0GM/hqdefault.jpg" },
              { "exercise": "Mountain Climbers", "prescription": "4x40s", "video": "https://www.youtube.com/watch?v=nmwgirgXLYM", "thumbnail": "https://i.ytimg.com/vi/nmwgirgXLYM/hqdefault.jpg" },
              { "exercise": "Plank", "prescription": "3x60s", "video": "https://www.youtube.com/watch?v=dnERKMqkd3k", "thumbnail": "https://i.ytimg.com/vi/dnERKMqkd3k/hqdefault.jpg" }
            ],
            "baseBurn": 470
          },
          "Tue": {
            "workouts": [
              { "exercise": "Tempo Jog in Place", "prescription": "28 min", "video": "https://www.youtube.com/watch?v=c3ZGl4pAwZ4", "thumbnail": "https://i.ytimg.com/vi/c3ZGl4pAwZ4/hqdefault.jpg" },
              { "exercise": "Squats", "prescription": "5x22", "video": "https://www.youtube.com/watch?v=601fB5fQvjE", "thumbnail": "https://i.ytimg.com/vi/601fB5fQvjE/hqdefault.jpg" }
            ],
            "baseBurn": 390
          },
          "Wed": {
            "workouts": [
              { "exercise": "High Knees", "prescription": "6x35s", "video": "https://www.youtube.com/watch?v=y5nNMQSGbBQ", "thumbnail": "https://i.ytimg.com/vi/y5nNMQSGbBQ/hqdefault.jpg" },
              { "exercise": "Butt Kicks", "prescription": "6x35s", "video": "https://www.youtube.com/watch?v=vc1E5CfRfos", "thumbnail": "https://i.ytimg.com/vi/vc1E5CfRfos/hqdefault.jpg" },
              { "exercise": "Jumping Jacks", "prescription": "6x35s", "video": "https://www.youtube.com/watch?v=RO_iZNEB9IU", "thumbnail": "https://i.ytimg.com/vi/RO_iZNEB9IU/hqdefault.jpg" }
            ],
            "baseBurn": 400
          },
          "Thu": {
            "workouts": [
              { "exercise": "Bird-dog", "prescription": "4x18/side", "video": "https://www.youtube.com/watch?v=wiFNA3sqjCA", "thumbnail": "https://i.ytimg.com/vi/wiFNA3sqjCA/hqdefault.jpg" },
              { "exercise": "Leg Raises", "prescription": "4x18", "video": "https://www.youtube.com/watch?v=JB2oyawG9KI", "thumbnail": "https://i.ytimg.com/vi/JB2oyawG9KI/hqdefault.jpg" }
            ],
            "baseBurn": 290
          },
          "Fri": {
            "workouts": [
              { "exercise": "Continuous Run/Walk", "prescription": "32 min", "video": "https://www.youtube.com/watch?v=y5nNMQSGbBQ", "thumbnail": "https://i.ytimg.com/vi/y5nNMQSGbBQ/hqdefault.jpg" },
              { "exercise": "Stretch", "prescription": "12-15 min", "video": "https://www.youtube.com/watch?v=sTANio_2E0Q", "thumbnail": "https://i.ytimg.com/vi/sTANio_2E0Q/hqdefault.jpg" }
            ],
            "baseBurn": 320
          },
          "Sat": {
            "workouts": [
              { "exercise": "Burpees", "prescription": "5x12", "video": "https://www.youtube.com/watch?v=EmXaVk2k0GM", "thumbnail": "https://i.ytimg.com/vi/EmXaVk2k0GM/hqdefault.jpg" },
              { "exercise": "Jumping Jacks", "prescription": "5x35s", "video": "https://www.youtube.com/watch?v=RO_iZNEB9IU", "thumbnail": "https://i.ytimg.com/vi/RO_iZNEB9IU/hqdefault.jpg" },
              { "exercise": "Squats", "prescription": "5x22", "video": "https://www.youtube.com/watch?v=601fB5fQvjE", "thumbnail": "https://i.ytimg.com/vi/601fB5fQvjE/hqdefault.jpg" }
            ],
            "baseBurn": 470
          },
          "Sun": {
            "workouts": [
              { "exercise": "Yoga / Active Stretch", "prescription": "25-40 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE", "thumbnail": "https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg" }
            ],
            "baseBurn": 180
          }
        }
      }
    },
    "General Fitness": {
      "seedWeek": {
        "Beginner": {
          "Mon": {
            "workouts": [
              { "exercise": "Jumping Jacks", "prescription": "3x30s", "video": "https://www.youtube.com/watch?v=RO_iZNEB9IU", "thumbnail": "https://i.ytimg.com/vi/RO_iZNEB9IU/hqdefault.jpg" },
              { "exercise": "Push-ups", "prescription": "3x10", "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8", "thumbnail": "https://i.ytimg.com/vi/_l3ySVKYVJ8/hqdefault.jpg" },
              { "exercise": "Squats", "prescription": "3x15", "video": "https://www.youtube.com/watch?v=601fB5fQvjE", "thumbnail": "https://i.ytimg.com/vi/601fB5fQvjE/hqdefault.jpg" },
              { "exercise": "Plank", "prescription": "3x30s", "video": "https://www.youtube.com/watch?v=dnERKMqkd3k", "thumbnail": "https://i.ytimg.com/vi/dnERKMqkd3k/hqdefault.jpg" }
            ],
            "baseBurn": 300
          },
          "Tue": {
            "workouts": [
              { "exercise": "Yoga Flow", "prescription": "20 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE", "thumbnail": "https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg" }
            ],
            "baseBurn": 160
          },
          "Wed": {
            "workouts": [
              { "exercise": "Plank", "prescription": "3x40s", "video": "https://www.youtube.com/watch?v=dnERKMqkd3k", "thumbnail": "https://i.ytimg.com/vi/dnERKMqkd3k/hqdefault.jpg" },
              { "exercise": "Bird-dog", "prescription": "3x12/side", "video": "https://www.youtube.com/watch?v=wiFNA3sqjCA", "thumbnail": "https://i.ytimg.com/vi/wiFNA3sqjCA/hqdefault.jpg" },
              { "exercise": "Squats", "prescription": "3x18", "video": "https://www.youtube.com/watch?v=601fB5fQvjE", "thumbnail": "https://i.ytimg.com/vi/601fB5fQvjE/hqdefault.jpg" }
            ],
            "baseBurn": 260
          },
          "Thu": {
            "workouts": [
              { "exercise": "Burpees", "prescription": "3x8", "video": "https://www.youtube.com/watch?v=EmXaVk2k0GM", "thumbnail": "https://i.ytimg.com/vi/EmXaVk2k0GM/hqdefault.jpg" },
              { "exercise": "Jumping Jacks", "prescription": "3x30s", "video": "https://www.youtube.com/watch?v=RO_iZNEB9IU", "thumbnail": "https://i.ytimg.com/vi/RO_iZNEB9IU/hqdefault.jpg" },
              { "exercise": "Push-ups", "prescription": "3x10", "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8", "thumbnail": "https://i.ytimg.com/vi/_l3ySVKYVJ8/hqdefault.jpg" }
            ],
            "baseBurn": 320
          },
          "Fri": {
            "workouts": [
              { "exercise": "Lunges", "prescription": "3x12/leg", "video": "https://www.youtube.com/watch?v=YZbyE7U6Gos", "thumbnail": "https://i.ytimg.com/vi/YZbyE7U6Gos/hqdefault.jpg" },
              { "exercise": "Glute Bridges", "prescription": "3x18", "video": "https://www.youtube.com/watch?v=wPM8icPu6H8", "thumbnail": "https://i.ytimg.com/vi/wPM8icPu6H8/hqdefault.jpg" },
              { "exercise": "Plank Shoulder Taps", "prescription": "3x16", "video": "https://www.youtube.com/watch?v=KM46AG4YuNM", "thumbnail": "https://i.ytimg.com/vi/KM46AG4YuNM/hqdefault.jpg" }
            ],
            "baseBurn": 280
          },
          "Sat": {
            "workouts": [
              { "exercise": "Full Body Circuit (Push-ups + Squats + Lunges)", "prescription": "3 rounds", "video": "https://www.youtube.com/watch?v=UBMk30rjy0o", "thumbnail": "https://i.ytimg.com/vi/UBMk30rjy0o/hqdefault.jpg" }
            ],
            "baseBurn": 340
          },
          "Sun": {
            "workouts": [
              { "exercise": "Stretch / Yoga Recovery", "prescription": "20-30 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE", "thumbnail": "https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg" }
            ],
            "baseBurn": 150
          }
        },
        "Intermediate": {
          "Mon": {
            "workouts": [
              { "exercise": "Jumping Jacks", "prescription": "4x35s", "video": "https://www.youtube.com/watch?v=RO_iZNEB9IU", "thumbnail": "https://i.ytimg.com/vi/RO_iZNEB9IU/hqdefault.jpg" },
              { "exercise": "Push-ups", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8", "thumbnail": "https://i.ytimg.com/vi/_l3ySVKYVJ8/hqdefault.jpg" },
              { "exercise": "Squats", "prescription": "4x18", "video": "https://www.youtube.com/watch?v=601fB5fQvjE", "thumbnail": "https://i.ytimg.com/vi/601fB5fQvjE/hqdefault.jpg" },
              { "exercise": "Plank", "prescription": "3x40s", "video": "https://www.youtube.com/watch?v=dnERKMqkd3k", "thumbnail": "https://i.ytimg.com/vi/dnERKMqkd3k/hqdefault.jpg" }
            ],
            "baseBurn": 345
          },
          "Tue": {
            "workouts": [
              { "exercise": "Yoga Flow", "prescription": "25 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE", "thumbnail": "https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg" }
            ],
            "baseBurn": 175
          },
          "Wed": {
            "workouts": [
              { "exercise": "Plank", "prescription": "4x40s", "video": "https://www.youtube.com/watch?v=dnERKMqkd3k", "thumbnail": "https://i.ytimg.com/vi/dnERKMqkd3k/hqdefault.jpg" },
              { "exercise": "Bird-dog", "prescription": "4x12/side", "video": "https://www.youtube.com/watch?v=wiFNA3sqjCA", "thumbnail": "https://i.ytimg.com/vi/wiFNA3sqjCA/hqdefault.jpg" },
              { "exercise": "Squats", "prescription": "4x20", "video": "https://www.youtube.com/watch?v=601fB5fQvjE", "thumbnail": "https://i.ytimg.com/vi/601fB5fQvjE/hqdefault.jpg" }
            ],
            "baseBurn": 290
          },
          "Thu": {
            "workouts": [
              { "exercise": "Burpees", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=EmXaVk2k0GM", "thumbnail": "https://i.ytimg.com/vi/EmXaVk2k0GM/hqdefault.jpg" },
              { "exercise": "Jumping Jacks", "prescription": "4x35s", "video": "https://www.youtube.com/watch?v=RO_iZNEB9IU", "thumbnail": "https://i.ytimg.com/vi/RO_iZNEB9IU/hqdefault.jpg" },
              { "exercise": "Push-ups", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8", "thumbnail": "https://i.ytimg.com/vi/_l3ySVKYVJ8/hqdefault.jpg" }
            ],
            "baseBurn": 350
          },
          "Fri": {
            "workouts": [
              { "exercise": "Lunges", "prescription": "4x12/leg", "video": "https://www.youtube.com/watch?v=YZbyE7U6Gos", "thumbnail": "https://i.ytimg.com/vi/YZbyE7U6Gos/hqdefault.jpg" },
              { "exercise": "Glute Bridges", "prescription": "4x20", "video": "https://www.youtube.com/watch?v=wPM8icPu6H8", "thumbnail": "https://i.ytimg.com/vi/wPM8icPu6H8/hqdefault.jpg" },
              { "exercise": "Plank Shoulder Taps", "prescription": "4x20", "video": "https://www.youtube.com/watch?v=KM46AG4YuNM", "thumbnail": "https://i.ytimg.com/vi/KM46AG4YuNM/hqdefault.jpg" }
            ],
            "baseBurn": 320
          },
          "Sat": {
            "workouts": [
              { "exercise": "Full Body Circuit (Push-ups + Squats + Lunges)", "prescription": "4 rounds", "video": "https://www.youtube.com/watch?v=UBMk30rjy0o", "thumbnail": "https://i.ytimg.com/vi/UBMk30rjy0o/hqdefault.jpg" }
            ],
            "baseBurn": 390
          },
          "Sun": {
            "workouts": [
              { "exercise": "Stretch / Yoga Recovery", "prescription": "25-30 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE", "thumbnail": "https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg" }
            ],
            "baseBurn": 165
          }
        },
        "Advanced": {
          "Mon": {
            "workouts": [
              { "exercise": "Jumping Jacks", "prescription": "5x40s", "video": "https://www.youtube.com/watch?v=RO_iZNEB9IU", "thumbnail": "https://i.ytimg.com/vi/RO_iZNEB9IU/hqdefault.jpg" },
              { "exercise": "Push-ups", "prescription": "5x15", "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8", "thumbnail": "https://i.ytimg.com/vi/_l3ySVKYVJ8/hqdefault.jpg" },
              { "exercise": "Squats", "prescription": "5x22", "video": "https://www.youtube.com/watch?v=601fB5fQvjE", "thumbnail": "https://i.ytimg.com/vi/601fB5fQvjE/hqdefault.jpg" },
              { "exercise": "Plank", "prescription": "3x60s", "video": "https://www.youtube.com/watch?v=dnERKMqkd3k", "thumbnail": "https://i.ytimg.com/vi/dnERKMqkd3k/hqdefault.jpg" }
            ],
            "baseBurn": 390
          },
          "Tue": {
            "workouts": [
              { "exercise": "Yoga Flow", "prescription": "30 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE", "thumbnail": "https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg" }
            ],
            "baseBurn": 190
          },
          "Wed": {
            "workouts": [
              { "exercise": "Plank", "prescription": "4x60s", "video": "https://www.youtube.com/watch?v=dnERKMqkd3k", "thumbnail": "https://i.ytimg.com/vi/dnERKMqkd3k/hqdefault.jpg" },
              { "exercise": "Bird-dog", "prescription": "4x15/side", "video": "https://www.youtube.com/watch?v=wiFNA3sqjCA", "thumbnail": "https://i.ytimg.com/vi/wiFNA3sqjCA/hqdefault.jpg" },
              { "exercise": "Squats", "prescription": "4x24", "video": "https://www.youtube.com/watch?v=601fB5fQvjE", "thumbnail": "https://i.ytimg.com/vi/601fB5fQvjE/hqdefault.jpg" }
            ],
            "baseBurn": 320
          },
          "Thu": {
            "workouts": [
              { "exercise": "Burpees", "prescription": "5x10", "video": "https://www.youtube.com/watch?v=EmXaVk2k0GM", "thumbnail": "https://i.ytimg.com/vi/EmXaVk2k0GM/hqdefault.jpg" },
              { "exercise": "Jumping Jacks", "prescription": "5x40s", "video": "https://www.youtube.com/watch?v=RO_iZNEB9IU", "thumbnail": "https://i.ytimg.com/vi/RO_iZNEB9IU/hqdefault.jpg" },
              { "exercise": "Push-ups", "prescription": "5x15", "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8", "thumbnail": "https://i.ytimg.com/vi/_l3ySVKYVJ8/hqdefault.jpg" }
            ],
            "baseBurn": 390
          },
          "Fri": {
            "workouts": [
              { "exercise": "Lunges", "prescription": "5x14/leg", "video": "https://www.youtube.com/watch?v=YZbyE7U6Gos", "thumbnail": "https://i.ytimg.com/vi/YZbyE7U6Gos/hqdefault.jpg" },
              { "exercise": "Glute Bridges", "prescription": "5x22", "video": "https://www.youtube.com/watch?v=wPM8icPu6H8", "thumbnail": "https://i.ytimg.com/vi/wPM8icPu6H8/hqdefault.jpg" },
              { "exercise": "Plank Shoulder Taps", "prescription": "4x24", "video": "https://www.youtube.com/watch?v=KM46AG4YuNM", "thumbnail": "https://i.ytimg.com/vi/KM46AG4YuNM/hqdefault.jpg" }
            ],
            "baseBurn": 350
          },
          "Sat": {
            "workouts": [
              { "exercise": "Full Body Circuit (Push-ups + Squats + Lunges)", "prescription": "5 rounds", "video": "https://www.youtube.com/watch?v=UBMk30rjy0o", "thumbnail": "https://i.ytimg.com/vi/UBMk30rjy0o/hqdefault.jpg" }
            ],
            "baseBurn": 430
          },
          "Sun": {
            "workouts": [
              { "exercise": "Stretch / Yoga Recovery", "prescription": "25-35 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE", "thumbnail": "https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg" }
            ],
            "baseBurn": 170
          }
        }
      }
    }
  }
}$$::jsonb
)
on conflict (schema_version) do update
set config = excluded.config,
    updated_at = timezone('utc', now());

insert into public.workout_plan_configs (schema_version, config)
values (
  'exercise_videos_v1',
  $${
  "categories": [
    {
      "category": "Leg Exercises",
      "workouts": [
        { "exercise": "Back Squats", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=YaXPRqUwItQ", "thumbnail": "https://i.ytimg.com/vi/YaXPRqUwItQ/hqdefault.jpg" },
        { "exercise": "Bodyweight Squats", "prescription": "3x15", "video": "https://www.youtube.com/watch?v=aclHkVaku9U", "thumbnail": "https://i.ytimg.com/vi/aclHkVaku9U/hqdefault.jpg" },
        { "exercise": "Squats", "prescription": "4x18", "video": "https://www.youtube.com/watch?v=601fB5fQvjE", "thumbnail": "https://i.ytimg.com/vi/601fB5fQvjE/hqdefault.jpg" },
        { "exercise": "Walking Lunges", "prescription": "3x20 (10/leg)", "video": "https://www.youtube.com/watch?v=D7KaRcUTQeE", "thumbnail": "https://i.ytimg.com/vi/D7KaRcUTQeE/hqdefault.jpg" },
        { "exercise": "Lunges", "prescription": "4x12/leg", "video": "https://www.youtube.com/watch?v=YZbyE7U6Gos", "thumbnail": "https://i.ytimg.com/vi/YZbyE7U6Gos/hqdefault.jpg" },
        { "exercise": "Forward Lunges", "prescription": "3x10/leg", "video": "https://www.youtube.com/watch?v=_PQm64POLOk", "thumbnail": "https://i.ytimg.com/vi/_PQm64POLOk/hqdefault.jpg" },
        { "exercise": "Side Lunge", "prescription": "3x12 (each side)", "video": "https://www.youtube.com/watch?v=CyyhZvaW9co", "thumbnail": "https://i.ytimg.com/vi/CyyhZvaW9co/hqdefault.jpg" },
        { "exercise": "Romanian Deadlift", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=2SHsk9AzdjA", "thumbnail": "https://i.ytimg.com/vi/2SHsk9AzdjA/hqdefault.jpg" },
        { "exercise": "Leg Press", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=IZxyjW7MPJQ", "thumbnail": "https://i.ytimg.com/vi/IZxyjW7MPJQ/hqdefault.jpg" },
        { "exercise": "Bulgarian Split Squat", "prescription": "3x12 (each leg)", "video": "https://www.youtube.com/watch?v=kYVS1aiLxeY", "thumbnail": "https://i.ytimg.com/vi/kYVS1aiLxeY/hqdefault.jpg" },
        { "exercise": "Goblet Squat", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=MeIiIdhvXT4", "thumbnail": "https://i.ytimg.com/vi/MeIiIdhvXT4/hqdefault.jpg" },
        { "exercise": "Sumo Deadlift", "prescription": "4x8", "video": "https://www.youtube.com/watch?v=Xkw8gT275Jo", "thumbnail": "https://i.ytimg.com/vi/Xkw8gT275Jo/hqdefault.jpg" },
        { "exercise": "Step-Ups", "prescription": "3x15 (per leg)", "video": "https://www.youtube.com/watch?v=dQqApCGd5Ss", "thumbnail": "https://i.ytimg.com/vi/dQqApCGd5Ss/hqdefault.jpg" },
        { "exercise": "Leg Extension", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=YyvSfVjQeL0", "thumbnail": "https://i.ytimg.com/vi/YyvSfVjQeL0/hqdefault.jpg" },
        { "exercise": "Seated Leg Curl", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=zjH2FmrMY4k", "thumbnail": "https://i.ytimg.com/vi/zjH2FmrMY4k/hqdefault.jpg" },
        { "exercise": "Wall Sit", "prescription": "3x45s", "video": "https://www.youtube.com/watch?v=L1eZmz7qONI", "thumbnail": "https://i.ytimg.com/vi/L1eZmz7qONI/hqdefault.jpg" },
        { "exercise": "Calf Raises", "prescription": "3x18", "video": "https://www.youtube.com/watch?v=-M4-G8p8fmc", "thumbnail": "https://i.ytimg.com/vi/-M4-G8p8fmc/hqdefault.jpg" }
      ],
      "baseBurn": 450
    },
    {
      "category": "Chest",
      "workouts": [
        { "exercise": "Barbell Bench Press", "prescription": "4x8", "video": "https://www.youtube.com/watch?v=HMK_nYD92aU", "thumbnail": "https://i.ytimg.com/vi/HMK_nYD92aU/hqdefault.jpg" },
        { "exercise": "Incline Dumbbell Press", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=8iPEnn-ltC8", "thumbnail": "https://i.ytimg.com/vi/8iPEnn-ltC8/hqdefault.jpg" },
        { "exercise": "Standard Push-Ups", "prescription": "4x20", "video": "https://www.youtube.com/watch?v=mge3Q4nkMPI", "thumbnail": "https://i.ytimg.com/vi/mge3Q4nkMPI/hqdefault.jpg" },
        { "exercise": "Push-ups", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=xtEFVrwZFGU", "thumbnail": "https://i.ytimg.com/vi/xtEFVrwZFGU/hqdefault.jpg" },
        { "exercise": "Chest Fly (Dumbbell)", "prescription": "3x12", "video": "https://www.youtube.com/watch?v=BRrxLaSKfYU", "thumbnail": "https://i.ytimg.com/vi/BRrxLaSKfYU/hqdefault.jpg" },
        { "exercise": "Decline Push-Ups", "prescription": "3x15", "video": "https://www.youtube.com/watch?v=0V8xUxGvo4A", "thumbnail": "https://i.ytimg.com/vi/0V8xUxGvo4A/hqdefault.jpg" },
        { "exercise": "Incline Push-Up", "prescription": "3x15", "video": "https://www.youtube.com/watch?v=1hwfvjSqhuc", "thumbnail": "https://i.ytimg.com/vi/1hwfvjSqhuc/hqdefault.jpg" },
        { "exercise": "Wide Push-Up", "prescription": "3x15", "video": "https://www.youtube.com/watch?v=XQyIOgypT00", "thumbnail": "https://i.ytimg.com/vi/XQyIOgypT00/hqdefault.jpg" },
        { "exercise": "Cable Crossovers", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=taI4XduLpTk", "thumbnail": "https://i.ytimg.com/vi/taI4XduLpTk/hqdefault.jpg" },
        { "exercise": "Incline Bench Press", "prescription": "4x8", "video": "https://www.youtube.com/watch?v=SrqOu55lrYU", "thumbnail": "https://i.ytimg.com/vi/SrqOu55lrYU/hqdefault.jpg" },
        { "exercise": "Machine Chest Press", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=IvCU-PD5VpI", "thumbnail": "https://i.ytimg.com/vi/IvCU-PD5VpI/hqdefault.jpg" },
        { "exercise": "Decline Dumbbell Press", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=Xkw8gT275Jo", "thumbnail": "https://i.ytimg.com/vi/Xkw8gT275Jo/hqdefault.jpg" },
        { "exercise": "Plyometric Push-Ups", "prescription": "3x10", "video": "https://www.youtube.com/watch?v=0fiAoqwsc9g", "thumbnail": "https://i.ytimg.com/vi/0fiAoqwsc9g/hqdefault.jpg" },
        { "exercise": "Elevated Push Up", "prescription": "3x12", "video": "https://www.youtube.com/watch?v=qIDRj0LjIXA", "thumbnail": "https://i.ytimg.com/vi/qIDRj0LjIXA/hqdefault.jpg" }
      ],
      "baseBurn": 400
    },
    {
      "category": "Shoulder",
      "workouts": [
        { "exercise": "Standing Overhead Press", "prescription": "4x8", "video": "https://www.youtube.com/watch?v=F3QY5vMz_6I", "thumbnail": "https://i.ytimg.com/vi/F3QY5vMz_6I/hqdefault.jpg" },
        { "exercise": "Dumbbell Lateral Raise", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=HkNOd4XsqKE", "thumbnail": "https://i.ytimg.com/vi/HkNOd4XsqKE/hqdefault.jpg" },
        { "exercise": "Face Pulls", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=rep-qVOkqgk", "thumbnail": "https://i.ytimg.com/vi/rep-qVOkqgk/hqdefault.jpg" },
        { "exercise": "Front Raise", "prescription": "3x12", "video": "https://www.youtube.com/watch?v=HkNOd4XsqKE", "thumbnail": "https://i.ytimg.com/vi/HkNOd4XsqKE/hqdefault.jpg" },
        { "exercise": "Arnold Press", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=vj2w851ZHRM", "thumbnail": "https://i.ytimg.com/vi/vj2w851ZHRM/hqdefault.jpg" },
        { "exercise": "Reverse Pec Deck Fly", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=Xkw8gT275Jo", "thumbnail": "https://i.ytimg.com/vi/Xkw8gT275Jo/hqdefault.jpg" },
        { "exercise": "Upright Row", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=Xkw8gT275Jo", "thumbnail": "https://i.ytimg.com/vi/Xkw8gT275Jo/hqdefault.jpg" },
        { "exercise": "Seated Dumbbell Press", "prescription": "4x8", "video": "https://www.youtube.com/watch?v=B-aVuyhvLHU", "thumbnail": "https://i.ytimg.com/vi/B-aVuyhvLHU/hqdefault.jpg" },
        { "exercise": "Cable Lateral Raise", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=HkNOd4XsqKE", "thumbnail": "https://i.ytimg.com/vi/HkNOd4XsqKE/hqdefault.jpg" },
        { "exercise": "Plate Front Raise", "prescription": "3x15", "video": "https://www.youtube.com/watch?v=HkNOd4XsqKE", "thumbnail": "https://i.ytimg.com/vi/HkNOd4XsqKE/hqdefault.jpg" }
      ],
      "baseBurn": 320
    },
    {
      "category": "Belly",
      "workouts": [
        { "exercise": "Forearm Plank", "prescription": "4x60s", "video": "https://www.youtube.com/watch?v=pSHjTRCQxIw", "thumbnail": "https://i.ytimg.com/vi/pSHjTRCQxIw/hqdefault.jpg" },
        { "exercise": "Plank", "prescription": "3x35s", "video": "https://www.youtube.com/watch?v=dnERKMqkd3k", "thumbnail": "https://i.ytimg.com/vi/dnERKMqkd3k/hqdefault.jpg" },
        { "exercise": "Hanging Leg Raises", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=JB2oyawG9KI", "thumbnail": "https://i.ytimg.com/vi/JB2oyawG9KI/hqdefault.jpg" },
        { "exercise": "Russian Twists", "prescription": "4x30 (15/side)", "video": "https://www.youtube.com/watch?v=wkD8rjkodUI", "thumbnail": "https://i.ytimg.com/vi/wkD8rjkodUI/hqdefault.jpg" },
        { "exercise": "Bicycle Crunch", "prescription": "4x20", "video": "https://www.youtube.com/watch?v=9FGilxCbdz8", "thumbnail": "https://i.ytimg.com/vi/9FGilxCbdz8/hqdefault.jpg" },
        { "exercise": "Flutter Kicks", "prescription": "4x40s", "video": "https://www.youtube.com/watch?v=KM46AG4YuNM", "thumbnail": "https://i.ytimg.com/vi/KM46AG4YuNM/hqdefault.jpg" },
        { "exercise": "Toe Touch Crunches", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=JB2oyawG9KI", "thumbnail": "https://i.ytimg.com/vi/JB2oyawG9KI/hqdefault.jpg" },
        { "exercise": "Side Plank", "prescription": "3x45s (each side)", "video": "https://www.youtube.com/watch?v=UrAUan4fPYE", "thumbnail": "https://i.ytimg.com/vi/UrAUan4fPYE/hqdefault.jpg" },
        { "exercise": "Reverse Crunch", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=hyv14e2QDq0", "thumbnail": "https://i.ytimg.com/vi/hyv14e2QDq0/hqdefault.jpg" },
        { "exercise": "V-Ups", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=iP2fjvG0g3w", "thumbnail": "https://i.ytimg.com/vi/iP2fjvG0g3w/hqdefault.jpg" },
        { "exercise": "Hollow Body Hold", "prescription": "3x30s", "video": "https://www.youtube.com/watch?v=4xRpGgttca8", "thumbnail": "https://i.ytimg.com/vi/4xRpGgttca8/hqdefault.jpg" },
        { "exercise": "Sit-Up", "prescription": "3x20", "video": "https://www.youtube.com/watch?v=1hwfvjSqhuc", "thumbnail": "https://i.ytimg.com/vi/1hwfvjSqhuc/hqdefault.jpg" },
        { "exercise": "Dead Bug", "prescription": "3x12 (each side)", "video": "https://www.youtube.com/watch?v=jOwcnFip7jE", "thumbnail": "https://i.ytimg.com/vi/jOwcnFip7jE/hqdefault.jpg" }
      ],
      "baseBurn": 280
    },
    {
      "category": "Hip",
      "workouts": [
        { "exercise": "Glute Bridge", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=8bbE64NuDTU", "thumbnail": "https://i.ytimg.com/vi/8bbE64NuDTU/hqdefault.jpg" },
        { "exercise": "Glute Bridges", "prescription": "4x18", "video": "https://www.youtube.com/watch?v=wPM8icPu6H8", "thumbnail": "https://i.ytimg.com/vi/wPM8icPu6H8/hqdefault.jpg" },
        { "exercise": "Clamshells", "prescription": "4x20 (10/side)", "video": "https://www.youtube.com/watch?v=bs-T0-kN_Ag", "thumbnail": "https://i.ytimg.com/vi/bs-T0-kN_Ag/hqdefault.jpg" },
        { "exercise": "Banded Monster Walk", "prescription": "4x20 steps", "video": "https://www.youtube.com/watch?v=bs-T0-kN_Ag", "thumbnail": "https://i.ytimg.com/vi/bs-T0-kN_Ag/hqdefault.jpg" },
        { "exercise": "Hip Thrust", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=LM8XHLYJoYs", "thumbnail": "https://i.ytimg.com/vi/LM8XHLYJoYs/hqdefault.jpg" },
        { "exercise": "Donkey Kicks", "prescription": "4x15 (per leg)", "video": "https://www.youtube.com/watch?v=Uv_DKDl7EjA", "thumbnail": "https://i.ytimg.com/vi/Uv_DKDl7EjA/hqdefault.jpg" },
        { "exercise": "Fire Hydrant", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=bs-T0-kN_Ag", "thumbnail": "https://i.ytimg.com/vi/bs-T0-kN_Ag/hqdefault.jpg" },
        { "exercise": "Side-Lying Leg Raise", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=bs-T0-kN_Ag", "thumbnail": "https://i.ytimg.com/vi/bs-T0-kN_Ag/hqdefault.jpg" },
        { "exercise": "Single-Leg Glute Bridge", "prescription": "3x12 (each leg)", "video": "https://www.youtube.com/watch?v=wPM8icPu6H8", "thumbnail": "https://i.ytimg.com/vi/wPM8icPu6H8/hqdefault.jpg" },
        { "exercise": "Standing Hip Abduction", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=bs-T0-kN_Ag", "thumbnail": "https://i.ytimg.com/vi/bs-T0-kN_Ag/hqdefault.jpg" },
        { "exercise": "Hip Circles", "prescription": "3x10 (each direction)", "video": "https://www.youtube.com/watch?v=bs-T0-kN_Ag", "thumbnail": "https://i.ytimg.com/vi/bs-T0-kN_Ag/hqdefault.jpg" },
        { "exercise": "Hip Mobility", "prescription": "10 min", "video": "https://www.youtube.com/watch?v=W72UP0-lnDM", "thumbnail": "https://i.ytimg.com/vi/W72UP0-lnDM/hqdefault.jpg" }
      ],
      "baseBurn": 240
    },
    {
      "category": "Back",
      "workouts": [
        { "exercise": "Pull-ups", "prescription": "4x8", "video": "https://www.youtube.com/watch?v=eGo4IYlbE5g", "thumbnail": "https://i.ytimg.com/vi/eGo4IYlbE5g/hqdefault.jpg" },
        { "exercise": "Bodyweight Rows (table)", "prescription": "4x8", "video": "https://www.youtube.com/watch?v=6kALZikXxLc", "thumbnail": "https://i.ytimg.com/vi/6kALZikXxLc/hqdefault.jpg" }
      ],
      "baseBurn": 320
    },
    {
      "category": "Tricep",
      "workouts": [
        { "exercise": "Parallel Bar Dips", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=rcM6zUXabhM", "thumbnail": "https://i.ytimg.com/vi/rcM6zUXabhM/hqdefault.jpg" },
        { "exercise": "EZ-Bar Skull Crushers", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=K0RRCJCyzMc", "thumbnail": "https://i.ytimg.com/vi/K0RRCJCyzMc/hqdefault.jpg" },
        { "exercise": "Cable Rope Pushdowns", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=XpeCPOHJTK8", "thumbnail": "https://i.ytimg.com/vi/XpeCPOHJTK8/hqdefault.jpg" },
        { "exercise": "Overhead Dumbbell Extension", "prescription": "4x12", "video": "https://www.youtube.com/shorts/b_r_LW4HEcM", "thumbnail": "https://i.ytimg.com/vi/b_r_LW4HEcM/hqdefault.jpg" },
        { "exercise": "Close-Grip Bench Press", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=kFwKJAJApXU", "thumbnail": "https://i.ytimg.com/vi/kFwKJAJApXU/hqdefault.jpg" },
        { "exercise": "Close-Grip Push-Up", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=1hwfvjSqhuc", "thumbnail": "https://i.ytimg.com/vi/1hwfvjSqhuc/hqdefault.jpg" },
        { "exercise": "Push-up for Triceps", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=UKjwhRPYkiE", "thumbnail": "https://i.ytimg.com/vi/UKjwhRPYkiE/hqdefault.jpg" },
        { "exercise": "Triceps-Biceps-Deltoids", "prescription": "3x12", "video": "https://www.youtube.com/watch?v=9UyN2XqbfZU", "thumbnail": "https://i.ytimg.com/vi/9UyN2XqbfZU/hqdefault.jpg" },
        { "exercise": "Tricep Kickbacks", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=m_UlDFNX4mk", "thumbnail": "https://i.ytimg.com/vi/m_UlDFNX4mk/hqdefault.jpg" },
        { "exercise": "Diamond Push-Ups", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=J0DnG1_S92I", "thumbnail": "https://i.ytimg.com/vi/J0DnG1_S92I/hqdefault.jpg" },
        { "exercise": "Tricep Dips", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=zFCMz1NkwQo", "thumbnail": "https://i.ytimg.com/vi/zFCMz1NkwQo/hqdefault.jpg" },
        { "exercise": "Chair Dips", "prescription": "3x10", "video": "https://www.youtube.com/shorts/4ua3MzaU0QU", "thumbnail": "https://i.ytimg.com/vi/4ua3MzaU0QU/hqdefault.jpg" },
        { "exercise": "Reverse Grip Pushdown", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=fsfshDBq9ko", "thumbnail": "https://i.ytimg.com/vi/fsfshDBq9ko/hqdefault.jpg" },
        { "exercise": "One Arm Overhead Cable Extension", "prescription": "3x15", "video": "https://www.youtube.com/watch?v=GTaXW-MpjII", "thumbnail": "https://i.ytimg.com/vi/GTaXW-MpjII/hqdefault.jpg" }
      ],
      "baseBurn": 260
    },
    {
      "category": "Cardio",
      "workouts": [
        { "exercise": "Jumping Jacks", "prescription": "4x35s", "video": "https://www.youtube.com/watch?v=RO_iZNEB9IU", "thumbnail": "https://i.ytimg.com/vi/RO_iZNEB9IU/hqdefault.jpg" },
        { "exercise": "High Knees", "prescription": "4x35s", "video": "https://www.youtube.com/watch?v=y5nNMQSGbBQ", "thumbnail": "https://i.ytimg.com/vi/y5nNMQSGbBQ/hqdefault.jpg" },
        { "exercise": "Burpees", "prescription": "3x10", "video": "https://www.youtube.com/watch?v=EmXaVk2k0GM", "thumbnail": "https://i.ytimg.com/vi/EmXaVk2k0GM/hqdefault.jpg" },
        { "exercise": "Mountain Climbers", "prescription": "4x30s", "video": "https://www.youtube.com/watch?v=nmwgirgXLYM", "thumbnail": "https://i.ytimg.com/vi/nmwgirgXLYM/hqdefault.jpg" }
      ],
      "baseBurn": 300
    },
    {
      "category": "Height Increasing",
      "workouts": [
        { "exercise": "Passive Bar Hang", "prescription": "4x60s", "video": "https://www.youtube.com/watch?v=XwryUTVQNIU", "thumbnail": "https://i.ytimg.com/vi/XwryUTVQNIU/hqdefault.jpg" },
        { "exercise": "Stretching (Cobra, Cat camel etc)", "prescription": "4x45s", "video": "https://www.youtube.com/watch?v=KcvEhTOnE7w&t=4s", "thumbnail": "https://i.ytimg.com/vi/KcvEhTOnE7w/hqdefault.jpg" },
        { "exercise": "Child’s Pose Stretch", "prescription": "4x60s", "video": "https://www.youtube.com/watch?v=kH12QrSGedM", "thumbnail": "https://i.ytimg.com/vi/kH12QrSGedM/hqdefault.jpg" },
        { "exercise": "Pelvic Tilt Stretch", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=ZIQjHtghzqw", "thumbnail": "https://i.ytimg.com/vi/ZIQjHtghzqw/hqdefault.jpg" },
        { "exercise": "Superman Stretch", "prescription": "4x45s", "video": "https://www.youtube.com/watch?v=z6PJMT2y8GQ", "thumbnail": "https://i.ytimg.com/vi/z6PJMT2y8GQ/hqdefault.jpg" },
        { "exercise": "Bridge Pose", "prescription": "4x30s", "video": "https://www.youtube.com/watch?v=wPM8icPu6H8", "thumbnail": "https://i.ytimg.com/vi/wPM8icPu6H8/hqdefault.jpg" },
        { "exercise": "Seated Toe Touch", "prescription": "4x45s", "video": "https://www.youtube.com/watch?v=M6NDLs-ORiU", "thumbnail": "https://i.ytimg.com/vi/M6NDLs-ORiU/hqdefault.jpg" },
        { "exercise": "Jump Rope", "prescription": "5x1min", "video": "https://www.youtube.com/watch?v=tNaoARG9E8w", "thumbnail": "https://i.ytimg.com/vi/tNaoARG9E8w/hqdefault.jpg" },
        { "exercise": "Standing Side Stretch", "prescription": "4x30s", "video": "https://www.youtube.com/watch?v=b4AP1T2eOaA", "thumbnail": "https://i.ytimg.com/vi/b4AP1T2eOaA/hqdefault.jpg" },
        { "exercise": "Wall Slides", "prescription": "3x12", "video": "https://www.youtube.com/watch?v=SoC1P-Aoywk", "thumbnail": "https://i.ytimg.com/vi/SoC1P-Aoywk/hqdefault.jpg" },
        { "exercise": "Height Increasing Stretch", "prescription": "12 min", "video": "https://www.youtube.com/watch?v=IF55ruqjY8o", "thumbnail": "https://i.ytimg.com/vi/IF55ruqjY8o/hqdefault.jpg" }
      ],
      "baseBurn": 180
    },
    {
      "category": "Mobility",
      "workouts": [
        { "exercise": "Ankle Mobility", "prescription": "8 min", "video": "https://www.youtube.com/watch?v=lpDgOYjm2pI", "thumbnail": "https://i.ytimg.com/vi/lpDgOYjm2pI/hqdefault.jpg" },
        { "exercise": "Shoulder Mobility", "prescription": "8 min", "video": "https://www.youtube.com/watch?v=D-BsyMtTT0I", "thumbnail": "https://i.ytimg.com/vi/D-BsyMtTT0I/hqdefault.jpg" },
        { "exercise": "Neck/Upper-Back Posture Drill", "prescription": "6 min", "video": "https://www.youtube.com/watch?v=fNX8ec8_5ks", "thumbnail": "https://i.ytimg.com/vi/fNX8ec8_5ks/hqdefault.jpg" },
        { "exercise": "Wrist/Forearm Mobility", "prescription": "6 min", "video": "https://www.youtube.com/watch?v=YtG550UZIM4", "thumbnail": "https://i.ytimg.com/vi/YtG550UZIM4/hqdefault.jpg" }
      ],
      "baseBurn": 140
    },
    {
      "category": "Bicep",
      "workouts": [
        { "exercise": "Bicep Curl", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=xXMtZoXQFLI", "thumbnail": "https://i.ytimg.com/vi/xXMtZoXQFLI/hqdefault.jpg" },
        { "exercise": "Concentration Curl", "prescription": "3x12", "video": "https://www.youtube.com/watch?v=ry2LiWeKtoo", "thumbnail": "https://i.ytimg.com/vi/ry2LiWeKtoo/hqdefault.jpg" },
        { "exercise": "Hammer Curl", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=QZN2PcBFAwg", "thumbnail": "https://i.ytimg.com/vi/QZN2PcBFAwg/hqdefault.jpg" },
        { "exercise": "Twiggy Biceps & Saggy Chest", "prescription": "3x12", "video": "https://www.youtube.com/watch?v=Q4gXE8ccpbk", "thumbnail": "https://i.ytimg.com/vi/Q4gXE8ccpbk/hqdefault.jpg" },
        { "exercise": "Strengthen Your Arms and Get Rid of Flabby Biceps", "prescription": "3x12", "video": "https://www.youtube.com/watch?v=yVluGRwKI70", "thumbnail": "https://i.ytimg.com/vi/yVluGRwKI70/hqdefault.jpg" },
        { "exercise": "Biceps Blow Up", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=KzZILhT_YvY", "thumbnail": "https://i.ytimg.com/vi/KzZILhT_YvY/hqdefault.jpg" },
        { "exercise": "Back and Biceps", "prescription": "3x12", "video": "https://www.youtube.com/watch?v=I2C5g8u8t0o", "thumbnail": "https://i.ytimg.com/vi/I2C5g8u8t0o/hqdefault.jpg" },
        { "exercise": "Dumbbell Biceps", "prescription": "4x12", "video": "https://www.youtube.com/shorts/rZ4Qjx_fc7g", "thumbnail": "https://i.ytimg.com/vi/rZ4Qjx_fc7g/hqdefault.jpg" }
      ],
      "baseBurn": 220
    },
    {
      "category": "Glute Activation",
      "workouts": [
        { "exercise": "Clamshells", "prescription": "3x15 (each side)", "video": "https://www.youtube.com/watch?v=bs-T0-kN_Ag", "thumbnail": "https://i.ytimg.com/vi/bs-T0-kN_Ag/hqdefault.jpg" },
        { "exercise": "Monster Walks", "prescription": "3x20 steps", "video": "https://www.youtube.com/watch?v=6x7WXz5P23c", "thumbnail": "https://i.ytimg.com/vi/6x7WXz5P23c/hqdefault.jpg" }
      ],
      "baseBurn": 200
    }
  ]
}$$::jsonb
)
on conflict (schema_version) do update
set config = excluded.config,
    updated_at = timezone('utc', now());

create table if not exists public.user_workout_plans (
  id uuid default gen_random_uuid() primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  schema_version text not null references public.workout_plan_configs(schema_version),
  goal_slug text not null,
  level_code text references public.plan_levels(code),
  start_date date not null,
  end_date date,
  current_day integer default 1 check (current_day between 1 and 180),
  streak_count integer default 0,
  completed boolean default false,
  archived boolean default false,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  unique (user_id, goal_slug, start_date)
);

create index if not exists idx_user_workout_plans_user on public.user_workout_plans (user_id);
create index if not exists idx_user_workout_plans_goal on public.user_workout_plans (goal_slug);

create table if not exists public.user_workout_sessions (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid not null references public.user_workout_plans(id) on delete cascade,
  scheduled_date date not null,
  day_index integer not null,
  level_code text not null references public.plan_levels(code),
  seed_reference text not null,
  workouts jsonb not null,
  base_burn integer,
  adjusted_burn integer,
  status text not null default 'pending' check (status in ('pending','completed','skipped')),
  completed_at timestamptz,
  skipped_at timestamptz,
  actual_metrics jsonb,
  notes text,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  unique (plan_id, scheduled_date)
);

create index if not exists idx_user_workout_sessions_plan on public.user_workout_sessions (plan_id);
create index if not exists idx_user_workout_sessions_status on public.user_workout_sessions (status);
create index if not exists idx_user_workout_sessions_date on public.user_workout_sessions (scheduled_date);

create table if not exists public.user_workout_streaks (
  user_id bigint primary key references public.users(id) on delete cascade,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_activity_date date,
  updated_at timestamptz default timezone('utc', now())
);

create table if not exists public.user_workout_activity (
  id uuid default gen_random_uuid() primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  activity_date date not null,
  goal_slug text,
  level text,
  calories integer not null check (calories >= 0),
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  unique (user_id, activity_date)
);

create index if not exists idx_user_workout_activity_user_date on public.user_workout_activity (user_id, activity_date);
