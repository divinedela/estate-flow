import { Card } from "@/components/ui/card";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/auth/role-guard";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserCircleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

async function getUserRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: appUser } = await supabase
    .from("app_users")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!appUser) return null;

  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role:roles(name)")
    .eq("user_id", (appUser as any).id);

  const roles =
    userRoles?.map((ur: any) => ur.role?.name).filter(Boolean) || [];

  // Return the highest priority role
  if (roles.includes("super_admin")) return "super_admin";
  if (roles.includes("executive")) return "executive";
  if (roles.includes("hr_manager")) return "hr_manager";

  return null;
}

async function getEmployees() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Get user's organization
  const { data: profile } = await supabase
    .from("app_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!(profile as any)?.organization_id) return [];

  // Fetch employees in the same organization
  const { data: employees, error } = await supabase
    .from("employees")
    .select("*")
    .eq("organization_id", (profile as any).organization_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching employees:", error);
    return [];
  }

  return employees || [];
}

export default async function EmployeesPage() {
  const employees = await getEmployees();
  const userRole = await getUserRole();

  // Show back button for super_admin and executive, hide for hr_manager
  const showBackButton = userRole === "super_admin" || userRole === "executive";

  return (
    <RoleGuard allowedRoles={["super_admin", "hr_manager", "executive"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Link
                href="/hr"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
            )}
            <div>
              {showBackButton && (
                <div className="flex items-center space-x-2 mb-1">
                  <Link
                    href="/hr"
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    HR
                  </Link>
                  <span className="text-gray-400">/</span>
                  <span className="text-sm text-gray-500">Employees</span>
                </div>
              )}
              <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your workforce and employee records
              </p>
            </div>
          </div>
          <Link href="/hr/employees/new">
            <Button className="inline-flex items-center">
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Add Employee
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserCircleIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Employees
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {employees.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-3 w-3 rounded-full bg-green-400"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {
                        (employees as any[]).filter(
                          (e: any) => e.status === "active"
                        ).length
                      }
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      On Leave
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {
                        (employees as any[]).filter(
                          (e: any) => e.status === "on_leave"
                        ).length
                      }
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Inactive
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {
                        (employees as any[]).filter(
                          (e: any) =>
                            e.status === "inactive" || e.status === "terminated"
                        ).length
                      }
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name, email, or employee number..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex gap-2">
                <select className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                  <option value="">All Departments</option>
                  <option value="construction">Construction</option>
                  <option value="sales">Sales</option>
                  <option value="admin">Administration</option>
                  <option value="hr">Human Resources</option>
                  <option value="finance">Finance</option>
                </select>
                <select className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="inactive">Inactive</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Employee</TableHeader>
                  <TableHeader>Department</TableHeader>
                  <TableHeader>Position</TableHeader>
                  <TableHeader>Email</TableHeader>
                  <TableHeader>Phone</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No employees
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by adding your first employee.
                      </p>
                      <div className="mt-6">
                        <Link href="/hr/employees/new">
                          <Button className="inline-flex items-center">
                            <UserPlusIcon className="h-5 w-5 mr-2" />
                            Add Employee
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  (employees as any[]).map((employee: any) => {
                    const statusColors: Record<string, string> = {
                      active: "bg-green-100 text-green-800",
                      inactive: "bg-gray-100 text-gray-800",
                      terminated: "bg-red-100 text-red-800",
                      on_leave: "bg-yellow-100 text-yellow-800",
                    };

                    return (
                      <TableRow key={employee.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-indigo-800">
                                  {employee.first_name?.[0]}
                                  {employee.last_name?.[0]}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {employee.first_name} {employee.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {employee.employee_number || "N/A"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-900">
                          {employee.department || "N/A"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-900">
                          {employee.position || "N/A"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {employee.email || "N/A"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {employee.phone || "N/A"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              statusColors[employee.status || "active"] ||
                              statusColors.active
                            }`}
                          >
                            {employee.status || "active"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          <Link
                            href={`/hr/employees/${employee.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Details
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </RoleGuard>
  );
}
