document.addEventListener('DOMContentLoaded', async () => {
  const calorieCard = document.querySelector('.calorie-card');
  const progressCircle = document.querySelector('.ring-progress');
  const calorieValue = document.getElementById('calorieValue');
  const planDateButton = document.querySelector('.plan-date');
  const planDateLabel = document.querySelector('.plan-date-label');
  const planSubtitle = document.querySelector('.plan-subtitle');
  const mealTableBody = document.querySelector('.meal-table tbody');
  const mealTableFoot = document.querySelector('.meal-table tfoot tr');
  const calorieList = document.querySelector('.calorie-list');
  const planCaloriesEl = document.querySelector('[data-plan-calories]');
  const macroSummaryEl = document.querySelector('[data-macro-summary]');
  const macroItems = Array.from(document.querySelectorAll('[data-macro-item]'));
  const logMealBtn = document.querySelector('.log-meal-btn');
  const logoutBtn = document.getElementById('logoutBtn');
  const macroTrendCanvas = document.getElementById('macroLineChart');
  const macroTrendEmpty = document.querySelector('.macro-trend-empty');
  const datePickerBackdrop = document.querySelector('[data-plan-date-picker]');
  const calendarDaysEl = datePickerBackdrop?.querySelector('[data-calendar-days]');
  const calendarTitleEl = datePickerBackdrop?.querySelector('#planDatePickerTitle');
  const calendarSubtitleEl = datePickerBackdrop?.querySelector('[data-calendar-subtitle]');
  const calendarPrev = datePickerBackdrop?.querySelector('[data-calendar-prev]');
  const calendarNext = datePickerBackdrop?.querySelector('[data-calendar-next]');
  const calendarApply = datePickerBackdrop?.querySelector('[data-calendar-apply]');
  const calendarCancel = datePickerBackdrop?.querySelector('[data-calendar-cancel]');

  if (window.FFSupa?.syncFromHash) {
    try {
      await window.FFSupa.syncFromHash();
    } catch (err) {
      console.warn('Failed to sync Supabase session from hash', err);
    }
  }

  const MACROS = ['protein', 'carbs', 'fat'];
  const macroColors = {
    protein: '#60a5fa',
    carbs: '#facc15',
    fat: '#f97316'
  };
  const DEFAULT_SUBTITLE = 'Suggested meals based on your goals';
  const COMPLETION_STORE_KEY = 'flexfuel.meals.completed';
  const CUSTOM_PLAN_STORE_KEY = 'flexfuel.meals.customPlan';
  const FAVORITE_FOODS_STORE_KEY = 'flexfuel.meals.favoriteFoods';
  const GOAL_STORAGE_PREFIX = 'flexfule.goals';

  const FOOD_LIBRARY = {
    breakfast: {
      protein: [
        {
          id: 'bf-egg-white-omelette',
          label: 'Egg White Omelette',
          quantity: '3 egg whites, spinach, 1 slice toast',
          calories: 310,
          protein: 26,
          carbs: 24,
          fat: 9
        },
        {
          id: 'bf-greek-yogurt-parfait',
          label: 'Greek Yogurt Parfait',
          quantity: '220g yogurt, berries, chia',
          calories: 320,
          protein: 24,
          carbs: 38,
          fat: 8
        },
        {
          id: 'bf-protein-oats',
          label: 'Protein Oats',
          quantity: '60g oats, 1 scoop whey, banana',
          calories: 360,
          protein: 28,
          carbs: 46,
          fat: 9
        }
      ],
      carbs: [
        {
          id: 'bf-fruit-smoothie-bowl',
          label: 'Fruit Smoothie Bowl',
          quantity: '300ml smoothie, 40g granola',
          calories: 380,
          protein: 12,
          carbs: 62,
          fat: 9
        },
        {
          id: 'bf-wholegrain-waffles',
          label: 'Wholegrain Waffles',
          quantity: '2 waffles, maple drizzle, berries',
          calories: 410,
          protein: 14,
          carbs: 58,
          fat: 12
        }
      ],
      fat: [
        {
          id: 'bf-avocado-toast',
          label: 'Avocado Toast & Egg',
          quantity: '2 slices toast, 1 avocado, poached egg',
          calories: 390,
          protein: 17,
          carbs: 34,
          fat: 22
        },
        {
          id: 'bf-nut-butter-bowl',
          label: 'Nut Butter Bowl',
          quantity: 'Greek yogurt, almond butter, seeds',
          calories: 420,
          protein: 19,
          carbs: 32,
          fat: 26
        }
      ]
    },
    lunch: {
      protein: [
        {
          id: 'ln-chicken-breast',
          label: 'Grilled Chicken Breast',
          quantity: '150g chicken, quinoa, greens',
          calories: 560,
          protein: 38,
          carbs: 48,
          fat: 16
        },
        {
          id: 'ln-salmon-bowl',
          label: 'Salmon Power Bowl',
          quantity: '140g salmon, brown rice, veggies',
          calories: 590,
          protein: 34,
          carbs: 50,
          fat: 22
        },
        {
          id: 'ln-turkey-wrap',
          label: 'Turkey & Hummus Wrap',
          quantity: 'Wholegrain wrap, 120g turkey, hummus',
          calories: 540,
          protein: 36,
          carbs: 48,
          fat: 18
        }
      ],
      carbs: [
        {
          id: 'ln-pasta-primavera',
          label: 'Pasta Primavera',
          quantity: '160g whole-wheat pasta, veggies',
          calories: 610,
          protein: 22,
          carbs: 78,
          fat: 18
        },
        {
          id: 'ln-buddha-bowl',
          label: 'Chickpea Buddha Bowl',
          quantity: 'Chickpeas, quinoa, roasted veg',
          calories: 580,
          protein: 24,
          carbs: 74,
          fat: 16
        }
      ],
      fat: [
        {
          id: 'ln-avocado-chicken-salad',
          label: 'Avocado Chicken Salad',
          quantity: 'Chicken, avocado, mixed greens',
          calories: 560,
          protein: 32,
          carbs: 24,
          fat: 28
        },
        {
          id: 'ln-steak-bowl',
          label: 'Steak & Sweet Potato Bowl',
          quantity: '140g flank steak, 160g sweet potato',
          calories: 600,
          protein: 35,
          carbs: 46,
          fat: 24
        }
      ]
    },
    snack: {
      protein: [
        {
          id: 'sn-greek-yogurt',
          label: 'Greek Yogurt & Nuts',
          quantity: '180g yogurt, almonds, honey',
          calories: 260,
          protein: 22,
          carbs: 20,
          fat: 11
        },
        {
          id: 'sn-protein-smoothie',
          label: 'Protein Smoothie',
          quantity: 'Protein powder, almond milk, banana',
          calories: 240,
          protein: 26,
          carbs: 20,
          fat: 6
        }
      ],
      carbs: [
        {
          id: 'sn-energy-bites',
          label: 'Energy Bites',
          quantity: 'Oats, dates, cacao, seeds',
          calories: 230,
          protein: 10,
          carbs: 28,
          fat: 9
        },
        {
          id: 'sn-fruit-plate',
          label: 'Seasonal Fruit Plate',
          quantity: 'Fruit mix, cottage cheese',
          calories: 210,
          protein: 12,
          carbs: 32,
          fat: 6
        }
      ],
      fat: [
        {
          id: 'sn-avocado-toast',
          label: 'Mini Avocado Toast',
          quantity: '1 slice toast, avocado, seeds',
          calories: 220,
          protein: 7,
          carbs: 22,
          fat: 12
        },
        {
          id: 'sn-nut-butter-cups',
          label: 'Nut Butter Cups',
          quantity: 'Homemade almond butter cups',
          calories: 240,
          protein: 8,
          carbs: 18,
          fat: 16
        }
      ]
    },
    dinner: {
      protein: [
        {
          id: 'dn-baked-cod',
          label: 'Baked Cod & Veg',
          quantity: '160g cod, roasted vegetables',
          calories: 460,
          protein: 34,
          carbs: 42,
          fat: 12
        },
        {
          id: 'dn-turkey-stirfry',
          label: 'Turkey Stir-Fry',
          quantity: 'Lean turkey, veggies, rice noodles',
          calories: 520,
          protein: 36,
          carbs: 48,
          fat: 16
        },
        {
          id: 'dn-lentil-curry',
          label: 'Lentil Coconut Curry',
          quantity: 'Lentils, coconut milk, brown rice',
          calories: 480,
          protein: 24,
          carbs: 58,
          fat: 14
        }
      ],
      carbs: [
        {
          id: 'dn-quinoa-bowl',
          label: 'Quinoa Veggie Bowl',
          quantity: 'Quinoa, roasted veg, tahini',
          calories: 500,
          protein: 20,
          carbs: 66,
          fat: 16
        },
        {
          id: 'dn-wholegrain-pasta',
          label: 'Wholegrain Pasta & Pesto',
          quantity: 'Pasta, pesto, chicken, greens',
          calories: 540,
          protein: 30,
          carbs: 62,
          fat: 18
        }
      ],
      fat: [
        {
          id: 'dn-salmon-sheetpan',
          label: 'Roasted Salmon Sheet Pan',
          quantity: 'Salmon, sweet potato, broccoli',
          calories: 520,
          protein: 32,
          carbs: 38,
          fat: 24
        },
        {
          id: 'dn-tofu-stirfry',
          label: 'Tofu Sesame Stir-Fry',
          quantity: 'Tofu, vegetables, soba noodles',
          calories: 500,
          protein: 28,
          carbs: 50,
          fat: 18
        }
      ]
    }
  };

  const FALLBACK_MEAL_PLAN = (function buildFallbackPlan() {
    if (window.FlexPlan) {
      try {
        const generated = window.FlexPlan.buildDailyPlans(
          { goal: 'General Fitness' },
          { startDate: new Date(), days: 7, startDay: 1 }
        );
        if (generated && generated.mealsByDate) {
          return generated.mealsByDate;
        }
      } catch (err) {
        console.warn('Unable to build fallback FlexPlan meals', err);
      }
    }
    return {};
  })();


  const clonePlanData = (data) => {
    try {
      return data ? JSON.parse(JSON.stringify(data)) : {};
    } catch (err) {
      console.warn('Failed to clone plan data', err);
      return {};
    }
  };
  let mealPlanData = {};
  let availableDates = [];
  let todayIso = '';
  let currentDateKey = '';
  let pendingDateKey = '';
  let calendarViewDate = new Date();

  const macroElements = macroItems.reduce((acc, item) => {
    const macroKey = item.dataset.macroItem;
    if (!macroKey) return acc;
    const consumedEl = item.querySelector('[data-macro-consumed]');
    const targetEl = item.querySelector('[data-macro-target]');
    const bar = item.querySelector('.macro-bar');
    const fill = item.querySelector('.macro-fill');
    acc[macroKey] = { consumedEl, targetEl, bar, fill };
    if (fill) {
      requestAnimationFrame(() => fill.classList.add('is-ready'));
    }
    return acc;
  }, {});

  let mealUserKey = 'anonymous';
  let goalNutritionTarget = 0;

  const getMealCompletionStorageKey = () => `${COMPLETION_STORE_KEY}.${mealUserKey}`;
  const getGoalStorageKey = (suffix, userId) =>
    `${GOAL_STORAGE_PREFIX}.${suffix}.${userId || 'anonymous'}`;

  const readGoalNutritionTarget = (userId) => {
    try {
      const raw = localStorage.getItem(getGoalStorageKey('nutrition', userId));
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      const calories = Number(parsed?.calories || 0);
      return Number.isFinite(calories) ? Math.max(0, Math.round(calories)) : 0;
    } catch (err) {
      console.warn('Failed to read goal nutrition target', err);
      return 0;
    }
  };

  const loadStoredCompletions = () => {
    try {
      const raw = localStorage.getItem(getMealCompletionStorageKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
      const legacy = localStorage.getItem(COMPLETION_STORE_KEY);
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        if (parsedLegacy && typeof parsedLegacy === 'object') {
          localStorage.removeItem(COMPLETION_STORE_KEY);
          localStorage.setItem(getMealCompletionStorageKey(), JSON.stringify(parsedLegacy));
          return parsedLegacy;
        }
      }
    } catch (err) {
      console.warn('Failed to parse stored meal completions', err);
    }
    return {};
  };

  let mealCompletionState = new Map();

  const loadCompletionStateForCurrentUser = () => {
    const storedCompletions = loadStoredCompletions();
    mealCompletionState = new Map(
      Object.entries(storedCompletions).map(([dateKey, ids]) => [dateKey, new Set(ids)])
    );
  };

  loadCompletionStateForCurrentUser();

  let mealItems = [];
  let macroTargets = { protein: 0, carbs: 0, fat: 0 };
  let targetCalories = Number(calorieCard?.dataset.targetCalories || 0);
  let updateRing = () => {};
  let previousBodyOverflow = '';

  const isoFromDate = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  };

  const formatPlanLabel = (isoDate, fallback) => {
    if (fallback) return fallback;
    if (!isoDate) return 'Today';
    const date = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) return 'Today';
    const dayFormatter = new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    return dayFormatter.format(date);
  };

  const formatMonthTitle = (date) =>
    new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(date);

  const safeParseJSON = (value, fallback) => {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null ? parsed : fallback;
    } catch (err) {
      return fallback;
    }
  };

  const loadCustomMeals = () => {
    try {
      const raw = localStorage.getItem(CUSTOM_PLAN_STORE_KEY);
      return raw ? safeParseJSON(raw, {}) : {};
    } catch (err) {
      console.warn('Failed to load custom meals', err);
      return {};
    }
  };

  const loadFavoriteFoods = () => {
    try {
      const raw = localStorage.getItem(FAVORITE_FOODS_STORE_KEY);
      return raw ? safeParseJSON(raw, {}) : {};
    } catch (err) {
      console.warn('Failed to load favourite foods', err);
      return {};
    }
  };

  let customMealsByDate = loadCustomMeals();
  let favoriteFoods = loadFavoriteFoods();
  favoriteFoods = Object.fromEntries(
    Object.entries(favoriteFoods).map(([key, value]) => {
      const [mealType, foodId] = key.split(':');
      return [key, { ...value, mealType: value?.mealType || mealType, foodId: value?.foodId || foodId }];
    })
  );

  const persistCustomMeals = () => {
    try {
      localStorage.setItem(CUSTOM_PLAN_STORE_KEY, JSON.stringify(customMealsByDate));
    } catch (err) {
      console.warn('Failed to persist custom meals', err);
    }
  };

  const persistFavoriteFoods = () => {
    try {
      localStorage.setItem(FAVORITE_FOODS_STORE_KEY, JSON.stringify(favoriteFoods));
    } catch (err) {
      console.warn('Failed to persist favourite foods', err);
    }
  };

  const getPlanDataForDate = (dateKey) => {
    const basePlan = mealPlanData[dateKey];
    if (!basePlan) return null;
    const overrides = customMealsByDate[dateKey];
    if (!overrides || !Object.keys(overrides).length) {
      return basePlan;
    }
    const mergedMeals = (basePlan.meals || []).map((meal) => {
      const override = overrides[meal.id];
      return override ? { ...meal, ...override } : meal;
    });
    return { ...basePlan, meals: mergedMeals };
  };

  const getMealFromPlan = (dateKey, mealId) => {
    const plan = getPlanDataForDate(dateKey);
    return plan?.meals?.find((meal) => meal.id === mealId) || null;
  };

  const updateMealOverride = (dateKey, mealId, nextMeal) => {
    if (!dateKey || !mealId || !nextMeal) return;
    if (!customMealsByDate[dateKey]) {
      customMealsByDate[dateKey] = {};
    }
    customMealsByDate[dateKey][mealId] = {
      ...customMealsByDate[dateKey][mealId],
      ...nextMeal
    };
    persistCustomMeals();
  };

  const removeMealOverride = (dateKey, mealId) => {
    if (!customMealsByDate[dateKey]) return;
    delete customMealsByDate[dateKey][mealId];
    if (Object.keys(customMealsByDate[dateKey]).length === 0) {
      delete customMealsByDate[dateKey];
    }
    persistCustomMeals();
  };

  const setPlanCollections = (meals) => {
    mealPlanData = meals && typeof meals === 'object' ? clonePlanData(meals) : {};
    availableDates = Object.keys(mealPlanData).sort();
    todayIso = isoFromDate(new Date());
    const fallbackDate = availableDates[availableDates.length - 1] || todayIso;
    currentDateKey = mealPlanData[todayIso] ? todayIso : fallbackDate;
    pendingDateKey = currentDateKey;
    calendarViewDate = currentDateKey ? new Date(`${currentDateKey}T00:00:00`) : new Date();

    // Prune overrides for days or meals that no longer exist
    Object.keys(customMealsByDate).forEach((dateKey) => {
      if (!mealPlanData[dateKey]) {
        delete customMealsByDate[dateKey];
        return;
      }
      const allowedIds = new Set((mealPlanData[dateKey].meals || []).map((meal) => meal.id));
      const overrides = customMealsByDate[dateKey];
      Object.keys(overrides).forEach((mealId) => {
        if (!allowedIds.has(mealId)) {
          delete overrides[mealId];
        }
      });
      if (!Object.keys(overrides).length) {
        delete customMealsByDate[dateKey];
      }
    });
    persistCustomMeals();
  };

  setPlanCollections(FALLBACK_MEAL_PLAN);

  const persistCompletions = () => {
    const payload = {};
    mealCompletionState.forEach((set, dateKey) => {
      if (set.size > 0) {
        payload[dateKey] = Array.from(set);
      }
    });
    try {
      localStorage.setItem(getMealCompletionStorageKey(), JSON.stringify(payload));
    } catch (err) {
      console.warn('Failed to persist meal completion state', err);
    }
  };

  const syncMealStreakForDate = (dateKey) => {
    if (!dateKey) return;
    const planData = getPlanDataForDate(dateKey) || mealPlanData[dateKey] || null;
    const meals = Array.isArray(planData?.meals) ? planData.meals.filter((meal) => meal && meal.id) : [];
    if (!meals.length) {
      window.FFStreak?.recordMeal(dateKey, false);
      return;
    }
    const completionSet = getCompletionSet(dateKey);
    const isComplete = meals.every((meal) => completionSet.has(meal.id));
    window.FFStreak?.recordMeal(dateKey, isComplete);
  };

  const getCompletionSet = (dateKey) => {
    if (!mealCompletionState.has(dateKey)) {
      mealCompletionState.set(dateKey, new Set());
    }
    return mealCompletionState.get(dateKey);
  };

  const syncCalorieLabel = () => {
    if (!calorieValue) return;
    const label = calorieValue.nextElementSibling;
    if (label) {
      label.textContent = targetCalories ? `/${targetCalories} kcal` : '';
    }
  };

  const setupRing = () => {
    if (!progressCircle) {
      updateRing = () => {};
      return;
    }
    const radius = Number(progressCircle.getAttribute('r') || 0);
    const circumference = 2 * Math.PI * radius;
    if (!circumference) {
      updateRing = () => {};
      return;
    }
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = `${circumference}`;
    updateRing = (currentValue = 0) => {
      const effectiveTarget = Math.max(targetCalories || currentValue || 1, 1);
      const clamped = Math.min(Math.max(currentValue, 0), effectiveTarget);
      const offset = circumference - (clamped / effectiveTarget) * circumference;
      progressCircle.style.strokeDashoffset = `${offset}`;
    };
  };

  const applyTargetCalories = (value) => {
    const nextTarget = Math.max(Number(value) || 0, 0);
    targetCalories = nextTarget;
    if (calorieCard) {
      calorieCard.dataset.targetCalories = String(nextTarget);
    }
    syncCalorieLabel();
    setupRing();
  };

  syncCalorieLabel();
  setupRing();

  const formatMacroValue = (value) => {
    if (Number.isNaN(value)) return '0';
    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
  };

  const parseMacroValue = (el, macro) => Number(el?.dataset?.[macro] || 0);

  const formatCalorieValue = (value) => {
    const numeric = Number(value) || 0;
    return numeric.toLocaleString('en-US');
  };

  const formatMacroLabelText = (label) => {
    if (!label) return '';
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const mealModalBackdrop = document.querySelector('[data-meal-modal-backdrop]');
  const mealModal = mealModalBackdrop?.querySelector('[data-meal-modal]');
  const mealModalSubtitle = document.querySelector('[data-meal-modal-subtitle]');
  const mealModalForm = mealModal?.querySelector('[data-meal-modal-form]');
  const mealTypeSelect = mealModal?.querySelector('[data-meal-select="type"]');
  const macroSelect = mealModal?.querySelector('[data-meal-select="macro"]');
  const foodSelect = mealModal?.querySelector('[data-meal-select="food"]');
  const mealSummaryCard = mealModal?.querySelector('[data-meal-item-summary]');
  const mealSummaryTitle = mealModal?.querySelector('[data-meal-summary-title]');
  const mealSummaryMeta = mealModal?.querySelector('[data-meal-summary-meta]');
  const mealSummaryMacros = mealModal?.querySelector('[data-meal-summary-macros]');
  const mealFavoriteToggle = mealModal?.querySelector('[data-meal-favorite-toggle]');
  const mealSubmitBtn = mealModal?.querySelector('[data-meal-modal-submit]');
  const mealModalCloseBtn = mealModal?.querySelector('[data-meal-modal-close]');
  const mealModalTabs = Array.from(mealModal?.querySelectorAll('[data-meal-modal-tab]') ?? []);
  const mealModalPanels = Array.from(mealModal?.querySelectorAll('[data-meal-modal-panel]') ?? []);
  const mealFavoritesList = mealModal?.querySelector('[data-meal-favorites-list]');
  const mealFavoritesEmpty = mealModal?.querySelector('[data-meal-favorites-empty]');
  const macroSelectInitialMarkup = macroSelect ? macroSelect.innerHTML : '';

  const makeFoodKey = (mealType, foodId) => `${mealType}:${foodId}`;

  const foodIndex = (() => {
    const map = new Map();
    Object.entries(FOOD_LIBRARY).forEach(([mealType, groups]) => {
      Object.entries(groups).forEach(([macroKey, items]) => {
        items.forEach((item) => {
          map.set(makeFoodKey(mealType, item.id), { ...item, mealType, macro: macroKey });
        });
      });
    });
    return map;
  })();

  const getFoodDefinition = (mealType, foodId) => {
    if (!mealType || !foodId) return null;
    return foodIndex.get(makeFoodKey(mealType, foodId)) || null;
  };

  let mealModalState = {
    mealId: '',
    macro: '',
    foodId: '',
    originalMeal: null,
    selectedFood: null
  };

  const resetSelect = (selectEl, placeholder) => {
    if (!selectEl) return;
    selectEl.innerHTML = '';
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholder;
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    selectEl.appendChild(placeholderOption);
  };

  const differenceScore = (candidate, reference) => {
    if (!reference) return Number.POSITIVE_INFINITY;
    const calorieDiff = Math.abs(candidate.calories - reference.calories) / Math.max(reference.calories || 1, 1);
    const proteinDiff = Math.abs(candidate.protein - reference.protein) / Math.max(reference.protein || 1, 1);
    const carbDiff = Math.abs(candidate.carbs - reference.carbs) / Math.max(reference.carbs || 1, 1);
    const fatDiff = Math.abs(candidate.fat - reference.fat) / Math.max(reference.fat || 1, 1);
    return calorieDiff * 0.4 + proteinDiff * 0.25 + carbDiff * 0.2 + fatDiff * 0.15;
  };

  const findFoodMatches = (mealId, macroKey, originalMeal) => {
    const library = FOOD_LIBRARY[mealId]?.[macroKey] || [];
    if (!library.length) return [];
    if (!originalMeal) return library;

    const toleranceCalories = Math.max(50, originalMeal.calories * 0.2);
    const toleranceMacro = Math.max(8, originalMeal.protein * 0.35 || 8);

    const primaryMatches = library.filter((item) => {
      const calorieClose = Math.abs(item.calories - originalMeal.calories) <= toleranceCalories;
      const proteinClose = Math.abs(item.protein - originalMeal.protein) <= toleranceMacro;
      const carbsClose = Math.abs(item.carbs - originalMeal.carbs) <= toleranceMacro;
      const fatClose = Math.abs(item.fat - originalMeal.fat) <= toleranceMacro;
      return calorieClose && proteinClose && carbsClose && fatClose;
    });

    if (primaryMatches.length) {
      return primaryMatches.sort((a, b) => differenceScore(a, originalMeal) - differenceScore(b, originalMeal));
    }

    return library
      .map((item) => ({ item, score: differenceScore(item, originalMeal) }))
      .sort((a, b) => a.score - b.score)
      .map((entry) => entry.item);
  };

  const populateFoodSelect = () => {
    if (!foodSelect) return;
    resetSelect(foodSelect, 'Select item');
    mealModalState.foodId = '';
    mealModalState.selectedFood = null;
    if (!mealModalState.mealId || !mealModalState.macro || !mealModalState.originalMeal) {
      foodSelect.disabled = true;
      return;
    }

    const matches = findFoodMatches(mealModalState.mealId, mealModalState.macro, mealModalState.originalMeal);
    if (!matches.length) {
      if (mealModalSubtitle) {
        mealModalSubtitle.textContent = 'No similar foods found for this focus. Try another macronutrient.';
      }
      const noOption = document.createElement('option');
      noOption.value = '';
      noOption.textContent = 'No similar foods available';
      noOption.disabled = true;
      foodSelect.appendChild(noOption);
      foodSelect.disabled = true;
      return;
    }

    if (mealModalSubtitle) {
      mealModalSubtitle.textContent = 'Swap a meal with a similar option.';
    }

    matches.forEach((food) => {
      const option = document.createElement('option');
      option.value = food.id;
      option.textContent = `${food.label} (${food.quantity} • ${food.calories} kcal)`;
      option.dataset.calories = String(food.calories);
      option.dataset.protein = String(food.protein);
      option.dataset.carbs = String(food.carbs);
      option.dataset.fat = String(food.fat);
      option.dataset.quantity = food.quantity || '';
      option.dataset.mealType = mealModalState.mealId;
      option.dataset.macro = mealModalState.macro;
      foodSelect.appendChild(option);
    });

    foodSelect.disabled = false;
  };

  const updateFavoriteToggleState = () => {
    if (!mealFavoriteToggle) return;
    const key = mealModalState.mealId && mealModalState.foodId ? makeFoodKey(mealModalState.mealId, mealModalState.foodId) : '';
    const isFavorite = Boolean(key && favoriteFoods[key]);
    mealFavoriteToggle.classList.toggle('is-active', isFavorite);
    mealFavoriteToggle.disabled = !mealModalState.foodId;
    mealFavoriteToggle.dataset.mealType = mealModalState.mealId || '';
    mealFavoriteToggle.dataset.foodId = mealModalState.foodId || '';
  };

  const updateMealSummary = (food) => {
    if (!mealSummaryCard) return;
    if (!food) {
      mealSummaryCard.hidden = true;
      mealSummaryTitle.textContent = '';
      mealSummaryMeta.textContent = '';
      mealSummaryMacros.innerHTML = '';
      mealSubmitBtn && (mealSubmitBtn.disabled = true);
      updateFavoriteToggleState();
      return;
    }
    mealSummaryCard.hidden = false;
    mealSummaryTitle.textContent = food.label;
    mealSummaryMeta.textContent = `${food.quantity || 'Serving'} • ${formatCalorieValue(food.calories)} kcal`;
    mealSummaryMacros.innerHTML = [
      `Protein: ${formatMacroValue(food.protein)}g`,
      `Carbs: ${formatMacroValue(food.carbs)}g`,
      `Fat: ${formatMacroValue(food.fat)}g`
    ]
      .map((macro) => `<li>${macro}</li>`)
      .join('');
    if (mealSubmitBtn) {
      mealSubmitBtn.disabled = false;
    }
    updateFavoriteToggleState();
  };

  const refreshFavoritesList = () => {
    if (!mealFavoritesList || !mealFavoritesEmpty) return;
    const entries = Object.entries(favoriteFoods);
    mealFavoritesList.innerHTML = '';
    if (!entries.length) {
      mealFavoritesEmpty.hidden = false;
      return;
    }
    mealFavoritesEmpty.hidden = true;
    entries
      .map(([, value]) => value)
      .sort((a, b) => a.label.localeCompare(b.label))
      .forEach((favorite) => {
        const item = document.createElement('li');
        item.className = 'meal-modal-favorite-item';
        const mealTypeLabel = formatMacroLabelText(favorite.mealType);
        const macroLabel = formatMacroLabelText(favorite.macro);
        item.innerHTML = `
          <div class="meal-modal-favorite-header">
            <span>${favorite.label}</span>
            <span>${mealTypeLabel}${macroLabel ? ` • ${macroLabel}` : ''}</span>
          </div>
          <p class="meal-modal-favorite-meta">${favorite.quantity || 'Serving'} • ${formatCalorieValue(
          favorite.calories
        )} kcal</p>
          <div class="meal-modal-favorite-meta">Protein ${formatMacroValue(favorite.protein)}g • Carbs ${formatMacroValue(
          favorite.carbs
        )}g • Fat ${formatMacroValue(favorite.fat)}g</div>
          <div class="meal-modal-favorite-actions">
            <button type="button" class="meal-modal-apply-btn" data-favorite-apply>Use in plan</button>
            <button type="button" class="meal-modal-remove-btn" data-favorite-remove>Remove</button>
          </div>
        `;
        item.dataset.favoriteKey = makeFoodKey(favorite.mealType, favorite.foodId);
        mealFavoritesList.appendChild(item);
      });
  };

  const setActiveModalTab = (tabId) => {
    mealModalTabs.forEach((tab) => {
      const isActive = tab.dataset.mealModalTab === tabId;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    mealModalPanels.forEach((panel) => {
      const active = panel.dataset.mealModalPanel === tabId;
      panel.hidden = !active;
    });
  };

  const resetMealModal = () => {
    mealModalState = {
      mealId: '',
      macro: '',
      foodId: '',
      originalMeal: null,
      selectedFood: null
    };
    if (mealModalSubtitle) {
      mealModalSubtitle.textContent = 'Swap a meal with a similar option.';
    }
    if (mealSubmitBtn) {
      mealSubmitBtn.disabled = true;
    }
    if (mealFavoriteToggle) {
      mealFavoriteToggle.disabled = true;
      mealFavoriteToggle.classList.remove('is-active');
    }
    if (mealModalForm) {
      mealModalForm.reset();
    }
    resetSelect(mealTypeSelect, 'Select meal');
    if (macroSelect) {
      macroSelect.innerHTML = macroSelectInitialMarkup;
      macroSelect.selectedIndex = 0;
      macroSelect.value = '';
      macroSelect.disabled = true;
    }
    resetSelect(foodSelect, 'Select item');
    if (foodSelect) {
      foodSelect.disabled = true;
    }
    updateMealSummary(null);
    refreshFavoritesList();
    setActiveModalTab('search');
  };

  const buildMealTypeOptions = () => {
    if (!mealTypeSelect) return;
    resetSelect(mealTypeSelect, 'Select meal');
    const plan = getPlanDataForDate(currentDateKey);
    (plan?.meals || []).forEach((meal) => {
      const option = document.createElement('option');
      option.value = meal.id;
      option.textContent = meal.type;
      option.dataset.calories = String(meal.calories || 0);
      option.dataset.protein = String(meal.protein || 0);
      option.dataset.carbs = String(meal.carbs || 0);
      option.dataset.fat = String(meal.fat || 0);
      option.dataset.quantity = meal.quantity || '';
      mealTypeSelect.appendChild(option);
    });
    mealTypeSelect.disabled = !(plan?.meals?.length);
    if (mealModalSubtitle) {
      mealModalSubtitle.textContent = plan?.meals?.length
        ? 'Swap a meal with a similar option.'
        : 'No meals are scheduled for this date.';
    }
  };

  const openMealModal = () => {
    if (!mealModalBackdrop || !mealModal || mealModalBackdrop.dataset.open === 'true') return;
    resetMealModal();
    buildMealTypeOptions();
    mealModalBackdrop.hidden = false;
    mealModalBackdrop.dataset.open = 'true';
    mealModal.focus?.();
    previousBodyOverflow = document.body.style.overflow || '';
    document.body.style.overflow = 'hidden';
  };

  const closeMealModal = () => {
    if (!mealModalBackdrop) return;
    mealModalBackdrop.hidden = true;
    delete mealModalBackdrop.dataset.open;
    document.body.style.overflow = previousBodyOverflow;
  };

  const applyFavoriteToModal = (favorite) => {
    if (!favorite) return;
    const plan = getPlanDataForDate(currentDateKey);
    const hasMeal = plan?.meals?.some((meal) => meal.id === favorite.mealType);
    if (!hasMeal) {
      if (mealModalSubtitle) {
        mealModalSubtitle.textContent = 'That meal type is not part of today\'s plan.';
      }
      return;
    }
    setActiveModalTab('search');
    mealModalState.mealId = favorite.mealType;
    mealModalState.originalMeal = getMealFromPlan(currentDateKey, favorite.mealType);
    mealModalState.macro = favorite.macro || 'protein';
    mealModalState.foodId = favorite.foodId;
    mealModalState.selectedFood = { ...favorite };
    if (mealTypeSelect) {
      mealTypeSelect.value = favorite.mealType;
    }
    if (macroSelect) {
      macroSelect.innerHTML = macroSelectInitialMarkup;
      macroSelect.disabled = false;
      macroSelect.value = favorite.macro || 'protein';
    }
    populateFoodSelect();
    if (foodSelect) {
      let option = Array.from(foodSelect.options).find((opt) => opt.value === favorite.foodId);
      if (!option) {
        option = document.createElement('option');
        option.value = favorite.foodId;
        option.textContent = `${favorite.label} (${favorite.quantity || 'Serving'} • ${formatCalorieValue(
          favorite.calories
        )} kcal)`;
        option.dataset.calories = String(favorite.calories);
        option.dataset.protein = String(favorite.protein);
        option.dataset.carbs = String(favorite.carbs);
        option.dataset.fat = String(favorite.fat);
        option.dataset.quantity = favorite.quantity || '';
        option.dataset.mealType = favorite.mealType;
        option.dataset.macro = favorite.macro || '';
        foodSelect.appendChild(option);
      }
      foodSelect.disabled = false;
      foodSelect.value = favorite.foodId;
    }
    if (mealModalSubtitle) {
      mealModalSubtitle.textContent = 'Swap a meal with a similar option.';
    }
    updateMealSummary(favorite);
  };

  const onMealTypeChange = (event) => {
    const value = event.target.value;
    mealModalState.mealId = value;
    mealModalState.originalMeal = value ? getMealFromPlan(currentDateKey, value) : null;
    mealModalState.macro = '';
    mealModalState.foodId = '';
    mealModalState.selectedFood = null;
    if (macroSelect) {
      macroSelect.innerHTML = macroSelectInitialMarkup;
      macroSelect.selectedIndex = 0;
      macroSelect.value = '';
      macroSelect.disabled = !mealModalState.originalMeal;
    }
    resetSelect(foodSelect, 'Select item');
    if (foodSelect) {
      foodSelect.disabled = true;
    }
    updateMealSummary(null);
    updateFavoriteToggleState();
    if (mealModalSubtitle) {
      mealModalSubtitle.textContent = mealModalState.originalMeal
        ? 'Swap a meal with a similar option.'
        : value
        ? 'No meal data available for this slot today.'
        : 'Swap a meal with a similar option.';
    }
  };

  const onMacroChange = (event) => {
    mealModalState.macro = event.target.value;
    mealModalState.foodId = '';
    mealModalState.selectedFood = null;
    updateMealSummary(null);
    populateFoodSelect();
  };

  const onFoodChange = (event) => {
    const value = event.target.value;
    if (!value) {
      mealModalState.foodId = '';
      mealModalState.selectedFood = null;
      updateMealSummary(null);
      return;
    }
    const option = event.target.selectedOptions?.[0];
    const mealType = option?.dataset.mealType || mealModalState.mealId;
    const libraryFood = getFoodDefinition(mealType, value);
    const selectedFood = {
      id: value,
      foodId: value,
      mealType,
      macro: mealModalState.macro,
      label: libraryFood?.label || option?.textContent?.split(' (')[0] || 'Selected food',
      quantity: option?.dataset.quantity || libraryFood?.quantity || '',
      calories: Number(option?.dataset.calories || libraryFood?.calories || 0),
      protein: Number(option?.dataset.protein || libraryFood?.protein || 0),
      carbs: Number(option?.dataset.carbs || libraryFood?.carbs || 0),
      fat: Number(option?.dataset.fat || libraryFood?.fat || 0)
    };
    mealModalState.foodId = value;
    mealModalState.selectedFood = selectedFood;
    updateMealSummary(selectedFood);
  };

  const onModalSubmit = (event) => {
    event.preventDefault();
    if (!mealModalState.mealId || !mealModalState.selectedFood) return;
    const original = getMealFromPlan(currentDateKey, mealModalState.mealId);
    if (!original) return;
    const nextMeal = {
      ...original,
      foods: mealModalState.selectedFood.label,
      quantity: mealModalState.selectedFood.quantity || original.quantity,
      calories: mealModalState.selectedFood.calories,
      protein: mealModalState.selectedFood.protein,
      carbs: mealModalState.selectedFood.carbs,
      fat: mealModalState.selectedFood.fat
    };
    const baseMeal = mealPlanData[currentDateKey]?.meals?.find((meal) => meal.id === mealModalState.mealId);
    const isSameAsBase = baseMeal
      ? ['foods', 'quantity'].every((key) => {
          const nextValue = String(nextMeal[key] ?? '').trim();
          const baseValue = String(baseMeal[key] ?? '').trim();
          return nextValue === baseValue;
        }) &&
        ['calories', 'protein', 'carbs', 'fat'].every(
          (key) => Number(nextMeal[key] || 0) === Number(baseMeal[key] || 0)
        )
      : false;

    if (isSameAsBase) {
      removeMealOverride(currentDateKey, mealModalState.mealId);
    } else {
      updateMealOverride(currentDateKey, mealModalState.mealId, nextMeal);
    }
    renderMealPlan(currentDateKey);
    closeMealModal();
  };

  const toggleFavoriteSelection = () => {
    if (!mealModalState.mealId || !mealModalState.foodId || !mealModalState.selectedFood) return;
    const key = makeFoodKey(mealModalState.mealId, mealModalState.foodId);
    if (favoriteFoods[key]) {
      delete favoriteFoods[key];
    } else {
      favoriteFoods[key] = {
        ...mealModalState.selectedFood,
        mealType: mealModalState.mealId,
        foodId: mealModalState.foodId,
        macro: mealModalState.macro || 'protein'
      };
    }
    persistFavoriteFoods();
    updateFavoriteToggleState();
    refreshFavoritesList();
  };

  const onFavoritesListClick = (event) => {
    const item = event.target.closest('.meal-modal-favorite-item');
    if (!item) return;
    const key = item.dataset.favoriteKey;
    if (!key) return;
    if (event.target.closest('[data-favorite-remove]')) {
      delete favoriteFoods[key];
      persistFavoriteFoods();
      refreshFavoritesList();
      updateFavoriteToggleState();
      return;
    }
    if (event.target.closest('[data-favorite-apply]')) {
      const favorite = favoriteFoods[key];
      applyFavoriteToModal(favorite);
    }
  };

  mealModalTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.mealModalTab;
      setActiveModalTab(tabId);
      if (tabId === 'favorites') {
        refreshFavoritesList();
      }
    });
  });

  mealModalCloseBtn?.addEventListener('click', closeMealModal);

  mealModalBackdrop?.addEventListener('click', (event) => {
    if (event.target === mealModalBackdrop) {
      closeMealModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (mealModalBackdrop?.dataset.open === 'true') {
      event.stopPropagation();
      closeMealModal();
    }
  });

  mealTypeSelect?.addEventListener('change', onMealTypeChange);
  macroSelect?.addEventListener('change', onMacroChange);
  foodSelect?.addEventListener('change', onFoodChange);
  mealModalForm?.addEventListener('submit', onModalSubmit);
  mealFavoriteToggle?.addEventListener('click', toggleFavoriteSelection);
  mealFavoritesList?.addEventListener('click', onFavoritesListClick);

  const updateMacroTargets = () => {
    macroTargets = MACROS.reduce((acc, macro) => {
      const total = mealItems.reduce((sum, item) => sum + parseMacroValue(item, macro), 0);
      acc[macro] = total;
      const targetEl = macroElements[macro]?.targetEl;
      if (targetEl) {
        targetEl.textContent = formatMacroValue(total);
      }
      return acc;
    }, {});
  };

  const updateCalories = () => {
    if (!calorieValue) return;
    const total = mealItems
      .filter((item) => item.classList.contains('is-complete'))
      .reduce((sum, item) => sum + Number(item.dataset.calories || 0), 0);
    calorieValue.textContent = `${total}`;
    updateRing(total || 0);
  };

  const updateMacroCard = () => {
    const totals = MACROS.reduce((acc, macro) => {
      acc[macro] = 0;
      return acc;
    }, {});

    mealItems.forEach((item) => {
      if (!item.classList.contains('is-complete')) return;
      MACROS.forEach((macro) => {
        totals[macro] += parseMacroValue(item, macro);
      });
    });

    const hasCompletedMeals = mealItems.some((item) => item.classList.contains('is-complete'));
    if (macroTrendEmpty) {
      const hasMeals = mealItems.length > 0;
      macroTrendEmpty.hidden = hasMeals && hasCompletedMeals;
    }

    MACROS.forEach((macro) => {
      const consumed = totals[macro] || 0;
      const target = macroTargets[macro] || 0;
      const { consumedEl, bar } = macroElements[macro] || {};
      if (consumedEl) {
        consumedEl.textContent = formatMacroValue(consumed);
      }
      if (bar) {
        const progress =
          target > 0 ? Math.min((consumed / target) * 100, 100) : consumed > 0 ? 100 : 0;
        bar.style.setProperty('--macro-progress', `${progress}%`);
      }
    });
  };

  const getMealOptionById = (meal, optionId) => {
    if (!meal || !optionId || !Array.isArray(meal.options)) return null;
    return meal.options.find((option) => option.id === optionId) || null;
  };

  const renderMealOptionSelect = (meal) => {
    if (!meal || !Array.isArray(meal.options) || meal.options.length < 2) return '';
    const selectedId = meal.optionId || meal.options[0].id;
    const optionsMarkup = meal.options
      .map((option) => {
        const label = option.label || meal.type;
        const description = option.foods || '';
        const display = description ? `${label} • ${description}` : label;
        const selectedAttr = option.id === selectedId ? ' selected' : '';
        return `<option value="${option.id}"${selectedAttr}>${display}</option>`;
      })
      .join('');
    return `<select class="meal-option-select" data-meal-option-select data-meal-id="${meal.id}">${optionsMarkup}</select>`;
  };

  const getCumulativeMacroSeries = () => {
    const runningTotals = MACROS.reduce((acc, macro) => {
      acc[macro] = 0;
      return acc;
    }, {});

    return mealItems.map((item) => {
      const point = {};
      MACROS.forEach((macro) => {
        if (item.classList.contains('is-complete')) {
          runningTotals[macro] += parseMacroValue(item, macro);
        }
        point[macro] = runningTotals[macro];
      });
      return point;
    });
  };

  const drawMacroTrend = () => {
    if (!macroTrendCanvas) return;
    const ctx = macroTrendCanvas.getContext('2d');
    if (!ctx) return;

    const rect = macroTrendCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (macroTrendCanvas.width !== rect.width * dpr || macroTrendCanvas.height !== rect.height * dpr) {
      macroTrendCanvas.width = rect.width * dpr;
      macroTrendCanvas.height = rect.height * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (!mealItems.length) {
      return;
    }

    const padding = { top: 28, right: 28, bottom: 36, left: 52 };
    const chartWidth = Math.max(rect.width - padding.left - padding.right, 1);
    const chartHeight = Math.max(rect.height - padding.top - padding.bottom, 1);
    const labels = mealItems.map(
      (item) => item.dataset.meal || item.querySelector('.meal-name')?.textContent?.trim() || 'Meal'
    );

    const cumulativeSeries = getCumulativeMacroSeries();
    const maxTarget = Math.max(...MACROS.map((macro) => macroTargets[macro] || 0), 0);
    const maxSeries =
      cumulativeSeries.length > 0
        ? Math.max(
            ...cumulativeSeries.map((point) => Math.max(...MACROS.map((macro) => point[macro] || 0))),
            0
          )
        : 0;
    const chartMax = Math.max(maxTarget, maxSeries, 10);

    const isLightTheme = document.body.classList.contains('dark-mode');
    const axisColor = isLightTheme ? 'rgba(100, 116, 139, 0.45)' : 'rgba(148, 163, 184, 0.45)';
    const gridColor = isLightTheme ? 'rgba(203, 213, 225, 0.35)' : 'rgba(148, 163, 184, 0.18)';
    const labelColor = isLightTheme ? '#1f2937' : 'rgba(226, 232, 240, 0.85)';

    const gridLines = 4;
    ctx.save();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    for (let i = 0; i <= gridLines; i += 1) {
      const value = (chartMax / gridLines) * i;
      const y = padding.top + chartHeight - (value / chartMax) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();

      ctx.fillStyle = labelColor;
      ctx.font = '12px "Inter", system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(value), padding.left - 12, y);
    }
    ctx.restore();

    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.stroke();

    const stepX = labels.length > 1 ? chartWidth / (labels.length - 1) : 0;
    ctx.fillStyle = labelColor;
    ctx.font = '12px "Inter", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    labels.forEach((label, index) => {
      const x = padding.left + stepX * index;
      ctx.fillText(label, x, padding.top + chartHeight + 10);
    });

    MACROS.forEach((macro) => {
      ctx.strokeStyle = macroColors[macro];
      ctx.lineWidth = 2.25;
      ctx.beginPath();
      cumulativeSeries.forEach((point, index) => {
        const x = padding.left + stepX * index;
        const value = point[macro] || 0;
        const y = padding.top + chartHeight - (value / chartMax) * chartHeight;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      if (labels.length === 1) {
        const singleX = padding.left;
        const singleY =
          padding.top + chartHeight - ((cumulativeSeries[0]?.[macro] || 0) / chartMax) * chartHeight;
        ctx.moveTo(singleX, singleY);
        ctx.lineTo(singleX, singleY);
      }
      ctx.stroke();

      cumulativeSeries.forEach((point, index) => {
        const x = padding.left + stepX * index;
        const value = point[macro] || 0;
        const y = padding.top + chartHeight - (value / chartMax) * chartHeight;
        ctx.fillStyle = macroColors[macro];
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  };

  const updateAll = () => {
    updateCalories();
    updateMacroTargets();
    updateMacroCard();
    drawMacroTrend();
  };

  const attachMealListeners = (dateKey) => {
    const completionSet = getCompletionSet(dateKey);
    mealItems.forEach((item) => {
      const toggleBtn = item.querySelector('[data-meal-done]');
      if (!toggleBtn) return;
      const mealId = item.dataset.mealId || item.dataset.meal || toggleBtn.dataset.mealId;
      const isComplete = completionSet.has(mealId);
      item.classList.toggle('is-complete', isComplete);
      toggleBtn.textContent = isComplete ? 'Undo' : 'Done';
      toggleBtn.addEventListener('click', () => {
        const currentlyComplete = item.classList.toggle('is-complete');
        toggleBtn.textContent = currentlyComplete ? 'Undo' : 'Done';
        if (currentlyComplete) {
          completionSet.add(mealId);
        } else {
          completionSet.delete(mealId);
        }
        persistCompletions();
        updateAll();
        syncMealStreakForDate(dateKey);
      });
    });
  };

  const renderMealPlan = (dateKey) => {
    const planData = getPlanDataForDate(dateKey) || mealPlanData[dateKey] || null;
    const meals = planData?.meals ?? [];
    const subtitle = planData?.subtitle || DEFAULT_SUBTITLE;
    const completionSet = getCompletionSet(dateKey);

    if (planDateLabel) {
      planDateLabel.textContent = formatPlanLabel(dateKey, planData?.label);
    }
    if (planSubtitle) {
      planSubtitle.textContent = subtitle;
    }

    const totals = meals.reduce(
      (acc, meal) => {
        acc.calories += meal.calories || 0;
        acc.protein += meal.protein || 0;
        acc.carbs += meal.carbs || 0;
        acc.fat += meal.fat || 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    if (planCaloriesEl) {
      planCaloriesEl.textContent = meals.length
        ? `${formatCalorieValue(totals.calories)} kcal`
        : '0 kcal';
    }
    if (macroSummaryEl) {
      macroSummaryEl.textContent = meals.length
        ? `Protein ${formatMacroValue(totals.protein)}g | Carbs ${formatMacroValue(
            totals.carbs
          )}g | Fat ${formatMacroValue(totals.fat)}g`
        : 'No macro targets for this date.';
    }

    applyTargetCalories(planData?.targetCalories ?? totals.calories);

    if (mealTableBody) {
      if (meals.length) {
        mealTableBody.innerHTML = meals
          .map(
            (meal) => {
              const optionSelect = renderMealOptionSelect(meal);
              return `<tr>
              <td>${meal.type}</td>
              <td>
                <div class="meal-foods-cell">
                  <span class="meal-foods-text">${meal.foods}</span>
                  ${optionSelect}
                </div>
              </td>
              <td>${meal.quantity}</td>
              <td>${formatCalorieValue(meal.calories)}</td>
              <td>${formatMacroValue(meal.protein)}</td>
              <td>${formatMacroValue(meal.carbs)}</td>
              <td>${formatMacroValue(meal.fat)}</td>
              <td><button class="table-action" type="button" aria-label="Remove ${meal.type.toLowerCase()} meal"></button></td>
            </tr>`;
            }
          )
          .join('');
      } else {
        mealTableBody.innerHTML = `<tr class="empty">
            <td colspan="8">No meal history recorded for this day.</td>
          </tr>`;
      }
    }

    if (mealTableFoot) {
      const cells = Array.from(mealTableFoot.querySelectorAll('th, td'));
      const caloriesCell = cells[1];
      const proteinCell = cells[2];
      const carbsCell = cells[3];
      const fatCell = cells[4];
      if (caloriesCell) {
        caloriesCell.textContent = formatCalorieValue(totals.calories);
      }
      if (proteinCell) {
        proteinCell.textContent = formatMacroValue(totals.protein);
      }
      if (carbsCell) {
        carbsCell.textContent = formatMacroValue(totals.carbs);
      }
      if (fatCell) {
        fatCell.textContent = formatMacroValue(totals.fat);
      }
    }

    if (calorieList) {
      if (meals.length) {
        calorieList.innerHTML = meals
          .map((meal) => {
            const isComplete = completionSet.has(meal.id);
            return `<li data-meal-item data-meal="${meal.type}" data-meal-id="${meal.id}"
                data-calories="${meal.calories}" data-protein="${meal.protein}"
                data-carbs="${meal.carbs}" data-fat="${meal.fat}"
                class="${isComplete ? 'is-complete' : ''}">
                <div class="meal-info">
                  <span class="meal-name">${meal.type}</span>
                  <span class="meal-calories">${formatCalorieValue(meal.calories)} kcal</span>
                </div>
                <button class="meal-check" data-meal-done type="button">${isComplete ? 'Undo' : 'Done'}</button>
              </li>`;
          })
          .join('');
      } else {
        calorieList.innerHTML = `<li data-meal-item class="empty">
            <div class="meal-info">
              <span class="meal-name">No meals</span>
              <span class="meal-calories">There are no logged meals for this date.</span>
            </div>
          </li>`;
      }
    }

    mealItems = Array.from(document.querySelectorAll('[data-meal-item]')).filter((item) =>
      item.dataset.meal
    );

    if (macroTrendEmpty) {
      macroTrendEmpty.textContent = meals.length
        ? 'Mark meals as done to see your macro progress.'
        : 'No meals are logged for this date.';
    }

    updateMacroTargets();
    attachMealListeners(dateKey);
    updateAll();
    syncMealStreakForDate(dateKey);
  };

  const applyMealOptionSelection = (mealId, optionId) => {
    if (!mealId || !optionId) return;
    const baseMeal = mealPlanData[currentDateKey]?.meals?.find((meal) => meal.id === mealId);
    if (!baseMeal || !Array.isArray(baseMeal.options)) return;
    const selectedOption = getMealOptionById(baseMeal, optionId);
    if (!selectedOption) return;
    const nextMeal = {
      ...baseMeal,
      foods: selectedOption.foods,
      quantity: selectedOption.quantity || baseMeal.quantity,
      calories: selectedOption.calories,
      protein: selectedOption.protein,
      carbs: selectedOption.carbs,
      fat: selectedOption.fat,
      optionId
    };
    const isBaseOption = optionId === baseMeal.id;
    if (isBaseOption) {
      removeMealOverride(currentDateKey, mealId);
    } else {
      updateMealOverride(currentDateKey, mealId, nextMeal);
    }
    renderMealPlan(currentDateKey);
  };

  const renderCalendar = () => {
    if (!calendarDaysEl || !calendarTitleEl) return;
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const dayOfWeek = (firstOfMonth.getDay() + 6) % 7; // convert Sunday(0) -> 6
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const previousMonthDays = new Date(year, month, 0).getDate();
    const totalCells = 42;
    const todayKey = isoFromDate(new Date());

    calendarTitleEl.textContent = formatMonthTitle(calendarViewDate);
    if (calendarSubtitleEl) {
      calendarSubtitleEl.textContent = 'Choose a day to review your meal history.';
    }

    const cells = [];
    for (let i = 0; i < totalCells; i += 1) {
      let dateNumber;
      let dateMonth = month;
      let dateYear = year;
      let relation = 'current';

      if (i < dayOfWeek) {
        dateNumber = previousMonthDays - dayOfWeek + i + 1;
        dateMonth = month - 1;
        relation = 'previous';
      } else if (i >= dayOfWeek + daysInMonth) {
        dateNumber = i - (dayOfWeek + daysInMonth) + 1;
        dateMonth = month + 1;
        relation = 'next';
      } else {
        dateNumber = i - dayOfWeek + 1;
      }

      const cellDate = new Date(dateYear, dateMonth, dateNumber);
      const cellIso = isoFromDate(cellDate);
      const isCurrentMonth = cellDate.getMonth() === month;
      const isSelected = cellIso === pendingDateKey;
      const isToday = cellIso === todayKey;
      const hasData = Boolean(mealPlanData[cellIso]?.meals?.length);
      const classes = ['picker-day'];
      if (!isCurrentMonth) classes.push('is-outside');
      if (isSelected) classes.push('is-selected');
      if (isToday) classes.push('is-today');
      if (hasData) classes.push('is-has-data');

      cells.push(
        `<button type="button" class="${classes.join(' ')}" data-iso="${cellIso}" data-month-relation="${relation}" aria-pressed="${isSelected}">
          ${cellDate.getDate()}
        </button>`
      );
    }

    calendarDaysEl.innerHTML = cells.join('');

    if (calendarApply) {
      calendarApply.disabled = !pendingDateKey;
    }
  };

  const openDatePicker = () => {
    if (!datePickerBackdrop) return;
    pendingDateKey = currentDateKey;
    calendarViewDate = new Date(`${currentDateKey}T00:00:00`);
    datePickerBackdrop.hidden = false;
    datePickerBackdrop.dataset.open = 'true';
    planDateButton?.setAttribute('aria-expanded', 'true');
    renderCalendar();
    datePickerBackdrop.focus?.();
  };

  const closeDatePicker = () => {
    if (!datePickerBackdrop) return;
    datePickerBackdrop.hidden = true;
    delete datePickerBackdrop.dataset.open;
    planDateButton?.setAttribute('aria-expanded', 'false');
    planDateButton?.focus();
    pendingDateKey = currentDateKey;
  };

  calendarDaysEl?.addEventListener('click', (event) => {
    const target = event.target.closest('.picker-day');
    if (!target) return;
    const iso = target.dataset.iso;
    if (!iso) return;
    pendingDateKey = iso;
    const relation = target.dataset.monthRelation;
    if (relation === 'previous' || relation === 'next') {
      calendarViewDate = new Date(`${iso}T00:00:00`);
    }
    renderCalendar();
  });

  calendarPrev?.addEventListener('click', () => {
    calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1);
    renderCalendar();
  });

  calendarNext?.addEventListener('click', () => {
    calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1);
    renderCalendar();
  });

  calendarCancel?.addEventListener('click', () => {
    closeDatePicker();
  });

  calendarApply?.addEventListener('click', () => {
    if (!pendingDateKey) return;
    currentDateKey = pendingDateKey;
    closeDatePicker();
    renderMealPlan(currentDateKey);
  });

  datePickerBackdrop?.addEventListener('click', (event) => {
    if (event.target === datePickerBackdrop) {
      closeDatePicker();
    }
  });

  datePickerBackdrop?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      closeDatePicker();
    }
  });

  planDateButton?.addEventListener('click', () => {
    openDatePicker();
  });

  const loadDynamicPlan = async () => {
    try {
      const response = await fetch('/api/me');
      if (response.status === 401) {
        const bootstrapResult = await (window.FFSupa?.bootstrapSessionFromSupabase?.() ?? Promise.resolve({ ok: false }));
        if (bootstrapResult?.ok) {
          return loadDynamicPlan();
        }
        if (bootstrapResult?.reason === 'missing-account') {
          window.location.href = 'health.html';
        } else {
          window.location.href = 'login.html';
        }
        return;
      }
      if (!response.ok) {
        throw new Error(`Failed to load profile (${response.status})`);
      }
      const payload = await response.json();
      const profile = payload?.user?.profile ? { ...payload.user.profile } : {};
      goalNutritionTarget = readGoalNutritionTarget(payload?.user?.id || null);
      if (window.FFStreak) {
        const initSummary = window.FFStreak.init(payload?.user?.id || null);
        if (initSummary?.userKey) {
          mealUserKey = initSummary.userKey;
          loadCompletionStateForCurrentUser();
        }
      }
      if (!profile.goal && payload?.user?.goal) {
        profile.goal = payload.user.goal;
      }
      const startIso = isoFromDate(new Date());
      if (startIso) {
        try {
          const planResponse = await fetch(`/api/meal-plans?start=${startIso}&days=90`);
          if (planResponse.ok) {
            const planPayload = await planResponse.json();
            if (planPayload?.mealsByDate && Object.keys(planPayload.mealsByDate).length) {
              const previousDateKey = currentDateKey;
              setPlanCollections(planPayload.mealsByDate);
              if (previousDateKey && mealPlanData[previousDateKey]) {
                currentDateKey = previousDateKey;
                pendingDateKey = currentDateKey;
                calendarViewDate = new Date(`${currentDateKey}T00:00:00`);
              }
              renderCalendar();
              renderMealPlan(currentDateKey);
              if (mealModalBackdrop?.dataset.open === 'true') {
                buildMealTypeOptions();
              }
              return;
            }
          }
        } catch (planError) {
          console.warn('Unable to load Supabase meal plan', planError);
        }
      }

      if (!window.FlexPlan) return;
      const planResult = window.FlexPlan.buildDailyPlans(profile || {}, {
        startDate: new Date(),
        days: 90,
        startDay: 1,
        nutritionTarget: goalNutritionTarget
      });
      if (planResult?.mealsByDate && Object.keys(planResult.mealsByDate).length) {
        const previousDateKey = currentDateKey;
        setPlanCollections(planResult.mealsByDate);
        if (previousDateKey && mealPlanData[previousDateKey]) {
          currentDateKey = previousDateKey;
          pendingDateKey = currentDateKey;
          calendarViewDate = new Date(`${currentDateKey}T00:00:00`);
        }
        renderCalendar();
        renderMealPlan(currentDateKey);
        if (mealModalBackdrop?.dataset.open === 'true') {
          buildMealTypeOptions();
        }
      }
    } catch (err) {
      console.warn('Unable to build goal-based meal plan', err);
    }
  };

  renderCalendar();
  renderMealPlan(currentDateKey);
  mealTableBody?.addEventListener('change', (event) => {
    const select = event.target?.closest?.('[data-meal-option-select]');
    if (!select) return;
    const mealId = select.dataset.mealId;
    const optionId = select.value;
    applyMealOptionSelection(mealId, optionId);
  });
  loadDynamicPlan();

  let resizeFrame = null;
  window.addEventListener('resize', () => {
    if (resizeFrame) {
      cancelAnimationFrame(resizeFrame);
    }
    resizeFrame = requestAnimationFrame(() => {
      drawMacroTrend();
    });
  });

  const themeObserver = new MutationObserver(() => drawMacroTrend());
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  logMealBtn?.addEventListener('click', () => {
    logMealBtn.classList.add('is-pressed');
    setTimeout(() => logMealBtn.classList.remove('is-pressed'), 220);
    openMealModal();
  });

  logoutBtn?.addEventListener('click', async () => {
    try {
      if (window.supabaseClient?.auth) {
        try {
          await window.supabaseClient.auth.signOut();
        } catch (err) {
          console.warn('Failed to sign out Supabase session', err);
        }
      }
      await fetch('/api/logout', { method: 'POST' });
    } catch (err) {
      console.error('Failed to logout', err);
    } finally {
      window.location.href = 'login.html';
    }
  });
});
