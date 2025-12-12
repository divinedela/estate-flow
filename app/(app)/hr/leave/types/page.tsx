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
import { FormTextarea } from "@/components/ui/form-textarea";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface LeaveType {
  id: string;
  name: string;
  code: string;
  description: string | null;
  max_days_per_year: number | null;
  is_paid: boolean;
  requires_approval: boolean;
  carry_forward: boolean;
  is_active: boolean;
  created_at: string;
}

export default function LeaveTypesPage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    max_days_per_year: "",
    is_paid: true,
    requires_approval: true,
    carry_forward: false,
    is_active: true,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  async function fetchLeaveTypes() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("app_users")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!(profile as any)?.organization_id) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("leave_types")
      .select("*")
      .eq("organization_id", (profile as any).organization_id)
      .order("name");

    setLeaveTypes(data || []);
    setLoading(false);
  }

  function openCreateModal() {
    setEditingType(null);
    setFormData({
      name: "",
      code: "",
      description: "",
      max_days_per_year: "",
      is_paid: true,
      requires_approval: true,
      carry_forward: false,
      is_active: true,
    });
    setIsModalOpen(true);
  }

  function openEditModal(leaveType: LeaveType) {
    setEditingType(leaveType);
    setFormData({
      name: leaveType.name,
      code: leaveType.code,
      description: leaveType.description || "",
      max_days_per_year: leaveType.max_days_per_year?.toString() || "",
      is_paid: leaveType.is_paid,
      requires_approval: leaveType.requires_approval,
      carry_forward: leaveType.carry_forward,
      is_active: leaveType.is_active,
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("app_users")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!(profile as any)?.organization_id) return;

    const leaveTypeData = {
      name: formData.name,
      code: formData.code.toUpperCase(),
      description: formData.description || null,
      max_days_per_year: formData.max_days_per_year
        ? parseInt(formData.max_days_per_year)
        : null,
      is_paid: formData.is_paid,
      requires_approval: formData.requires_approval,
      carry_forward: formData.carry_forward,
      is_active: formData.is_active,
      organization_id: (profile as any).organization_id,
    };

    if (editingType) {
      await (supabase.from("leave_types") as any)
        .update(leaveTypeData)
        .eq("id", editingType.id);
    } else {
      await (supabase.from("leave_types") as any).insert(leaveTypeData);
    }

    setIsModalOpen(false);
    fetchLeaveTypes();
  }

  async function handleDelete(leaveType: LeaveType) {
    if (
      confirm(
        `Are you sure you want to delete "${leaveType.name}"? This cannot be undone.`
      )
    ) {
      await supabase.from("leave_types").delete().eq("id", leaveType.id);

      fetchLeaveTypes();
    }
  }

  async function toggleActive(leaveType: LeaveType) {
    await (supabase.from("leave_types") as any)
      .update({ is_active: !leaveType.is_active })
      .eq("id", leaveType.id);

    fetchLeaveTypes();
  }

  return (
    <RoleGuard allowedRoles={["super_admin", "hr_manager"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/hr/leave"
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leave Types</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage leave types and policies
              </p>
            </div>
          </div>
          <Button onClick={openCreateModal}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Leave Type
          </Button>
        </div>

        <Card>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading leave types...</p>
            </div>
          ) : leaveTypes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                No leave types configured yet.
              </p>
              <Button onClick={openCreateModal}>
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Your First Leave Type
              </Button>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Code</TableHeader>
                  <TableHeader>Max Days/Year</TableHeader>
                  <TableHeader>Paid</TableHeader>
                  <TableHeader>Approval</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaveTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{type.name}</p>
                        {type.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                            {type.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                        {type.code}
                      </span>
                    </TableCell>
                    <TableCell>
                      {type.max_days_per_year || "Unlimited"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          type.is_paid
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {type.is_paid ? "Yes" : "No"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          type.requires_approval
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {type.requires_approval ? "Required" : "Not Required"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          type.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {type.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(type)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => toggleActive(type)}
                          className={
                            type.is_active
                              ? "text-yellow-600 hover:text-yellow-900"
                              : "text-green-600 hover:text-green-900"
                          }
                        >
                          {type.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDelete(type)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Common Leave Types Info */}
        <Card title="Common Leave Types">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-900">Annual Leave</p>
              <p className="text-blue-700 mt-1">
                Paid time off for vacation and personal time
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="font-medium text-green-900">Sick Leave</p>
              <p className="text-green-700 mt-1">
                Time off for illness or medical appointments
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="font-medium text-purple-900">
                Maternity/Paternity Leave
              </p>
              <p className="text-purple-700 mt-1">Leave for new parents</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="font-medium text-yellow-900">Compassionate Leave</p>
              <p className="text-yellow-700 mt-1">
                Leave for family emergencies or bereavement
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">Unpaid Leave</p>
              <p className="text-gray-700 mt-1">Extended leave without pay</p>
            </div>
            <div className="p-4 bg-pink-50 rounded-lg">
              <p className="font-medium text-pink-900">Study Leave</p>
              <p className="text-pink-700 mt-1">
                Time off for education and training
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingType ? "Edit Leave Type" : "Add Leave Type"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Leave Type Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Annual Leave"
              required
            />
            <FormInput
              label="Code"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              placeholder="e.g., AL"
              maxLength={10}
              required
            />
          </div>
          <FormTextarea
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe this leave type..."
            rows={2}
          />
          <FormInput
            label="Max Days Per Year"
            type="number"
            min="0"
            value={formData.max_days_per_year}
            onChange={(e) =>
              setFormData({ ...formData, max_days_per_year: e.target.value })
            }
            placeholder="Leave empty for unlimited"
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_paid"
                checked={formData.is_paid}
                onChange={(e) =>
                  setFormData({ ...formData, is_paid: e.target.checked })
                }
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_paid" className="text-sm text-gray-700">
                Paid Leave
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requires_approval"
                checked={formData.requires_approval}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requires_approval: e.target.checked,
                  })
                }
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="requires_approval"
                className="text-sm text-gray-700"
              >
                Requires Approval
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="carry_forward"
                checked={formData.carry_forward}
                onChange={(e) =>
                  setFormData({ ...formData, carry_forward: e.target.checked })
                }
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="carry_forward" className="text-sm text-gray-700">
                Allow Carry Forward
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
                Active
              </label>
            </div>
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
              {editingType ? "Update Leave Type" : "Create Leave Type"}
            </Button>
          </div>
        </form>
      </Modal>
    </RoleGuard>
  );
}
