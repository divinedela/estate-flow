You are an expert full-stack software architect and senior engineer.
Your task is to DESIGN and IMPLEMENT a full ERP-style web application for a real estate development company.

The solution must allow the owner (real estate developer) and staff to monitor and manage the business remotely, end-to-end, in one system.

==================================================

1. CONTEXT & GOALS
   ==================================================

Business type:

- A real estate development company that:
  - Acquires land / properties
  - Plans and executes construction projects
  - Markets and sells / leases units
  - Manages facilities, maintenance, and tenants
  - Manages purchasing, inventory, and staff

Main goal:

- Build an ERP-style system to manage:
  - HR
  - Marketing / CRM
  - Project Management (construction & development projects)
  - Stock & Inventory
  - Facility Management
  - Purchasing / Procurement
  - Global dashboards for remote monitoring (KPIs, alerts, status)

Key non-functional goals:

- Accessible from web (desktop + tablet; mobile-friendly if possible)
- Role-based access control (RBAC)
- Multi-user, with audit logs for important actions
- Secure authentication and authorization
- Clean separation of frontend and backend logic
- Easy to extend with new modules later

==================================================
2. TECH STACK (SUPABASE-CENTRIC)
================================

Use this stack (unless you have a very strong reason to deviate; if you deviate, explain why and stay consistent):

- Frontend:

  - React + TypeScript
  - Next.js (App Router) for SSR/SSG and API routes
  - UI: [Tailwind CSS + Headless UI] OR [Material UI] (pick one and stick to it)
- Backend / Data:

  - Supabase as the primary backend platform:
    - PostgreSQL database
    - Supabase Auth for authentication
    - Supabase Row Level Security (RLS) for data access control
    - Supabase Storage for files (documents, images)
    - Supabase Realtime for live updates
    - Supabase Edge Functions for custom business logic/endpoints where needed
- Access:

  - Use the official Supabase JS/TS client (both server-side and client-side where appropriate)
  - JWT-based auth via Supabase; use JWT claims / custom claims for RBAC

Important:

- Design the schema as SQL migrations compatible with Supabase.
- Design RLS policies explicitly for each table.
- Use Edge Functions or Next.js route handlers for complex workflows (e.g. multi-step approvals) where client-side alone is not enough.

==================================================
3. OVERALL SYSTEM STRUCTURE
===========================

Organize the project as a Next.js app connected to Supabase:

Core domain layers:

- Core / Shared:
  - User & Auth integration with Supabase Auth
  - Role & Permission model (stored in DB, joined with Supabase user IDs)
  - Organization Settings (company data, branches/projects, etc.)
  - Notifications & Audit Logs
  - Dashboard & Reporting layer

Business modules:

- HR
- Marketing / CRM
- Project Management
- Stock & Inventory
- Facility Management
- Purchasing / Procurement

Each module should:

- Have a clear domain model (entities and relations in SQL)
- Expose well-defined access paths from the frontend
- Integrate with the core RBAC system
- Emit events/notifications (e.g. via Realtime or notifications table) where appropriate

==================================================
4. USER ROLES & ACCESS CONTROL (RBAC + RLS)
===========================================

Define at least these roles (configurable in DB):

- Super Admin (system owner)
- HR Manager
- Project Manager
- Site Engineer / Supervisor
- Marketing / Sales Officer
- Procurement / Purchasing Officer
- Inventory / Store Officer
- Facility Manager
- Read-only Executive / Director

Implementation strategy:

- Supabase Auth:
  - Use Supabase `auth.users` as the main identity source.
  - Create an `app_users` table with profile info, linked to `auth.users` via `user_id`.
- RBAC tables:
  - `roles` table (id, name, description)
  - `permissions` table OR encode permissions per role in code
  - `user_roles` table linking `app_users` to roles (support multiple roles if needed)
- JWT & RLS:
  - Add role-related claims to JWT where useful (e.g. `role`, `org_id`).
  - Write RLS policies that:
    - Restrict data by organization/branch/project where applicable
    - Restrict actions by role (e.g., only Procurement can approve POs)
- UI:
  - Hide/show actions based on role on the frontend
  - Also enforce all checks via RLS and/or Edge Functions so security does not depend on UI alone

==================================================
5. GLOBAL FEATURES
==================

5.1 Authentication & Profile

- Sign-up (by admin) and login using Supabase Auth
- Password reset flow with Supabase
- Basic user profile:
  - Name, email, phone, role(s), avatar, organization/branch
- Optionally multi-tenant:
  - Organization or Company table
  - Users can belong to one or more organizations
  - RLS restricts all domain data to org scope

5.2 Dashboards & Remote Monitoring
Create dashboards that show high-level KPIs. At minimum:

- Executive Dashboard:

  - Ongoing projects: status, budget vs actual, % completion
  - Active leads vs conversions (marketing)
  - HR summary: headcount, recent hires, upcoming expiries (contracts, documents)
  - Inventory alerts: low stock items, high usage items
  - Facility issues: open maintenance tickets, overdue tickets
  - Purchasing: open PRs, pending approvals, recent POs
- Module-specific dashboards (summarized):

  - HR: headcount, upcoming contract/document expiries, leave calendar
  - Project Management: list of projects, progress bars, overdue tasks, upcoming milestones
  - Inventory: stock levels by location, low stock, fast movers
  - Facility: open vs closed tickets, overdue maintenance, asset status
  - Procurement: open PRs/POs, spend by supplier, spend by project

Use Supabase Realtime and/or polling for live updates where helpful.

5.3 Notifications & Audit

- `notifications` table:
  - user_id, type, payload, read_at, created_at
- Triggers/events:
  - New tasks assigned, approvals required, low stock alerts, maintenance tickets assigned, etc.
- Audit log:
  - `audit_logs` table:
    - actor_user_id, action, entity_type, entity_id, metadata, timestamp
  - Consider using Postgres triggers to auto-log inserts/updates on critical tables.

==================================================
6. MODULES & FEATURE DETAILS
============================

---

6.1 HR MODULE
-------------

Entities:

- `employees`
- `employee_documents`
- `leave_types`, `leave_balances`, `leave_requests`
- `attendance_logs`
- (Optional) `payroll_records` (simplified)

Key features:

- CRUD employees (search/filter by department, role, project, status)
- Track documents with expiry dates and alerts
- Leave management (request, approve, calendar view)
- Simple attendance logs
- HR dashboard with key metrics and alerts

---

6.2 MARKETING / CRM MODULE
--------------------------

Entities:

- `campaigns`
- `leads`
- `contacts`
- `properties` / `units` (linked to projects if applicable)
- `interactions` (calls, emails, visits, follow-ups)

Key features:

- Lead capture and pipeline (statuses: new, contacted, hot, cold, converted)
- Assign leads to officers
- Track activities and next follow-up
- Convert leads to customers and link to units
- Campaign analytics (leads and conversions per campaign)

---

6.3 PROJECT MANAGEMENT MODULE
-----------------------------

Entities:

- `projects`
- `project_phases`
- `project_milestones`
- `project_tasks`
- `project_team_members`
- `project_issues`

Key features:

- Project creation with budget, dates, location, status
- Phases/milestones and progress tracking
- Task management (assign, due dates, priority, status, %complete)
- Simple Gantt-/timeline-style views in the UI
- Attach documents (via Supabase Storage) to projects
- Optionally link costs from inventory/purchasing to projects

---

6.4 STOCK & INVENTORY MODULE
----------------------------

Entities:

- `items` (materials)
- `stock_locations`
- `stock_levels`
- `stock_transactions` (inbound, outbound, transfer, adjustment)
- `reorder_rules`

Key features:

- Item master data
- Track stock per location (warehouse/site)
- Record all stock movements
- Low stock alerts based on `reorder_rules`
- Link stock issues/usage to projects
- Reports: current stock, stock card, fast-moving items

---

6.5 FACILITY MANAGEMENT MODULE
------------------------------

Entities:

- `facilities` / `estates`
- `units` (apartments, offices, etc.)
- `assets` (equipment)
- `maintenance_requests`
- `maintenance_work_orders`
- `preventive_maintenance_schedules`

Key features:

- Manage facilities, units, and assets (with service history)
- Create maintenance tickets (optionally from tenants or staff)
- Assign to internal team or vendors
- Track status, priority, and SLA (if needed)
- Preventive maintenance schedules that generate work orders
- Attach photos and documents via Supabase Storage

---

6.6 PURCHASING / PROCUREMENT MODULE
-----------------------------------

Entities:

- `suppliers`
- `purchase_requisitions` (PRs)
- `purchase_requisition_items`
- `purchase_orders` (POs)
- `purchase_order_items`
- `goods_receipts` (GRNs)
- `invoices` (basic records)

Key features:

- Supplier management
- PR workflow: created by staff, approved by managers/procurement
- POs generated from approved PRs
- Goods receiving:
  - Record GRNs against POs
  - Trigger inventory updates in `stock_transactions`
- Optional invoice logging and PO matching
- Procurement dashboard: open PRs/POs, spend metrics

==================================================
7. UI/UX REQUIREMENTS
=====================

General:

- Clean, modern layout with consistent navigation
- Use a global sidebar with sections:
  - Dashboard
  - HR
  - Marketing / CRM
  - Projects
  - Inventory
  - Facilities
  - Purchasing
  - Admin / Settings

For each module:

- List views (with search, filters, pagination)
- Detail views with related information (e.g., project tasks, facility assets)
- Create/edit forms with validation
- Cards and charts on dashboards to highlight KPIs, statuses, and alerts

Remote monitoring emphasis:

- Prioritize dashboards that give quick snapshots for executives
- Use badges, colors, and simple charts to surface issues (overdue, low stock, pending approvals)

==================================================
8. IMPLEMENTATION STRATEGY (STAGES)
===================================

Work in clear stages. At each stage, provide code and a short explanation.

Stage 1 – Project Setup & Core:

- Initialize Next.js + TypeScript project
- Integrate Supabase client (server and client)
- Set up basic layout and navigation
- Design core DB schema:
  - `app_users`, `roles`, `user_roles`, `notifications`, `audit_logs`, `organizations` (if multi-tenant)
- Write SQL migrations for Supabase
- Enable and configure RLS on core tables
- Implement auth flows (login, logout, profile fetching)

Stage 2 – HR & Marketing Modules:

- Define DB schema (SQL) for HR and Marketing entities
- Add RLS policies for HR and Marketing tables
- Implement CRUD API access (via direct Supabase client calls in server components or route handlers)
- Build UI pages:
  - Employee list/detail/form
  - Leads list/pipeline view/detail/form
  - Campaign list/detail with basic stats
- Add relevant notifications (e.g., new leave requests)

Stage 3 – Project Management & Inventory:

- Define DB schema (SQL) for projects, tasks, milestones, items, stock, transactions
- Write RLS policies for project- and inventory-related tables
- Implement UI:
  - Projects list/detail
  - Tasks views (list/kanban)
  - Inventory list, stock overview, transaction history
- Link inventory usage to projects where applicable

Stage 4 – Facility Management & Purchasing:

- Define DB schema (SQL) for facilities, assets, maintenance, suppliers, PRs, POs, GRNs
- Implement RLS policies
- Build UI:
  - Facilities/units/assets
  - Maintenance requests and work orders
  - Suppliers, PRs, POs, GRNs
- Integrate GRNs with stock transactions

Stage 5 – Polishing & Reporting:

- Improve dashboards using real data and charts
- Add CSV export for key lists
- Refine audit log and admin tools
- Improve settings (company info, branches, role management)
- Add any final RLS refinements and security checks

==================================================
9. CODING STYLE & OUTPUT FORMAT
===============================

When producing code:

- Use TypeScript everywhere
- Favor typed interfaces and types for entities
- For database:
  - Provide SQL for table creation and RLS policies
  - Include comments on key constraints and indexes
- For frontend:
  - Use clear React components and hooks
  - Use reusable UI components (tables, forms, cards)
- For Supabase integration:
  - Clearly separate data access logic (e.g., in hooks or services)
  - Avoid leaking Supabase details all over the UI (wrap them where sensible)

When responding:

- Work module by module or stage by stage
- At each step provide:
  - Updated schema (SQL) explanation
  - Key queries / Supabase functions
  - Frontend components/pages
  - Brief explanation of design decisions

Start now by:

1. Confirming the use of Next.js + Supabase as described.
2. Designing the initial Supabase database schema for core tables (users, roles, organizations, notifications, audit logs).
3. Writing the SQL for table creation and RLS policies for these core tables.
4. Scaffolding the Next.js app with Supabase integration and a simple logged-in layout and dashboard placeholder.
