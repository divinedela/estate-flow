# Estate Flow ERP

A comprehensive ERP-style web application for real estate development companies, built with Next.js, TypeScript, and Supabase.

## Features

- **HR Management**: Employee management, leave tracking, attendance, document management
- **Marketing/CRM**: Lead pipeline, campaign management, property listings, contact management
- **Project Management**: Project tracking, phases, milestones, tasks, team management
- **Inventory Management**: Stock tracking, transactions, low stock alerts, reorder rules
- **Facility Management**: Facility/unit/asset management, maintenance requests, work orders
- **Procurement**: Purchase requisitions, purchase orders, goods receipts, supplier management
- **Executive Dashboard**: Comprehensive KPIs and real-time monitoring
- **Role-Based Access Control**: Secure multi-role system with RLS policies

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS, Headless UI
- **Backend**: Supabase (PostgreSQL, Auth, RLS, Storage, Realtime, Edge Functions)
- **Authentication**: Supabase Auth with JWT-based RBAC

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp env.template .env.local
   ```
   Then edit `.env.local` and fill in your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL (found in Project Settings > API)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key (found in Project Settings > API)
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (found in Project Settings > API)
   
   **Note**: The service role key should be kept secret and never exposed in client-side code.

4. Run database migrations:
   - Apply all SQL migration files in `supabase/migrations/` to your Supabase project
   - Migrations should be run in order (001, 002, 003, etc.)

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Migrations

The database schema is organized in migration files:

- `001_core_schema.sql` - Core tables (users, roles, organizations, notifications, audit logs)
- `002_core_rls_policies.sql` - RLS policies for core tables
- `003_hr_schema.sql` - HR module tables
- `004_hr_rls_policies.sql` - HR RLS policies
- `005_crm_schema.sql` - Marketing/CRM module tables
- `006_crm_rls_policies.sql` - CRM RLS policies
- `007_projects_schema.sql` - Project management tables
- `008_projects_rls_policies.sql` - Projects RLS policies
- `009_inventory_schema.sql` - Inventory module tables
- `010_inventory_rls_policies.sql` - Inventory RLS policies
- `011_facility_schema.sql` - Facility management tables
- `012_facility_rls_policies.sql` - Facility RLS policies
- `013_procurement_schema.sql` - Procurement module tables
- `014_procurement_rls_policies.sql` - Procurement RLS policies

## Project Structure

```
estate-flow/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Executive dashboard
│   ├── hr/                # HR module pages
│   ├── marketing/         # CRM module pages
│   ├── projects/          # Project management pages
│   ├── inventory/         # Inventory module pages
│   ├── facilities/        # Facility management pages
│   ├── purchasing/        # Procurement module pages
│   └── admin/             # Admin pages
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── layout/            # Layout components
│   ├── ui/                # Reusable UI components
│   └── notifications/     # Notification components
├── lib/                   # Utility libraries
│   ├── supabase/         # Supabase client setup
│   ├── hooks/             # Custom React hooks
│   └── utils/             # Utility functions
├── supabase/
│   └── migrations/        # Database migration files
└── types/                 # TypeScript type definitions
```

## User Roles

The system supports the following roles:

- **Super Admin**: Full system access
- **HR Manager**: HR module management
- **Project Manager**: Project oversight and management
- **Site Engineer**: Site supervision
- **Marketing Officer**: Marketing and sales management
- **Procurement Officer**: Purchasing and procurement
- **Inventory Officer**: Stock and inventory management
- **Facility Manager**: Facility and maintenance management
- **Executive**: Read-only access for reporting

## Security

- Row Level Security (RLS) policies enforce data access at the database level
- Role-based access control (RBAC) for UI and functionality
- JWT-based authentication via Supabase
- Audit logging for critical actions
- Secure file storage via Supabase Storage

## Development

- Run development server: `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm start`
- Lint code: `npm run lint`

## License

Private - All rights reserved

