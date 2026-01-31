
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
                "video": "https://www.youtube.com/watch?v=c4DAnQ6DtF8"
              },
              {
                "exercise": "High Knees",
                "prescription": "3x30s",
                "video": "https://www.youtube.com/watch?v=8opcQdC-V-U"
              },
              {
                "exercise": "Mountain Climbers",
                "prescription": "3x25s",
                "video": "https://www.youtube.com/watch?v=nmwgirgXLYM"
              },
              {
                "exercise": "Plank",
                "prescription": "3x25s",
                "video": "https://www.youtube.com/watch?v=pSHjTRCQxIw"
              }
            ],
            "baseBurn": 320
          },
          "Tue": {
            "workouts": [
              {
                "exercise": "Bodyweight Squats",
                "prescription": "3x15",
                "video": "https://www.youtube.com/watch?v=aclHkVaku9U"
              },
              {
                "exercise": "Forward Lunges",
                "prescription": "3x10/leg",
                "video": "https://www.youtube.com/watch?v=QOVaHwm-Q6U"
              },
              {
                "exercise": "Glute Bridges",
                "prescription": "3x15",
                "video": "https://www.youtube.com/watch?v=wPM8icPu6H8"
              },
              {
                "exercise": "Side Plank",
                "prescription": "3x20s/side",
                "video": "https://www.youtube.com/watch?v=K2VljzCC16g"
              }
            ],
            "baseBurn": 300
          },
          "Wed": {
            "workouts": [
              {
                "exercise": "Brisk Walk / March in Place",
                "prescription": "25 min",
                "video": "https://www.youtube.com/watch?v=MsP2aT6O3v0"
              },
              {
                "exercise": "Dynamic Stretching",
                "prescription": "10 min",
                "video": "https://www.youtube.com/watch?v=V1Lb8CzNzC8"
              }
            ],
            "baseBurn": 180
          },
          "Thu": {
            "workouts": [
              {
                "exercise": "Jump Squats",
                "prescription": "3x12",
                "video": "https://www.youtube.com/watch?v=U4s4mEQ5VqU"
              },
              {
                "exercise": "Push-ups",
                "prescription": "3x10",
                "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8"
              },
              {
                "exercise": "Burpees",
                "prescription": "3x8",
                "video": "https://www.youtube.com/watch?v=TU8QYVW0gDU"
              },
              {
                "exercise": "Plank Shoulder Taps",
                "prescription": "3x16",
                "video": "https://www.youtube.com/watch?v=67chrbmYdxA"
              }
            ],
            "baseBurn": 350
          },
          "Fri": {
            "workouts": [
              {
                "exercise": "Crunches",
                "prescription": "3x18",
                "video": "https://www.youtube.com/watch?v=Xyd_fa5zoEU"
              },
              {
                "exercise": "Bicycle Crunches",
                "prescription": "3x16",
                "video": "https://www.youtube.com/watch?v=9FGilxCbdz8"
              },
              {
                "exercise": "Flutter Kicks",
                "prescription": "3x25s",
                "video": "https://www.youtube.com/watch?v=K7iA1J1iBMc"
              },
              {
                "exercise": "Russian Twists",
                "prescription": "3x18",
                "video": "https://www.youtube.com/watch?v=wkD8rjkodUI"
              }
            ],
            "baseBurn": 280
          },
          "Sat": {
            "workouts": [
              {
                "exercise": "Full Body Circuit (Squat \u2192 Push-up \u2192 Lunge \u2192 Plank)",
                "prescription": "3 rounds",
                "video": "https://www.youtube.com/watch?v=UBMk30rjy0o"
              }
            ],
            "baseBurn": 360
          },
          "Sun": {
            "workouts": [
              {
                "exercise": "Yoga / Stretch Recovery",
                "prescription": "20-30 min",
                "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE"
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
                "video": "https://www.youtube.com/watch?v=c4DAnQ6DtF8"
              },
              {
                "exercise": "High Knees",
                "prescription": "4x35s",
                "video": "https://www.youtube.com/watch?v=8opcQdC-V-U"
              },
              {
                "exercise": "Mountain Climbers",
                "prescription": "4x30s",
                "video": "https://www.youtube.com/watch?v=nmwgirgXLYM"
              },
              {
                "exercise": "Plank",
                "prescription": "3x35s",
                "video": "https://www.youtube.com/watch?v=pSHjTRCQxIw"
              }
            ],
            "baseBurn": 380
          },
          "Tue": {
            "workouts": [
              {
                "exercise": "Bodyweight Squats",
                "prescription": "4x18",
                "video": "https://www.youtube.com/watch?v=aclHkVaku9U"
              },
              {
                "exercise": "Forward Lunges",
                "prescription": "4x12/leg",
                "video": "https://www.youtube.com/watch?v=QOVaHwm-Q6U"
              },
              {
                "exercise": "Glute Bridges",
                "prescription": "4x18",
                "video": "https://www.youtube.com/watch?v=wPM8icPu6H8"
              },
              {
                "exercise": "Side Plank",
                "prescription": "3x30s/side",
                "video": "https://www.youtube.com/watch?v=K2VljzCC16g"
              }
            ],
            "baseBurn": 345
          },
          "Wed": {
            "workouts": [
              {
                "exercise": "Brisk Walk / March in Place",
                "prescription": "30 min",
                "video": "https://www.youtube.com/watch?v=MsP2aT6O3v0"
              },
              {
                "exercise": "Mobility Flow",
                "prescription": "12 min",
                "video": "https://www.youtube.com/watch?v=V1Lb8CzNzC8"
              }
            ],
            "baseBurn": 210
          },
          "Thu": {
            "workouts": [
              {
                "exercise": "Jump Squats",
                "prescription": "4x12",
                "video": "https://www.youtube.com/watch?v=U4s4mEQ5VqU"
              },
              {
                "exercise": "Push-ups",
                "prescription": "4x12",
                "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8"
              },
              {
                "exercise": "Burpees",
                "prescription": "3x10",
                "video": "https://www.youtube.com/watch?v=TU8QYVW0gDU"
              },
              {
                "exercise": "Plank Shoulder Taps",
                "prescription": "3x20",
                "video": "https://www.youtube.com/watch?v=67chrbmYdxA"
              }
            ],
            "baseBurn": 400
          },
          "Fri": {
            "workouts": [
              {
                "exercise": "Crunches",
                "prescription": "4x20",
                "video": "https://www.youtube.com/watch?v=Xyd_fa5zoEU"
              },
              {
                "exercise": "Bicycle Crunches",
                "prescription": "4x18",
                "video": "https://www.youtube.com/watch?v=9FGilxCbdz8"
              },
              {
                "exercise": "Flutter Kicks",
                "prescription": "4x30s",
                "video": "https://www.youtube.com/watch?v=K7iA1J1iBMc"
              },
              {
                "exercise": "Russian Twists",
                "prescription": "4x20",
                "video": "https://www.youtube.com/watch?v=wkD8rjkodUI"
              }
            ],
            "baseBurn": 320
          },
          "Sat": {
            "workouts": [
              {
                "exercise": "Full Body Circuit (Squat \u2192 Push-up \u2192 Lunge \u2192 Plank)",
                "prescription": "4 rounds",
                "video": "https://www.youtube.com/watch?v=UBMk30rjy0o"
              }
            ],
            "baseBurn": 420
          },
          "Sun": {
            "workouts": [
              {
                "exercise": "Yoga / Stretch Recovery",
                "prescription": "25-35 min",
                "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE"
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
                "video": "https://www.youtube.com/watch?v=c4DAnQ6DtF8"
              },
              {
                "exercise": "High Knees",
                "prescription": "5x40s",
                "video": "https://www.youtube.com/watch?v=8opcQdC-V-U"
              },
              {
                "exercise": "Mountain Climbers",
                "prescription": "4x40s",
                "video": "https://www.youtube.com/watch?v=nmwgirgXLYM"
              },
              {
                "exercise": "Plank",
                "prescription": "3x45s",
                "video": "https://www.youtube.com/watch?v=pSHjTRCQxIw"
              }
            ],
            "baseBurn": 416
          },
          "Tue": {
            "workouts": [
              {
                "exercise": "Bodyweight Squats",
                "prescription": "5x20",
                "video": "https://www.youtube.com/watch?v=aclHkVaku9U"
              },
              {
                "exercise": "Forward Lunges",
                "prescription": "4x14/leg",
                "video": "https://www.youtube.com/watch?v=QOVaHwm-Q6U"
              },
              {
                "exercise": "Glute Bridges",
                "prescription": "4x20",
                "video": "https://www.youtube.com/watch?v=wPM8icPu6H8"
              },
              {
                "exercise": "Side Plank",
                "prescription": "3x40s/side",
                "video": "https://www.youtube.com/watch?v=K2VljzCC16g"
              }
            ],
            "baseBurn": 390
          },
          "Wed": {
            "workouts": [
              {
                "exercise": "Tempo Walk/Jog",
                "prescription": "35 min",
                "video": "https://www.youtube.com/watch?v=MsP2aT6O3v0"
              },
              {
                "exercise": "Mobility Flow",
                "prescription": "12 min",
                "video": "https://www.youtube.com/watch?v=V1Lb8CzNzC8"
              }
            ],
            "baseBurn": 230
          },
          "Thu": {
            "workouts": [
              {
                "exercise": "Jump Squats",
                "prescription": "5x12",
                "video": "https://www.youtube.com/watch?v=U4s4mEQ5VqU"
              },
              {
                "exercise": "Push-ups",
                "prescription": "4x15",
                "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8"
              },
              {
                "exercise": "Burpees",
                "prescription": "4x10",
                "video": "https://www.youtube.com/watch?v=TU8QYVW0gDU"
              },
              {
                "exercise": "Plank Shoulder Taps",
                "prescription": "4x20",
                "video": "https://www.youtube.com/watch?v=67chrbmYdxA"
              }
            ],
            "baseBurn": 455
          },
          "Fri": {
            "workouts": [
              {
                "exercise": "Crunches",
                "prescription": "4x24",
                "video": "https://www.youtube.com/watch?v=Xyd_fa5zoEU"
              },
              {
                "exercise": "Bicycle Crunches",
                "prescription": "4x22",
                "video": "https://www.youtube.com/watch?v=9FGilxCbdz8"
              },
              {
                "exercise": "Flutter Kicks",
                "prescription": "4x35s",
                "video": "https://www.youtube.com/watch?v=K7iA1J1iBMc"
              },
              {
                "exercise": "Russian Twists",
                "prescription": "4x24",
                "video": "https://www.youtube.com/watch?v=wkD8rjkodUI"
              }
            ],
            "baseBurn": 365
          },
          "Sat": {
            "workouts": [
              {
                "exercise": "Full Body Circuit (Squat \u2192 Push-up \u2192 Lunge \u2192 Plank)",
                "prescription": "5 rounds",
                "video": "https://www.youtube.com/watch?v=UBMk30rjy0o"
              }
            ],
            "baseBurn": 468
          },
          "Sun": {
            "workouts": [
              {
                "exercise": "Yoga / Stretch Recovery",
                "prescription": "25-35 min",
                "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE"
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
              { "exercise": "Push-ups", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8" },
              { "exercise": "Bodyweight Rows (table)", "prescription": "4x8", "video": "https://www.youtube.com/watch?v=6kALZikXxLc" },
              { "exercise": "Squats", "prescription": "4x18", "video": "https://www.youtube.com/watch?v=aclHkVaku9U" },
              { "exercise": "Chair Dips", "prescription": "3x10", "video": "https://www.youtube.com/watch?v=0326dy_-CzM" }
            ],
            "baseBurn": 340
          },
          "Tue": {
            "workouts": [
              { "exercise": "Lunges", "prescription": "4x10/leg", "video": "https://www.youtube.com/watch?v=QOVaHwm-Q6U" },
              { "exercise": "Glute Bridges", "prescription": "4x18", "video": "https://www.youtube.com/watch?v=wPM8icPu6H8" },
              { "exercise": "Leg Raises", "prescription": "3x12", "video": "https://www.youtube.com/watch?v=JB2oyawG9KI" }
            ],
            "baseBurn": 300
          },
          "Wed": {
            "workouts": [
              { "exercise": "Yoga Mobility", "prescription": "20 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE" }
            ],
            "baseBurn": 150
          },
          "Thu": {
            "workouts": [
              { "exercise": "Diamond Push-ups", "prescription": "3x8", "video": "https://www.youtube.com/watch?v=J0DnG1_S92I" },
              { "exercise": "Tricep Dips", "prescription": "3x12", "video": "https://www.youtube.com/watch?v=0326dy_-CzM" },
              { "exercise": "Mountain Climbers", "prescription": "3x30s", "video": "https://www.youtube.com/watch?v=nmwgirgXLYM" }
            ],
            "baseBurn": 320
          },
          "Fri": {
            "workouts": [
              { "exercise": "Pull-ups / Assisted Rows", "prescription": "3x6", "video": "https://www.youtube.com/watch?v=eGo4IYlbE5g" },
              { "exercise": "Calf Raises", "prescription": "3x18", "video": "https://www.youtube.com/watch?v=-M4-G8p8fmc" },
              { "exercise": "Squats", "prescription": "3x18", "video": "https://www.youtube.com/watch?v=aclHkVaku9U" }
            ],
            "baseBurn": 330
          },
          "Sat": {
            "workouts": [
              { "exercise": "Full Body Strength Circuit", "prescription": "3 rounds", "video": "https://www.youtube.com/watch?v=UItWltVZZmE" }
            ],
            "baseBurn": 360
          },
          "Sun": {
            "workouts": [
              { "exercise": "Active Stretch", "prescription": "20-30 min", "video": "https://www.youtube.com/watch?v=sTANio_2E0Q" }
            ],
            "baseBurn": 140
          }
        },
        "Intermediate": {
          "Mon": {
            "workouts": [
              { "exercise": "Push-ups", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8" },
              { "exercise": "Bodyweight Rows (table)", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=6kALZikXxLc" },
              { "exercise": "Squats", "prescription": "4x22", "video": "https://www.youtube.com/watch?v=aclHkVaku9U" },
              { "exercise": "Chair Dips", "prescription": "3x12", "video": "https://www.youtube.com/watch?v=0326dy_-CzM" }
            ],
            "baseBurn": 390
          },
          "Tue": {
            "workouts": [
              { "exercise": "Lunges", "prescription": "4x12/leg", "video": "https://www.youtube.com/watch?v=QOVaHwm-Q6U" },
              { "exercise": "Glute Bridges", "prescription": "4x20", "video": "https://www.youtube.com/watch?v=wPM8icPu6H8" },
              { "exercise": "Leg Raises", "prescription": "3x15", "video": "https://www.youtube.com/watch?v=JB2oyawG9KI" }
            ],
            "baseBurn": 340
          },
          "Wed": {
            "workouts": [
              { "exercise": "Yoga Mobility", "prescription": "25 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE" }
            ],
            "baseBurn": 170
          },
          "Thu": {
            "workouts": [
              { "exercise": "Diamond Push-ups", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=J0DnG1_S92I" },
              { "exercise": "Tricep Dips", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=0326dy_-CzM" },
              { "exercise": "Mountain Climbers", "prescription": "4x30s", "video": "https://www.youtube.com/watch?v=nmwgirgXLYM" }
            ],
            "baseBurn": 360
          },
          "Fri": {
            "workouts": [
              { "exercise": "Pull-ups / Assisted Rows", "prescription": "3x8", "video": "https://www.youtube.com/watch?v=eGo4IYlbE5g" },
              { "exercise": "Calf Raises", "prescription": "4x20", "video": "https://www.youtube.com/watch?v=-M4-G8p8fmc" },
              { "exercise": "Squats", "prescription": "4x20", "video": "https://www.youtube.com/watch?v=aclHkVaku9U" }
            ],
            "baseBurn": 380
          },
          "Sat": {
            "workouts": [
              { "exercise": "Full Body Strength Circuit", "prescription": "4 rounds", "video": "https://www.youtube.com/watch?v=UItWltVZZmE" }
            ],
            "baseBurn": 420
          },
          "Sun": {
            "workouts": [
              { "exercise": "Active Stretch", "prescription": "25-30 min", "video": "https://www.youtube.com/watch?v=sTANio_2E0Q" }
            ],
            "baseBurn": 155
          }
        },
        "Advanced": {
          "Mon": {
            "workouts": [
              { "exercise": "Push-ups", "prescription": "5x15", "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8" },
              { "exercise": "Bodyweight Rows (table)", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=6kALZikXxLc" },
              { "exercise": "Squats", "prescription": "5x22", "video": "https://www.youtube.com/watch?v=aclHkVaku9U" },
              { "exercise": "Chair Dips", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=0326dy_-CzM" }
            ],
            "baseBurn": 450
          },
          "Tue": {
            "workouts": [
              { "exercise": "Lunges", "prescription": "5x12/leg", "video": "https://www.youtube.com/watch?v=QOVaHwm-Q6U" },
              { "exercise": "Glute Bridges", "prescription": "5x20", "video": "https://www.youtube.com/watch?v=wPM8icPu6H8" },
              { "exercise": "Leg Raises", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=JB2oyawG9KI" }
            ],
            "baseBurn": 390
          },
          "Wed": {
            "workouts": [
              { "exercise": "Yoga Mobility", "prescription": "25-35 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE" }
            ],
            "baseBurn": 180
          },
          "Thu": {
            "workouts": [
              { "exercise": "Diamond Push-ups", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=J0DnG1_S92I" },
              { "exercise": "Tricep Dips", "prescription": "4x14", "video": "https://www.youtube.com/watch?v=0326dy_-CzM" },
              { "exercise": "Mountain Climbers", "prescription": "4x40s", "video": "https://www.youtube.com/watch?v=nmwgirgXLYM" }
            ],
            "baseBurn": 405
          },
          "Fri": {
            "workouts": [
              { "exercise": "Pull-ups", "prescription": "4x8", "video": "https://www.youtube.com/watch?v=eGo4IYlbE5g" },
              { "exercise": "Calf Raises", "prescription": "4x24", "video": "https://www.youtube.com/watch?v=-M4-G8p8fmc" },
              { "exercise": "Squats", "prescription": "4x24", "video": "https://www.youtube.com/watch?v=aclHkVaku9U" }
            ],
            "baseBurn": 430
          },
          "Sat": {
            "workouts": [
              { "exercise": "Full Body Strength Circuit", "prescription": "5 rounds", "video": "https://www.youtube.com/watch?v=UItWltVZZmE" }
            ],
            "baseBurn": 468
          },
          "Sun": {
            "workouts": [
              { "exercise": "Active Stretch", "prescription": "25-35 min", "video": "https://www.youtube.com/watch?v=sTANio_2E0Q" }
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
              { "exercise": "Jump Rope (or mimic)", "prescription": "5x45s", "video": "https://www.youtube.com/watch?v=1BZMZZMj8yY" },
              { "exercise": "Burpees", "prescription": "3x10", "video": "https://www.youtube.com/watch?v=TU8QYVW0gDU" },
              { "exercise": "Mountain Climbers", "prescription": "3x25s", "video": "https://www.youtube.com/watch?v=nmwgirgXLYM" },
              { "exercise": "Plank", "prescription": "3x35s", "video": "https://www.youtube.com/watch?v=pSHjTRCQxIw" }
            ],
            "baseBurn": 360
          },
          "Tue": {
            "workouts": [
              { "exercise": "Jog in Place", "prescription": "18 min", "video": "https://www.youtube.com/watch?v=c3ZGl4pAwZ4" },
              { "exercise": "Squats", "prescription": "3x18", "video": "https://www.youtube.com/watch?v=aclHkVaku9U" }
            ],
            "baseBurn": 300
          },
          "Wed": {
            "workouts": [
              { "exercise": "High Knees", "prescription": "4x25s", "video": "https://www.youtube.com/watch?v=8opcQdC-V-U" },
              { "exercise": "Butt Kicks", "prescription": "4x25s", "video": "https://www.youtube.com/watch?v=vc1E5CfRfos" },
              { "exercise": "Jumping Jacks", "prescription": "4x25s", "video": "https://www.youtube.com/watch?v=c4DAnQ6DtF8" }
            ],
            "baseBurn": 320
          },
          "Thu": {
            "workouts": [
              { "exercise": "Bird-dog", "prescription": "3x12/side", "video": "https://www.youtube.com/watch?v=wiFNA3sqjCA" },
              { "exercise": "Leg Raises", "prescription": "3x12", "video": "https://www.youtube.com/watch?v=JB2oyawG9KI" }
            ],
            "baseBurn": 220
          },
          "Fri": {
            "workouts": [
              { "exercise": "Walk/Jog", "prescription": "22 min", "video": "https://www.youtube.com/watch?v=MsP2aT6O3v0" },
              { "exercise": "Stretch", "prescription": "10 min", "video": "https://www.youtube.com/watch?v=sTANio_2E0Q" }
            ],
            "baseBurn": 240
          },
          "Sat": {
            "workouts": [
              { "exercise": "Burpees", "prescription": "3x10", "video": "https://www.youtube.com/watch?v=TU8QYVW0gDU" },
              { "exercise": "Jumping Jacks", "prescription": "3x25s", "video": "https://www.youtube.com/watch?v=c4DAnQ6DtF8" },
              { "exercise": "Squats", "prescription": "3x18", "video": "https://www.youtube.com/watch?v=aclHkVaku9U" }
            ],
            "baseBurn": 360
          },
          "Sun": {
            "workouts": [
              { "exercise": "Yoga / Active Stretch", "prescription": "20-30 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE" }
            ],
            "baseBurn": 160
          }
        },
        "Intermediate": {
          "Mon": {
            "workouts": [
              { "exercise": "Jump Rope (or mimic)", "prescription": "6x50s", "video": "https://www.youtube.com/watch?v=1BZMZZMj8yY" },
              { "exercise": "Burpees", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=TU8QYVW0gDU" },
              { "exercise": "Mountain Climbers", "prescription": "4x30s", "video": "https://www.youtube.com/watch?v=nmwgirgXLYM" },
              { "exercise": "Plank", "prescription": "3x45s", "video": "https://www.youtube.com/watch?v=pSHjTRCQxIw" }
            ],
            "baseBurn": 410
          },
          "Tue": {
            "workouts": [
              { "exercise": "Jog in Place", "prescription": "22 min", "video": "https://www.youtube.com/watch?v=c3ZGl4pAwZ4" },
              { "exercise": "Squats", "prescription": "4x20", "video": "https://www.youtube.com/watch?v=aclHkVaku9U" }
            ],
            "baseBurn": 340
          },
          "Wed": {
            "workouts": [
              { "exercise": "High Knees", "prescription": "5x30s", "video": "https://www.youtube.com/watch?v=8opcQdC-V-U" },
              { "exercise": "Butt Kicks", "prescription": "5x30s", "video": "https://www.youtube.com/watch?v=vc1E5CfRfos" },
              { "exercise": "Jumping Jacks", "prescription": "5x30s", "video": "https://www.youtube.com/watch?v=c4DAnQ6DtF8" }
            ],
            "baseBurn": 360
          },
          "Thu": {
            "workouts": [
              { "exercise": "Bird-dog", "prescription": "4x15/side", "video": "https://www.youtube.com/watch?v=wiFNA3sqjCA" },
              { "exercise": "Leg Raises", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=JB2oyawG9KI" }
            ],
            "baseBurn": 260
          },
          "Fri": {
            "workouts": [
              { "exercise": "Continuous Walk/Jog", "prescription": "28 min", "video": "https://www.youtube.com/watch?v=MsP2aT6O3v0" },
              { "exercise": "Stretch", "prescription": "12 min", "video": "https://www.youtube.com/watch?v=sTANio_2E0Q" }
            ],
            "baseBurn": 280
          },
          "Sat": {
            "workouts": [
              { "exercise": "Burpees", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=TU8QYVW0gDU" },
              { "exercise": "Jumping Jacks", "prescription": "4x30s", "video": "https://www.youtube.com/watch?v=c4DAnQ6DtF8" },
              { "exercise": "Squats", "prescription": "4x20", "video": "https://www.youtube.com/watch?v=aclHkVaku9U" }
            ],
            "baseBurn": 410
          },
          "Sun": {
            "workouts": [
              { "exercise": "Yoga / Active Stretch", "prescription": "25-35 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE" }
            ],
            "baseBurn": 170
          }
        },
        "Advanced": {
          "Mon": {
            "workouts": [
              { "exercise": "Jump Rope (or mimic)", "prescription": "7x60s", "video": "https://www.youtube.com/watch?v=1BZMZZMj8yY" },
              { "exercise": "Burpees", "prescription": "5x12", "video": "https://www.youtube.com/watch?v=TU8QYVW0gDU" },
              { "exercise": "Mountain Climbers", "prescription": "4x40s", "video": "https://www.youtube.com/watch?v=nmwgirgXLYM" },
              { "exercise": "Plank", "prescription": "3x60s", "video": "https://www.youtube.com/watch?v=pSHjTRCQxIw" }
            ],
            "baseBurn": 470
          },
          "Tue": {
            "workouts": [
              { "exercise": "Tempo Jog in Place", "prescription": "28 min", "video": "https://www.youtube.com/watch?v=c3ZGl4pAwZ4" },
              { "exercise": "Squats", "prescription": "5x22", "video": "https://www.youtube.com/watch?v=aclHkVaku9U" }
            ],
            "baseBurn": 390
          },
          "Wed": {
            "workouts": [
              { "exercise": "High Knees", "prescription": "6x35s", "video": "https://www.youtube.com/watch?v=8opcQdC-V-U" },
              { "exercise": "Butt Kicks", "prescription": "6x35s", "video": "https://www.youtube.com/watch?v=vc1E5CfRfos" },
              { "exercise": "Jumping Jacks", "prescription": "6x35s", "video": "https://www.youtube.com/watch?v=c4DAnQ6DtF8" }
            ],
            "baseBurn": 400
          },
          "Thu": {
            "workouts": [
              { "exercise": "Bird-dog", "prescription": "4x18/side", "video": "https://www.youtube.com/watch?v=wiFNA3sqjCA" },
              { "exercise": "Leg Raises", "prescription": "4x18", "video": "https://www.youtube.com/watch?v=JB2oyawG9KI" }
            ],
            "baseBurn": 290
          },
          "Fri": {
            "workouts": [
              { "exercise": "Continuous Run/Walk", "prescription": "32 min", "video": "https://www.youtube.com/watch?v=MsP2aT6O3v0" },
              { "exercise": "Stretch", "prescription": "12-15 min", "video": "https://www.youtube.com/watch?v=sTANio_2E0Q" }
            ],
            "baseBurn": 320
          },
          "Sat": {
            "workouts": [
              { "exercise": "Burpees", "prescription": "5x12", "video": "https://www.youtube.com/watch?v=TU8QYVW0gDU" },
              { "exercise": "Jumping Jacks", "prescription": "5x35s", "video": "https://www.youtube.com/watch?v=c4DAnQ6DtF8" },
              { "exercise": "Squats", "prescription": "5x22", "video": "https://www.youtube.com/watch?v=aclHkVaku9U" }
            ],
            "baseBurn": 470
          },
          "Sun": {
            "workouts": [
              { "exercise": "Yoga / Active Stretch", "prescription": "25-40 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE" }
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
              { "exercise": "Jumping Jacks", "prescription": "3x30s", "video": "https://www.youtube.com/watch?v=c4DAnQ6DtF8" },
              { "exercise": "Push-ups", "prescription": "3x10", "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8" },
              { "exercise": "Squats", "prescription": "3x15", "video": "https://www.youtube.com/watch?v=aclHkVaku9U" },
              { "exercise": "Plank", "prescription": "3x30s", "video": "https://www.youtube.com/watch?v=pSHjTRCQxIw" }
            ],
            "baseBurn": 300
          },
          "Tue": {
            "workouts": [
              { "exercise": "Yoga Flow", "prescription": "20 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE" }
            ],
            "baseBurn": 160
          },
          "Wed": {
            "workouts": [
              { "exercise": "Plank", "prescription": "3x40s", "video": "https://www.youtube.com/watch?v=pSHjTRCQxIw" },
              { "exercise": "Bird-dog", "prescription": "3x12/side", "video": "https://www.youtube.com/watch?v=wiFNA3sqjCA" },
              { "exercise": "Squats", "prescription": "3x18", "video": "https://www.youtube.com/watch?v=aclHkVaku9U" }
            ],
            "baseBurn": 260
          },
          "Thu": {
            "workouts": [
              { "exercise": "Burpees", "prescription": "3x8", "video": "https://www.youtube.com/watch?v=TU8QYVW0gDU" },
              { "exercise": "Jumping Jacks", "prescription": "3x30s", "video": "https://www.youtube.com/watch?v=c4DAnQ6DtF8" },
              { "exercise": "Push-ups", "prescription": "3x10", "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8" }
            ],
            "baseBurn": 320
          },
          "Fri": {
            "workouts": [
              { "exercise": "Lunges", "prescription": "3x12/leg", "video": "https://www.youtube.com/watch?v=QOVaHwm-Q6U" },
              { "exercise": "Glute Bridges", "prescription": "3x18", "video": "https://www.youtube.com/watch?v=wPM8icPu6H8" },
              { "exercise": "Plank Shoulder Taps", "prescription": "3x16", "video": "https://www.youtube.com/watch?v=67chrbmYdxA" }
            ],
            "baseBurn": 280
          },
          "Sat": {
            "workouts": [
              { "exercise": "Full Body Circuit (Push-ups + Squats + Lunges)", "prescription": "3 rounds", "video": "https://www.youtube.com/watch?v=UBMk30rjy0o" }
            ],
            "baseBurn": 340
          },
          "Sun": {
            "workouts": [
              { "exercise": "Stretch / Yoga Recovery", "prescription": "20-30 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE" }
            ],
            "baseBurn": 150
          }
        },
        "Intermediate": {
          "Mon": {
            "workouts": [
              { "exercise": "Jumping Jacks", "prescription": "4x35s", "video": "https://www.youtube.com/watch?v=c4DAnQ6DtF8" },
              { "exercise": "Push-ups", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8" },
              { "exercise": "Squats", "prescription": "4x18", "video": "https://www.youtube.com/watch?v=aclHkVaku9U" },
              { "exercise": "Plank", "prescription": "3x40s", "video": "https://www.youtube.com/watch?v=pSHjTRCQxIw" }
            ],
            "baseBurn": 345
          },
          "Tue": {
            "workouts": [
              { "exercise": "Yoga Flow", "prescription": "25 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE" }
            ],
            "baseBurn": 175
          },
          "Wed": {
            "workouts": [
              { "exercise": "Plank", "prescription": "4x40s", "video": "https://www.youtube.com/watch?v=pSHjTRCQxIw" },
              { "exercise": "Bird-dog", "prescription": "4x12/side", "video": "https://www.youtube.com/watch?v=wiFNA3sqjCA" },
              { "exercise": "Squats", "prescription": "4x20", "video": "https://www.youtube.com/watch?v=aclHkVaku9U" }
            ],
            "baseBurn": 290
          },
          "Thu": {
            "workouts": [
              { "exercise": "Burpees", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=TU8QYVW0gDU" },
              { "exercise": "Jumping Jacks", "prescription": "4x35s", "video": "https://www.youtube.com/watch?v=c4DAnQ6DtF8" },
              { "exercise": "Push-ups", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8" }
            ],
            "baseBurn": 350
          },
          "Fri": {
            "workouts": [
              { "exercise": "Lunges", "prescription": "4x12/leg", "video": "https://www.youtube.com/watch?v=QOVaHwm-Q6U" },
              { "exercise": "Glute Bridges", "prescription": "4x20", "video": "https://www.youtube.com/watch?v=wPM8icPu6H8" },
              { "exercise": "Plank Shoulder Taps", "prescription": "4x20", "video": "https://www.youtube.com/watch?v=67chrbmYdxA" }
            ],
            "baseBurn": 320
          },
          "Sat": {
            "workouts": [
              { "exercise": "Full Body Circuit (Push-ups + Squats + Lunges)", "prescription": "4 rounds", "video": "https://www.youtube.com/watch?v=UBMk30rjy0o" }
            ],
            "baseBurn": 390
          },
          "Sun": {
            "workouts": [
              { "exercise": "Stretch / Yoga Recovery", "prescription": "25-30 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE" }
            ],
            "baseBurn": 165
          }
        },
        "Advanced": {
          "Mon": {
            "workouts": [
              { "exercise": "Jumping Jacks", "prescription": "5x40s", "video": "https://www.youtube.com/watch?v=c4DAnQ6DtF8" },
              { "exercise": "Push-ups", "prescription": "5x15", "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8" },
              { "exercise": "Squats", "prescription": "5x22", "video": "https://www.youtube.com/watch?v=aclHkVaku9U" },
              { "exercise": "Plank", "prescription": "3x60s", "video": "https://www.youtube.com/watch?v=pSHjTRCQxIw" }
            ],
            "baseBurn": 390
          },
          "Tue": {
            "workouts": [
              { "exercise": "Yoga Flow", "prescription": "30 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE" }
            ],
            "baseBurn": 190
          },
          "Wed": {
            "workouts": [
              { "exercise": "Plank", "prescription": "4x60s", "video": "https://www.youtube.com/watch?v=pSHjTRCQxIw" },
              { "exercise": "Bird-dog", "prescription": "4x15/side", "video": "https://www.youtube.com/watch?v=wiFNA3sqjCA" },
              { "exercise": "Squats", "prescription": "4x24", "video": "https://www.youtube.com/watch?v=aclHkVaku9U" }
            ],
            "baseBurn": 320
          },
          "Thu": {
            "workouts": [
              { "exercise": "Burpees", "prescription": "5x10", "video": "https://www.youtube.com/watch?v=TU8QYVW0gDU" },
              { "exercise": "Jumping Jacks", "prescription": "5x40s", "video": "https://www.youtube.com/watch?v=c4DAnQ6DtF8" },
              { "exercise": "Push-ups", "prescription": "5x15", "video": "https://www.youtube.com/watch?v=_l3ySVKYVJ8" }
            ],
            "baseBurn": 390
          },
          "Fri": {
            "workouts": [
              { "exercise": "Lunges", "prescription": "5x14/leg", "video": "https://www.youtube.com/watch?v=QOVaHwm-Q6U" },
              { "exercise": "Glute Bridges", "prescription": "5x22", "video": "https://www.youtube.com/watch?v=wPM8icPu6H8" },
              { "exercise": "Plank Shoulder Taps", "prescription": "4x24", "video": "https://www.youtube.com/watch?v=67chrbmYdxA" }
            ],
            "baseBurn": 350
          },
          "Sat": {
            "workouts": [
              { "exercise": "Full Body Circuit (Push-ups + Squats + Lunges)", "prescription": "5 rounds", "video": "https://www.youtube.com/watch?v=UBMk30rjy0o" }
            ],
            "baseBurn": 430
          },
          "Sun": {
            "workouts": [
              { "exercise": "Stretch / Yoga Recovery", "prescription": "25-35 min", "video": "https://www.youtube.com/watch?v=v7AYKMP6rOE" }
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
        { "exercise": "Back Squats", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=YaXPRqUwItQ" },
        { "exercise": "Walking Lunges", "prescription": "3x20 (10/leg)", "video": "https://www.youtube.com/watch?v=D7KaRcUTQeE" },
        { "exercise": "Romanian Deadlift", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=2SHsk9AzdjA" },
        { "exercise": "Leg Press", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=IZxyjW7MPJQ" },
        { "exercise": "Bulgarian Split Squat", "prescription": "3x12 (each leg)", "video": "https://www.youtube.com/watch?v=2C-uNgKwPLE" },
        { "exercise": "Goblet Squat", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=MeIiIdhvXT4" },
        { "exercise": "Sumo Deadlift", "prescription": "4x8", "video": "https://www.youtube.com/watch?v=ZGQpU0sH2gY" },
        { "exercise": "Step-Ups", "prescription": "3x15 (per leg)", "video": "https://www.youtube.com/watch?v=dQqApCGd5Ss" },
        { "exercise": "Leg Extension", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=YyvSfVjQeL0" },
        { "exercise": "Seated Leg Curl", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=ELOCsoDSmrg" }
      ],
      "baseBurn": 450
    },
    {
      "category": "Chest",
      "workouts": [
        { "exercise": "Barbell Bench Press", "prescription": "4x8", "video": "https://www.youtube.com/watch?v=gRVjAtPip0Y" },
        { "exercise": "Incline Dumbbell Press", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=8iPEnn-ltC8" },
        { "exercise": "Standard Push-Ups", "prescription": "4x20", "video": "https://www.youtube.com/watch?v=l3ySVKYVJ8" },
        { "exercise": "Chest Fly (Dumbbell)", "prescription": "3x12", "video": "https://www.youtube.com/watch?v=eozdVDA78K0" },
        { "exercise": "Decline Push-Ups", "prescription": "3x15", "video": "https://www.youtube.com/watch?v=9P6RdRzq4X0" },
        { "exercise": "Cable Crossovers", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=taI4XduLpTk" },
        { "exercise": "Incline Bench Press", "prescription": "4x8", "video": "https://www.youtube.com/watch?v=SrqOu55lrYU" },
        { "exercise": "Machine Chest Press", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=pmJ0T63xJME" },
        { "exercise": "Decline Dumbbell Press", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=YzYgprl4E0E" },
        { "exercise": "Plyometric Push-Ups", "prescription": "3x10", "video": "https://www.youtube.com/watch?v=0fiAoqwsc9g" }
      ],
      "baseBurn": 400
    },
    {
      "category": "Shoulder",
      "workouts": [
        { "exercise": "Standing Overhead Press", "prescription": "4x8", "video": "https://www.youtube.com/watch?v=F3QY5vMz_6I" },
        { "exercise": "Dumbbell Lateral Raise", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=kDqklk1ZESo" },
        { "exercise": "Face Pulls", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=rep-qVOkqgk" },
        { "exercise": "Front Raise", "prescription": "3x12", "video": "https://www.youtube.com/watch?v=-t7fuZ0KhDA" },
        { "exercise": "Arnold Press", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=vj2w851ZHRM" },
        { "exercise": "Reverse Pec Deck Fly", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=JEtBE6xPWmI" },
        { "exercise": "Upright Row", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=VgN6_0Gxfz0" },
        { "exercise": "Seated Dumbbell Press", "prescription": "4x8", "video": "https://www.youtube.com/watch?v=B-aVuyhvLHU" },
        { "exercise": "Cable Lateral Raise", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=kDqklk1ZESo" },
        { "exercise": "Plate Front Raise", "prescription": "3x15", "video": "https://www.youtube.com/watch?v=1Tq3QdYUuHs" }
      ],
      "baseBurn": 320
    },
    {
      "category": "Belly",
      "workouts": [
        { "exercise": "Forearm Plank", "prescription": "4x60s", "video": "https://www.youtube.com/watch?v=pSHjTRCQxIw" },
        { "exercise": "Hanging Leg Raises", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=JB2oyawG9KI" },
        { "exercise": "Russian Twists", "prescription": "4x30 (15/side)", "video": "https://www.youtube.com/watch?v=wkD8rjkodUI" },
        { "exercise": "Bicycle Crunch", "prescription": "4x20", "video": "https://www.youtube.com/watch?v=9FGilxCbdz8" },
        { "exercise": "Mountain Climbers", "prescription": "4x30s", "video": "https://www.youtube.com/watch?v=nmwgirgXLYM" },
        { "exercise": "Flutter Kicks", "prescription": "4x40s", "video": "https://www.youtube.com/watch?v=KZitx-6tLxI" },
        { "exercise": "Toe Touch Crunches", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=JB2oyawG9KI" },
        { "exercise": "Side Plank", "prescription": "3x45s (each side)", "video": "https://www.youtube.com/watch?v=K2VljzCC16g" },
        { "exercise": "Reverse Crunch", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=hyv14e2QDq0" },
        { "exercise": "V-Ups", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=iP2fjvG0g3w" }
      ],
      "baseBurn": 280
    },
    {
      "category": "Hip",
      "workouts": [
        { "exercise": "Glute Bridge", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=8bbE64NuDTU" },
        { "exercise": "Clamshells", "prescription": "4x20 (10/side)", "video": "https://www.youtube.com/watch?v=xX17zJWT8_0" },
        { "exercise": "Banded Monster Walk", "prescription": "4x20 steps", "video": "https://www.youtube.com/watch?v=sEW9g5aX0FY" },
        { "exercise": "Hip Thrust", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=LM8XHLYJoYs" },
        { "exercise": "Donkey Kicks", "prescription": "4x15 (per leg)", "video": "https://www.youtube.com/watch?v=Uv_DKDl7EjA" },
        { "exercise": "Fire Hydrant", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=JQ6mD8J1DAE" },
        { "exercise": "Side-Lying Leg Raise", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=Vz3eOb6Y6xY" },
        { "exercise": "Single-Leg Glute Bridge", "prescription": "3x12 (each leg)", "video": "https://www.youtube.com/watch?v=wPM8icPu6H8" },
        { "exercise": "Standing Hip Abduction", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=9Z6l5FdxY-o" },
        { "exercise": "Hip Circles", "prescription": "3x10 (each direction)", "video": "https://www.youtube.com/watch?v=TC9gYpZ6G9I" }
      ],
      "baseBurn": 240
    },
    {
      "category": "Tricep",
      "workouts": [
        { "exercise": "Parallel Bar Dips", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=0326dy-CzM" },
        { "exercise": "EZ-Bar Skull Crushers", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=d_KZxkY_0cM" },
        { "exercise": "Cable Rope Pushdowns", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=6SS6K3lAwZ8" },
        { "exercise": "Overhead Dumbbell Extension", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=nRiJVZDpdL0" },
        { "exercise": "Close-Grip Bench Press", "prescription": "4x10", "video": "https://www.youtube.com/watch?v=ziT1gyVGHw8" },
        { "exercise": "Tricep Kickbacks", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=6SS6K3lAwZ8" },
        { "exercise": "Diamond Push-Ups", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=J0DnG1_S92I" },
        { "exercise": "Bench Dips", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=6kALZikXxLc" },
        { "exercise": "Reverse Grip Pushdown", "prescription": "4x12", "video": "https://www.youtube.com/watch?v=2-LAMcpzODU" },
        { "exercise": "One Arm Overhead Cable Extension", "prescription": "3x15", "video": "https://www.youtube.com/watch?v=Q8KBvVEflz8" }
      ],
      "baseBurn": 260
    },
    {
      "category": "Height Increasing",
      "workouts": [
        { "exercise": "Passive Bar Hang", "prescription": "4x60s", "video": "https://www.youtube.com/watch?v=AJpOIlJZkBw" },
        { "exercise": "Cobra Stretch", "prescription": "4x45s", "video": "https://www.youtube.com/watch?v=JhpkkQKWrFw" },
        { "exercise": "Cat-Camel Mobility", "prescription": "4x12 cycles", "video": "https://www.youtube.com/watch?v=wE4gL8_Nc6A" },
        { "exercise": "Child’s Pose Stretch", "prescription": "4x60s", "video": "https://www.youtube.com/watch?v=3nUnF-nR6zk" },
        { "exercise": "Pelvic Tilt Stretch", "prescription": "4x15", "video": "https://www.youtube.com/watch?v=t5I9o3Nc8I4" },
        { "exercise": "Superman Stretch", "prescription": "4x45s", "video": "https://www.youtube.com/watch?v=z6PJMT2y8GQ" },
        { "exercise": "Bridge Pose", "prescription": "4x30s", "video": "https://www.youtube.com/watch?v=wPM8icPu6H8" },
        { "exercise": "Seated Toe Touch", "prescription": "4x45s", "video": "https://www.youtube.com/watch?v=Vuv0F4x3XcE" },
        { "exercise": "Jump Rope", "prescription": "5x1min", "video": "https://www.youtube.com/watch?v=1BZMdzf_aR0" },
        { "exercise": "Standing Side Stretch", "prescription": "4x30s", "video": "https://www.youtube.com/watch?v=ByBzd6_BtB8" }
      ],
      "baseBurn": 180
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
