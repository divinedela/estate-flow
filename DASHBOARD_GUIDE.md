# Dashboard Guide: What Each User Role Sees

This document explains what information, KPIs, and features each user role will see on their personalized dashboard in the Estate Flow ERP system.

---

## Overview

The Estate Flow ERP system provides **role-based dashboards** that are customized to show relevant information for each user's responsibilities. Each dashboard is designed to give users a quick overview of their key metrics, pending actions, and important alerts.

All dashboards share common features:
- **Real-time updates** via Supabase Realtime
- **Quick navigation** to detailed module pages
- **Color-coded alerts** (red for urgent, yellow for warnings, green for good status)
- **Responsive design** for desktop, tablet, and mobile access

---

## 1. Super Admin Dashboard

**Access Level:** Full system access

**Purpose:** Complete oversight of all business operations

### Dashboard Sections:

#### **Executive Overview**
- **Projects Summary**
  - Total ongoing projects (count)
  - Projects on hold (count)
  - Completed projects (count)
  - Budget vs. actual spending across all projects
  - Overdue tasks across all projects

#### **Marketing & Sales**
- Total active leads
- Hot leads (high priority)
- Conversion rate (leads to customers)
- Active marketing campaigns
- Recent property sales/leases

#### **Human Resources**
- Total employees (headcount)
- Active employees
- Pending leave requests (requiring approval)
- Upcoming document expiries (contracts, certifications)
- Recent hires

#### **Inventory**
- Total items in inventory
- Low stock alerts (items below reorder level)
- High-value items
- Recent stock transactions
- Fast-moving items

#### **Facilities**
- Open maintenance tickets
- Overdue maintenance tickets
- Total facilities/units managed
- Upcoming preventive maintenance schedules
- Asset status summary

#### **Purchasing/Procurement**
- Open Purchase Requisitions (PRs)
- Pending PR approvals
- Open Purchase Orders (POs)
- Recent POs
- Pending Goods Receipt Notes (GRNs)
- Total spend by supplier
- Total spend by project

#### **System Administration**
- Total users in system
- Active users
- Recent audit log entries
- System notifications
- Organization settings access

**Key Features:**
- Can access all modules
- Can view all organization data
- Can manage users and roles
- Can configure system settings
- Full audit log access

---

## 2. HR Manager Dashboard

**Access Level:** HR module management

**Purpose:** Manage human resources, employees, and HR operations

### Dashboard Sections:

#### **Employee Overview**
- **Total Employees** (headcount)
- **Active Employees** (currently employed)
- **New Hires This Month**
- **Department Breakdown** (employees by department)

#### **Leave Management**
- **Pending Leave Requests** (requiring approval)
- **Approved Leave Requests** (upcoming)
- **Leave Calendar** (visual calendar of who's on leave)
- **Leave Balance Summary** (by employee or department)

#### **Document Management**
- **Expiring Documents** (contracts, certifications, licenses)
  - Documents expiring in next 30 days
  - Documents expiring in next 60 days
  - Overdue document renewals
- **Document Status** (valid, expiring soon, expired)

#### **Attendance**
- **Today's Attendance** (who's checked in/out)
- **Attendance Rate** (percentage of employees present)
- **Absent Employees** (today)

#### **Recruitment**
- **Open Positions**
- **Pending Applications**
- **Recent Hires**

#### **Quick Actions**
- Create new employee
- Approve/reject leave requests
- View employee list
- Manage documents
- View attendance logs

**Key Features:**
- Full access to HR module
- Can create/edit employees
- Can approve leave requests
- Can manage employee documents
- Can view attendance data
- Cannot access other modules (except read-only executive dashboard)

---

## 3. Project Manager Dashboard

**Access Level:** Project oversight and management

**Purpose:** Monitor and manage construction/development projects

### Dashboard Sections:

#### **My Projects Overview**
- **Active Projects** (projects I'm managing)
- **On Hold Projects**
- **Completed Projects**
- **Total Budget vs. Actual Cost** (across all projects)

#### **Project Progress**
- **Project Status Summary** (by status: planning, in-progress, on-hold, completed)
- **Overall Progress** (average completion percentage)
- **Upcoming Milestones** (next 7 days, 30 days)
- **Overdue Milestones** (past due dates)

#### **Tasks & Issues**
- **My Assigned Tasks** (tasks assigned to me)
- **Team Tasks** (tasks in my projects)
- **Overdue Tasks** (across all my projects)
- **Open Issues** (project issues requiring attention)
- **High Priority Issues**

#### **Team Management**
- **Project Team Members** (across all my projects)
- **Team Performance** (task completion rates)
- **Resource Allocation** (team members by project)

#### **Budget & Costs**
- **Budget Utilization** (percentage of budget used)
- **Cost by Project** (breakdown)
- **Cost by Category** (materials, labor, etc.)
- **Variance Alerts** (projects over budget)

#### **Timeline**
- **Project Timeline View** (Gantt-style overview)
- **Upcoming Deadlines**
- **Critical Path Items**

#### **Quick Actions**
- Create new project
- View all projects
- Create task
- Report issue
- View project details

**Key Features:**
- Full access to Projects module
- Can create/edit projects
- Can assign tasks to team members
- Can update project status and progress
- Can manage project budgets
- Can view linked inventory and purchasing data
- Cannot access HR, Marketing, or other modules directly

---

## 4. Site Engineer / Supervisor Dashboard

**Access Level:** Site operations and supervision

**Purpose:** Monitor site activities and update project progress

### Dashboard Sections:

#### **Assigned Projects**
- **My Active Projects** (projects I'm assigned to)
- **Project Status** (current phase)
- **Site Location** (map or address)

#### **My Tasks**
- **Assigned Tasks** (tasks assigned to me)
- **In Progress Tasks**
- **Completed Tasks** (this week)
- **Overdue Tasks**
- **Task Priority Breakdown** (high, medium, low)

#### **Daily Activities**
- **Today's Tasks** (what needs to be done today)
- **Task Completion Rate** (my performance)
- **Time Tracking** (if applicable)

#### **Issues & Reports**
- **Open Issues** (on my projects)
- **Issues I Reported**
- **Issue Status** (pending, in-progress, resolved)

#### **Project Progress**
- **Project Completion** (percentage for each assigned project)
- **Milestone Status** (upcoming milestones)
- **Recent Updates** (recent project updates)

#### **Resources**
- **Required Materials** (materials needed for my tasks)
- **Available Inventory** (at site locations)
- **Equipment Status** (if applicable)

#### **Quick Actions**
- Update task status
- Report new issue
- View project details
- View task details
- Check inventory levels

**Key Features:**
- Read access to assigned projects
- Can update task status and progress
- Can report issues
- Can view project details
- Cannot create projects or assign tasks to others
- Limited access to other modules

---

## 5. Marketing / Sales Officer Dashboard

**Access Level:** Marketing and CRM management

**Purpose:** Manage leads, campaigns, and sales activities

### Dashboard Sections:

#### **Leads Overview**
- **Total Leads** (all leads in system)
- **Hot Leads** (high priority, high conversion potential)
- **New Leads** (this week/month)
- **Lead Status Breakdown** (new, contacted, hot, cold, converted)
- **Conversion Rate** (leads to customers)

#### **My Leads**
- **Assigned to Me** (leads I'm responsible for)
- **Requiring Follow-up** (leads with upcoming follow-up dates)
- **Overdue Follow-ups** (missed follow-up dates)
- **Recent Conversions** (leads I converted)

#### **Campaigns**
- **Active Campaigns** (currently running)
- **Campaign Performance** (leads generated per campaign)
- **Campaign ROI** (return on investment)
- **Upcoming Campaigns**

#### **Properties**
- **Total Properties** (available for sale/lease)
- **Listed Properties** (active listings)
- **Sold/Leased Properties** (this month)
- **Property Views** (if tracked)

#### **Sales Pipeline**
- **Pipeline Stages** (visual funnel)
  - New leads
  - Contacted
  - Qualified
  - Proposal sent
  - Negotiation
  - Closed won/lost
- **Pipeline Value** (total potential revenue)

#### **Activities**
- **Recent Interactions** (calls, emails, visits)
- **Scheduled Follow-ups** (upcoming)
- **Activity Summary** (this week/month)

#### **Quick Actions**
- Create new lead
- Create new campaign
- Add new contact
- Add new property
- Schedule follow-up
- View lead details

**Key Features:**
- Full access to Marketing/CRM module
- Can create/edit leads, contacts, campaigns, properties
- Can assign leads to team members
- Can track interactions and follow-ups
- Can view sales analytics
- Cannot access HR, Projects, or other modules directly

---

## 6. Procurement / Purchasing Officer Dashboard

**Access Level:** Purchasing and procurement management

**Purpose:** Manage purchase requisitions, orders, and suppliers

### Dashboard Sections:

#### **Purchase Requisitions (PRs)**
- **Pending PRs** (requiring approval)
- **Open PRs** (approved, not yet converted to PO)
- **Total PR Value** (total amount of open PRs)
- **PR Status Breakdown** (draft, submitted, approved, rejected)

#### **Purchase Orders (POs)**
- **Open POs** (sent, not yet received)
- **Partial POs** (partially received)
- **Recent POs** (created this week/month)
- **Total PO Value** (total amount of open POs)

#### **Goods Receipts (GRNs)**
- **Pending GRNs** (requiring processing)
- **Recent GRNs** (completed this week)
- **GRN Status** (pending, verified, completed)

#### **Suppliers**
- **Total Suppliers** (active suppliers)
- **Top Suppliers** (by purchase volume)
- **Supplier Performance** (on-time delivery, quality ratings)

#### **Spend Analysis**
- **Total Spend** (this month/quarter/year)
- **Spend by Supplier** (breakdown)
- **Spend by Project** (if linked to projects)
- **Spend by Category** (materials, services, etc.)

#### **Approvals**
- **Pending Approvals** (PRs requiring my approval)
- **Approval Queue** (items waiting for approval)

#### **Alerts**
- **Overdue Deliveries** (POs past expected delivery date)
- **Pending Invoices** (invoices requiring processing)
- **Supplier Issues** (quality or delivery problems)

#### **Quick Actions**
- Create new PR
- Create new PO
- Process GRN
- Add new supplier
- Approve/reject PR
- View supplier details

**Key Features:**
- Full access to Purchasing/Procurement module
- Can create/edit PRs, POs, GRNs
- Can approve PRs
- Can manage suppliers
- Can process invoices
- Cannot access HR, Projects, or other modules directly

---

## 7. Inventory / Store Officer Dashboard

**Access Level:** Stock and inventory management

**Purpose:** Manage inventory, stock levels, and stock movements

### Dashboard Sections:

#### **Stock Overview**
- **Total Items** (items in inventory)
- **Total Stock Value** (monetary value of inventory)
- **Stock Locations** (warehouses, sites, offices)

#### **Stock Alerts**
- **Low Stock Items** (below reorder level)
  - Critical (urgent reorder needed)
  - Warning (approaching reorder level)
- **Out of Stock Items** (zero quantity)
- **Overstock Items** (excess inventory)

#### **Stock Movements**
- **Recent Transactions** (inbound, outbound, transfers)
- **Today's Transactions**
- **Transaction Summary** (this week/month)
  - Inbound (received)
  - Outbound (issued)
  - Transfers
  - Adjustments

#### **Stock by Location**
- **Stock Levels by Location** (breakdown by warehouse/site)
- **Location Status** (active locations)
- **Stock Distribution** (items across locations)

#### **Fast Movers**
- **Top Moving Items** (most frequently used)
- **High-Value Items** (expensive items)
- **Slow Movers** (items with low turnover)

#### **Reorder Management**
- **Items Requiring Reorder** (based on reorder rules)
- **Reorder Recommendations** (suggested quantities)
- **Pending Reorders** (PRs created for reorder)

#### **Project Stock**
- **Stock Allocated to Projects** (if linked to projects)
- **Project Stock Usage** (materials used by projects)

#### **Quick Actions**
- Add new item
- Record stock transaction
- View stock levels
- Set reorder rules
- Transfer stock
- Adjust stock
- View item details

**Key Features:**
- Full access to Inventory module
- Can create/edit items
- Can record stock transactions
- Can set reorder rules
- Can manage stock locations
- Can view stock reports
- Cannot access HR, Projects, or other modules directly

---

## 8. Facility Manager Dashboard

**Access Level:** Facility and maintenance management

**Purpose:** Manage facilities, units, assets, and maintenance

### Dashboard Sections:

#### **Facilities Overview**
- **Total Facilities** (properties managed)
- **Total Units** (apartments, offices, etc.)
- **Occupied Units** (currently occupied)
- **Vacant Units** (available for rent)

#### **Maintenance Requests**
- **Open Requests** (pending maintenance)
- **In Progress Requests** (being worked on)
- **Overdue Requests** (past due date)
- **Completed This Week** (recently completed)

#### **Work Orders**
- **Open Work Orders** (assigned to vendors/team)
- **Pending Work Orders** (awaiting assignment)
- **Completed Work Orders** (this month)

#### **Preventive Maintenance**
- **Upcoming Schedules** (scheduled maintenance)
- **Overdue Schedules** (missed maintenance)
- **Maintenance Calendar** (visual calendar)

#### **Assets**
- **Total Assets** (equipment, machinery)
- **Asset Status** (operational, maintenance, out of service)
- **Asset Value** (total asset value)

#### **Vendors & Contractors**
- **Active Vendors** (service providers)
- **Vendor Performance** (quality, timeliness)

#### **Alerts**
- **Urgent Maintenance** (critical issues)
- **Upcoming Maintenance** (scheduled in next 7 days)
- **Asset Expiries** (warranties, certifications)

#### **Quick Actions**
- Create maintenance request
- Create work order
- Add new facility/unit
- Add new asset
- Schedule preventive maintenance
- View facility details

**Key Features:**
- Full access to Facility Management module
- Can create/edit facilities, units, assets
- Can create maintenance requests and work orders
- Can schedule preventive maintenance
- Can manage vendors
- Cannot access HR, Projects, or other modules directly

---

## 9. Executive / Director Dashboard (Read-Only)

**Access Level:** Read-only executive reporting

**Purpose:** High-level business overview for executives and directors

### Dashboard Sections:

#### **Executive Summary**
- **Business Overview** (key metrics at a glance)
- **Financial Summary** (if financial data is available)
- **Operational Health** (overall system status)

#### **Projects Overview**
- **Total Projects** (all projects)
- **Active Projects** (in progress)
- **Project Status** (by status)
- **Budget vs. Actual** (across all projects)
- **Project Completion Rate** (overall progress)

#### **Sales & Marketing**
- **Total Leads** (all leads)
- **Conversion Rate** (leads to customers)
- **Active Campaigns**
- **Property Sales/Leases** (this month/quarter)

#### **Human Resources**
- **Total Employees** (headcount)
- **Department Breakdown**
- **Recent Hires**

#### **Operations**
- **Inventory Value** (total stock value)
- **Low Stock Alerts** (critical items)
- **Open Maintenance Tickets**
- **Purchasing Activity** (recent POs, total spend)

#### **Reports & Analytics**
- **Performance Trends** (visual charts)
- **Key Metrics Over Time** (historical data)
- **Comparative Analysis** (period-over-period)

#### **Alerts & Notifications**
- **Critical Issues** (requiring executive attention)
- **Budget Overruns** (projects over budget)
- **Operational Alerts** (system-wide issues)

**Key Features:**
- **Read-only access** to all modules
- Can view all data but cannot edit
- Can access reports and analytics
- Can view audit logs
- Cannot create, edit, or delete records
- Designed for monitoring and decision-making

---

## Dashboard Customization

### Personalization Features:
- **Widget Arrangement:** Users can rearrange dashboard sections (future feature)
- **Date Range Selection:** Filter metrics by date range (this week, month, quarter, year)
- **Module Quick Links:** Direct links to detailed module pages
- **Notification Center:** Real-time notifications for important events

### Data Refresh:
- **Real-time Updates:** Critical metrics update automatically via Supabase Realtime
- **Manual Refresh:** Users can refresh data manually
- **Auto-refresh:** Dashboards refresh every 5 minutes (configurable)

### Responsive Design:
- **Desktop:** Full dashboard with all sections visible
- **Tablet:** Optimized layout with collapsible sections
- **Mobile:** Simplified view with key metrics and quick actions

---

## Security & Access Control

### Row-Level Security (RLS):
- All dashboard data is filtered by **organization_id**
- Users only see data from their organization
- RLS policies enforce data access at the database level

### Role-Based Access:
- Dashboard content is determined by user roles
- Users with multiple roles see combined dashboard views
- Access to modules is controlled by role permissions

### Audit Trail:
- All dashboard views are logged (optional)
- User activity is tracked in audit logs
- Sensitive data access is monitored

---

## Future Enhancements

Planned improvements to dashboards:
1. **Customizable Dashboards:** Users can create custom dashboard layouts
2. **Advanced Analytics:** More detailed charts and graphs
3. **Export Capabilities:** Export dashboard data to PDF/Excel
4. **Drill-Down:** Click metrics to see detailed breakdowns
5. **Comparison Views:** Compare metrics across time periods
6. **Mobile App:** Native mobile app for dashboard access
7. **AI Insights:** Automated insights and recommendations

---

## Support & Documentation

For questions about dashboards:
- Check module-specific documentation
- Contact system administrator
- Review user guides for each module

---

**Last Updated:** 2024
**Version:** 1.0

