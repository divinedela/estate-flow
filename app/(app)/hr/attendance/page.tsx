"use client";

import { useState, useEffect } from "react";
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
import { Modal } from "@/components/ui/modal";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { FormTextarea } from "@/components/ui/form-textarea";
import { createClient } from "@/lib/supabase/client";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface AttendanceLog {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_number: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  hours_worked: number | null;
  status: string;
  notes: string | null;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
}

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceLog[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceLog | null>(
    null
  );
  const [userRole, setUserRole] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    employee_id: "",
    date: "",
    check_in_time: "",
    check_out_time: "",
    status: "present",
    notes: "",
  });

  const supabase = createClient();

  useEffect(() => {
    fetchUserRole();
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  async function fetchUserRole() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: appUser } = await supabase
      .from("app_users")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!appUser) return;

    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role:roles(name)")
      .eq("user_id", (appUser as any).id);

    const roles =
      userRoles?.map((ur: any) => ur.role?.name).filter(Boolean) || [];

    if (roles.includes("super_admin")) setUserRole("super_admin");
    else if (roles.includes("executive")) setUserRole("executive");
    else if (roles.includes("hr_manager")) setUserRole("hr_manager");
  }

  async function fetchEmployees() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from("app_users")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    const profile = profileData as { organization_id: string } | null;
    if (!(profile as any)?.organization_id) return;

    const { data } = await (supabase.from("employees") as any)
      .select("id, first_name, last_name, employee_number")
      .eq("organization_id", (profile as any).organization_id)
      .eq("status", "active")
      .order("first_name");

    setEmployees(data || []);
  }

  async function fetchAttendance() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from("app_users")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    const profile = profileData as { organization_id: string } | null;
    if (!(profile as any)?.organization_id) {
      setLoading(false);
      return;
    }

    const { data } = await (supabase.from("attendance_logs") as any)
      .select(
        `
        *,
        employee:employees(first_name, last_name, employee_number, organization_id)
      `
      )
      .eq("date", selectedDate)
      .order("created_at", { ascending: false });

    interface AttendanceRaw {
      id: string;
      employee_id: string;
      date: string;
      check_in_time: string | null;
      check_out_time: string | null;
      hours_worked: number | null;
      status: string;
      notes: string | null;
      employee: {
        first_name: string;
        last_name: string;
        employee_number: string;
        organization_id: string;
      } | null;
    }

    const rawData = data as AttendanceRaw[] | null;
    const filteredData = (rawData || [])
      .filter(
        (a) => a.employee?.organization_id === (profile as any).organization_id
      )
      .map((a) => ({
        id: a.id,
        employee_id: a.employee_id,
        employee_name: `${a.employee?.first_name} ${a.employee?.last_name}`,
        employee_number: a.employee?.employee_number || "",
        date: a.date,
        check_in_time: a.check_in_time,
        check_out_time: a.check_out_time,
        hours_worked: a.hours_worked,
        status: a.status,
        notes: a.notes,
      }));

    setAttendance(filteredData);
    setLoading(false);
  }

  function openCreateModal() {
    setEditingRecord(null);
    setFormData({
      employee_id: "",
      date: selectedDate,
      check_in_time: "",
      check_out_time: "",
      status: "present",
      notes: "",
    });
    setIsModalOpen(true);
  }

  function openEditModal(record: AttendanceLog) {
    setEditingRecord(record);
    setFormData({
      employee_id: record.employee_id,
      date: record.date,
      check_in_time: record.check_in_time
        ? record.check_in_time.substring(11, 16)
        : "",
      check_out_time: record.check_out_time
        ? record.check_out_time.substring(11, 16)
        : "",
      status: record.status,
      notes: record.notes || "",
    });
    setIsModalOpen(true);
  }

  function calculateHours(checkIn: string, checkOut: string): number | null {
    if (!checkIn || !checkOut) return null;
    const start = new Date(`2000-01-01T${checkIn}`);
    const end = new Date(`2000-01-01T${checkOut}`);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.round(diff * 100) / 100;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: appUserData } = await supabase
      .from("app_users")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const appUser = appUserData as { id: string } | null;

    const hours = calculateHours(
      formData.check_in_time,
      formData.check_out_time
    );

    const attendanceData = {
      employee_id: formData.employee_id,
      date: formData.date,
      check_in_time: formData.check_in_time
        ? `${formData.date}T${formData.check_in_time}:00`
        : null,
      check_out_time: formData.check_out_time
        ? `${formData.date}T${formData.check_out_time}:00`
        : null,
      hours_worked: hours,
      status: formData.status,
      notes: formData.notes || null,
      created_by: (appUser as any)?.id,
    };

    if (editingRecord) {
      const { error } = await (supabase.from("attendance_logs") as any)
        .update(attendanceData)
        .eq("id", editingRecord.id);

      if (error) {
        alert("Error updating attendance: " + error.message);
        return;
      }
    } else {
      const { error } = await (supabase.from("attendance_logs") as any).insert(
        attendanceData
      );

      if (error) {
        alert("Error creating attendance: " + error.message);
        return;
      }
    }

    setIsModalOpen(false);
    fetchAttendance();
  }

  async function handleDelete(record: AttendanceLog) {
    if (
      !confirm(
        `Are you sure you want to delete this attendance record for ${record.employee_name}?`
      )
    ) {
      return;
    }

    const { error } = await (supabase.from("attendance_logs") as any)
      .delete()
      .eq("id", record.id);

    if (error) {
      alert("Error deleting attendance: " + error.message);
      return;
    }

    fetchAttendance();
  }

  const statusColors: Record<string, string> = {
    present: "bg-green-100 text-green-800",
    absent: "bg-red-100 text-red-800",
    late: "bg-yellow-100 text-yellow-800",
    half_day: "bg-orange-100 text-orange-800",
    on_leave: "bg-blue-100 text-blue-800",
  };

  const statusOptions = [
    { value: "present", label: "Present" },
    { value: "absent", label: "Absent" },
    { value: "late", label: "Late" },
    { value: "half_day", label: "Half Day" },
    { value: "on_leave", label: "On Leave" },
  ];

  // Calculate stats
  const stats = {
    total: attendance.length,
    present: attendance.filter((a) => a.status === "present").length,
    absent: attendance.filter((a) => a.status === "absent").length,
    late: attendance.filter((a) => a.status === "late").length,
  };

  const showBackButton = userRole === "super_admin" || userRole === "executive";

  return (
    <RoleGuard allowedRoles={["super_admin", "hr_manager", "project_manager"]}>
      <div className="space-y-6">
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
                  <span className="text-sm text-gray-500">Attendance</span>
                </div>
              )}
              <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
              <p className="mt-1 text-sm text-gray-500">
                Track employee attendance and working hours
              </p>
            </div>
          </div>
          <Button onClick={openCreateModal}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Attendance
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100">
                <UserGroupIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Records
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.total}
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
                <p className="text-sm font-medium text-gray-500">Present</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.present}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <XCircleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Absent</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.absent}
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
                <p className="text-sm font-medium text-gray-500">Late</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.late}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                Select Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="text-sm text-gray-500">
              Showing {attendance.length} record(s) for{" "}
              {new Date(selectedDate).toLocaleDateString()}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading attendance...</p>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Employee</TableHeader>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Check In</TableHeader>
                  <TableHeader>Check Out</TableHeader>
                  <TableHeader>Hours</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendance.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-gray-500 py-8"
                    >
                      No attendance records found for this date.
                      <button
                        onClick={openCreateModal}
                        className="ml-2 text-indigo-600 hover:text-indigo-500"
                      >
                        Add attendance record
                      </button>
                    </TableCell>
                  </TableRow>
                ) : (
                  attendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{record.employee_name}</p>
                          <p className="text-sm text-gray-500">
                            {record.employee_number}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(record.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {record.check_in_time
                          ? new Date(record.check_in_time).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {record.check_out_time
                          ? new Date(record.check_out_time).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {record.hours_worked ? `${record.hours_worked}h` : "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            statusColors[record.status] ||
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {record.status.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(record)}
                            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(record)}
                            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecord ? "Edit Attendance" : "Add Attendance"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormSelect
            label="Employee"
            value={formData.employee_id}
            onChange={(e) =>
              setFormData({ ...formData, employee_id: e.target.value })
            }
            required
            disabled={!!editingRecord}
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.first_name} {emp.last_name} ({emp.employee_number})
              </option>
            ))}
          </FormSelect>

          <FormInput
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
            disabled={!!editingRecord}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Check In Time"
              type="time"
              value={formData.check_in_time}
              onChange={(e) =>
                setFormData({ ...formData, check_in_time: e.target.value })
              }
            />
            <FormInput
              label="Check Out Time"
              type="time"
              value={formData.check_out_time}
              onChange={(e) =>
                setFormData({ ...formData, check_out_time: e.target.value })
              }
            />
          </div>

          {formData.check_in_time && formData.check_out_time && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Hours worked:{" "}
                <strong>
                  {calculateHours(
                    formData.check_in_time,
                    formData.check_out_time
                  )}
                  h
                </strong>
              </p>
            </div>
          )}

          <FormSelect
            label="Status"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            required
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FormSelect>

          <FormTextarea
            label="Notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Optional notes..."
            rows={2}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">{editingRecord ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </RoleGuard>
  );
}
