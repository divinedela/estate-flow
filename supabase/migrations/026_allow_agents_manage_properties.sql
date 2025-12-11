-- Allow agents to manage properties
-- Agents need to be able to create listings and update property information

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Authorized users can manage properties" ON properties;

-- Create new policy that includes agents
CREATE POLICY "Authorized users can manage properties"
    ON properties FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('marketing_officer')
        OR public.user_has_role('project_manager')
        OR public.user_has_role('agent')
        OR public.user_has_role('agent_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('marketing_officer')
        OR public.user_has_role('project_manager')
        OR public.user_has_role('agent')
        OR public.user_has_role('agent_manager')
    );

-- Also update units policy to allow agents
DROP POLICY IF EXISTS "Authorized users can manage units" ON units;

CREATE POLICY "Authorized users can manage units"
    ON units FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('marketing_officer')
        OR public.user_has_role('project_manager')
        OR public.user_has_role('agent')
        OR public.user_has_role('agent_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('marketing_officer')
        OR public.user_has_role('project_manager')
        OR public.user_has_role('agent')
        OR public.user_has_role('agent_manager')
    );
