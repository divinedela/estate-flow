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
  CurrencyDollarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FolderIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

interface Expense {
  id: string;
  project_id: string;
  project_name: string;
  project_code: string;
  category_name: string;
  category_color: string;
  expense_date: string;
  description: string;
  amount: number;
  vendor: string | null;
  invoice_number: string | null;
  payment_status: string;
  payment_date: string | null;
}

async function getExpenses() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("app_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!(profile as any)?.organization_id) return [];

  // Fetch expenses with project and category details
  const { data: expenses } = await supabase
    .from("project_expenses")
    .select(
      `
      id,
      expense_date,
      description,
      amount,
      vendor,
      invoice_number,
      payment_status,
      payment_date,
      project:projects(id, name, project_code),
      category:expense_categories(name, color)
    `
    )
    .eq("projects.organization_id", (profile as any).organization_id)
    .order("expense_date", { ascending: false });

  return (expenses || []).map((expense: any) => ({
    id: expense.id,
    project_id: expense.project?.id || "",
    project_name: expense.project?.name || "Unknown",
    project_code: expense.project?.project_code || "N/A",
    category_name: expense.category?.name || "Uncategorized",
    category_color: expense.category?.color || "#6B7280",
    expense_date: expense.expense_date,
    description: expense.description,
    amount: Number(expense.amount),
    vendor: expense.vendor,
    invoice_number: expense.invoice_number,
    payment_status: expense.payment_status,
    payment_date: expense.payment_date,
  })) as Expense[];
}

export default async function ExpensesListPage() {
  const expenses = await getExpenses();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    overdue: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
  };

  const statusIcons: Record<string, any> = {
    pending: ClockIcon,
    paid: CheckCircleIcon,
    overdue: XCircleIcon,
    cancelled: XCircleIcon,
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const paidExpenses = expenses
    .filter((e) => e.payment_status === "paid")
    .reduce((sum, exp) => sum + exp.amount, 0);
  const pendingExpenses = expenses
    .filter((e) => e.payment_status === "pending")
    .reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <RoleGuard
      allowedRoles={[
        "super_admin",
        "project_manager",
        "site_engineer",
        "executive",
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Expenses</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage all project expenses
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/projects/budget">
              <Button variant="secondary">Back to Budget</Button>
            </Link>
            <Link href="/projects/budget/expenses/new">
              <Button>
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Expense
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Expenses
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Paid</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(paidExpenses)}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(pendingExpenses)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Expenses Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Project</TableHeader>
                  <TableHeader>Category</TableHeader>
                  <TableHeader>Description</TableHeader>
                  <TableHeader>Vendor</TableHeader>
                  <TableHeader>Amount</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No expenses
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by adding your first expense.
                      </p>
                      <div className="mt-6">
                        <Link href="/projects/budget/expenses/new">
                          <Button className="inline-flex items-center">
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Add Expense
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => {
                    const StatusIcon =
                      statusIcons[expense.payment_status] || ClockIcon;
                    return (
                      <TableRow key={expense.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-900">
                            <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {new Date(
                              expense.expense_date
                            ).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <FolderIcon className="h-4 w-4 mr-1 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {expense.project_code}
                              </p>
                              <p className="text-xs text-gray-500">
                                {expense.project_name}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-white"
                            style={{ backgroundColor: expense.category_color }}
                          >
                            {expense.category_name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-900 max-w-xs truncate">
                            {expense.description}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-500">
                            {expense.vendor || "-"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(expense.amount)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              statusColors[expense.payment_status] ||
                              statusColors.pending
                            }`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {expense.payment_status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/projects/budget/expenses/${expense.id}/edit`}
                              className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                          </div>
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
