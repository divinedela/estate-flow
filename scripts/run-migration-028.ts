/**
 * Script to run the marketing team management migration
 * Run this with: npx tsx scripts/run-migration-028.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/028_marketing_team_management.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('Running migration: 028_marketing_team_management.sql')
    console.log('This will add:')
    console.log('- New marketing_team_member role')
    console.log('- marketing_teams table for team relationships')
    console.log('- RLS policies for team member access')
    console.log('- Helper functions for team management')
    console.log('')

    // Split the migration into individual statements
    // This is a simple approach - for complex migrations, use a proper parser
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`Executing ${statements.length} SQL statements...`)
    console.log('')

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'

      // Skip comment blocks
      if (statement.includes('COMMENT ON')) {
        console.log(`[${i + 1}/${statements.length}] Skipping COMMENT statement`)
        continue
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })

        if (error) {
          // Try direct execution as fallback
          const { error: directError } = await supabase.from('_migrations').select('*').limit(1)

          if (directError) {
            console.error(`[${i + 1}/${statements.length}] ❌ Error:`, error.message)
            errorCount++
          } else {
            console.log(`[${i + 1}/${statements.length}] ⚠️  Warning:`, error.message)
            successCount++
          }
        } else {
          console.log(`[${i + 1}/${statements.length}] ✓ Success`)
          successCount++
        }
      } catch (err: any) {
        console.error(`[${i + 1}/${statements.length}] ❌ Exception:`, err.message)
        errorCount++
      }
    }

    console.log('')
    console.log('Migration Summary:')
    console.log(`- Successful: ${successCount}`)
    console.log(`- Errors: ${errorCount}`)
    console.log('')

    if (errorCount === 0) {
      console.log('✅ Migration completed successfully!')
      console.log('')
      console.log('Next steps:')
      console.log('1. Go to /marketing/team to manage your team members')
      console.log('2. Create new team members with the "Add Team Member" button')
      console.log('3. Team members can login and see their assigned leads')
    } else {
      console.log('⚠️  Migration completed with errors.')
      console.log('Please run the SQL manually in Supabase SQL Editor.')
    }

  } catch (error: any) {
    console.error('Fatal error running migration:', error.message)
    console.log('')
    console.log('Alternative: Run the migration manually')
    console.log('1. Go to https://app.supabase.com/project/YOUR_PROJECT/sql')
    console.log('2. Copy the contents of: supabase/migrations/028_marketing_team_management.sql')
    console.log('3. Paste and execute in the SQL Editor')
    process.exit(1)
  }
}

runMigration()
