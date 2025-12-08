const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'app/admin/users/page.tsx',
  'app/admin/settings/page.tsx',
  'app/purchasing/pos/page.tsx',
  'app/purchasing/prs/page.tsx',
  'app/purchasing/suppliers/page.tsx',
  'app/purchasing/page.tsx',
  'app/admin/roles/page.tsx',
  'app/admin/organizations/page.tsx',
  'app/purchasing/invoices/page.tsx',
  'app/purchasing/grns/page.tsx',
  'app/admin/audit-logs/page.tsx',
  'app/facilities/preventive/page.tsx',
  'app/facilities/units/page.tsx',
  'app/facilities/assets/page.tsx',
  'app/facilities/work-orders/page.tsx',
  'app/facilities/maintenance/page.tsx',
  'app/facilities/list/page.tsx',
  'app/facilities/page.tsx',
  'app/inventory/transactions/page.tsx',
  'app/inventory/locations/page.tsx',
  'app/inventory/items/page.tsx',
  'app/inventory/reorder-rules/page.tsx',
  'app/inventory/page.tsx',
  'app/projects/phases/page.tsx',
  'app/projects/page.tsx',
  'app/projects/[id]/page.tsx',
  'app/projects/[id]/edit/page.tsx',
  'app/projects/new/page.tsx',
  'app/projects/tasks/page.tsx',
  'app/projects/list/page.tsx',
  'app/marketing/campaigns/page.tsx',
  'app/marketing/page.tsx',
  'app/marketing/properties/page.tsx',
  'app/marketing/leads/page.tsx',
  'app/marketing/contacts/page.tsx',
  'app/hr/documents/page.tsx',
  'app/hr/attendance/page.tsx',
  'app/hr/leave/page.tsx',
  'app/hr/employees/page.tsx',
  'app/hr/page.tsx',
  'app/hr/leave/[id]/edit/page.tsx',
  'app/hr/leave/request/page.tsx',
  'app/hr/leave/types/page.tsx',
  'app/hr/employees/[id]/edit/page.tsx',
  'app/marketing/campaigns/[id]/page.tsx',
  'app/marketing/campaigns/[id]/edit/page.tsx',
  'app/hr/employees/[id]/page.tsx',
  'app/purchasing/pr/new/page.tsx',
  'app/purchasing/po/new/page.tsx',
  'app/marketing/properties/[id]/page.tsx',
  'app/marketing/properties/[id]/edit/page.tsx',
  'app/marketing/properties/new/page.tsx',
  'app/marketing/leads/[id]/page.tsx',
  'app/marketing/leads/[id]/edit/page.tsx',
  'app/marketing/leads/new/page.tsx',
  'app/marketing/contacts/[id]/page.tsx',
  'app/marketing/contacts/[id]/edit/page.tsx',
  'app/marketing/contacts/new/page.tsx',
  'app/marketing/campaigns/new/page.tsx',
  'app/hr/employees/new/page.tsx',
  'app/dashboard/page.tsx',
  'app/admin/page.tsx',
];

function processFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${filePath} - file not found`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // Remove MainLayout import
  content = content.replace(/import\s*\{\s*MainLayout\s*\}\s*from\s*['"]@\/components\/layout\/main-layout['"]\s*\n?/g, '');
  
  // Remove <MainLayout> opening tag and </MainLayout> closing tag
  // This handles multi-line cases
  content = content.replace(/<MainLayout>\s*/g, '');
  content = content.replace(/\s*<\/MainLayout>/g, '');

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log(`Updated: ${filePath}`);
  } else {
    console.log(`No changes needed: ${filePath}`);
  }
}

console.log('Removing MainLayout from pages...\n');

filesToProcess.forEach(processFile);

console.log('\nDone! Now create the shared layout at app/(app)/layout.tsx');

