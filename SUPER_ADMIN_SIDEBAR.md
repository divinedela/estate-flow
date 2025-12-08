# Super Admin Sidebar Navigation

This document outlines all navigation items that should appear in the sidebar for users with the **Super Admin** role.

---

## Main Navigation Items

### 1. **Dashboard** 🏠
- **Route:** `/dashboard`
- **Icon:** HomeIcon
- **Description:** Executive dashboard with overview of all modules
- **Access:** Full access to all KPIs and metrics

---

### 2. **HR** 👥
- **Route:** `/hr`
- **Icon:** UserGroupIcon
- **Description:** Human Resources management
- **Sub-items:**
  - **HR Dashboard** (`/hr`)
    - Overview of employees, leave, documents
  - **Employees** (`/hr/employees`)
    - View all employees
    - Create new employee (`/hr/employees/new`)
    - View/edit employee details (`/hr/employees/[id]`)
  - **Leave Management** (`/hr/leave`)
    - View leave requests
    - Approve/reject leave
    - Leave calendar
  - **Attendance** (`/hr/attendance`)
    - View attendance logs
    - Track employee attendance
  - **Documents** (`/hr/documents`)
    - Manage employee documents
    - Track expiring documents

---

### 3. **Marketing / CRM** 📢
- **Route:** `/marketing`
- **Icon:** MegaphoneIcon
- **Description:** Marketing, sales, and customer relationship management
- **Sub-items:**
  - **CRM Dashboard** (`/marketing`)
    - Leads overview, campaigns, conversion rates
  - **Leads** (`/marketing/leads`)
    - View all leads
    - Create new lead (`/marketing/leads/new`)
    - View/edit lead (`/marketing/leads/[id]`, `/marketing/leads/[id]/edit`)
  - **Contacts** (`/marketing/contacts`)
    - View all contacts
    - Create new contact (`/marketing/contacts/new`)
    - View/edit contact (`/marketing/contacts/[id]`, `/marketing/contacts/[id]/edit`)
  - **Properties** (`/marketing/properties`)
    - View all properties
    - Create new property (`/marketing/properties/new`)
    - View/edit property (`/marketing/properties/[id]`, `/marketing/properties/[id]/edit`)
  - **Campaigns** (`/marketing/campaigns`)
    - View all campaigns
    - Create new campaign (`/marketing/campaigns/new`)
    - View campaign analytics

---

### 4. **Projects** 📁
- **Route:** `/projects`
- **Icon:** FolderIcon
- **Description:** Project management for construction and development
- **Sub-items:**
  - **Projects Dashboard** (`/projects`)
    - View all projects
    - Project status overview
    - Budget vs actual tracking
  - **All Projects** (`/projects`)
    - List view with filters
    - Create new project (`/projects/new`)
    - View project details (`/projects/[id]`)
    - Edit project (`/projects/[id]/edit`)
  - **Tasks** (`/projects/tasks`)
    - View all project tasks
    - Task management
    - Overdue tasks
  - **Project Details** (`/projects/[id]`)
    - Project overview
    - Phases and milestones
    - Team members
    - Issues and documents

---

### 5. **Inventory** 📦
- **Route:** `/inventory`
- **Icon:** CubeIcon
- **Description:** Stock and inventory management
- **Sub-items:**
  - **Inventory Dashboard** (`/inventory`)
    - Stock levels overview
    - Low stock alerts
    - Recent transactions
  - **Items** (`/inventory/items`)
    - View all items
    - Create new item (`/inventory/items/new`)
    - Edit item details
  - **Stock Levels** (`/inventory`)
    - View stock by location
    - Stock movements
  - **Transactions** (`/inventory/transactions`)
    - View all stock transactions
    - Create new transaction (`/inventory/transactions/new`)
    - Transaction history
  - **Locations** (`/inventory/locations`)
    - Manage stock locations
    - Warehouse/site management
  - **Reorder Rules** (`/inventory/reorder-rules`)
    - Set reorder points
    - Low stock alerts configuration

---

### 6. **Facilities** 🏢
- **Route:** `/facilities`
- **Icon:** BuildingOfficeIcon
- **Description:** Facility and maintenance management
- **Sub-items:**
  - **Facilities Dashboard** (`/facilities`)
    - Open maintenance tickets
    - Overdue tickets
    - Asset status
  - **Facilities** (`/facilities`)
    - View all facilities
    - Create new facility
    - Facility details
  - **Units** (`/facilities/units`)
    - Manage facility units (apartments, offices)
    - Unit status and occupancy
  - **Maintenance Requests** (`/facilities/maintenance`)
    - View all maintenance requests
    - Create new request
    - Assign to vendors/team
  - **Work Orders** (`/facilities/work-orders`)
    - View work orders
    - Track maintenance progress
  - **Assets** (`/facilities/assets`)
    - Manage facility assets
    - Equipment tracking
    - Asset maintenance history
  - **Preventive Maintenance** (`/facilities/preventive`)
    - Schedule maintenance
    - Maintenance calendar

---

### 7. **Purchasing** 🛒
- **Route:** `/purchasing`
- **Icon:** ShoppingCartIcon
- **Description:** Procurement and purchasing management
- **Sub-items:**
  - **Procurement Dashboard** (`/purchasing`)
    - Open PRs and POs
    - Pending approvals
    - Recent purchases
  - **Purchase Requisitions (PRs)** (`/purchasing/prs`)
    - View all PRs
    - Create new PR (`/purchasing/pr/new`)
    - Approve/reject PRs
  - **Purchase Orders (POs)** (`/purchasing/pos`)
    - View all POs
    - Create new PO (`/purchasing/po/new`)
    - PO status tracking
  - **Suppliers** (`/purchasing/suppliers`)
    - View all suppliers
    - Create new supplier
    - Supplier performance
  - **Goods Receipts (GRNs)** (`/purchasing/grns`)
    - Process goods receipts
    - GRN status tracking
  - **Invoices** (`/purchasing/invoices`)
    - View invoices
    - Invoice processing
    - Payment tracking

---

### 8. **Admin** ⚙️
- **Route:** `/admin`
- **Icon:** Cog6ToothIcon
- **Description:** System administration and settings
- **Sub-items:**
  - **Admin Dashboard** (`/admin`)
    - System overview
    - User management
    - System settings
  - **Users** (`/admin/users`)
    - View all users
    - Create new user
    - Edit user details
    - Assign roles
    - Activate/deactivate users
  - **Roles** (`/admin/roles`)
    - View all roles
    - Create/edit roles
    - Manage role permissions
  - **Organizations** (`/admin/organizations`)
    - View all organizations
    - Create new organization
    - Edit organization details
    - Organization settings
  - **Audit Logs** (`/admin/audit-logs`)
    - View system audit logs
    - User activity tracking
    - System events
  - **System Settings** (`/admin/settings`)
    - General settings
    - Email configuration
    - Notification settings
    - System preferences

---

## Sidebar Structure

### Recommended Layout:

```
┌─────────────────────────┐
│   Estate Flow           │
├─────────────────────────┤
│ 🏠 Dashboard            │
│ 👥 HR                   │
│   ├─ Employees          │
│   ├─ Leave              │
│   ├─ Attendance         │
│   └─ Documents          │
│ 📢 Marketing / CRM      │
│   ├─ Leads              │
│   ├─ Contacts           │
│   ├─ Properties         │
│   └─ Campaigns          │
│ 📁 Projects             │
│   ├─ All Projects       │
│   └─ Tasks              │
│ 📦 Inventory            │
│   ├─ Items              │
│   ├─ Transactions       │
│   └─ Locations          │
│ 🏢 Facilities           │
│   ├─ Maintenance        │
│   ├─ Assets             │
│   └─ Units              │
│ 🛒 Purchasing           │
│   ├─ PRs                │
│   ├─ POs                │
│   ├─ Suppliers          │
│   └─ GRNs               │
│ ⚙️ Admin                │
│   ├─ Users              │
│   ├─ Roles              │
│   ├─ Organizations      │
│   └─ Audit Logs         │
└─────────────────────────┘
```

---

## Implementation Notes

### Expandable/Collapsible Sections
- Main menu items (HR, Marketing, Projects, etc.) can be expandable
- Clicking a main item expands to show sub-items
- Active sub-item is highlighted
- Current page is indicated with active state

### Icons
- Use Heroicons for consistency
- Main items have larger icons
- Sub-items can have smaller icons or indentation

### Access Control
- All items visible to Super Admin
- Other roles see filtered views based on permissions
- Use `RoleGuard` component for route protection

### Responsive Design
- Sidebar collapses on mobile
- Hamburger menu for mobile navigation
- Sub-items accessible via dropdown on mobile

---

## Quick Actions (Optional)

Consider adding quick action buttons in the sidebar:
- **+ New Project** (if on projects page)
- **+ New Lead** (if on marketing page)
- **+ New Employee** (if on HR page)
- **+ New PR** (if on purchasing page)

---

## Badge/Notification Counts (Optional)

Show counts for urgent items:
- Pending approvals (Purchasing)
- Overdue tasks (Projects)
- Expiring documents (HR)
- Open maintenance (Facilities)
- Low stock items (Inventory)

---

**Last Updated:** 2024
**Version:** 1.0

