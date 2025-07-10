-- Create support_requests table for contact form submissions
-- This helps track and manage user support requests

CREATE TABLE IF NOT EXISTS support_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('technical', 'billing', 'account', 'documents', 'universities', 'general')),
    subject TEXT,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to TEXT,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_requests_email ON support_requests(email);
CREATE INDEX IF NOT EXISTS idx_support_requests_category ON support_requests(category);
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON support_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_requests_priority ON support_requests(priority);
CREATE INDEX IF NOT EXISTS idx_support_requests_created_at ON support_requests(created_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_support_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_support_requests_updated_at ON support_requests;
CREATE TRIGGER trigger_update_support_requests_updated_at
    BEFORE UPDATE ON support_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_support_requests_updated_at();

-- Enable RLS (Row Level Security) if needed
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (backend) to access all records
DROP POLICY IF EXISTS "Service role can manage all support requests" ON support_requests;
CREATE POLICY "Service role can manage all support requests" 
ON support_requests 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Users can only view their own support requests (if you want to show them in dashboard later)
DROP POLICY IF EXISTS "Users can view their own support requests" ON support_requests;
CREATE POLICY "Users can view their own support requests" 
ON support_requests 
FOR SELECT 
TO authenticated 
USING (email = auth.jwt() ->> 'email');

-- Insert some sample categories for reference (optional)
COMMENT ON TABLE support_requests IS 'Stores user support requests from contact form';
COMMENT ON COLUMN support_requests.category IS 'Support category: technical, billing, account, documents, universities, general';
COMMENT ON COLUMN support_requests.priority IS 'Request priority: low, normal, high, critical';
COMMENT ON COLUMN support_requests.status IS 'Request status: open, in_progress, resolved, closed';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Support requests table created successfully!';
    RAISE NOTICE '📋 Table: support_requests';
    RAISE NOTICE '🔍 Indexes: email, category, status, priority, created_at';
    RAISE NOTICE '🔒 RLS enabled with policies for service_role and authenticated users';
    RAISE NOTICE '⚡ Auto-updating updated_at timestamp configured';
    RAISE NOTICE '';
    RAISE NOTICE 'Contact form is now ready to store support requests!';
END $$; 