export const load = async ({ parent }: any) => {
    const { session, supabase } = await parent();
    return {
        session,
        supabase
    };
}; 