const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyRLSFix() {
  console.log('Applying RLS policy updates...')

  try {
    // Drop and recreate app_users policy
    await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Admins can manage users" ON app_users;

        CREATE POLICY "Admins and PMs can manage users"
            ON app_users FOR ALL
            USING (
                public.is_super_admin()
                OR public.user_has_role('hr_manager')
                OR public.user_has_role('project_manager')
            )
            WITH CHECK (
                public.is_super_admin()
                OR public.user_has_role('hr_manager')
                OR public.user_has_role('project_manager')
            );
      `
    })

    // Drop and recreate user_roles policy
    await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;

        CREATE POLICY "Admins and PMs can manage user roles"
            ON user_roles FOR ALL
            USING (
                public.is_super_admin()
                OR public.user_has_role('hr_manager')
                OR public.user_has_role('project_manager')
            )
            WITH CHECK (
                public.is_super_admin()
                OR public.user_has_role('hr_manager')
                OR public.user_has_role('project_manager')
            );
      `
    })

    // Update view policy
    await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;

        CREATE POLICY "Users can view own roles"
            ON user_roles FOR SELECT
            USING (
                user_id IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
                OR public.is_super_admin()
                OR public.user_has_role('hr_manager')
                OR public.user_has_role('project_manager')
            );
      `
    })

    console.log('✅ RLS policies updated successfully!')
    console.log('Project managers can now create and manage team members.')
  } catch (error) {
    console.error('❌ Error applying RLS fix:', error.message)
    process.exit(1)
  }
}

applyRLSFix()
