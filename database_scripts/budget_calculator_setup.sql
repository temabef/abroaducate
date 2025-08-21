-- Budget Calculator Database Setup
-- =====================================

-- 1. Budget Calculator Data
CREATE TABLE IF NOT EXISTS budget_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT, -- For anonymous users
    
    -- Location & University
    city VARCHAR(100),
    state VARCHAR(100),
    university_type VARCHAR(50), -- public, private, community
    university_name VARCHAR(200),
    
    -- Calculated Costs
    tuition_annual DECIMAL(10,2),
    housing_monthly DECIMAL(10,2),
    food_monthly DECIMAL(10,2),
    personal_monthly DECIMAL(10,2),
    insurance_annual DECIMAL(10,2),
    transportation_monthly DECIMAL(10,2),
    books_annual DECIMAL(10,2),
    total_annual DECIMAL(10,2),
    total_4_year DECIMAL(10,2),
    monthly_budget DECIMAL(10,2),
    
    -- User Preferences
    housing_type VARCHAR(50), -- dorm, shared, studio
    lifestyle VARCHAR(50), -- budget, average, comfortable
    
    -- Lead Generation
    email VARCHAR(255),
    phone VARCHAR(50),
    interested_in_scholarships BOOLEAN DEFAULT false,
    interested_in_loans BOOLEAN DEFAULT false,
    interested_in_consultation BOOLEAN DEFAULT false,
    
    -- Source Tracking
    source VARCHAR(100), -- homepage, blog, direct
    utm_campaign VARCHAR(100),
    utm_source VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. US Cities Cost Data
CREATE TABLE IF NOT EXISTS us_cities_cost_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    state_code VARCHAR(2) NOT NULL,
    
    -- Housing Costs (monthly USD)
    dorm_cost_min DECIMAL(8,2) DEFAULT 800,
    dorm_cost_max DECIMAL(8,2) DEFAULT 1500,
    shared_apt_min DECIMAL(8,2) DEFAULT 600,
    shared_apt_max DECIMAL(8,2) DEFAULT 1200,
    studio_apt_min DECIMAL(8,2) DEFAULT 1000,
    studio_apt_max DECIMAL(8,2) DEFAULT 2500,
    
    -- Living Costs (monthly USD)
    food_budget DECIMAL(8,2) DEFAULT 300,
    food_average DECIMAL(8,2) DEFAULT 500,
    food_comfortable DECIMAL(8,2) DEFAULT 800,
    transportation DECIMAL(8,2) DEFAULT 100,
    utilities DECIMAL(8,2) DEFAULT 150,
    personal_expenses DECIMAL(8,2) DEFAULT 200,
    
    -- University Costs (annual USD)
    public_tuition_min DECIMAL(10,2) DEFAULT 15000,
    public_tuition_max DECIMAL(10,2) DEFAULT 35000,
    private_tuition_min DECIMAL(10,2) DEFAULT 25000,
    private_tuition_max DECIMAL(10,2) DEFAULT 55000,
    community_tuition_min DECIMAL(10,2) DEFAULT 8000,
    community_tuition_max DECIMAL(10,2) DEFAULT 15000,
    
    -- Additional Costs (annual USD)
    health_insurance DECIMAL(8,2) DEFAULT 2000,
    books_supplies DECIMAL(8,2) DEFAULT 1200,
    
    -- City Metadata
    population INTEGER,
    cost_of_living_index DECIMAL(5,2), -- 100 = national average
    popular_universities TEXT[], -- Array of university names
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Usage Tracking
CREATE TABLE IF NOT EXISTS budget_calculator_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    calculation_id UUID REFERENCES budget_calculations(id) ON DELETE SET NULL,
    
    -- User Journey
    page_entry VARCHAR(100), -- homepage, blog, direct
    steps_completed INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 5,
    
    -- Analytics
    time_spent_seconds INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    email_captured BOOLEAN DEFAULT false,
    consultation_requested BOOLEAN DEFAULT false,
    pdf_downloaded BOOLEAN DEFAULT false,
    
    -- A/B Testing
    variant VARCHAR(50), -- For testing different versions
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Insert Sample US Cities Data
INSERT INTO us_cities_cost_data (
    city, state, state_code,
    dorm_cost_min, dorm_cost_max,
    shared_apt_min, shared_apt_max,
    studio_apt_min, studio_apt_max,
    food_budget, food_average, food_comfortable,
    transportation, utilities, personal_expenses,
    public_tuition_min, public_tuition_max,
    private_tuition_min, private_tuition_max,
    community_tuition_min, community_tuition_max,
    health_insurance, books_supplies,
    cost_of_living_index,
    popular_universities
) VALUES 
-- New York
('New York', 'New York', 'NY', 
 1200, 2000, 1000, 1800, 2000, 3500,
 400, 600, 1000, 120, 200, 300,
 20000, 40000, 35000, 60000, 12000, 18000,
 3000, 1500, 184.0,
 ARRAY['Columbia University', 'NYU', 'Fordham University']),

-- California - Los Angeles  
('Los Angeles', 'California', 'CA',
 1000, 1800, 800, 1500, 1800, 3000,
 350, 550, 900, 100, 180, 280,
 18000, 35000, 30000, 55000, 10000, 16000,
 2800, 1400, 173.0,
 ARRAY['UCLA', 'USC', 'Pepperdine University']),

-- Texas - Austin
('Austin', 'Texas', 'TX',
 800, 1400, 600, 1100, 1200, 2200,
 300, 450, 700, 80, 140, 220,
 15000, 28000, 25000, 45000, 8000, 14000,
 2200, 1100, 119.0,
 ARRAY['University of Texas at Austin', 'Texas State University']),

-- Florida - Miami
('Miami', 'Florida', 'FL',
 900, 1600, 700, 1300, 1400, 2600,
 320, 500, 800, 90, 160, 250,
 16000, 30000, 28000, 50000, 9000, 15000,
 2400, 1200, 142.0,
 ARRAY['University of Miami', 'Florida International University']),

-- Illinois - Chicago
('Chicago', 'Illinois', 'IL',
 1000, 1700, 750, 1350, 1500, 2800,
 330, 520, 820, 95, 170, 260,
 17000, 32000, 30000, 52000, 9500, 16000,
 2600, 1300, 128.0,
 ARRAY['University of Chicago', 'Northwestern University', 'DePaul University']),

-- Massachusetts - Boston
('Boston', 'Massachusetts', 'MA',
 1100, 1900, 900, 1600, 1700, 3200,
 380, 580, 950, 110, 190, 290,
 19000, 38000, 32000, 58000, 11000, 17000,
 2900, 1450, 161.0,
 ARRAY['Harvard University', 'MIT', 'Boston University']),

-- Washington - Seattle
('Seattle', 'Washington', 'WA',
 1050, 1750, 850, 1450, 1600, 2900,
 360, 560, 900, 105, 175, 275,
 16500, 31000, 28000, 48000, 9000, 15500,
 2500, 1250, 152.0,
 ARRAY['University of Washington', 'Seattle University']),

-- Georgia - Atlanta
('Atlanta', 'Georgia', 'GA',
 850, 1500, 650, 1200, 1300, 2400,
 310, 480, 750, 85, 150, 230,
 15500, 29000, 26000, 46000, 8500, 14500,
 2300, 1150, 116.0,
 ARRAY['Georgia Tech', 'Emory University', 'Georgia State University']);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_budget_calculations_user_id ON budget_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_calculations_session_id ON budget_calculations(session_id);
CREATE INDEX IF NOT EXISTS idx_budget_calculations_created_at ON budget_calculations(created_at);
CREATE INDEX IF NOT EXISTS idx_us_cities_state ON us_cities_cost_data(state);
CREATE INDEX IF NOT EXISTS idx_us_cities_city_state ON us_cities_cost_data(city, state);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON budget_calculator_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_session_id ON budget_calculator_usage(session_id);

-- 6. Row Level Security (RLS)
ALTER TABLE budget_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_calculator_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own calculations
CREATE POLICY "Users can view own calculations" ON budget_calculations
    FOR SELECT USING (
        auth.uid() = user_id OR 
        user_id IS NULL -- Allow anonymous calculations
    );

CREATE POLICY "Users can insert own calculations" ON budget_calculations
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        user_id IS NULL -- Allow anonymous calculations
    );

CREATE POLICY "Users can update own calculations" ON budget_calculations
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        user_id IS NULL -- Allow anonymous calculations
    );

-- Cities data is public read
CREATE POLICY "Cities data is publicly readable" ON us_cities_cost_data
    FOR SELECT USING (true);

-- Usage tracking policies
CREATE POLICY "Users can view own usage" ON budget_calculator_usage
    FOR SELECT USING (
        auth.uid() = user_id OR 
        user_id IS NULL -- Allow anonymous usage tracking
    );

CREATE POLICY "Anyone can insert usage tracking" ON budget_calculator_usage
    FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON us_cities_cost_data TO anon, authenticated;
GRANT ALL ON budget_calculations TO authenticated;
GRANT INSERT, SELECT ON budget_calculator_usage TO anon, authenticated;

-- 7. Helper Functions
CREATE OR REPLACE FUNCTION get_city_cost_data(p_city TEXT, p_state TEXT)
RETURNS TABLE (
    city TEXT,
    state TEXT,
    housing_costs JSONB,
    living_costs JSONB,
    tuition_costs JSONB,
    additional_costs JSONB,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cd.city::TEXT,
        cd.state::TEXT,
        jsonb_build_object(
            'dorm', jsonb_build_object('min', cd.dorm_cost_min, 'max', cd.dorm_cost_max),
            'shared', jsonb_build_object('min', cd.shared_apt_min, 'max', cd.shared_apt_max),
            'studio', jsonb_build_object('min', cd.studio_apt_min, 'max', cd.studio_apt_max)
        ) as housing_costs,
        jsonb_build_object(
            'food', jsonb_build_object('budget', cd.food_budget, 'average', cd.food_average, 'comfortable', cd.food_comfortable),
            'transportation', cd.transportation,
            'utilities', cd.utilities,
            'personal', cd.personal_expenses
        ) as living_costs,
        jsonb_build_object(
            'public', jsonb_build_object('min', cd.public_tuition_min, 'max', cd.public_tuition_max),
            'private', jsonb_build_object('min', cd.private_tuition_min, 'max', cd.private_tuition_max),
            'community', jsonb_build_object('min', cd.community_tuition_min, 'max', cd.community_tuition_max)
        ) as tuition_costs,
        jsonb_build_object(
            'health_insurance', cd.health_insurance,
            'books_supplies', cd.books_supplies
        ) as additional_costs,
        jsonb_build_object(
            'cost_of_living_index', cd.cost_of_living_index,
            'popular_universities', cd.popular_universities
        ) as metadata
    FROM us_cities_cost_data cd
    WHERE LOWER(cd.city) = LOWER(p_city) 
    AND LOWER(cd.state) = LOWER(p_state);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_city_cost_data(TEXT, TEXT) TO anon, authenticated;

SELECT 'Budget Calculator database setup completed!' as result;
