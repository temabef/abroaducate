CREATE OR REPLACE FUNCTION get_user_subscription_for_server(p_user_id UUID)
RETURNS TABLE (
    plan_type TEXT,
    status TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        us.plan_type,
        us.status,
        us.created_at
    FROM
        public.user_subscriptions us
    WHERE
        us.user_id = p_user_id
    ORDER BY
        us.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 