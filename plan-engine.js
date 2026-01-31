(function () {
  'use strict';

  const GOAL_ALIASES = {
    'lose weight': 'lose-weight',
    'fat loss': 'lose-weight',
    'weight loss': 'lose-weight',
    'lean down': 'lose-weight',
    'build muscle': 'build-muscle',
    'gain muscle': 'build-muscle',
    'hypertrophy': 'build-muscle',
    'improve endurance': 'improve-endurance',
    endurance: 'improve-endurance',
    stamina: 'improve-endurance',
    'general fitness': 'general-fitness',
    maintenance: 'general-fitness',
    wellness: 'general-fitness',
    default: 'general-fitness'
  };

  const GOAL_LABELS = {
    'lose-weight': 'Lose Weight',
    'build-muscle': 'Build Muscle',
    'improve-endurance': 'Improve Endurance',
    'general-fitness': 'General Fitness'
  };

  const LEVEL_WINDOWS = [
    { start: 1, end: 30, level: 'Beginner' },
    { start: 31, end: 60, level: 'Intermediate' },
    { start: 61, end: 90, level: 'Advanced' }
  ];

  const WEEKLY_PROGRESSION = {
    Beginner: { weeklyIncrementPct: 5, maxPct: 15 },
    Intermediate: { weeklyIncrementPct: 7, maxPct: 21 },
    Advanced: { weeklyIncrementPct: 10, maxPct: 30 }
  };

  const BURN_MULTIPLIERS = {
    Beginner: 1,
    Intermediate: 1.15,
    Advanced: 1.3
  };

  const PORTION_MULTIPLIERS = {
    Beginner: 1,
    Intermediate: 1.1,
    Advanced: 1.2
  };

  const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const CALENDAR_DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const HIGH_INTENSITY_THRESHOLD = 350;
  const LOW_INTENSITY_THRESHOLD = 200;

  const HIGH_INTENSITY_SNACK = {
    type: 'Snack',
    label: 'Banana + Whey Shake',
    foods: 'Banana blended with whey protein',
    calories: 150,
    protein: 12,
    carbs: 28,
    fat: 1
  };

  const ADVANCED_EXTRA_SNACK = {
    type: 'Snack',
    label: 'Greek Yogurt + Whey Shot',
    foods: '150 g Greek yogurt with whey shot',
    calories: 180,
    protein: 20,
    carbs: 8,
    fat: 4
  };

  const WORKOUT_SEED_WEEKS = {
    'Lose Weight': {
      Beginner: {
        Mon: {
          workouts: [
            { exercise: 'Jumping Jacks', prescription: '3x30s', video: 'https://www.youtube.com/watch?v=c4DAnQ6DtF8' },
            { exercise: 'High Knees', prescription: '3x30s', video: 'https://www.youtube.com/watch?v=8opcQdC-V-U' },
            { exercise: 'Mountain Climbers', prescription: '3x25s', video: 'https://www.youtube.com/watch?v=nmwgirgXLYM' },
            { exercise: 'Plank', prescription: '3x25s', video: 'https://www.youtube.com/watch?v=pSHjTRCQxIw' }
          ],
          baseBurn: 320
        },
        Tue: {
          workouts: [
            { exercise: 'Bodyweight Squats', prescription: '3x15', video: 'https://www.youtube.com/watch?v=aclHkVaku9U' },
            { exercise: 'Forward Lunges', prescription: '3x10/leg', video: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U' },
            { exercise: 'Glute Bridges', prescription: '3x15', video: 'https://www.youtube.com/watch?v=wPM8icPu6H8' },
            { exercise: 'Side Plank', prescription: '3x20s/side', video: 'https://www.youtube.com/watch?v=K2VljzCC16g' }
          ],
          baseBurn: 300
        },
        Wed: {
          workouts: [
            { exercise: 'Brisk Walk / March in Place', prescription: '25 min', video: 'https://www.youtube.com/watch?v=MsP2aT6O3v0' },
            { exercise: 'Dynamic Stretching', prescription: '10 min', video: 'https://www.youtube.com/watch?v=V1Lb8CzNzC8' }
          ],
          baseBurn: 180
        },
        Thu: {
          workouts: [
            { exercise: 'Jump Squats', prescription: '3x12', video: 'https://www.youtube.com/watch?v=U4s4mEQ5VqU' },
            { exercise: 'Push-ups', prescription: '3x10', video: 'https://www.youtube.com/watch?v=_l3ySVKYVJ8' },
            { exercise: 'Burpees', prescription: '3x8', video: 'https://www.youtube.com/watch?v=TU8QYVW0gDU' },
            { exercise: 'Plank Shoulder Taps', prescription: '3x16', video: 'https://www.youtube.com/watch?v=67chrbmYdxA' }
          ],
          baseBurn: 350
        },
        Fri: {
          workouts: [
            { exercise: 'Crunches', prescription: '3x18', video: 'https://www.youtube.com/watch?v=Xyd_fa5zoEU' },
            { exercise: 'Bicycle Crunches', prescription: '3x16', video: 'https://www.youtube.com/watch?v=9FGilxCbdz8' },
            { exercise: 'Flutter Kicks', prescription: '3x25s', video: 'https://www.youtube.com/watch?v=K7iA1J1iBMc' },
            { exercise: 'Russian Twists', prescription: '3x18', video: 'https://www.youtube.com/watch?v=wkD8rjkodUI' }
          ],
          baseBurn: 280
        },
        Sat: {
          workouts: [
            { exercise: 'Full Body Circuit (Squat → Push-up → Lunge → Plank)', prescription: '3 rounds', video: 'https://www.youtube.com/watch?v=UBMk30rjy0o' }
          ],
          baseBurn: 360
        },
        Sun: {
          workouts: [
            { exercise: 'Yoga / Stretch Recovery', prescription: '20-30 min', video: 'https://www.youtube.com/watch?v=v7AYKMP6rOE' }
          ],
          baseBurn: 160
        }
      },
      Intermediate: {
        Mon: {
          workouts: [
            { exercise: 'Jumping Jacks', prescription: '4x35s', video: 'https://www.youtube.com/watch?v=c4DAnQ6DtF8' },
            { exercise: 'High Knees', prescription: '4x35s', video: 'https://www.youtube.com/watch?v=8opcQdC-V-U' },
            { exercise: 'Mountain Climbers', prescription: '4x30s', video: 'https://www.youtube.com/watch?v=nmwgirgXLYM' },
            { exercise: 'Plank', prescription: '3x35s', video: 'https://www.youtube.com/watch?v=pSHjTRCQxIw' }
          ],
          baseBurn: 380
        },
        Tue: {
          workouts: [
            { exercise: 'Bodyweight Squats', prescription: '4x18', video: 'https://www.youtube.com/watch?v=aclHkVaku9U' },
            { exercise: 'Forward Lunges', prescription: '4x12/leg', video: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U' },
            { exercise: 'Glute Bridges', prescription: '4x18', video: 'https://www.youtube.com/watch?v=wPM8icPu6H8' },
            { exercise: 'Side Plank', prescription: '3x30s/side', video: 'https://www.youtube.com/watch?v=K2VljzCC16g' }
          ],
          baseBurn: 345
        },
        Wed: {
          workouts: [
            { exercise: 'Brisk Walk / March in Place', prescription: '30 min', video: 'https://www.youtube.com/watch?v=MsP2aT6O3v0' },
            { exercise: 'Mobility Flow', prescription: '12 min', video: 'https://www.youtube.com/watch?v=V1Lb8CzNzC8' }
          ],
          baseBurn: 210
        },
        Thu: {
          workouts: [
            { exercise: 'Jump Squats', prescription: '4x12', video: 'https://www.youtube.com/watch?v=U4s4mEQ5VqU' },
            { exercise: 'Push-ups', prescription: '4x12', video: 'https://www.youtube.com/watch?v=_l3ySVKYVJ8' },
            { exercise: 'Burpees', prescription: '3x10', video: 'https://www.youtube.com/watch?v=TU8QYVW0gDU' },
            { exercise: 'Plank Shoulder Taps', prescription: '3x20', video: 'https://www.youtube.com/watch?v=67chrbmYdxA' }
          ],
          baseBurn: 400
        },
        Fri: {
          workouts: [
            { exercise: 'Crunches', prescription: '4x20', video: 'https://www.youtube.com/watch?v=Xyd_fa5zoEU' },
            { exercise: 'Bicycle Crunches', prescription: '4x18', video: 'https://www.youtube.com/watch?v=9FGilxCbdz8' },
            { exercise: 'Flutter Kicks', prescription: '4x30s', video: 'https://www.youtube.com/watch?v=K7iA1J1iBMc' },
            { exercise: 'Russian Twists', prescription: '4x20', video: 'https://www.youtube.com/watch?v=wkD8rjkodUI' }
          ],
          baseBurn: 320
        },
        Sat: {
          workouts: [
            { exercise: 'Full Body Circuit (Squat → Push-up → Lunge → Plank)', prescription: '4 rounds', video: 'https://www.youtube.com/watch?v=UBMk30rjy0o' }
          ],
          baseBurn: 420
        },
        Sun: {
          workouts: [
            { exercise: 'Yoga / Stretch Recovery', prescription: '25-35 min', video: 'https://www.youtube.com/watch?v=v7AYKMP6rOE' }
          ],
          baseBurn: 170
        }
      },
      Advanced: {
        Mon: {
          workouts: [
            { exercise: 'Jumping Jacks', prescription: '5x40s', video: 'https://www.youtube.com/watch?v=c4DAnQ6DtF8' },
            { exercise: 'High Knees', prescription: '5x40s', video: 'https://www.youtube.com/watch?v=8opcQdC-V-U' },
            { exercise: 'Mountain Climbers', prescription: '4x40s', video: 'https://www.youtube.com/watch?v=nmwgirgXLYM' },
            { exercise: 'Plank', prescription: '3x45s', video: 'https://www.youtube.com/watch?v=pSHjTRCQxIw' }
          ],
          baseBurn: 416
        },
        Tue: {
          workouts: [
            { exercise: 'Bodyweight Squats', prescription: '5x20', video: 'https://www.youtube.com/watch?v=aclHkVaku9U' },
            { exercise: 'Forward Lunges', prescription: '4x14/leg', video: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U' },
            { exercise: 'Glute Bridges', prescription: '4x20', video: 'https://www.youtube.com/watch?v=wPM8icPu6H8' },
            { exercise: 'Side Plank', prescription: '3x40s/side', video: 'https://www.youtube.com/watch?v=K2VljzCC16g' }
          ],
          baseBurn: 390
        },
        Wed: {
          workouts: [
            { exercise: 'Tempo Walk/Jog', prescription: '35 min', video: 'https://www.youtube.com/watch?v=MsP2aT6O3v0' },
            { exercise: 'Mobility Flow', prescription: '12 min', video: 'https://www.youtube.com/watch?v=V1Lb8CzNzC8' }
          ],
          baseBurn: 230
        },
        Thu: {
          workouts: [
            { exercise: 'Jump Squats', prescription: '5x12', video: 'https://www.youtube.com/watch?v=U4s4mEQ5VqU' },
            { exercise: 'Push-ups', prescription: '4x15', video: 'https://www.youtube.com/watch?v=_l3ySVKYVJ8' },
            { exercise: 'Burpees', prescription: '4x10', video: 'https://www.youtube.com/watch?v=TU8QYVW0gDU' },
            { exercise: 'Plank Shoulder Taps', prescription: '4x20', video: 'https://www.youtube.com/watch?v=67chrbmYdxA' }
          ],
          baseBurn: 455
        },
        Fri: {
          workouts: [
            { exercise: 'Crunches', prescription: '4x24', video: 'https://www.youtube.com/watch?v=Xyd_fa5zoEU' },
            { exercise: 'Bicycle Crunches', prescription: '4x22', video: 'https://www.youtube.com/watch?v=9FGilxCbdz8' },
            { exercise: 'Flutter Kicks', prescription: '4x35s', video: 'https://www.youtube.com/watch?v=K7iA1J1iBMc' },
            { exercise: 'Russian Twists', prescription: '4x24', video: 'https://www.youtube.com/watch?v=wkD8rjkodUI' }
          ],
          baseBurn: 365
        },
        Sat: {
          workouts: [
            { exercise: 'Full Body Circuit (Squat → Push-up → Lunge → Plank)', prescription: '5 rounds', video: 'https://www.youtube.com/watch?v=UBMk30rjy0o' }
          ],
          baseBurn: 468
        },
        Sun: {
          workouts: [
            { exercise: 'Yoga / Stretch Recovery', prescription: '25-35 min', video: 'https://www.youtube.com/watch?v=v7AYKMP6rOE' }
          ],
          baseBurn: 175
        }
      }
    },
    'Build Muscle': {
      Beginner: {
        Mon: {
          workouts: [
            { exercise: 'Push-ups', prescription: '4x12', video: 'https://www.youtube.com/watch?v=_l3ySVKYVJ8' },
            { exercise: 'Bodyweight Rows (table)', prescription: '4x8', video: 'https://www.youtube.com/watch?v=6kALZikXxLc' },
            { exercise: 'Squats', prescription: '4x18', video: 'https://www.youtube.com/watch?v=aclHkVaku9U' },
            { exercise: 'Chair Dips', prescription: '3x10', video: 'https://www.youtube.com/watch?v=0326dy_-CzM' }
          ],
          baseBurn: 340
        },
        Tue: {
          workouts: [
            { exercise: 'Lunges', prescription: '4x10/leg', video: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U' },
            { exercise: 'Glute Bridges', prescription: '4x18', video: 'https://www.youtube.com/watch?v=wPM8icPu6H8' },
            { exercise: 'Leg Raises', prescription: '3x12', video: 'https://www.youtube.com/watch?v=JB2oyawG9KI' }
          ],
          baseBurn: 300
        },
        Wed: {
          workouts: [
            { exercise: 'Yoga Mobility', prescription: '20 min', video: 'https://www.youtube.com/watch?v=v7AYKMP6rOE' }
          ],
          baseBurn: 150
        },
        Thu: {
          workouts: [
            { exercise: 'Diamond Push-ups', prescription: '3x8', video: 'https://www.youtube.com/watch?v=J0DnG1_S92I' },
            { exercise: 'Tricep Dips', prescription: '3x12', video: 'https://www.youtube.com/watch?v=0326dy_-CzM' },
            { exercise: 'Mountain Climbers', prescription: '3x30s', video: 'https://www.youtube.com/watch?v=nmwgirgXLYM' }
          ],
          baseBurn: 320
        },
        Fri: {
          workouts: [
            { exercise: 'Pull-ups / Assisted Rows', prescription: '3x6', video: 'https://www.youtube.com/watch?v=eGo4IYlbE5g' },
            { exercise: 'Calf Raises', prescription: '3x18', video: 'https://www.youtube.com/watch?v=-M4-G8p8fmc' },
            { exercise: 'Squats', prescription: '3x18', video: 'https://www.youtube.com/watch?v=aclHkVaku9U' }
          ],
          baseBurn: 330
        },
        Sat: {
          workouts: [
            { exercise: 'Full Body Strength Circuit', prescription: '3 rounds', video: 'https://www.youtube.com/watch?v=UItWltVZZmE' }
          ],
          baseBurn: 360
        },
        Sun: {
          workouts: [
            { exercise: 'Active Stretch', prescription: '20-30 min', video: 'https://www.youtube.com/watch?v=sTANio_2E0Q' }
          ],
          baseBurn: 140
        }
      },
      Intermediate: {
        Mon: {
          workouts: [
            { exercise: 'Push-ups', prescription: '4x15', video: 'https://www.youtube.com/watch?v=_l3ySVKYVJ8' },
            { exercise: 'Bodyweight Rows (table)', prescription: '4x10', video: 'https://www.youtube.com/watch?v=6kALZikXxLc' },
            { exercise: 'Squats', prescription: '4x22', video: 'https://www.youtube.com/watch?v=aclHkVaku9U' },
            { exercise: 'Chair Dips', prescription: '3x12', video: 'https://www.youtube.com/watch?v=0326dy_-CzM' }
          ],
          baseBurn: 390
        },
        Tue: {
          workouts: [
            { exercise: 'Lunges', prescription: '4x12/leg', video: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U' },
            { exercise: 'Glute Bridges', prescription: '4x20', video: 'https://www.youtube.com/watch?v=wPM8icPu6H8' },
            { exercise: 'Leg Raises', prescription: '3x15', video: 'https://www.youtube.com/watch?v=JB2oyawG9KI' }
          ],
          baseBurn: 340
        },
        Wed: {
          workouts: [
            { exercise: 'Yoga Mobility', prescription: '25 min', video: 'https://www.youtube.com/watch?v=v7AYKMP6rOE' }
          ],
          baseBurn: 170
        },
        Thu: {
          workouts: [
            { exercise: 'Diamond Push-ups', prescription: '4x10', video: 'https://www.youtube.com/watch?v=J0DnG1_S92I' },
            { exercise: 'Tricep Dips', prescription: '4x12', video: 'https://www.youtube.com/watch?v=0326dy_-CzM' },
            { exercise: 'Mountain Climbers', prescription: '4x30s', video: 'https://www.youtube.com/watch?v=nmwgirgXLYM' }
          ],
          baseBurn: 360
        },
        Fri: {
          workouts: [
            { exercise: 'Pull-ups / Assisted Rows', prescription: '3x8', video: 'https://www.youtube.com/watch?v=eGo4IYlbE5g' },
            { exercise: 'Calf Raises', prescription: '4x20', video: 'https://www.youtube.com/watch?v=-M4-G8p8fmc' },
            { exercise: 'Squats', prescription: '4x20', video: 'https://www.youtube.com/watch?v=aclHkVaku9U' }
          ],
          baseBurn: 380
        },
        Sat: {
          workouts: [
            { exercise: 'Full Body Strength Circuit', prescription: '4 rounds', video: 'https://www.youtube.com/watch?v=UItWltVZZmE' }
          ],
          baseBurn: 420
        },
        Sun: {
          workouts: [
            { exercise: 'Active Stretch', prescription: '25-30 min', video: 'https://www.youtube.com/watch?v=sTANio_2E0Q' }
          ],
          baseBurn: 155
        }
      },
      Advanced: {
        Mon: {
          workouts: [
            { exercise: 'Push-ups', prescription: '5x15', video: 'https://www.youtube.com/watch?v=_l3ySVKYVJ8' },
            { exercise: 'Bodyweight Rows (table)', prescription: '4x12', video: 'https://www.youtube.com/watch?v=6kALZikXxLc' },
            { exercise: 'Squats', prescription: '5x22', video: 'https://www.youtube.com/watch?v=aclHkVaku9U' },
            { exercise: 'Chair Dips', prescription: '4x12', video: 'https://www.youtube.com/watch?v=0326dy_-CzM' }
          ],
          baseBurn: 450
        },
        Tue: {
          workouts: [
            { exercise: 'Lunges', prescription: '5x12/leg', video: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U' },
            { exercise: 'Glute Bridges', prescription: '5x20', video: 'https://www.youtube.com/watch?v=wPM8icPu6H8' },
            { exercise: 'Leg Raises', prescription: '4x15', video: 'https://www.youtube.com/watch?v=JB2oyawG9KI' }
          ],
          baseBurn: 390
        },
        Wed: {
          workouts: [
            { exercise: 'Yoga Mobility', prescription: '25-35 min', video: 'https://www.youtube.com/watch?v=v7AYKMP6rOE' }
          ],
          baseBurn: 180
        },
        Thu: {
          workouts: [
            { exercise: 'Diamond Push-ups', prescription: '4x12', video: 'https://www.youtube.com/watch?v=J0DnG1_S92I' },
            { exercise: 'Tricep Dips', prescription: '4x14', video: 'https://www.youtube.com/watch?v=0326dy_-CzM' },
            { exercise: 'Mountain Climbers', prescription: '4x40s', video: 'https://www.youtube.com/watch?v=nmwgirgXLYM' }
          ],
          baseBurn: 405
        },
        Fri: {
          workouts: [
            { exercise: 'Pull-ups', prescription: '4x8', video: 'https://www.youtube.com/watch?v=eGo4IYlbE5g' },
            { exercise: 'Calf Raises', prescription: '4x24', video: 'https://www.youtube.com/watch?v=-M4-G8p8fmc' },
            { exercise: 'Squats', prescription: '4x24', video: 'https://www.youtube.com/watch?v=aclHkVaku9U' }
          ],
          baseBurn: 430
        },
        Sat: {
          workouts: [
            { exercise: 'Full Body Strength Circuit', prescription: '5 rounds', video: 'https://www.youtube.com/watch?v=UItWltVZZmE' }
          ],
          baseBurn: 468
        },
        Sun: {
          workouts: [
            { exercise: 'Active Stretch', prescription: '25-35 min', video: 'https://www.youtube.com/watch?v=sTANio_2E0Q' }
          ],
          baseBurn: 160
        }
      }
    },
    'Improve Endurance': {
      Beginner: {
        Mon: {
          workouts: [
            { exercise: 'Jump Rope (or mimic)', prescription: '5x45s', video: 'https://www.youtube.com/watch?v=1BZMZZMj8yY' },
            { exercise: 'Burpees', prescription: '3x10', video: 'https://www.youtube.com/watch?v=TU8QYVW0gDU' },
            { exercise: 'Mountain Climbers', prescription: '3x25s', video: 'https://www.youtube.com/watch?v=nmwgirgXLYM' },
            { exercise: 'Plank', prescription: '3x35s', video: 'https://www.youtube.com/watch?v=pSHjTRCQxIw' }
          ],
          baseBurn: 360
        },
        Tue: {
          workouts: [
            { exercise: 'Jog in Place', prescription: '18 min', video: 'https://www.youtube.com/watch?v=c3ZGl4pAwZ4' },
            { exercise: 'Squats', prescription: '3x18', video: 'https://www.youtube.com/watch?v=aclHkVaku9U' }
          ],
          baseBurn: 300
        },
        Wed: {
          workouts: [
            { exercise: 'High Knees', prescription: '4x25s', video: 'https://www.youtube.com/watch?v=8opcQdC-V-U' },
            { exercise: 'Butt Kicks', prescription: '4x25s', video: 'https://www.youtube.com/watch?v=vc1E5CfRfos' },
            { exercise: 'Jumping Jacks', prescription: '4x25s', video: 'https://www.youtube.com/watch?v=c4DAnQ6DtF8' }
          ],
          baseBurn: 320
        },
        Thu: {
          workouts: [
            { exercise: 'Bird-dog', prescription: '3x12/side', video: 'https://www.youtube.com/watch?v=wiFNA3sqjCA' },
            { exercise: 'Leg Raises', prescription: '3x12', video: 'https://www.youtube.com/watch?v=JB2oyawG9KI' }
          ],
          baseBurn: 220
        },
        Fri: {
          workouts: [
            { exercise: 'Walk/Jog', prescription: '22 min', video: 'https://www.youtube.com/watch?v=MsP2aT6O3v0' },
            { exercise: 'Stretch', prescription: '10 min', video: 'https://www.youtube.com/watch?v=sTANio_2E0Q' }
          ],
          baseBurn: 240
        },
        Sat: {
          workouts: [
            { exercise: 'Burpees', prescription: '3x10', video: 'https://www.youtube.com/watch?v=TU8QYVW0gDU' },
            { exercise: 'Jumping Jacks', prescription: '3x25s', video: 'https://www.youtube.com/watch?v=c4DAnQ6DtF8' },
            { exercise: 'Squats', prescription: '3x18', video: 'https://www.youtube.com/watch?v=aclHkVaku9U' }
          ],
          baseBurn: 360
        },
        Sun: {
          workouts: [
            { exercise: 'Yoga / Active Stretch', prescription: '20-30 min', video: 'https://www.youtube.com/watch?v=v7AYKMP6rOE' }
          ],
          baseBurn: 160
        }
      },
      Intermediate: {
        Mon: {
          workouts: [
            { exercise: 'Jump Rope (or mimic)', prescription: '6x50s', video: 'https://www.youtube.com/watch?v=1BZMZZMj8yY' },
            { exercise: 'Burpees', prescription: '4x10', video: 'https://www.youtube.com/watch?v=TU8QYVW0gDU' },
            { exercise: 'Mountain Climbers', prescription: '4x30s', video: 'https://www.youtube.com/watch?v=nmwgirgXLYM' },
            { exercise: 'Plank', prescription: '3x45s', video: 'https://www.youtube.com/watch?v=pSHjTRCQxIw' }
          ],
          baseBurn: 410
        },
        Tue: {
          workouts: [
            { exercise: 'Jog in Place', prescription: '22 min', video: 'https://www.youtube.com/watch?v=c3ZGl4pAwZ4' },
            { exercise: 'Squats', prescription: '4x20', video: 'https://www.youtube.com/watch?v=aclHkVaku9U' }
          ],
          baseBurn: 340
        },
        Wed: {
          workouts: [
            { exercise: 'High Knees', prescription: '5x30s', video: 'https://www.youtube.com/watch?v=8opcQdC-V-U' },
            { exercise: 'Butt Kicks', prescription: '5x30s', video: 'https://www.youtube.com/watch?v=vc1E5CfRfos' },
            { exercise: 'Jumping Jacks', prescription: '5x30s', video: 'https://www.youtube.com/watch?v=c4DAnQ6DtF8' }
          ],
          baseBurn: 360
        },
        Thu: {
          workouts: [
            { exercise: 'Bird-dog', prescription: '4x15/side', video: 'https://www.youtube.com/watch?v=wiFNA3sqjCA' },
            { exercise: 'Leg Raises', prescription: '4x15', video: 'https://www.youtube.com/watch?v=JB2oyawG9KI' }
          ],
          baseBurn: 260
        },
        Fri: {
          workouts: [
            { exercise: 'Continuous Walk/Jog', prescription: '28 min', video: 'https://www.youtube.com/watch?v=MsP2aT6O3v0' },
            { exercise: 'Stretch', prescription: '12 min', video: 'https://www.youtube.com/watch?v=sTANio_2E0Q' }
          ],
          baseBurn: 280
        },
        Sat: {
          workouts: [
            { exercise: 'Burpees', prescription: '4x12', video: 'https://www.youtube.com/watch?v=TU8QYVW0gDU' },
            { exercise: 'Jumping Jacks', prescription: '4x30s', video: 'https://www.youtube.com/watch?v=c4DAnQ6DtF8' },
            { exercise: 'Squats', prescription: '4x20', video: 'https://www.youtube.com/watch?v=aclHkVaku9U' }
          ],
          baseBurn: 410
        },
        Sun: {
          workouts: [
            { exercise: 'Yoga / Active Stretch', prescription: '25-35 min', video: 'https://www.youtube.com/watch?v=v7AYKMP6rOE' }
          ],
          baseBurn: 170
        }
      },
      Advanced: {
        Mon: {
          workouts: [
            { exercise: 'Jump Rope (or mimic)', prescription: '7x60s', video: 'https://www.youtube.com/watch?v=1BZMZZMj8yY' },
            { exercise: 'Burpees', prescription: '5x12', video: 'https://www.youtube.com/watch?v=TU8QYVW0gDU' },
            { exercise: 'Mountain Climbers', prescription: '4x40s', video: 'https://www.youtube.com/watch?v=nmwgirgXLYM' },
            { exercise: 'Plank', prescription: '3x60s', video: 'https://www.youtube.com/watch?v=pSHjTRCQxIw' }
          ],
          baseBurn: 470
        },
        Tue: {
          workouts: [
            { exercise: 'Tempo Jog in Place', prescription: '28 min', video: 'https://www.youtube.com/watch?v=c3ZGl4pAwZ4' },
            { exercise: 'Squats', prescription: '5x22', video: 'https://www.youtube.com/watch?v=aclHkVaku9U' }
          ],
          baseBurn: 390
        },
        Wed: {
          workouts: [
            { exercise: 'High Knees', prescription: '6x35s', video: 'https://www.youtube.com/watch?v=8opcQdC-V-U' },
            { exercise: 'Butt Kicks', prescription: '6x35s', video: 'https://www.youtube.com/watch?v=vc1E5CfRfos' },
            { exercise: 'Jumping Jacks', prescription: '6x35s', video: 'https://www.youtube.com/watch?v=c4DAnQ6DtF8' }
          ],
          baseBurn: 400
        },
        Thu: {
          workouts: [
            { exercise: 'Bird-dog', prescription: '4x18/side', video: 'https://www.youtube.com/watch?v=wiFNA3sqjCA' },
            { exercise: 'Leg Raises', prescription: '4x18', video: 'https://www.youtube.com/watch?v=JB2oyawG9KI' }
          ],
          baseBurn: 290
        },
        Fri: {
          workouts: [
            { exercise: 'Continuous Run/Walk', prescription: '32 min', video: 'https://www.youtube.com/watch?v=MsP2aT6O3v0' },
            { exercise: 'Stretch', prescription: '12-15 min', video: 'https://www.youtube.com/watch?v=sTANio_2E0Q' }
          ],
          baseBurn: 320
        },
        Sat: {
          workouts: [
            { exercise: 'Burpees', prescription: '5x12', video: 'https://www.youtube.com/watch?v=TU8QYVW0gDU' },
            { exercise: 'Jumping Jacks', prescription: '5x35s', video: 'https://www.youtube.com/watch?v=c4DAnQ6DtF8' },
            { exercise: 'Squats', prescription: '5x22', video: 'https://www.youtube.com/watch?v=aclHkVaku9U' }
          ],
          baseBurn: 470
        },
        Sun: {
          workouts: [
            { exercise: 'Yoga / Active Stretch', prescription: '25-40 min', video: 'https://www.youtube.com/watch?v=v7AYKMP6rOE' }
          ],
          baseBurn: 180
        }
      }
    },
    'General Fitness': {
      Beginner: {
        Mon: {
          workouts: [
            { exercise: 'Jumping Jacks', prescription: '3x30s', video: 'https://www.youtube.com/watch?v=c4DAnQ6DtF8' },
            { exercise: 'Push-ups', prescription: '3x10', video: 'https://www.youtube.com/watch?v=_l3ySVKYVJ8' },
            { exercise: 'Squats', prescription: '3x15', video: 'https://www.youtube.com/watch?v=aclHkVaku9U' },
            { exercise: 'Plank', prescription: '3x30s', video: 'https://www.youtube.com/watch?v=pSHjTRCQxIw' }
          ],
          baseBurn: 300
        },
        Tue: {
          workouts: [
            { exercise: 'Yoga Flow', prescription: '20 min', video: 'https://www.youtube.com/watch?v=v7AYKMP6rOE' }
          ],
          baseBurn: 160
        },
        Wed: {
          workouts: [
            { exercise: 'Plank', prescription: '3x40s', video: 'https://www.youtube.com/watch?v=pSHjTRCQxIw' },
            { exercise: 'Bird-dog', prescription: '3x12/side', video: 'https://www.youtube.com/watch?v=wiFNA3sqjCA' },
            { exercise: 'Squats', prescription: '3x18', video: 'https://www.youtube.com/watch?v=aclHkVaku9U' }
          ],
          baseBurn: 260
        },
        Thu: {
          workouts: [
            { exercise: 'Burpees', prescription: '3x8', video: 'https://www.youtube.com/watch?v=TU8QYVW0gDU' },
            { exercise: 'Jumping Jacks', prescription: '3x30s', video: 'https://www.youtube.com/watch?v=c4DAnQ6DtF8' },
            { exercise: 'Push-ups', prescription: '3x10', video: 'https://www.youtube.com/watch?v=_l3ySVKYVJ8' }
          ],
          baseBurn: 320
        },
        Fri: {
          workouts: [
            { exercise: 'Lunges', prescription: '3x12/leg', video: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U' },
            { exercise: 'Glute Bridges', prescription: '3x18', video: 'https://www.youtube.com/watch?v=wPM8icPu6H8' },
            { exercise: 'Plank Shoulder Taps', prescription: '3x16', video: 'https://www.youtube.com/watch?v=67chrbmYdxA' }
          ],
          baseBurn: 280
        },
        Sat: {
          workouts: [
            { exercise: 'Full Body Circuit (Push-ups + Squats + Lunges)', prescription: '3 rounds', video: 'https://www.youtube.com/watch?v=UBMk30rjy0o' }
          ],
          baseBurn: 340
        },
        Sun: {
          workouts: [
            { exercise: 'Stretch / Yoga Recovery', prescription: '20-30 min', video: 'https://www.youtube.com/watch?v=v7AYKMP6rOE' }
          ],
          baseBurn: 150
        }
      },
      Intermediate: {
        Mon: {
          workouts: [
            { exercise: 'Jumping Jacks', prescription: '4x35s', video: 'https://www.youtube.com/watch?v=c4DAnQ6DtF8' },
            { exercise: 'Push-ups', prescription: '4x12', video: 'https://www.youtube.com/watch?v=_l3ySVKYVJ8' },
            { exercise: 'Squats', prescription: '4x18', video: 'https://www.youtube.com/watch?v=aclHkVaku9U' },
            { exercise: 'Plank', prescription: '3x40s', video: 'https://www.youtube.com/watch?v=pSHjTRCQxIw' }
          ],
          baseBurn: 345
        },
        Tue: {
          workouts: [
            { exercise: 'Yoga Flow', prescription: '25 min', video: 'https://www.youtube.com/watch?v=v7AYKMP6rOE' }
          ],
          baseBurn: 175
        },
        Wed: {
          workouts: [
            { exercise: 'Plank', prescription: '4x40s', video: 'https://www.youtube.com/watch?v=pSHjTRCQxIw' },
            { exercise: 'Bird-dog', prescription: '4x12/side', video: 'https://www.youtube.com/watch?v=wiFNA3sqjCA' },
            { exercise: 'Squats', prescription: '4x20', video: 'https://www.youtube.com/watch?v=aclHkVaku9U' }
          ],
          baseBurn: 290
        },
        Thu: {
          workouts: [
            { exercise: 'Burpees', prescription: '4x10', video: 'https://www.youtube.com/watch?v=TU8QYVW0gDU' },
            { exercise: 'Jumping Jacks', prescription: '4x35s', video: 'https://www.youtube.com/watch?v=c4DAnQ6DtF8' },
            { exercise: 'Push-ups', prescription: '4x12', video: 'https://www.youtube.com/watch?v=_l3ySVKYVJ8' }
          ],
          baseBurn: 350
        },
        Fri: {
          workouts: [
            { exercise: 'Lunges', prescription: '4x12/leg', video: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U' },
            { exercise: 'Glute Bridges', prescription: '4x20', video: 'https://www.youtube.com/watch?v=wPM8icPu6H8' },
            { exercise: 'Plank Shoulder Taps', prescription: '4x20', video: 'https://www.youtube.com/watch?v=67chrbmYdxA' }
          ],
          baseBurn: 320
        },
        Sat: {
          workouts: [
            { exercise: 'Full Body Circuit (Push-ups + Squats + Lunges)', prescription: '4 rounds', video: 'https://www.youtube.com/watch?v=UBMk30rjy0o' }
          ],
          baseBurn: 390
        },
        Sun: {
          workouts: [
            { exercise: 'Stretch / Yoga Recovery', prescription: '25-30 min', video: 'https://www.youtube.com/watch?v=v7AYKMP6rOE' }
          ],
          baseBurn: 165
        }
      },
      Advanced: {
        Mon: {
          workouts: [
            { exercise: 'Jumping Jacks', prescription: '5x40s', video: 'https://www.youtube.com/watch?v=c4DAnQ6DtF8' },
            { exercise: 'Push-ups', prescription: '5x15', video: 'https://www.youtube.com/watch?v=_l3ySVKYVJ8' },
            { exercise: 'Squats', prescription: '5x22', video: 'https://www.youtube.com/watch?v=aclHkVaku9U' },
            { exercise: 'Plank', prescription: '3x60s', video: 'https://www.youtube.com/watch?v=pSHjTRCQxIw' }
          ],
          baseBurn: 390
        },
        Tue: {
          workouts: [
            { exercise: 'Yoga Flow', prescription: '30 min', video: 'https://www.youtube.com/watch?v=v7AYKMP6rOE' }
          ],
          baseBurn: 190
        },
        Wed: {
          workouts: [
            { exercise: 'Plank', prescription: '4x60s', video: 'https://www.youtube.com/watch?v=pSHjTRCQxIw' },
            { exercise: 'Bird-dog', prescription: '4x15/side', video: 'https://www.youtube.com/watch?v=wiFNA3sqjCA' },
            { exercise: 'Squats', prescription: '4x24', video: 'https://www.youtube.com/watch?v=aclHkVaku9U' }
          ],
          baseBurn: 320
        },
        Thu: {
          workouts: [
            { exercise: 'Burpees', prescription: '5x10', video: 'https://www.youtube.com/watch?v=TU8QYVW0gDU' },
            { exercise: 'Jumping Jacks', prescription: '5x40s', video: 'https://www.youtube.com/watch?v=c4DAnQ6DtF8' },
            { exercise: 'Push-ups', prescription: '5x15', video: 'https://www.youtube.com/watch?v=_l3ySVKYVJ8' }
          ],
          baseBurn: 390
        },
        Fri: {
          workouts: [
            { exercise: 'Lunges', prescription: '5x14/leg', video: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U' },
            { exercise: 'Glute Bridges', prescription: '5x22', video: 'https://www.youtube.com/watch?v=wPM8icPu6H8' },
            { exercise: 'Plank Shoulder Taps', prescription: '4x24', video: 'https://www.youtube.com/watch?v=67chrbmYdxA' }
          ],
          baseBurn: 350
        },
        Sat: {
          workouts: [
            { exercise: 'Full Body Circuit (Push-ups + Squats + Lunges)', prescription: '5 rounds', video: 'https://www.youtube.com/watch?v=UBMk30rjy0o' }
          ],
          baseBurn: 430
        },
        Sun: {
          workouts: [
            { exercise: 'Stretch / Yoga Recovery', prescription: '25-35 min', video: 'https://www.youtube.com/watch?v=v7AYKMP6rOE' }
          ],
          baseBurn: 170
        }
      }
    }
  };

  const MEAL_SEED_WEEKS = {
    'Lose Weight': {
      Beginner: {
        Mon: {
          meals: [
            { id: 'mon-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Oats 40 g + milk 200 ml + 1 egg + apple', calories: 320, protein: 18, carbs: 38, fat: 6 },
            { id: 'mon-lunch', type: 'Lunch', label: 'Lunch', foods: 'Grilled chicken 120 g + brown rice 80 g + vegetables 100 g', calories: 420, protein: 35, carbs: 42, fat: 8 },
            { id: 'mon-snack', type: 'Snack', label: 'Snack', foods: 'Greek yogurt 100 g + 10 almonds', calories: 150, protein: 10, carbs: 8, fat: 6 },
            { id: 'mon-dinner', type: 'Dinner', label: 'Dinner', foods: 'Veg soup 250 ml + salad 100 g', calories: 180, protein: 9, carbs: 20, fat: 4 }
          ]
        },
        Tue: {
          meals: [
            { id: 'tue-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Scrambled egg whites + 1 toast + orange', calories: 290, protein: 20, carbs: 25, fat: 5 },
            { id: 'tue-lunch', type: 'Lunch', label: 'Lunch', foods: 'Tuna salad + 1 roti', calories: 410, protein: 34, carbs: 40, fat: 8 },
            { id: 'tue-snack', type: 'Snack', label: 'Snack', foods: 'Apple + green tea', calories: 95, protein: 0, carbs: 24, fat: 0 },
            { id: 'tue-dinner', type: 'Dinner', label: 'Dinner', foods: 'Lentil soup + boiled veggies', calories: 205, protein: 14, carbs: 30, fat: 2 }
          ]
        },
        Wed: {
          meals: [
            { id: 'wed-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Greek yogurt 150 g + banana + chia', calories: 300, protein: 14, carbs: 35, fat: 8 },
            { id: 'wed-lunch', type: 'Lunch', label: 'Lunch', foods: 'Grilled fish 100 g + quinoa 100 g + spinach', calories: 400, protein: 32, carbs: 38, fat: 7 },
            { id: 'wed-snack', type: 'Snack', label: 'Snack', foods: 'Boiled egg + carrots', calories: 120, protein: 8, carbs: 4, fat: 6 },
            { id: 'wed-dinner', type: 'Dinner', label: 'Dinner', foods: 'Chicken clear soup + stir-fried broccoli', calories: 250, protein: 20, carbs: 12, fat: 6 }
          ]
        },
        Thu: {
          meals: [
            { id: 'thu-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Smoothie (oats + milk + banana + peanut butter 10 g)', calories: 350, protein: 17, carbs: 45, fat: 10 },
            { id: 'thu-lunch', type: 'Lunch', label: 'Lunch', foods: 'Paneer 80 g + brown rice 100 g + veggies', calories: 420, protein: 25, carbs: 45, fat: 12 },
            { id: 'thu-snack', type: 'Snack', label: 'Snack', foods: 'Handful of nuts + green tea', calories: 180, protein: 6, carbs: 7, fat: 13 },
            { id: 'thu-dinner', type: 'Dinner', label: 'Dinner', foods: 'Veggie wrap + salad', calories: 240, protein: 14, carbs: 30, fat: 5 }
          ]
        },
        Fri: {
          meals: [
            { id: 'fri-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Boiled eggs 2 + brown bread 2 + apple', calories: 310, protein: 18, carbs: 32, fat: 6 },
            { id: 'fri-lunch', type: 'Lunch', label: 'Lunch', foods: 'Chicken wrap + cucumber salad', calories: 410, protein: 32, carbs: 40, fat: 9 },
            { id: 'fri-snack', type: 'Snack', label: 'Snack', foods: 'Protein shake', calories: 150, protein: 24, carbs: 3, fat: 1 },
            { id: 'fri-dinner', type: 'Dinner', label: 'Dinner', foods: 'Veg soup + toast', calories: 210, protein: 9, carbs: 25, fat: 4 }
          ]
        },
        Sat: {
          meals: [
            { id: 'sat-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Yogurt parfait + berries', calories: 330, protein: 16, carbs: 42, fat: 7 },
            { id: 'sat-lunch', type: 'Lunch', label: 'Lunch', foods: 'Egg curry + boiled potato + spinach', calories: 430, protein: 26, carbs: 46, fat: 11 },
            { id: 'sat-snack', type: 'Snack', label: 'Snack', foods: 'Popcorn 20 g + tea', calories: 90, protein: 3, carbs: 12, fat: 2 },
            { id: 'sat-dinner', type: 'Dinner', label: 'Dinner', foods: 'Grilled tofu + mixed veggies', calories: 220, protein: 18, carbs: 15, fat: 6 }
          ]
        },
        Sun: {
          meals: [
            { id: 'sun-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Fruit bowl + nuts + toast', calories: 300, protein: 10, carbs: 45, fat: 8 },
            { id: 'sun-lunch', type: 'Lunch', label: 'Lunch', foods: 'Chicken fried rice (light oil)', calories: 450, protein: 33, carbs: 50, fat: 10 },
            { id: 'sun-snack', type: 'Snack', label: 'Snack', foods: 'Yogurt + cucumber', calories: 120, protein: 8, carbs: 10, fat: 4 },
            { id: 'sun-dinner', type: 'Dinner', label: 'Dinner', foods: 'Soup + whole-grain crackers', calories: 180, protein: 9, carbs: 22, fat: 3 }
          ]
        }
      }
    },
    'Build Muscle': {
      Beginner: {
        Mon: {
          meals: [
            { id: 'mon-breakfast', type: 'Breakfast', label: 'Breakfast', foods: '4 eggs + oats 60 g + banana', calories: 480, protein: 35, carbs: 55, fat: 14 },
            { id: 'mon-lunch', type: 'Lunch', label: 'Lunch', foods: 'Chicken 150 g + brown rice 120 g + broccoli', calories: 480, protein: 42, carbs: 50, fat: 6 },
            { id: 'mon-snack-a', type: 'Snack', label: 'Snack 1', foods: 'Protein shake', calories: 180, protein: 28, carbs: 5, fat: 2 },
            { id: 'mon-snack-b', type: 'Snack', label: 'Snack 2', foods: 'Nuts 20 g', calories: 180, protein: 5, carbs: 4, fat: 15 },
            { id: 'mon-dinner', type: 'Dinner', label: 'Dinner', foods: 'Fish 100 g + sweet potato 100 g + spinach', calories: 350, protein: 28, carbs: 35, fat: 6 }
          ]
        },
        Tue: {
          meals: [
            { id: 'tue-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Smoothie (oats 50 g + milk 250 ml + peanut butter 20 g)', calories: 500, protein: 28, carbs: 50, fat: 16 },
            { id: 'tue-lunch', type: 'Lunch', label: 'Lunch', foods: 'Grilled chicken 150 g + quinoa 100 g', calories: 460, protein: 40, carbs: 46, fat: 7 },
            { id: 'tue-snack', type: 'Snack', label: 'Snacks', foods: 'Banana + honey and whey shake', calories: 350, protein: 26, carbs: 60, fat: 2 },
            { id: 'tue-dinner', type: 'Dinner', label: 'Dinner', foods: 'Rice 100 g + lentils + salad', calories: 370, protein: 24, carbs: 55, fat: 4 }
          ]
        },
        Wed: {
          meals: [
            { id: 'wed-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Omelette (3 eggs) + toast + yogurt 100 g', calories: 410, protein: 30, carbs: 28, fat: 13 },
            { id: 'wed-lunch', type: 'Lunch', label: 'Lunch', foods: 'Chicken curry 150 g + rice 100 g + veggies', calories: 440, protein: 40, carbs: 50, fat: 8 },
            { id: 'wed-snack', type: 'Snack', label: 'Snacks', foods: 'Boiled egg / Peanut bar', calories: 340, protein: 20, carbs: 30, fat: 10 },
            { id: 'wed-dinner', type: 'Dinner', label: 'Dinner', foods: 'Paneer 100 g + brown rice 100 g', calories: 360, protein: 28, carbs: 38, fat: 8 }
          ]
        },
        Thu: {
          meals: [
            { id: 'thu-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Pancakes (oats + egg + banana)', calories: 420, protein: 25, carbs: 50, fat: 10 },
            { id: 'thu-lunch', type: 'Lunch', label: 'Lunch', foods: 'Tuna sandwich + salad', calories: 390, protein: 35, carbs: 45, fat: 8 },
            { id: 'thu-snack', type: 'Snack', label: 'Snacks', foods: 'Milk + cookies / Nuts mix', calories: 350, protein: 15, carbs: 45, fat: 12 },
            { id: 'thu-dinner', type: 'Dinner', label: 'Dinner', foods: 'Chicken + quinoa + veggies', calories: 420, protein: 36, carbs: 40, fat: 8 }
          ]
        },
        Fri: {
          meals: [
            { id: 'fri-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Eggs + banana + peanut butter toast', calories: 420, protein: 26, carbs: 45, fat: 12 },
            { id: 'fri-lunch', type: 'Lunch', label: 'Lunch', foods: 'Rice + fish + vegetables', calories: 450, protein: 38, carbs: 52, fat: 8 },
            { id: 'fri-snack', type: 'Snack', label: 'Snacks', foods: 'Protein shake / Fruit bowl', calories: 340, protein: 25, carbs: 45, fat: 5 },
            { id: 'fri-dinner', type: 'Dinner', label: 'Dinner', foods: 'Chicken + lentils + spinach', calories: 360, protein: 30, carbs: 35, fat: 6 }
          ]
        },
        Sat: {
          meals: [
            { id: 'sat-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Yogurt 200 g + oats 50 g + nuts 20 g', calories: 370, protein: 22, carbs: 40, fat: 11 },
            { id: 'sat-lunch', type: 'Lunch', label: 'Lunch', foods: 'Paneer 120 g + roti 2 + salad', calories: 430, protein: 34, carbs: 45, fat: 9 },
            { id: 'sat-snack', type: 'Snack', label: 'Snacks', foods: 'Granola bar / Whey shake', calories: 320, protein: 26, carbs: 45, fat: 4 },
            { id: 'sat-dinner', type: 'Dinner', label: 'Dinner', foods: 'Brown rice + vegetables', calories: 300, protein: 20, carbs: 45, fat: 3 }
          ]
        },
        Sun: {
          meals: [
            { id: 'sun-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Oats pancake + milk 200 ml', calories: 360, protein: 18, carbs: 48, fat: 8 },
            { id: 'sun-lunch', type: 'Lunch', label: 'Lunch', foods: 'Chicken fried rice (home-style)', calories: 480, protein: 38, carbs: 50, fat: 9 },
            { id: 'sun-snack', type: 'Snack', label: 'Snacks', foods: 'Dates + nuts / Protein smoothie', calories: 350, protein: 24, carbs: 45, fat: 8 },
            { id: 'sun-dinner', type: 'Dinner', label: 'Dinner', foods: 'Fish + vegetables', calories: 300, protein: 28, carbs: 25, fat: 7 }
          ]
        }
      }
    },
    'Improve Endurance': {
      Beginner: {
        Mon: {
          meals: [
            { id: 'mon-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Toast + peanut butter + banana', calories: 370, protein: 14, carbs: 45, fat: 10 },
            { id: 'mon-lunch', type: 'Lunch', label: 'Lunch', foods: 'Chicken 120 g + rice 100 g + salad', calories: 430, protein: 36, carbs: 50, fat: 7 },
            { id: 'mon-snack-a', type: 'Snack', label: 'Snack 1', foods: 'Yogurt + fruit', calories: 180, protein: 9, carbs: 25, fat: 3 },
            { id: 'mon-snack-b', type: 'Snack', label: 'Snack 2', foods: 'Energy bar', calories: 200, protein: 8, carbs: 28, fat: 5 },
            { id: 'mon-dinner', type: 'Dinner', label: 'Dinner', foods: 'Fish + quinoa + veggies', calories: 380, protein: 30, carbs: 42, fat: 7 }
          ]
        },
        Tue: {
          meals: [
            { id: 'tue-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Banana smoothie + oats 40 g', calories: 330, protein: 13, carbs: 55, fat: 5 },
            { id: 'tue-lunch', type: 'Lunch', label: 'Lunch', foods: 'Tuna wrap + lettuce', calories: 400, protein: 30, carbs: 40, fat: 8 },
            { id: 'tue-snack', type: 'Snack', label: 'Snack', foods: 'Apple / Nuts', calories: 230, protein: 5, carbs: 25, fat: 10 },
            { id: 'tue-dinner', type: 'Dinner', label: 'Dinner', foods: 'Vegetable curry + rice', calories: 350, protein: 15, carbs: 50, fat: 8 }
          ]
        },
        Wed: {
          meals: [
            { id: 'wed-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Boiled eggs 2 + toast + juice', calories: 330, protein: 19, carbs: 30, fat: 8 },
            { id: 'wed-lunch', type: 'Lunch', label: 'Lunch', foods: 'Chicken + potatoes + greens', calories: 370, protein: 30, carbs: 45, fat: 7 },
            { id: 'wed-snack', type: 'Snack', label: 'Snack', foods: 'Whey shake + banana', calories: 300, protein: 25, carbs: 40, fat: 3 },
            { id: 'wed-dinner', type: 'Dinner', label: 'Dinner', foods: 'Lentils + spinach + rice', calories: 330, protein: 20, carbs: 50, fat: 5 }
          ]
        },
        Thu: {
          meals: [
            { id: 'thu-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Oats + milk + honey', calories: 360, protein: 18, carbs: 52, fat: 8 },
            { id: 'thu-lunch', type: 'Lunch', label: 'Lunch', foods: 'Grilled fish + brown rice', calories: 370, protein: 30, carbs: 45, fat: 6 },
            { id: 'thu-snack', type: 'Snack', label: 'Snack', foods: 'Dates + granola bar', calories: 270, protein: 8, carbs: 45, fat: 5 },
            { id: 'thu-dinner', type: 'Dinner', label: 'Dinner', foods: 'Tofu + quinoa + broccoli', calories: 320, protein: 26, carbs: 38, fat: 6 }
          ]
        },
        Fri: {
          meals: [
            { id: 'fri-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Yogurt + muesli + fruit', calories: 320, protein: 14, carbs: 50, fat: 5 },
            { id: 'fri-lunch', type: 'Lunch', label: 'Lunch', foods: 'Pasta + veggies + boiled eggs 2', calories: 430, protein: 25, carbs: 60, fat: 8 },
            { id: 'fri-snack', type: 'Snack', label: 'Snack', foods: 'Energy drink + apple', calories: 200, protein: 3, carbs: 40, fat: 0 },
            { id: 'fri-dinner', type: 'Dinner', label: 'Dinner', foods: 'Soup + bread + salad', calories: 200, protein: 9, carbs: 28, fat: 3 }
          ]
        },
        Sat: {
          meals: [
            { id: 'sat-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Smoothie (oats + milk)', calories: 310, protein: 14, carbs: 45, fat: 5 },
            { id: 'sat-lunch', type: 'Lunch', label: 'Lunch', foods: 'Chicken/tofu + rice + salad', calories: 380, protein: 30, carbs: 45, fat: 6 },
            { id: 'sat-snack', type: 'Snack', label: 'Snack', foods: 'Banana + whey shake', calories: 320, protein: 26, carbs: 45, fat: 3 },
            { id: 'sat-dinner', type: 'Dinner', label: 'Dinner', foods: 'Soup + vegetables', calories: 180, protein: 9, carbs: 20, fat: 2 }
          ]
        },
        Sun: {
          meals: [
            { id: 'sun-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Omelette 2 + fruit + toast', calories: 320, protein: 18, carbs: 35, fat: 8 },
            { id: 'sun-lunch', type: 'Lunch', label: 'Lunch', foods: 'Fish curry + rice + salad', calories: 380, protein: 32, carbs: 48, fat: 6 },
            { id: 'sun-snack', type: 'Snack', label: 'Snack', foods: 'Yogurt + dates mix', calories: 240, protein: 10, carbs: 35, fat: 5 },
            { id: 'sun-dinner', type: 'Dinner', label: 'Dinner', foods: 'Lentils + vegetables', calories: 270, protein: 18, carbs: 38, fat: 4 }
          ]
        }
      }
    },
    'General Fitness': {
      Beginner: {
        Mon: {
          meals: [
            { id: 'mon-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Oats + milk + egg + fruit', calories: 350, protein: 20, carbs: 42, fat: 8 },
            { id: 'mon-lunch', type: 'Lunch', label: 'Lunch', foods: 'Rice + chicken + veggies', calories: 430, protein: 35, carbs: 45, fat: 7 },
            { id: 'mon-snack', type: 'Snack', label: 'Snack', foods: 'Yogurt + granola', calories: 200, protein: 10, carbs: 30, fat: 4 },
            { id: 'mon-dinner', type: 'Dinner', label: 'Dinner', foods: 'Soup + salad', calories: 250, protein: 12, carbs: 25, fat: 5 }
          ]
        },
        Tue: {
          meals: [
            { id: 'tue-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Toast + peanut butter + milk', calories: 340, protein: 15, carbs: 35, fat: 10 },
            { id: 'tue-lunch', type: 'Lunch', label: 'Lunch', foods: 'Lentils + roti + veggies', calories: 360, protein: 20, carbs: 45, fat: 6 },
            { id: 'tue-snack', type: 'Snack', label: 'Snack', foods: 'Apple + almonds', calories: 180, protein: 4, carbs: 22, fat: 8 },
            { id: 'tue-dinner', type: 'Dinner', label: 'Dinner', foods: 'Fish + greens', calories: 320, protein: 28, carbs: 25, fat: 7 }
          ]
        },
        Wed: {
          meals: [
            { id: 'wed-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Yogurt + granola + banana', calories: 310, protein: 14, carbs: 45, fat: 5 },
            { id: 'wed-lunch', type: 'Lunch', label: 'Lunch', foods: 'Chicken + rice + salad', calories: 380, protein: 30, carbs: 45, fat: 6 },
            { id: 'wed-snack', type: 'Snack', label: 'Snack', foods: 'Boiled egg + carrots', calories: 120, protein: 9, carbs: 3, fat: 5 },
            { id: 'wed-dinner', type: 'Dinner', label: 'Dinner', foods: 'Veg curry + roti', calories: 230, protein: 10, carbs: 30, fat: 4 }
          ]
        },
        Thu: {
          meals: [
            { id: 'thu-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Smoothie (oats + milk + fruit)', calories: 310, protein: 14, carbs: 48, fat: 5 },
            { id: 'thu-lunch', type: 'Lunch', label: 'Lunch', foods: 'Fish + rice + vegetables', calories: 380, protein: 30, carbs: 48, fat: 7 },
            { id: 'thu-snack', type: 'Snack', label: 'Snack', foods: 'Fruit + nuts', calories: 190, protein: 6, carbs: 20, fat: 8 },
            { id: 'thu-dinner', type: 'Dinner', label: 'Dinner', foods: 'Lentil soup + toast', calories: 220, protein: 12, carbs: 25, fat: 4 }
          ]
        },
        Fri: {
          meals: [
            { id: 'fri-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Eggs 2 + bread 2 + fruit', calories: 330, protein: 18, carbs: 35, fat: 8 },
            { id: 'fri-lunch', type: 'Lunch', label: 'Lunch', foods: 'Chicken + quinoa + veggies', calories: 420, protein: 35, carbs: 45, fat: 7 },
            { id: 'fri-snack', type: 'Snack', label: 'Snack', foods: 'Yogurt cup', calories: 130, protein: 8, carbs: 15, fat: 3 },
            { id: 'fri-dinner', type: 'Dinner', label: 'Dinner', foods: 'Paneer + soup', calories: 270, protein: 20, carbs: 15, fat: 10 }
          ]
        },
        Sat: {
          meals: [
            { id: 'sat-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Parfait (yogurt + oats + nuts)', calories: 340, protein: 16, carbs: 40, fat: 9 },
            { id: 'sat-lunch', type: 'Lunch', label: 'Lunch', foods: 'Rice + lentils + salad', calories: 360, protein: 20, carbs: 45, fat: 6 },
            { id: 'sat-snack', type: 'Snack', label: 'Snack', foods: 'Apple + nuts', calories: 180, protein: 4, carbs: 22, fat: 8 },
            { id: 'sat-dinner', type: 'Dinner', label: 'Dinner', foods: 'Grilled veggies + rice', calories: 250, protein: 12, carbs: 35, fat: 5 }
          ]
        },
        Sun: {
          meals: [
            { id: 'sun-breakfast', type: 'Breakfast', label: 'Breakfast', foods: 'Boiled eggs + toast + orange', calories: 270, protein: 15, carbs: 28, fat: 7 },
            { id: 'sun-lunch', type: 'Lunch', label: 'Lunch', foods: 'Fish + vegetables', calories: 310, protein: 28, carbs: 25, fat: 6 },
            { id: 'sun-snack', type: 'Snack', label: 'Snack', foods: 'Popcorn + green tea', calories: 110, protein: 3, carbs: 18, fat: 2 },
            { id: 'sun-dinner', type: 'Dinner', label: 'Dinner', foods: 'Soup + salad', calories: 160, protein: 9, carbs: 20, fat: 2 }
          ]
        }
      }
    }
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const toSlug = (text) =>
    String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const WORKOUT_METADATA = {
    'jumping-jacks': { categories: ['cardio', 'fullbody'], tags: ['warmup', 'hiit'] },
    'high-knees': { categories: ['cardio', 'legs'], tags: ['warmup'] },
    'mountain-climbers': { categories: ['cardio', 'core', 'shoulders'], tags: ['hiit'] },
    'plank': { categories: ['core', 'shoulders'], tags: ['abs', 'stability'] },
    'bodyweight-squats': { categories: ['legs'], tags: ['lower-body', 'glutes'] },
    'forward-lunges': { categories: ['legs'], tags: ['glutes', 'lower-body'] },
    'glute-bridges': { categories: ['legs'], tags: ['glutes', 'hamstrings'] },
    'side-plank': { categories: ['core'], tags: ['obliques', 'stability'] },
    'brisk-walk-march-in-place': { categories: ['cardio'], tags: ['low-impact'] },
    'dynamic-stretching': { categories: ['mobility', 'fullbody'], tags: ['warmup'] },
    'jump-squats': { categories: ['legs', 'cardio'], tags: ['power'] },
    'push-ups': { categories: ['chest', 'arms'], tags: ['upper-body'] },
    'burpees': { categories: ['cardio', 'fullbody'], tags: ['hiit'] },
    'plank-shoulder-taps': { categories: ['core', 'shoulders'], tags: ['stability'] },
    'crunches': { categories: ['core'], tags: ['abs', 'belly'] },
    'bicycle-crunches': { categories: ['core'], tags: ['abs', 'obliques'] },
    'flutter-kicks': { categories: ['core'], tags: ['lower-abs'] },
    'russian-twists': { categories: ['core'], tags: ['obliques'] },
    'full-body-circuit-squat-push-up-lunge-plank': { categories: ['fullbody', 'cardio'], tags: ['circuit'] },
    'full-body-circuit-push-ups-squats-lunges': { categories: ['fullbody', 'cardio'], tags: ['circuit'] },
    'yoga-stretch-recovery': { categories: ['mobility', 'fullbody'], tags: ['stretch', 'recovery'] },
    'yoga-mobility': { categories: ['mobility', 'fullbody'], tags: ['yoga', 'stretch'] },
    'yoga-flow': { categories: ['mobility', 'fullbody'], tags: ['yoga'] },
    'yoga-active-stretch': { categories: ['mobility', 'fullbody'], tags: ['yoga', 'stretch'] },
    'walk-jog': { categories: ['cardio'], tags: ['endurance'] },
    'tempo-walk-jog': { categories: ['cardio'], tags: ['endurance'] },
    'tempo-jog-in-place': { categories: ['cardio'], tags: ['warmup'] },
    'continuous-run-walk': { categories: ['cardio'], tags: ['endurance'] },
    'continuous-walk-jog': { categories: ['cardio'], tags: ['endurance'] },
    'jump-rope-or-mimic': { categories: ['cardio'], tags: ['conditioning'] },
    'jog-in-place': { categories: ['cardio'], tags: ['warmup'] },
    'butt-kicks': { categories: ['cardio', 'legs'], tags: ['warmup'] },
    'calf-raises': { categories: ['legs'], tags: ['lower-body'] },
    'chair-dips': { categories: ['arms', 'chest'], tags: ['triceps'] },
    'diamond-push-ups': { categories: ['chest', 'arms'], tags: ['triceps'] },
    'tricep-dips': { categories: ['arms'], tags: ['triceps'] },
    'pull-ups': { categories: ['back', 'arms'], tags: ['upper-body'] },
    'pull-ups-assisted-rows': { categories: ['back', 'arms'], tags: ['upper-body'] },
    'bodyweight-rows-table': { categories: ['back', 'arms'], tags: ['upper-body'] },
    'bird-dog': { categories: ['core', 'back'], tags: ['stability'] },
    'leg-raises': { categories: ['core'], tags: ['lower-abs'] },
    'lunges': { categories: ['legs'], tags: ['glutes'] },
    'squats': { categories: ['legs'], tags: ['lower-body'] },
    'full-body-strength-circuit': { categories: ['fullbody'], tags: ['strength', 'circuit'] },
    'active-stretch': { categories: ['mobility', 'fullbody'], tags: ['stretch', 'warmup'] },
    'stretch': { categories: ['mobility'], tags: ['recovery'] },
    'stretch-yoga-recovery': { categories: ['mobility'], tags: ['recovery'] },
    'mobility-flow': { categories: ['mobility', 'fullbody'], tags: ['yoga', 'stretch'] }
  };

  const getWorkoutMeta = (name) => {
    const key = toSlug(name);
    return WORKOUT_METADATA[key] || null;
  };

  const isoFromDate = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateLabel = (date) =>
    date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

  const normalizeGoal = (value) => {
    if (!value) return GOAL_ALIASES.default;
    const key = String(value).trim().toLowerCase();
    return GOAL_ALIASES[key] || GOAL_ALIASES.default;
  };

  const goalLabelFromKey = (goalKey) => GOAL_LABELS[goalKey] || GOAL_LABELS['general-fitness'];

  const levelForDay = (day) => {
    for (const window of LEVEL_WINDOWS) {
      if (day >= window.start && day <= window.end) {
        return window.level;
      }
    }
    return LEVEL_WINDOWS[LEVEL_WINDOWS.length - 1].level;
  };

  const levelStartDay = {
    Beginner: 1,
    Intermediate: 31,
    Advanced: 61
  };

  const weekIndexForDay = (day) => {
    const level = levelForDay(day);
    const start = levelStartDay[level] || 1;
    const offset = Math.max(0, day - start);
    return Math.floor(offset / 7);
  };

  const dayOfWeekForDay = (day) => DAYS_OF_WEEK[(Math.max(1, day) - 1) % DAYS_OF_WEEK.length];
  const dayKeyFromDate = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
    return CALENDAR_DAY_KEYS[date.getDay()] || null;
  };

  const progressionPctForDay = (day) => {
    const level = levelForDay(day);
    const rules = WEEKLY_PROGRESSION[level];
    if (!rules) return 0;
    const weekIndex = weekIndexForDay(day);
    const pct = weekIndex * (rules.weeklyIncrementPct || 0);
    return clamp(pct, 0, rules.maxPct || pct);
  };

  const computeBurn = (baseBurn, day) => {
    const level = levelForDay(day);
    const progressionPct = progressionPctForDay(day);
    const multiplier = 1 + progressionPct / 100;
    const levelMultiplier = BURN_MULTIPLIERS[level] || 1;
    return Math.round(baseBurn * multiplier * levelMultiplier);
  };

  const categorizeIntensity = (burn) => {
    if (burn >= HIGH_INTENSITY_THRESHOLD) return 'high';
    if (burn <= LOW_INTENSITY_THRESHOLD) return 'low';
    return 'moderate';
  };

  const toEmbedUrl = (url) => {
    if (!url) return null;
    const youtubeMatch =
      url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/) ||
      url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0`;
    }
    return url;
  };

  const getGoalSeed = (collection, goalLabel) => {
    if (collection[goalLabel]) return collection[goalLabel];
    return collection[GOAL_LABELS['general-fitness']];
  };

  const getSeedDay = (collection, goalLabel, day, level, options = {}) => {
    const goalSeed = getGoalSeed(collection, goalLabel) || {};
    const levelSeed = goalSeed[level] || goalSeed.Beginner || {};
    const date =
      options.date instanceof Date && !Number.isNaN(options.date.getTime()) ? options.date : null;
    let dayKey = dayKeyFromDate(date);
    if (!dayKey) {
      dayKey = dayOfWeekForDay(day);
    }
    return levelSeed[dayKey] || {};
  };

  const sumMacros = (items) =>
    items.reduce(
      (totals, meal) => {
        totals.calories += meal.calories || 0;
        totals.protein += meal.protein || 0;
        totals.carbs += meal.carbs || 0;
        totals.fat += meal.fat || 0;
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

  const scaleMeal = (meal, multiplier) => ({
    id: meal.id,
    type: meal.type,
    label: meal.label,
    foods: meal.foods,
    quantity: multiplier === 1 ? 'Standard serving' : `Scaled ×${multiplier.toFixed(2)}`,
    calories: Math.round(meal.calories * multiplier),
    protein: Math.round(meal.protein * multiplier),
    carbs: Math.round(meal.carbs * multiplier),
    fat: Math.round(meal.fat * multiplier)
  });

  const scaleMealValues = (meal, multiplier) => ({
    ...meal,
    calories: Math.round((meal.calories || 0) * multiplier),
    protein: Math.round((meal.protein || 0) * multiplier),
    carbs: Math.round((meal.carbs || 0) * multiplier),
    fat: Math.round((meal.fat || 0) * multiplier)
  });

  const generateWorkoutDay = (goalLabel, day, options = {}) => {
    const date =
      options.date instanceof Date && !Number.isNaN(options.date.getTime()) ? options.date : null;
    const level = levelForDay(day);
    const progressionPct = progressionPctForDay(day);
    const seed = getSeedDay(WORKOUT_SEED_WEEKS, goalLabel, day, level, { date });
    const workouts = (seed.workouts || []).map((entry, index) => {
      const id = `${toSlug(entry.exercise)}-${index}`;
      const meta = getWorkoutMeta(entry.exercise);
      const categories = Array.isArray(meta?.categories) ? Array.from(new Set(meta.categories)) : ['fullbody'];
      const tags = Array.isArray(meta?.tags) ? meta.tags : [];
      return {
        id,
        name: entry.exercise,
        prescription: entry.prescription,
        video: entry.video,
        videoEmbed: toEmbedUrl(entry.video),
        categories,
        tags
      };
    });
    const baseBurn = seed.baseBurn || 0;
    const burn = computeBurn(baseBurn, day);
    const intensity = categorizeIntensity(burn);
    const totalLoad = Math.max(1, Math.round(burn / 30));
    const burnPerExercise = workouts.length ? Math.round(burn / workouts.length) : 0;
    const exercises = workouts.map((workout) => ({
      ...workout,
      targetBurn: burnPerExercise,
      level,
      categories: Array.isArray(workout.categories) ? workout.categories : ['fullbody'],
      tags: Array.isArray(workout.tags) ? workout.tags : []
    }));
    const dayLabel = dayKeyFromDate(date) || dayOfWeekForDay(day);
    return {
      day,
      level,
      dayOfWeek: dayLabel,
      progressionPct,
      baseBurn,
      burn,
      intensity,
      totalLoad,
      exercises
    };
  };

  const generateMealDay = (goalLabel, day, workoutDay, options = {}) => {
    const date =
      options.date instanceof Date && !Number.isNaN(options.date.getTime()) ? options.date : null;
    const level = levelForDay(day);
    const multiplier = PORTION_MULTIPLIERS[level] || 1;
    const nutritionTarget = Math.max(0, Math.round(Number(options.nutritionTarget || 0)));
    const intensity = workoutDay?.intensity || 'moderate';
    const seed = getSeedDay(MEAL_SEED_WEEKS, goalLabel, day, level, { date });
    const baseMeals = (seed.meals || []).map((entry, index) => ({
      id: entry.id || `${toSlug(entry.type)}-${index}`,
      type: entry.type,
      label: entry.label,
      foods: entry.foods,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat
    }));

    let meals = baseMeals.map((meal) => scaleMeal(meal, multiplier));

    if (intensity === 'low') {
      const snackCandidates = meals.filter((meal) => meal.type.toLowerCase().includes('snack'));
      if (snackCandidates.length) {
        const snackToRemove = snackCandidates.reduce((lowest, current) =>
          current.calories < lowest.calories ? current : lowest
        );
        meals = meals.filter((meal) => meal.id !== snackToRemove.id);
      }
    }

    if (level === 'Advanced') {
      meals.push({
        id: `advanced-extra-${day}`,
        type: ADVANCED_EXTRA_SNACK.type,
        label: ADVANCED_EXTRA_SNACK.label,
        foods: ADVANCED_EXTRA_SNACK.foods,
        quantity: 'Added advanced snack',
        calories: ADVANCED_EXTRA_SNACK.calories,
        protein: ADVANCED_EXTRA_SNACK.protein,
        carbs: ADVANCED_EXTRA_SNACK.carbs,
        fat: ADVANCED_EXTRA_SNACK.fat
      });
    }

    if (intensity === 'high') {
      meals.push({
        id: `high-intensity-${day}`,
        type: HIGH_INTENSITY_SNACK.type,
        label: HIGH_INTENSITY_SNACK.label,
        foods: HIGH_INTENSITY_SNACK.foods,
        quantity: 'Recovery boost',
        calories: HIGH_INTENSITY_SNACK.calories,
        protein: HIGH_INTENSITY_SNACK.protein,
        carbs: HIGH_INTENSITY_SNACK.carbs,
        fat: HIGH_INTENSITY_SNACK.fat
      });
    }

    const snackIndexes = meals.reduce((acc, meal, index) => {
      if (meal.type && meal.type.toLowerCase().includes('snack')) {
        acc.push(index);
      }
      return acc;
    }, []);
    if (snackIndexes.length > 1) {
      const keepIndex = snackIndexes[snackIndexes.length - 1];
      meals = meals.filter((meal, index) => index === keepIndex || !snackIndexes.includes(index));
    }

    let totals = sumMacros(meals);
    if (nutritionTarget > 0 && totals.calories > 0) {
      const ratio = nutritionTarget / totals.calories;
      meals = meals.map((meal) => scaleMealValues(meal, ratio));
      totals = sumMacros(meals);
      const diff = nutritionTarget - totals.calories;
      if (diff && meals.length) {
        const maxIndex = meals.reduce(
          (idx, meal, current) => (meal.calories > meals[idx].calories ? current : idx),
          0
        );
        meals[maxIndex] = {
          ...meals[maxIndex],
          calories: Math.max(0, meals[maxIndex].calories + diff)
        };
        totals = sumMacros(meals);
      }
    }
    const subtitleParts = [
      `${level} portions (${Math.round(multiplier * 100)}%)`,
      intensity === 'high'
        ? 'High-intensity refuel'
        : intensity === 'low'
        ? 'Low-intensity trim'
        : 'Balanced intake'
    ];
    if (level === 'Advanced') {
      subtitleParts.push('Includes protein booster');
    }
    const dayLabel = dayKeyFromDate(date) || dayOfWeekForDay(day);

    return {
      day,
      level,
      dayOfWeek: dayLabel,
      intensity,
      portionMultiplier: multiplier,
      meals,
      totals,
      subtitle: subtitleParts.join(' • ')
    };
  };

  const buildProgramWindow = (goalLabel, startDay, days, options = {}) => {
    const normalizedStartDate =
      options.startDate instanceof Date && !Number.isNaN(options.startDate.getTime())
        ? new Date(options.startDate.getFullYear(), options.startDate.getMonth(), options.startDate.getDate())
        : null;
    const nutritionTarget = Number(options.nutritionTarget || 0);
    const plan = [];
    for (let offset = 0; offset < days; offset += 1) {
      const dayNumber = startDay + offset;
      const date = normalizedStartDate
        ? new Date(
            normalizedStartDate.getFullYear(),
            normalizedStartDate.getMonth(),
            normalizedStartDate.getDate() + offset
          )
        : null;
      const workoutDay = generateWorkoutDay(goalLabel, dayNumber, { date });
      const mealDay = generateMealDay(goalLabel, dayNumber, workoutDay, { date, nutritionTarget });
      plan.push({ workoutDay, mealDay, date });
    }
    return plan;
  };

  const buildDailyPlans = (profile = {}, options = {}) => {
    const goalKey = normalizeGoal(profile.goal);
    const goalLabel = goalLabelFromKey(goalKey);
    const days = Number.isInteger(options.days) && options.days > 0 ? options.days : 7;
    const startDay = Number.isInteger(options.startDay) && options.startDay > 0 ? options.startDay : 1;
    let startDate =
      options.startDate instanceof Date ? new Date(options.startDate.getTime()) : new Date();
    if (Number.isNaN(startDate.getTime())) {
      startDate = new Date();
    }
    const normalizedStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

    const mealsByDate = {};
    const workoutsByDate = {};

    const window = buildProgramWindow(goalLabel, startDay, days, {
      startDate: normalizedStartDate,
      nutritionTarget: options.nutritionTarget
    });

    window.forEach(({ workoutDay, mealDay, date: planDate }, index) => {
      let date = null;
      if (planDate instanceof Date && !Number.isNaN(planDate.getTime())) {
        date = new Date(planDate.getFullYear(), planDate.getMonth(), planDate.getDate());
      } else {
        date = new Date(normalizedStartDate);
        date.setDate(normalizedStartDate.getDate() + index);
      }
      const iso = isoFromDate(date);
      const label = formatDateLabel(date);
      const actualDayOfWeek = date.toLocaleDateString(undefined, { weekday: 'long' });

      workoutsByDate[iso] = {
        dateIso: iso,
        label,
        goal: goalLabel,
        level: workoutDay.level,
        dayNumber: workoutDay.day,
        dayOfWeek: actualDayOfWeek,
        intensity: workoutDay.intensity,
        totalLoad: workoutDay.totalLoad,
        burn: workoutDay.burn,
        progressionPct: workoutDay.progressionPct,
        exercises: workoutDay.exercises
      };

      mealsByDate[iso] = {
        dateIso: iso,
        label,
        goal: goalLabel,
        level: mealDay.level,
        dayNumber: mealDay.day,
        dayOfWeek: actualDayOfWeek,
        intensity: mealDay.intensity,
        portionMultiplier: mealDay.portionMultiplier,
        targetCalories: mealDay.totals.calories,
        macroTargets: {
          protein: mealDay.totals.protein,
          carbs: mealDay.totals.carbs,
          fat: mealDay.totals.fat
        },
        meals: mealDay.meals,
        subtitle: mealDay.subtitle
      };
    });

    return {
      goalKey,
      goalLabel,
      mealsByDate,
      workoutsByDate
    };
  };

  window.FlexPlan = {
    normalizeGoal,
    buildDailyPlans,
    buildProgramWindow: (goal, startDay = 1, days = 90, opts) => {
      const goalKey = normalizeGoal(goal);
      const goalLabel = goalLabelFromKey(goalKey);
      let options = {};
      if (opts instanceof Date) {
        options.startDate = opts;
      } else if (opts && typeof opts === 'object') {
        options = { ...opts };
      }
      return buildProgramWindow(goalLabel, startDay, days, options);
    },
    getWorkoutSeed: (goal, level) => {
      const goalLabel = goalLabelFromKey(normalizeGoal(goal));
      const goalSeed = getGoalSeed(WORKOUT_SEED_WEEKS, goalLabel) || {};
      return goalSeed[level] || null;
    },
    getMealSeed: (goal, level) => {
      const goalLabel = goalLabelFromKey(normalizeGoal(goal));
      const goalSeed = getGoalSeed(MEAL_SEED_WEEKS, goalLabel) || {};
      return goalSeed[level] || null;
    }
  };
})();
