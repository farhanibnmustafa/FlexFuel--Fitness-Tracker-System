-- Auto-generated from plan-engine.js MEAL_SEED_WEEKS
BEGIN;
INSERT INTO meal_goals (slug, title) VALUES
  ('lose-weight', 'Lose Weight'),
  ('build-muscle', 'Build Muscle'),
  ('improve-endurance', 'Improve Endurance'),
  ('general-fitness', 'General Fitness')
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

-- Lose Weight (Beginner)
WITH goal AS (
  SELECT id FROM meal_goals WHERE slug = 'lose-weight'
), level AS (
  SELECT id FROM plan_levels WHERE code = 'Beginner'
), days AS (
  INSERT INTO meal_template_days (goal_id, level_id, weekday, base_daily_kcal, base_daily_protein, base_daily_carbs, base_daily_fat)
  VALUES
    ((SELECT id FROM goal), (SELECT id FROM level), 1, 1070, 72, 108, 24),
    ((SELECT id FROM goal), (SELECT id FROM level), 2, 1000, 68, 119, 15),
    ((SELECT id FROM goal), (SELECT id FROM level), 3, 1070, 74, 89, 27),
    ((SELECT id FROM goal), (SELECT id FROM level), 4, 1190, 62, 127, 40),
    ((SELECT id FROM goal), (SELECT id FROM level), 5, 1080, 83, 100, 20),
    ((SELECT id FROM goal), (SELECT id FROM level), 6, 1070, 63, 115, 26),
    ((SELECT id FROM goal), (SELECT id FROM level), 7, 1050, 60, 127, 25)
  ON CONFLICT (goal_id, level_id, weekday) DO UPDATE SET
    base_daily_kcal = EXCLUDED.base_daily_kcal,
    base_daily_protein = EXCLUDED.base_daily_protein,
    base_daily_carbs = EXCLUDED.base_daily_carbs,
    base_daily_fat = EXCLUDED.base_daily_fat
  RETURNING id, weekday
), clear_meals AS (
  DELETE FROM meal_template_meals
  WHERE template_day_id IN (SELECT id FROM days)
), meals AS (
  INSERT INTO meal_template_meals (template_day_id, meal_label, food_description, base_kcal, base_protein, base_carbs, base_fat, meal_order)
  SELECT days.id, m.meal_label, m.food_description, m.base_kcal, m.base_protein, m.base_carbs, m.base_fat, m.meal_order
  FROM days
  JOIN (VALUES
    (1, 'Breakfast', 'Oats 40 g + milk 200 ml + 1 egg + apple', 320, 18, 38, 6, 1),
    (1, 'Lunch', 'Grilled chicken 120 g + brown rice 80 g + vegetables 100 g', 420, 35, 42, 8, 2),
    (1, 'Snack', 'Greek yogurt 100 g + 10 almonds', 150, 10, 8, 6, 3),
    (1, 'Dinner', 'Veg soup 250 ml + salad 100 g', 180, 9, 20, 4, 4),
    (2, 'Breakfast', 'Scrambled egg whites + 1 toast + orange', 290, 20, 25, 5, 1),
    (2, 'Lunch', 'Tuna salad + 1 roti', 410, 34, 40, 8, 2),
    (2, 'Snack', 'Apple + green tea', 95, 0, 24, 0, 3),
    (2, 'Dinner', 'Lentil soup + boiled veggies', 205, 14, 30, 2, 4),
    (3, 'Breakfast', 'Greek yogurt 150 g + banana + chia', 300, 14, 35, 8, 1),
    (3, 'Lunch', 'Grilled fish 100 g + quinoa 100 g + spinach', 400, 32, 38, 7, 2),
    (3, 'Snack', 'Boiled egg + carrots', 120, 8, 4, 6, 3),
    (3, 'Dinner', 'Chicken clear soup + stir-fried broccoli', 250, 20, 12, 6, 4),
    (4, 'Breakfast', 'Smoothie (oats + milk + banana + peanut butter 10 g)', 350, 17, 45, 10, 1),
    (4, 'Lunch', 'Paneer 80 g + brown rice 100 g + veggies', 420, 25, 45, 12, 2),
    (4, 'Snack', 'Handful of nuts + green tea', 180, 6, 7, 13, 3),
    (4, 'Dinner', 'Veggie wrap + salad', 240, 14, 30, 5, 4),
    (5, 'Breakfast', 'Boiled eggs 2 + brown bread 2 + apple', 310, 18, 32, 6, 1),
    (5, 'Lunch', 'Chicken wrap + cucumber salad', 410, 32, 40, 9, 2),
    (5, 'Snack', 'Protein shake', 150, 24, 3, 1, 3),
    (5, 'Dinner', 'Veg soup + toast', 210, 9, 25, 4, 4),
    (6, 'Breakfast', 'Yogurt parfait + berries', 330, 16, 42, 7, 1),
    (6, 'Lunch', 'Egg curry + boiled potato + spinach', 430, 26, 46, 11, 2),
    (6, 'Snack', 'Popcorn 20 g + tea', 90, 3, 12, 2, 3),
    (6, 'Dinner', 'Grilled tofu + mixed veggies', 220, 18, 15, 6, 4),
    (7, 'Breakfast', 'Fruit bowl + nuts + toast', 300, 10, 45, 8, 1),
    (7, 'Lunch', 'Chicken fried rice (light oil)', 450, 33, 50, 10, 2),
    (7, 'Snack', 'Yogurt + cucumber', 120, 8, 10, 4, 3),
    (7, 'Dinner', 'Soup + whole-grain crackers', 180, 9, 22, 3, 4)
  ) AS m(weekday, meal_label, food_description, base_kcal, base_protein, base_carbs, base_fat, meal_order)
  ON days.weekday = m.weekday
  RETURNING id, template_day_id, meal_label
), clear_options AS (
  DELETE FROM meal_template_options
  WHERE template_meal_id IN (SELECT id FROM meals)
)
SELECT 1;

-- Build Muscle (Beginner)
WITH goal AS (
  SELECT id FROM meal_goals WHERE slug = 'build-muscle'
), level AS (
  SELECT id FROM plan_levels WHERE code = 'Beginner'
), days AS (
  INSERT INTO meal_template_days (goal_id, level_id, weekday, base_daily_kcal, base_daily_protein, base_daily_carbs, base_daily_fat)
  VALUES
    ((SELECT id FROM goal), (SELECT id FROM level), 1, 1490, 133, 145, 28),
    ((SELECT id FROM goal), (SELECT id FROM level), 2, 1680, 118, 211, 29),
    ((SELECT id FROM goal), (SELECT id FROM level), 3, 1550, 118, 146, 39),
    ((SELECT id FROM goal), (SELECT id FROM level), 4, 1580, 111, 180, 38),
    ((SELECT id FROM goal), (SELECT id FROM level), 5, 1570, 119, 177, 31),
    ((SELECT id FROM goal), (SELECT id FROM level), 6, 1420, 102, 175, 27),
    ((SELECT id FROM goal), (SELECT id FROM level), 7, 1490, 108, 168, 32)
  ON CONFLICT (goal_id, level_id, weekday) DO UPDATE SET
    base_daily_kcal = EXCLUDED.base_daily_kcal,
    base_daily_protein = EXCLUDED.base_daily_protein,
    base_daily_carbs = EXCLUDED.base_daily_carbs,
    base_daily_fat = EXCLUDED.base_daily_fat
  RETURNING id, weekday
), clear_meals AS (
  DELETE FROM meal_template_meals
  WHERE template_day_id IN (SELECT id FROM days)
), meals AS (
  INSERT INTO meal_template_meals (template_day_id, meal_label, food_description, base_kcal, base_protein, base_carbs, base_fat, meal_order)
  SELECT days.id, m.meal_label, m.food_description, m.base_kcal, m.base_protein, m.base_carbs, m.base_fat, m.meal_order
  FROM days
  JOIN (VALUES
    (1, 'Breakfast', '4 eggs + oats 60 g + banana', 480, 35, 55, 14, 1),
    (1, 'Lunch', 'Chicken 150 g + brown rice 120 g + broccoli', 480, 42, 50, 6, 2),
    (1, 'Snack 1', 'Protein shake', 180, 28, 5, 2, 3),
    (1, 'Dinner', 'Fish 100 g + sweet potato 100 g + spinach', 350, 28, 35, 6, 4),
    (2, 'Breakfast', 'Smoothie (oats 50 g + milk 250 ml + peanut butter 20 g)', 500, 28, 50, 16, 1),
    (2, 'Lunch', 'Grilled chicken 150 g + quinoa 100 g', 460, 40, 46, 7, 2),
    (2, 'Snacks', 'Banana + honey and whey shake', 350, 26, 60, 2, 3),
    (2, 'Dinner', 'Rice 100 g + lentils + salad', 370, 24, 55, 4, 4),
    (3, 'Breakfast', 'Omelette (3 eggs) + toast + yogurt 100 g', 410, 30, 28, 13, 1),
    (3, 'Lunch', 'Chicken curry 150 g + rice 100 g + veggies', 440, 40, 50, 8, 2),
    (3, 'Snacks', 'Boiled egg / Peanut bar', 340, 20, 30, 10, 3),
    (3, 'Dinner', 'Paneer 100 g + brown rice 100 g', 360, 28, 38, 8, 4),
    (4, 'Breakfast', 'Pancakes (oats + egg + banana)', 420, 25, 50, 10, 1),
    (4, 'Lunch', 'Tuna sandwich + salad', 390, 35, 45, 8, 2),
    (4, 'Snacks', 'Milk + cookies / Nuts mix', 350, 15, 45, 12, 3),
    (4, 'Dinner', 'Chicken + quinoa + veggies', 420, 36, 40, 8, 4),
    (5, 'Breakfast', 'Eggs + banana + peanut butter toast', 420, 26, 45, 12, 1),
    (5, 'Lunch', 'Rice + fish + vegetables', 450, 38, 52, 8, 2),
    (5, 'Snacks', 'Protein shake / Fruit bowl', 340, 25, 45, 5, 3),
    (5, 'Dinner', 'Chicken + lentils + spinach', 360, 30, 35, 6, 4),
    (6, 'Breakfast', 'Yogurt 200 g + oats 50 g + nuts 20 g', 370, 22, 40, 11, 1),
    (6, 'Lunch', 'Paneer 120 g + roti 2 + salad', 430, 34, 45, 9, 2),
    (6, 'Snacks', 'Granola bar / Whey shake', 320, 26, 45, 4, 3),
    (6, 'Dinner', 'Brown rice + vegetables', 300, 20, 45, 3, 4),
    (7, 'Breakfast', 'Oats pancake + milk 200 ml', 360, 18, 48, 8, 1),
    (7, 'Lunch', 'Chicken fried rice (home-style)', 480, 38, 50, 9, 2),
    (7, 'Snacks', 'Dates + nuts / Protein smoothie', 350, 24, 45, 8, 3),
    (7, 'Dinner', 'Fish + vegetables', 300, 28, 25, 7, 4)
  ) AS m(weekday, meal_label, food_description, base_kcal, base_protein, base_carbs, base_fat, meal_order)
  ON days.weekday = m.weekday
  RETURNING id, template_day_id, meal_label
), clear_options AS (
  DELETE FROM meal_template_options
  WHERE template_meal_id IN (SELECT id FROM meals)
)
INSERT INTO meal_template_options (template_meal_id, option_label, food_description, base_kcal, base_protein, base_carbs, base_fat, option_order)
SELECT meals.id, o.option_label, o.food_description, o.base_kcal, o.base_protein, o.base_carbs, o.base_fat, o.option_order
FROM meals
JOIN days ON days.id = meals.template_day_id
JOIN (VALUES
  (1, 'Snack 1', 'Snack 2', 'Nuts 20 g', 180, 5, 4, 15, 1)
) AS o(weekday, meal_label, option_label, food_description, base_kcal, base_protein, base_carbs, base_fat, option_order)
ON days.weekday = o.weekday AND meals.meal_label = o.meal_label;

-- Improve Endurance (Beginner)
WITH goal AS (
  SELECT id FROM meal_goals WHERE slug = 'improve-endurance'
), level AS (
  SELECT id FROM plan_levels WHERE code = 'Beginner'
), days AS (
  INSERT INTO meal_template_days (goal_id, level_id, weekday, base_daily_kcal, base_daily_protein, base_daily_carbs, base_daily_fat)
  VALUES
    ((SELECT id FROM goal), (SELECT id FROM level), 1, 1360, 89, 162, 27),
    ((SELECT id FROM goal), (SELECT id FROM level), 2, 1310, 63, 170, 31),
    ((SELECT id FROM goal), (SELECT id FROM level), 3, 1330, 94, 165, 23),
    ((SELECT id FROM goal), (SELECT id FROM level), 4, 1320, 82, 180, 25),
    ((SELECT id FROM goal), (SELECT id FROM level), 5, 1150, 51, 178, 16),
    ((SELECT id FROM goal), (SELECT id FROM level), 6, 1190, 79, 155, 16),
    ((SELECT id FROM goal), (SELECT id FROM level), 7, 1210, 78, 156, 23)
  ON CONFLICT (goal_id, level_id, weekday) DO UPDATE SET
    base_daily_kcal = EXCLUDED.base_daily_kcal,
    base_daily_protein = EXCLUDED.base_daily_protein,
    base_daily_carbs = EXCLUDED.base_daily_carbs,
    base_daily_fat = EXCLUDED.base_daily_fat
  RETURNING id, weekday
), clear_meals AS (
  DELETE FROM meal_template_meals
  WHERE template_day_id IN (SELECT id FROM days)
), meals AS (
  INSERT INTO meal_template_meals (template_day_id, meal_label, food_description, base_kcal, base_protein, base_carbs, base_fat, meal_order)
  SELECT days.id, m.meal_label, m.food_description, m.base_kcal, m.base_protein, m.base_carbs, m.base_fat, m.meal_order
  FROM days
  JOIN (VALUES
    (1, 'Breakfast', 'Toast + peanut butter + banana', 370, 14, 45, 10, 1),
    (1, 'Lunch', 'Chicken 120 g + rice 100 g + salad', 430, 36, 50, 7, 2),
    (1, 'Snack 1', 'Yogurt + fruit', 180, 9, 25, 3, 3),
    (1, 'Dinner', 'Fish + quinoa + veggies', 380, 30, 42, 7, 4),
    (2, 'Breakfast', 'Banana smoothie + oats 40 g', 330, 13, 55, 5, 1),
    (2, 'Lunch', 'Tuna wrap + lettuce', 400, 30, 40, 8, 2),
    (2, 'Snack', 'Apple / Nuts', 230, 5, 25, 10, 3),
    (2, 'Dinner', 'Vegetable curry + rice', 350, 15, 50, 8, 4),
    (3, 'Breakfast', 'Boiled eggs 2 + toast + juice', 330, 19, 30, 8, 1),
    (3, 'Lunch', 'Chicken + potatoes + greens', 370, 30, 45, 7, 2),
    (3, 'Snack', 'Whey shake + banana', 300, 25, 40, 3, 3),
    (3, 'Dinner', 'Lentils + spinach + rice', 330, 20, 50, 5, 4),
    (4, 'Breakfast', 'Oats + milk + honey', 360, 18, 52, 8, 1),
    (4, 'Lunch', 'Grilled fish + brown rice', 370, 30, 45, 6, 2),
    (4, 'Snack', 'Dates + granola bar', 270, 8, 45, 5, 3),
    (4, 'Dinner', 'Tofu + quinoa + broccoli', 320, 26, 38, 6, 4),
    (5, 'Breakfast', 'Yogurt + muesli + fruit', 320, 14, 50, 5, 1),
    (5, 'Lunch', 'Pasta + veggies + boiled eggs 2', 430, 25, 60, 8, 2),
    (5, 'Snack', 'Energy drink + apple', 200, 3, 40, 0, 3),
    (5, 'Dinner', 'Soup + bread + salad', 200, 9, 28, 3, 4),
    (6, 'Breakfast', 'Smoothie (oats + milk)', 310, 14, 45, 5, 1),
    (6, 'Lunch', 'Chicken/tofu + rice + salad', 380, 30, 45, 6, 2),
    (6, 'Snack', 'Banana + whey shake', 320, 26, 45, 3, 3),
    (6, 'Dinner', 'Soup + vegetables', 180, 9, 20, 2, 4),
    (7, 'Breakfast', 'Omelette 2 + fruit + toast', 320, 18, 35, 8, 1),
    (7, 'Lunch', 'Fish curry + rice + salad', 380, 32, 48, 6, 2),
    (7, 'Snack', 'Yogurt + dates mix', 240, 10, 35, 5, 3),
    (7, 'Dinner', 'Lentils + vegetables', 270, 18, 38, 4, 4)
  ) AS m(weekday, meal_label, food_description, base_kcal, base_protein, base_carbs, base_fat, meal_order)
  ON days.weekday = m.weekday
  RETURNING id, template_day_id, meal_label
), clear_options AS (
  DELETE FROM meal_template_options
  WHERE template_meal_id IN (SELECT id FROM meals)
)
INSERT INTO meal_template_options (template_meal_id, option_label, food_description, base_kcal, base_protein, base_carbs, base_fat, option_order)
SELECT meals.id, o.option_label, o.food_description, o.base_kcal, o.base_protein, o.base_carbs, o.base_fat, o.option_order
FROM meals
JOIN days ON days.id = meals.template_day_id
JOIN (VALUES
  (1, 'Snack 1', 'Snack 2', 'Energy bar', 200, 8, 28, 5, 1)
) AS o(weekday, meal_label, option_label, food_description, base_kcal, base_protein, base_carbs, base_fat, option_order)
ON days.weekday = o.weekday AND meals.meal_label = o.meal_label;

-- General Fitness (Beginner)
WITH goal AS (
  SELECT id FROM meal_goals WHERE slug = 'general-fitness'
), level AS (
  SELECT id FROM plan_levels WHERE code = 'Beginner'
), days AS (
  INSERT INTO meal_template_days (goal_id, level_id, weekday, base_daily_kcal, base_daily_protein, base_daily_carbs, base_daily_fat)
  VALUES
    ((SELECT id FROM goal), (SELECT id FROM level), 1, 1230, 77, 142, 24),
    ((SELECT id FROM goal), (SELECT id FROM level), 2, 1200, 67, 127, 31),
    ((SELECT id FROM goal), (SELECT id FROM level), 3, 1040, 63, 123, 20),
    ((SELECT id FROM goal), (SELECT id FROM level), 4, 1100, 62, 141, 24),
    ((SELECT id FROM goal), (SELECT id FROM level), 5, 1150, 81, 110, 28),
    ((SELECT id FROM goal), (SELECT id FROM level), 6, 1130, 52, 142, 28),
    ((SELECT id FROM goal), (SELECT id FROM level), 7, 850, 55, 91, 17)
  ON CONFLICT (goal_id, level_id, weekday) DO UPDATE SET
    base_daily_kcal = EXCLUDED.base_daily_kcal,
    base_daily_protein = EXCLUDED.base_daily_protein,
    base_daily_carbs = EXCLUDED.base_daily_carbs,
    base_daily_fat = EXCLUDED.base_daily_fat
  RETURNING id, weekday
), clear_meals AS (
  DELETE FROM meal_template_meals
  WHERE template_day_id IN (SELECT id FROM days)
), meals AS (
  INSERT INTO meal_template_meals (template_day_id, meal_label, food_description, base_kcal, base_protein, base_carbs, base_fat, meal_order)
  SELECT days.id, m.meal_label, m.food_description, m.base_kcal, m.base_protein, m.base_carbs, m.base_fat, m.meal_order
  FROM days
  JOIN (VALUES
    (1, 'Breakfast', 'Oats + milk + egg + fruit', 350, 20, 42, 8, 1),
    (1, 'Lunch', 'Rice + chicken + veggies', 430, 35, 45, 7, 2),
    (1, 'Snack', 'Yogurt + granola', 200, 10, 30, 4, 3),
    (1, 'Dinner', 'Soup + salad', 250, 12, 25, 5, 4),
    (2, 'Breakfast', 'Toast + peanut butter + milk', 340, 15, 35, 10, 1),
    (2, 'Lunch', 'Lentils + roti + veggies', 360, 20, 45, 6, 2),
    (2, 'Snack', 'Apple + almonds', 180, 4, 22, 8, 3),
    (2, 'Dinner', 'Fish + greens', 320, 28, 25, 7, 4),
    (3, 'Breakfast', 'Yogurt + granola + banana', 310, 14, 45, 5, 1),
    (3, 'Lunch', 'Chicken + rice + salad', 380, 30, 45, 6, 2),
    (3, 'Snack', 'Boiled egg + carrots', 120, 9, 3, 5, 3),
    (3, 'Dinner', 'Veg curry + roti', 230, 10, 30, 4, 4),
    (4, 'Breakfast', 'Smoothie (oats + milk + fruit)', 310, 14, 48, 5, 1),
    (4, 'Lunch', 'Fish + rice + vegetables', 380, 30, 48, 7, 2),
    (4, 'Snack', 'Fruit + nuts', 190, 6, 20, 8, 3),
    (4, 'Dinner', 'Lentil soup + toast', 220, 12, 25, 4, 4),
    (5, 'Breakfast', 'Eggs 2 + bread 2 + fruit', 330, 18, 35, 8, 1),
    (5, 'Lunch', 'Chicken + quinoa + veggies', 420, 35, 45, 7, 2),
    (5, 'Snack', 'Yogurt cup', 130, 8, 15, 3, 3),
    (5, 'Dinner', 'Paneer + soup', 270, 20, 15, 10, 4),
    (6, 'Breakfast', 'Parfait (yogurt + oats + nuts)', 340, 16, 40, 9, 1),
    (6, 'Lunch', 'Rice + lentils + salad', 360, 20, 45, 6, 2),
    (6, 'Snack', 'Apple + nuts', 180, 4, 22, 8, 3),
    (6, 'Dinner', 'Grilled veggies + rice', 250, 12, 35, 5, 4),
    (7, 'Breakfast', 'Boiled eggs + toast + orange', 270, 15, 28, 7, 1),
    (7, 'Lunch', 'Fish + vegetables', 310, 28, 25, 6, 2),
    (7, 'Snack', 'Popcorn + green tea', 110, 3, 18, 2, 3),
    (7, 'Dinner', 'Soup + salad', 160, 9, 20, 2, 4)
  ) AS m(weekday, meal_label, food_description, base_kcal, base_protein, base_carbs, base_fat, meal_order)
  ON days.weekday = m.weekday
  RETURNING id, template_day_id, meal_label
), clear_options AS (
  DELETE FROM meal_template_options
  WHERE template_meal_id IN (SELECT id FROM meals)
)
SELECT 1;

COMMIT;