-- Clear existing practice data to ensure a clean slate
DELETE FROM practice_choices;
DELETE FROM practice_questions;
DELETE FROM practice_sets;
DELETE FROM practice_tests;

-- Seed IELTS test
INSERT INTO practice_tests (slug, name, description)
VALUES ('ielts', 'IELTS', 'International English Language Testing System');

-- Seed Reading Set 1
DO $$
DECLARE
    test_uuid uuid;
    set_uuid uuid;
BEGIN
    -- get the test ID
    SELECT id INTO test_uuid FROM practice_tests WHERE slug = 'ielts';

    -- insert the set and get its ID
    INSERT INTO practice_sets (test_id, section, title, sort_order)
    VALUES (test_uuid, 'reading', 'Reading Set 1', 1)
    RETURNING id INTO set_uuid;

    -- insert questions for this set
    INSERT INTO practice_questions (set_id, question_text, explanation, sort_order)
    VALUES
        (set_uuid, 'The Eiffel Tower is located in which city?', 'The Eiffel Tower is a famous landmark in Paris, the capital of France.', 1),
        (set_uuid, 'Which planet is known as the Red Planet?', 'Mars is often called the Red Planet due to its reddish appearance, caused by iron oxide on its surface.', 2),
        (set_uuid, 'Water boils at what temperature (in °C)?', 'At standard atmospheric pressure, pure water boils at 100° Celsius (212° Fahrenheit).', 3);
END $$;`

-- Seed choices for the questions
DO $$`
DECLARE
    q1_uuid uuid;
    q2_uuid uuid;
    q3_uuid uuid;
BEGIN
    SELECT id INTO q1_uuid FROM practice_questions WHERE question_text LIKE 'The Eiffel Tower%';
    SELECT id INTO q2_uuid FROM practice_questions WHERE question_text LIKE 'Which planet%';
    SELECT id INTO q3_uuid FROM practice_questions WHERE question_text LIKE 'Water boils%';

    INSERT INTO practice_choices (question_id, choice_text, is_correct)
    VALUES
        (q1_uuid, 'Paris', true),
        (q1_uuid, 'London', false),
        (q1_uuid, 'Rome', false),
        (q2_uuid, 'Mars', true),
        (q2_uuid, 'Jupiter', false),
        (q2_uuid, 'Venus', false),
        (q3_uuid, '90', false),
        (q3_uuid, '100', true),
        (q3_uuid, '80', false);
END $$; 