"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { FormTextarea } from "@/components/ui/form-textarea";
import { RoleGuard } from "@/components/auth/role-guard";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

interface LeaveType {
  id: string;
  name: string;
  code: string;
  max_days_per_year: number | null;
  is_paid: boolean;
  requires_approval: boolean;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
}

interface LeaveBalance {
  leave_type_id: string;
  allocated_days: number;
  used_days: number;
  pending_days: number;
  available: number;
}

export default function RequestLeavePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [selectedBalance, setSelectedBalance] = useState<LeaveBalance | null>(
    null
  );
  const [daysRequested, setDaysRequested] = useState<number>(0);
  const [formData, setFormData] = useState({
    employee_id: "",
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Calculate days when dates change
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setDaysRequested(diffDays);
      } else {
        setDaysRequested(0);
      }
    } else {
      setDaysRequested(0);
    }
  }, [formData.start_date, formData.end_date]);

  useEffect(() => {
    // Update selected balance when employee or leave type changes
    if (formData.employee_id && formData.leave_type_id) {
      fetchLeaveBalance(formData.employee_id, formData.leave_type_id);
    } else {
      setSelectedBalance(null);
    }
  }, [formData.employee_id, formData.leave_type_id]);

  async function fetchData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // Get user's organization
    const { data: profileData } = await supabase
      .from("app_users")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    const profile = profileData as { organization_id: string } | null;
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    // Fetch leave types
    const { data: leaveTypesData } = await (supabase.from("leave_types") as any)
      .select("*")
      .eq("organization_id", profile.organization_id)
      .eq("is_active", true)
      .order("name");

    // Fetch employees
    const { data: employeesData } = await (supabase.from("employees") as any)
      .select("id, first_name, last_name, employee_number")
      .eq("organization_id", profile.organization_id)
      .eq("status", "active")
      .order("first_name");

    setLeaveTypes(leaveTypesData || []);
    setEmployees(employeesData || []);
    setLoading(false);
  }

  async function fetchLeaveBalance(employeeId: string, leaveTypeId: string) {
    const currentYear = new Date().getFullYear();

    const { data: balanceData } = await (supabase.from("leave_balances") as any)
      .select("*")
      .eq("employee_id", employeeId)
      .eq("leave_type_id", leaveTypeId)
      .eq("year", currentYear)
      .single();

    interface BalanceRecord {
      leave_type_id: string;
      allocated_days: number;
      carried_forward_days: number;
      used_days: number;
      pending_days: number;
    }
    const data = balanceData as BalanceRecord | null;

    if (data) {
      const available =
        (data.allocated_days || 0) +
        (data.carried_forward_days || 0) -
        (data.used_days || 0) -
        (data.pending_days || 0);
      setSelectedBalance({
        leave_type_id: data.leave_type_id,
        allocated_days: data.allocated_days || 0,
        used_days: data.used_days || 0,
        pending_days: data.pending_days || 0,
        available: available,
      });
    } else {
      // No balance record - check leave type for max days
      const leaveType = leaveTypes.find((lt) => lt.id === leaveTypeId);
      setSelectedBalance({
        leave_type_id: leaveTypeId,
        allocated_days: leaveType?.max_days_per_year || 0,
        used_days: 0,
        pending_days: 0,
        available: leaveType?.max_days_per_year || 0,
      });
    }
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.employee_id) {
      newErrors.employee_id = "Please select an employee";
    }
    if (!formData.leave_type_id) {
      newErrors.leave_type_id = "Please select a leave type";
    }
    if (!formData.start_date) {
      newErrors.start_date = "Please select a start date";
    }
    if (!formData.end_date) {
      newErrors.end_date = "Please select an end date";
    }
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end < start) {
        newErrors.end_date = "End date cannot be before start date";
      }
    }
    if (selectedBalance && daysRequested > selectedBalance.available) {
      newErrors.days = `Insufficient leave balance. Available: ${selectedBalance.available} days`;
    }
    if (!formData.reason.trim()) {
      newErrors.reason = "Please provide a reason for the leave request";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get the app_users.id (not auth.uid) for created_by foreign key
    const { data: appUserData } = await supabase
      .from("app_users")
      .select("id")
      .eq("user_id", user?.id || "")
      .single();

    const appUser = appUserData as { id: string } | null;

    const { error } = await (supabase.from("leave_requests") as any).insert({
      employee_id: formData.employee_id,
      leave_type_id: formData.leave_type_id,
      start_date: formData.start_date,
      end_date: formData.end_date,
      days_requested: daysRequested,
      reason: formData.reason,
      status: "pending",
      created_by: (appUser as any)?.id,
    });

    if (error) {
      setSubmitting(false);
      alert("Error submitting leave request: " + error.message);
      return;
    }

    // Update pending days in leave balance
    if (selectedBalance) {
      const currentYear = new Date().getFullYear();
      await (supabase.from("leave_balances") as any).upsert(
        {
          employee_id: formData.employee_id,
          leave_type_id: formData.leave_type_id,
          year: currentYear,
          allocated_days: selectedBalance.allocated_days,
          used_days: selectedBalance.used_days,
          pending_days: selectedBalance.pending_days + daysRequested,
        },
        {
          onConflict: "employee_id,leave_type_id,year",
        }
      );
    }

    router.push("/hr/leave");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const selectedLeaveType = leaveTypes.find(
    (lt) => lt.id === formData.leave_type_id
  );

  return (
    <RoleGuard allowedRoles={["super_admin", "hr_manager", "employee"]}>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/hr/leave" className="text-gray-500 hover:text-gray-700">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Request Leave</h1>
            <p className="text-sm text-gray-500">Submit a new leave request</p>
          </div>
        </div>

        {/* Warning if no leave types */}
        {leaveTypes.length === 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  No Leave Types Configured
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  You need to set up leave types before you can submit leave
                  requests.
                </p>
                <Link href="/hr/leave/types" className="mt-3 inline-block">
                  <Button size="sm">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Configure Leave Types
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Warning if no employees */}
        {employees.length === 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  No Active Employees
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  You need to add employees before you can submit leave
                  requests.
                </p>
                <Link href="/hr/employees/new" className="mt-3 inline-block">
                  <Button size="sm">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Employee
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee Selection */}
          <Card title="Employee Information">
            <FormSelect
              label="Employee"
              value={formData.employee_id}
              onChange={(e) =>
                setFormData({ ...formData, employee_id: e.target.value })
              }
              error={errors.employee_id}
              required
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_number})
                </option>
              ))}
            </FormSelect>
          </Card>

          {/* Leave Type Selection */}
          <Card title="Leave Details">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Leave Type <span className="text-red-500">*</span>
                  </label>
                  <Link
                    href="/hr/leave/types"
                    className="text-xs text-indigo-600 hover:text-indigo-500"
                  >
                    Manage Leave Types
                  </Link>
                </div>
                <FormSelect
                  value={formData.leave_type_id}
                  onChange={(e) =>
                    setFormData({ ...formData, leave_type_id: e.target.value })
                  }
                  error={errors.leave_type_id}
                  required
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} {type.is_paid ? "(Paid)" : "(Unpaid)"}
                    </option>
                  ))}
                </FormSelect>
              </div>

              {/* Leave Balance Info */}
              {selectedBalance && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Leave Balance
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-blue-600">Allocated</p>
                      <p className="font-semibold text-blue-900">
                        {selectedBalance.allocated_days} days
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-600">Used</p>
                      <p className="font-semibold text-blue-900">
                        {selectedBalance.used_days} days
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-600">Available</p>
                      <p className="font-semibold text-blue-900">
                        {selectedBalance.available} days
                      </p>
                    </div>
                  </div>
                  {selectedBalance.pending_days > 0 && (
                    <p className="mt-2 text-xs text-blue-700">
                      Note: {selectedBalance.pending_days} day(s) pending
                      approval
                    </p>
                  )}
                </div>
              )}

              {/* Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Start Date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  error={errors.start_date}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
                <FormInput
                  label="End Date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  error={errors.end_date}
                  min={
                    formData.start_date ||
                    new Date().toISOString().split("T")[0]
                  }
                  required
                />
              </div>

              {/* Days Calculation */}
              {daysRequested > 0 && (
                <div
                  className={`flex items-center space-x-2 p-3 rounded-lg ${
                    selectedBalance && daysRequested > selectedBalance.available
                      ? "bg-red-50 border border-red-200"
                      : "bg-green-50 border border-green-200"
                  }`}
                >
                  <ClockIcon
                    className={`h-5 w-5 ${
                      selectedBalance &&
                      daysRequested > selectedBalance.available
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      selectedBalance &&
                      daysRequested > selectedBalance.available
                        ? "text-red-700"
                        : "text-green-700"
                    }`}
                  >
                    {daysRequested} day(s) requested
                    {selectedBalance &&
                      daysRequested > selectedBalance.available && (
                        <span className="block text-xs mt-1">
                          Exceeds available balance by{" "}
                          {daysRequested - selectedBalance.available} day(s)
                        </span>
                      )}
                  </span>
                </div>
              )}
              {errors.days && (
                <p className="text-sm text-red-600">{errors.days}</p>
              )}
            </div>
          </Card>

          {/* Reason */}
          <Card title="Reason for Leave">
            <FormTextarea
              label="Reason"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              error={errors.reason}
              placeholder="Please provide a reason for your leave request..."
              rows={4}
              required
            />
          </Card>

          {/* Leave Type Info */}
          {selectedLeaveType && (
            <Card title="Leave Type Information">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="font-medium">{selectedLeaveType.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Paid Leave</p>
                  <p className="font-medium">
                    {selectedLeaveType.is_paid ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Requires Approval</p>
                  <p className="font-medium">
                    {selectedLeaveType.requires_approval ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Max Days/Year</p>
                  <p className="font-medium">
                    {selectedLeaveType.max_days_per_year || "Unlimited"}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link href="/hr/leave">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={
                submitting ||
                (selectedBalance !== null &&
                  daysRequested > selectedBalance.available)
              }
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}
