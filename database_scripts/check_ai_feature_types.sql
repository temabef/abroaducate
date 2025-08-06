-- ========================================
-- CHECK AI FEATURE TYPES
-- ========================================
-- This script checks what feature types actually exist in ai_usage_log

SELECT '=== ALL AI FEATURE TYPES IN DATABASE ===' as description;

-- Show all unique feature types and their counts
SELECT 
    feature_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ai_usage_log), 2) as percentage
FROM ai_usage_log 
GROUP BY feature_type 
ORDER BY count DESC;

-- Show the breakdown we're currently tracking
SELECT '=== CURRENT TRACKING BREAKDOWN ===' as description;

WITH breakdown AS (
    SELECT 
        'reviews' as category,
        COUNT(*) as count
    FROM ai_usage_log 
    WHERE feature_type IN ('reviews', 'sop_review', 'review')
    
    UNION ALL
    
    SELECT 
        'grammar_checks' as category,
        COUNT(*) as count
    FROM ai_usage_log 
    WHERE feature_type IN ('grammar_check', 'grammar_checks', 'grammar')
    
    UNION ALL
    
    SELECT 
        'tone_analysis' as category,
        COUNT(*) as count
    FROM ai_usage_log 
    WHERE feature_type IN ('tone_analysis', 'tone_analyses', 'tone')
    
    UNION ALL
    
    SELECT 
        'plagiarism_checks' as category,
        COUNT(*) as count
    FROM ai_usage_log 
    WHERE feature_type IN ('plagiarism_check', 'plagiarism_checks', 'plagiarism')
    
    UNION ALL
    
    SELECT 
        'text_enhancements' as category,
        COUNT(*) as count
    FROM ai_usage_log 
    WHERE feature_type IN ('text_enhancement', 'text_enhancements', 'enhancement')
    
    UNION ALL
    
    SELECT 
        'word_optimizations' as category,
        COUNT(*) as count
    FROM ai_usage_log 
    WHERE feature_type IN ('word_optimization', 'word_optimizations', 'optimization')
)
SELECT 
    category,
    count,
    ROUND(count * 100.0 / (SELECT COUNT(*) FROM ai_usage_log), 2) as percentage
FROM breakdown
ORDER BY count DESC;

-- Show untracked feature types
SELECT '=== UNTRACKED FEATURE TYPES ===' as description;

SELECT 
    feature_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ai_usage_log), 2) as percentage
FROM ai_usage_log 
WHERE feature_type NOT IN (
    'reviews', 'sop_review', 'review',
    'grammar_check', 'grammar_checks', 'grammar',
    'tone_analysis', 'tone_analyses', 'tone',
    'plagiarism_check', 'plagiarism_checks', 'plagiarism',
    'text_enhancement', 'text_enhancements', 'enhancement',
    'word_optimization', 'word_optimizations', 'optimization'
)
GROUP BY feature_type 
ORDER BY count DESC; 