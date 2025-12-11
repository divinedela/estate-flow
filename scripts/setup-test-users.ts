/**
 * Setup Test Users Script
 * 
 * This script helps create test users with different roles.
 * Run with: npx tsx scripts/setup-test-users.ts
 * 
 * Prerequisites:
 * 1. Set up your .env.local with Supabase credentials
 * 2. Run all database migrations first
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in environment variables')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const TEST_ORG_ID = '00000000-0000-0000-0000-000000000001'
const TEST_PASSWORD = 'TestPassword123!'

interface TestUser {
  email: string
  fullName: string
  roleName: string
  password?: string
}

const testUsers: TestUser[] = [
  {
    email: 'superadmin@test.com',
    fullName: 'Super Admin User',
    roleName: 'super_admin',
  },
  {
  
    email: 'hrmanager@test.com',
    fullName: 'HR Manager User',
    roleName: 'hr_manager',
  },
  {
    email: 'projectmanager@test.com',
    fullName: 'Project Manager User',
    roleName: 'project_manager',
  },
  {
    email: 'siteengineer@test.com',
    fullName: 'Site Engineer User',
    roleName: 'site_engineer',
  },
  {
    email: 'marketing@test.com',
    fullName: 'Marketing Officer User',
    roleName: 'marketing_officer',
  },
  {
    email: 'procurement@test.com',
    fullName: 'Procurement Officer User',
    roleName: 'procurement_officer',
  },
  {
    email: 'inventory@test.com',
    fullName: 'Inventory Officer User',
    roleName: 'inventory_officer',
  },
  {
    email: 'facility@test.com',
    fullName: 'Facility Manager User',
    roleName: 'facility_manager',
  },
  {
    email: 'executive@test.com',
    fullName: 'Executive User',
    roleName: 'executive',
  },
]

async function setupTestUsers() {
  console.log('🚀 Starting test user setup...\n')

  // Ensure test organization exists
  const { error: orgError } = await supabase
    .from('organizations')
    .upsert({
      id: TEST_ORG_ID,
      name: 'Test Real Estate Development Co.',
      code: 'TEST-ORG',
      email: 'test@estateflow.com',
      phone: '+1234567890',
      address: '123 Test Street, Test City',
    }, {
      onConflict: 'id'
    })

  if (orgError) {
    console.error('Error creating organization:', orgError)
    return
  }
  console.log('✅ Test organization created/verified\n')

  // Get all roles
  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('id, name')

  if (rolesError || !roles) {
    console.error('Error fetching roles:', rolesError)
    return
  }

  const roleMap = new Map(roles.map(r => [r.name, r.id]))
  console.log('✅ Roles loaded\n')

  // Create each test user
  for (const testUser of testUsers) {
    try {
      console.log(`Creating user: ${testUser.email} (${testUser.roleName})...`)

      // Check if user already exists in auth by querying auth.users via RPC or direct query
      // Note: We'll use a workaround since we can't directly query auth.users
      // First, try to get the user by email from app_users
      const { data: existingAppUser } = await supabase
        .from('app_users')
        .select('user_id')
        .eq('email', testUser.email)
        .single()

      let authUserId: string

      if (existingAppUser?.user_id) {
        console.log(`  ⚠️  App user already exists, checking auth user...`)
        // Try to verify auth user exists by attempting to get it
        // If this fails, we'll need to create it manually
        authUserId = existingAppUser.user_id
        console.log(`  ℹ️  Using existing auth user ID: ${authUserId.substring(0, 8)}...`)
      } else {
        // Try to create auth user using admin API
        try {
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: testUser.email,
            password: TEST_PASSWORD,
            email_confirm: true,
          })

          if (authError) {
            if (authError.message.includes('already registered') || 
                authError.message.includes('already exists') ||
                authError.message.includes('User already registered')) {
              console.log(`  ⚠️  Auth user already exists`)
              console.log(`  📝 Get user ID: SELECT id FROM auth.users WHERE email = '${testUser.email}';`)
              console.log(`  📝 Then create app_user manually or re-run script\n`)
              continue
            } else {
              console.error(`  ❌ Error: ${authError.message}`)
              console.log(`  💡 Create auth user manually in Supabase Dashboard first\n`)
              continue
            }
          }

          if (authData?.user?.id) {
            authUserId = authData.user.id
            console.log(`  ✅ Auth user created`)
          } else {
            console.error(`  ❌ No user ID in response`)
            continue
          }
        } catch (error: any) {
          console.error(`  ❌ Error: ${error.message}`)
          console.log(`  📝 Create auth user manually: ${testUser.email} / ${TEST_PASSWORD}\n`)
          continue
        }
      }

      if (!authUserId) {
        console.error(`  ❌ No auth user ID available`)
        continue
      }

      // Create or update app_user record
      const { data: appUser, error: appUserError } = await supabase
        .from('app_users')
        .upsert({
          user_id: authUserId,
          email: testUser.email,
          full_name: testUser.fullName,
          organization_id: TEST_ORG_ID,
          is_active: true,
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single()

      if (appUserError) {
        console.error(`  ❌ Error creating app_user:`, appUserError.message)
        continue
      }

      if (!appUser) {
        console.error(`  ❌ Failed to create app_user`)
        continue
      }

      console.log(`  ✅ App user record created/updated`)

      // Assign role
      const roleId = roleMap.get(testUser.roleName)
      if (!roleId) {
        console.error(`  ❌ Role '${testUser.roleName}' not found`)
        continue
      }

      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: appUser.id,
          role_id: roleId,
          organization_id: TEST_ORG_ID,
        }, {
          onConflict: 'user_id,role_id,organization_id'
        })

      if (roleError) {
        console.error(`  ❌ Error assigning role:`, roleError.message)
        continue
      }

      console.log(`  ✅ Role assigned\n`)
    } catch (error: any) {
      console.error(`  ❌ Unexpected error:`, error.message)
      console.log('')
    }
  }

  console.log('\n✨ Test user setup complete!')
  console.log('\n📋 Test Accounts Created:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  testUsers.forEach(user => {
    console.log(`Email: ${user.email.padEnd(30)} Password: ${TEST_PASSWORD}  Role: ${user.roleName}`)
  })
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n💡 You can now log in with any of these accounts to test different features!')
}

setupTestUsers().catch(console.error)

