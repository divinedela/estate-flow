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
import Link from "next/link";
import {
  CalendarDaysIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface PreventiveSchedule {
  id: string;
  schedule_name: string;
  description: string | null;
  asset_id: string;
  frequency_type: string;
  frequency_value: number | null;
  next_due_date: string | null;
  last_performed_date: string | null;
  estimated_duration_minutes: number | null;
  checklist: unknown[];
  is_active: boolean;
  created_at: string;
  asset?: { name: string; asset_code: string };
}

interface Asset {
  id: string;
  name: string;
  asset_code: string;
}

interface AppUser {
  id: string;
  organization_id: string;
}

export default function PreventiveMaintenancePage() {
  const [schedules, setSchedules] = useState<PreventiveSchedule[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] =
    useState<PreventiveSchedule | null>(null);
  const [viewingSchedule, setViewingSchedule] =
    useState<PreventiveSchedule | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    schedule_name: "",
    description: "",
    asset_id: "",
    frequency_type: "monthly",
    frequency_value: "",
    next_due_date: "",
    estimated_duration_minutes: "",
    is_active: true,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const [schedulesRes, assetsRes] = await Promise.all([
      supabase
        .from("preventive_maintenance_schedules")
        .select("*, asset:assets(name, asset_code)")
        .order("next_due_date", { ascending: true }),
      supabase.from("assets").select("id, name, asset_code").order("name"),
    ]);

    setSchedules((schedulesRes.data as PreventiveSchedule[]) || []);
    setAssets((assetsRes.data as Asset[]) || []);
    setLoading(false);
  }

  function openCreateModal() {
    setEditingSchedule(null);
    setFormData({
      schedule_name: "",
      description: "",
      asset_id: "",
      frequency_type: "monthly",
      frequency_value: "",
      next_due_date: "",
      estimated_duration_minutes: "",
      is_active: true,
    });
    setIsModalOpen(true);
  }

  function openEditModal(schedule: PreventiveSchedule) {
    setEditingSchedule(schedule);
    setFormData({
      schedule_name: schedule.schedule_name,
      description: schedule.description || "",
      asset_id: schedule.asset_id,
      frequency_type: schedule.frequency_type,
      frequency_value: schedule.frequency_value?.toString() || "",
      next_due_date: schedule.next_due_date || "",
      estimated_duration_minutes:
        schedule.estimated_duration_minutes?.toString() || "",
      is_active: schedule.is_active,
    });
    setIsModalOpen(true);
  }

  function openViewModal(schedule: PreventiveSchedule) {
    setViewingSchedule(schedule);
    setIsViewModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Get user's organization_id
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: appUser } = (await supabase
      .from("app_users")
      .select("id, organization_id")
      .eq("auth_user_id", user.id)
      .single()) as { data: AppUser | null; error: unknown };

    if (!appUser) return;

    const scheduleData = {
      schedule_name: formData.schedule_name,
      description: formData.description || null,
      asset_id: formData.asset_id,
      frequency_type: formData.frequency_type,
      frequency_value: formData.frequency_value
        ? parseInt(formData.frequency_value)
        : null,
      next_due_date: formData.next_due_date || null,
      estimated_duration_minutes: formData.estimated_duration_minutes
        ? parseInt(formData.estimated_duration_minutes)
        : null,
      is_active: formData.is_active,
    };

    if (editingSchedule) {
      await supabase
        .from("preventive_maintenance_schedules")
        .update(scheduleData as never)
        .eq("id", editingSchedule.id);
    } else {
      await supabase.from("preventive_maintenance_schedules").insert({
        ...scheduleData,
        created_by: (appUser as any).id,
      } as never);
    }

    setIsModalOpen(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    await supabase
      .from("preventive_maintenance_schedules")
      .delete()
      .eq("id", id);

    setDeleteConfirmId(null);
    fetchData();
  }

  async function markCompleted(schedule: PreventiveSchedule) {
    const today = new Date();
    let nextDue = new Date(today);

    // Calculate next due date based on frequency
    switch (schedule.frequency_type) {
      case "daily":
        nextDue.setDate(nextDue.getDate() + (schedule.frequency_value || 1));
        break;
      case "weekly":
        nextDue.setDate(
          nextDue.getDate() + 7 * (schedule.frequency_value || 1)
        );
        break;
      case "monthly":
        nextDue.setMonth(nextDue.getMonth() + (schedule.frequency_value || 1));
        break;
      case "quarterly":
        nextDue.setMonth(nextDue.getMonth() + 3);
        break;
      case "yearly":
        nextDue.setFullYear(
          nextDue.getFullYear() + (schedule.frequency_value || 1)
        );
        break;
      case "custom":
        nextDue.setDate(nextDue.getDate() + (schedule.frequency_value || 30));
        break;
    }

    await supabase
      .from("preventive_maintenance_schedules")
      .update({
        last_performed_date: today.toISOString().split("T")[0],
        next_due_date: nextDue.toISOString().split("T")[0],
      } as never)
      .eq("id", schedule.id);

    fetchData();
  }

  async function toggleActive(id: string, isActive: boolean) {
    await supabase
      .from("preventive_maintenance_schedules")
      .update({ is_active: !isActive } as never)
      .eq("id", id);

    fetchData();
  }

  const today = new Date();
  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearch =
      schedule.schedule_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (schedule.asset as { name: string } | undefined)?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    if (statusFilter === "active") return matchesSearch && schedule.is_active;
    if (statusFilter === "inactive")
      return matchesSearch && !schedule.is_active;
    if (statusFilter === "overdue") {
      return (
        matchesSearch &&
        schedule.next_due_date &&
        new Date(schedule.next_due_date) < today
      );
    }
    if (statusFilter === "upcoming") {
      if (!schedule.next_due_date) return false;
      const dueDate = new Date(schedule.next_due_date);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return matchesSearch && dueDate >= today && dueDate <= weekFromNow;
    }
    return matchesSearch;
  });

  const frequencyTypes = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
    { value: "custom", label: "Custom (days)" },
  ];

  const stats = {
    total: schedules.length,
    active: schedules.filter((s) => s.is_active).length,
    overdue: schedules.filter(
      (s) => s.next_due_date && new Date(s.next_due_date) < today && s.is_active
    ).length,
    upcoming: schedules.filter((s) => {
      if (!s.next_due_date || !s.is_active) return false;
      const dueDate = new Date(s.next_due_date);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return dueDate >= today && dueDate <= weekFromNow;
    }).length,
    completedThisMonth: schedules.filter((s) => {
      if (!s.last_performed_date) return false;
      const lastPerformed = new Date(s.last_performed_date);
      return (
        lastPerformed.getMonth() === today.getMonth() &&
        lastPerformed.getFullYear() === today.getFullYear()
      );
    }).length,
  };

  return (
    <RoleGuard allowedRoles={["super_admin", "facility_manager"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/facilities">
              <Button variant="secondary" size="sm">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Preventive Maintenance
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage scheduled maintenance tasks
              </p>
            </div>
          </div>
          <Button onClick={openCreateModal}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Schedule
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <div className="text-center p-4">
              <CalendarDaysIcon className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.total}
              </p>
              <p className="text-sm text-gray-500">Total Schedules</p>
            </div>
          </Card>
          <Card>
            <div className="text-center p-4">
              <p className="text-2xl font-bold text-green-600">
                {stats.active}
              </p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </Card>
          <Card>
            <div className="text-center p-4">
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              <p className="text-sm text-gray-500">Overdue</p>
            </div>
          </Card>
          <Card>
            <div className="text-center p-4">
              <p className="text-2xl font-bold text-yellow-600">
                {stats.upcoming}
              </p>
              <p className="text-sm text-gray-500">Due This Week</p>
            </div>
          </Card>
          <Card>
            <div className="text-center p-4">
              <p className="text-2xl font-bold text-blue-600">
                {stats.completedThisMonth}
              </p>
              <p className="text-sm text-gray-500">Completed This Month</p>
            </div>
          </Card>
        </div>

        {/* Alerts */}
        {stats.overdue > 0 && (
          <Card className="border-l-4 border-l-red-500 bg-red-50">
            <div className="flex items-center p-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-4" />
              <div>
                <h3 className="font-semibold text-red-800">
                  Overdue Maintenance
                </h3>
                <p className="text-sm text-red-600">
                  {stats.overdue} schedule(s) are overdue and require immediate
                  attention
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search schedules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Schedules</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="overdue">Overdue</option>
              <option value="upcoming">Due This Week</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading schedules...</p>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No schedules found
              </h3>
              <p className="mt-2 text-gray-500">
                Create a preventive maintenance schedule to get started.
              </p>
              <Button onClick={openCreateModal} className="mt-4">
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Schedule
              </Button>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Schedule</TableHeader>
                  <TableHeader>Asset</TableHeader>
                  <TableHeader>Frequency</TableHeader>
                  <TableHeader>Last Performed</TableHeader>
                  <TableHeader>Next Due</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSchedules.map((schedule) => {
                  const isOverdue =
                    schedule.next_due_date &&
                    new Date(schedule.next_due_date) < today;
                  const isDueSoon =
                    schedule.next_due_date &&
                    !isOverdue &&
                    (() => {
                      const dueDate = new Date(schedule.next_due_date);
                      const weekFromNow = new Date(today);
                      weekFromNow.setDate(weekFromNow.getDate() + 7);
                      return dueDate <= weekFromNow;
                    })();

                  return (
                    <TableRow
                      key={schedule.id}
                      className={!schedule.is_active ? "opacity-50" : ""}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {schedule.schedule_name}
                          </p>
                          {schedule.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {schedule.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {(schedule.asset as { name: string } | undefined)
                          ?.name || "-"}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 text-xs font-medium rounded bg-indigo-100 text-indigo-800">
                          {schedule.frequency_type}
                          {schedule.frequency_value &&
                            schedule.frequency_type === "custom" &&
                            ` (${schedule.frequency_value} days)`}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {schedule.last_performed_date
                          ? new Date(
                              schedule.last_performed_date
                            ).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        {schedule.next_due_date ? (
                          <div className="flex items-center">
                            {isOverdue && (
                              <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                            )}
                            {isDueSoon && !isOverdue && (
                              <ClockIcon className="h-4 w-4 text-yellow-500 mr-1" />
                            )}
                            <span
                              className={`text-sm ${
                                isOverdue
                                  ? "text-red-600 font-medium"
                                  : isDueSoon
                                  ? "text-yellow-600"
                                  : "text-gray-600"
                              }`}
                            >
                              {new Date(
                                schedule.next_due_date
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() =>
                            toggleActive(schedule.id, schedule.is_active)
                          }
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            schedule.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {schedule.is_active ? "Active" : "Inactive"}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openViewModal(schedule)}
                            className="text-gray-600 hover:text-gray-900"
                            title="View"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openEditModal(schedule)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          {schedule.is_active && (
                            <button
                              onClick={() => markCompleted(schedule)}
                              className="text-green-600 hover:text-green-900"
                              title="Mark Completed"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteConfirmId(schedule.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSchedule ? "Edit Schedule" : "Add Maintenance Schedule"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Schedule Name"
            value={formData.schedule_name}
            onChange={(e) =>
              setFormData({ ...formData, schedule_name: e.target.value })
            }
            placeholder="e.g., HVAC Filter Replacement"
            required
          />
          <FormTextarea
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Description of maintenance tasks..."
            rows={2}
          />
          <FormSelect
            label="Asset"
            value={formData.asset_id}
            onChange={(e) =>
              setFormData({ ...formData, asset_id: e.target.value })
            }
            required
          >
            <option value="">Select Asset</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.asset_code})
              </option>
            ))}
          </FormSelect>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Frequency"
              value={formData.frequency_type}
              onChange={(e) =>
                setFormData({ ...formData, frequency_type: e.target.value })
              }
            >
              {frequencyTypes.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </FormSelect>
            {formData.frequency_type === "custom" && (
              <FormInput
                label="Interval (days)"
                type="number"
                value={formData.frequency_value}
                onChange={(e) =>
                  setFormData({ ...formData, frequency_value: e.target.value })
                }
                placeholder="e.g., 30"
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Next Due Date"
              type="date"
              value={formData.next_due_date}
              onChange={(e) =>
                setFormData({ ...formData, next_due_date: e.target.value })
              }
            />
            <FormInput
              label="Est. Duration (minutes)"
              type="number"
              value={formData.estimated_duration_minutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  estimated_duration_minutes: e.target.value,
                })
              }
              placeholder="e.g., 60"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="is_active"
              className="ml-2 block text-sm text-gray-900"
            >
              Schedule is active
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingSchedule ? "Update Schedule" : "Create Schedule"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Schedule Details"
        size="lg"
      >
        {viewingSchedule && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {viewingSchedule.schedule_name}
                </h3>
                <p className="text-gray-500">
                  {(viewingSchedule.asset as { name: string } | undefined)
                    ?.name || "No asset"}
                </p>
              </div>
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  viewingSchedule.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {viewingSchedule.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            {viewingSchedule.description && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-gray-700">{viewingSchedule.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Frequency</p>
                <p className="font-medium">
                  {viewingSchedule.frequency_type}
                  {viewingSchedule.frequency_value &&
                    viewingSchedule.frequency_type === "custom" &&
                    ` (${viewingSchedule.frequency_value} days)`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Est. Duration</p>
                <p className="font-medium">
                  {viewingSchedule.estimated_duration_minutes
                    ? `${viewingSchedule.estimated_duration_minutes} minutes`
                    : "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Performed</p>
                <p className="font-medium">
                  {viewingSchedule.last_performed_date
                    ? new Date(
                        viewingSchedule.last_performed_date
                      ).toLocaleDateString()
                    : "Never"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Next Due</p>
                <p
                  className={`font-medium ${
                    viewingSchedule.next_due_date &&
                    new Date(viewingSchedule.next_due_date) < today
                      ? "text-red-600"
                      : ""
                  }`}
                >
                  {viewingSchedule.next_due_date
                    ? new Date(
                        viewingSchedule.next_due_date
                      ).toLocaleDateString()
                    : "Not scheduled"}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </Button>
              {viewingSchedule.is_active && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    markCompleted(viewingSchedule);
                    setIsViewModalOpen(false);
                  }}
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Mark Completed
                </Button>
              )}
              <Button
                onClick={() => {
                  setIsViewModalOpen(false);
                  openEditModal(viewingSchedule);
                }}
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Schedule"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this maintenance schedule? This
            action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete Schedule
            </Button>
          </div>
        </div>
      </Modal>
    </RoleGuard>
  );
}
