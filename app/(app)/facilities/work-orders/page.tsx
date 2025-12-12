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
  ClipboardDocumentListIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

interface WorkOrder {
  id: string;
  work_order_number: string;
  title: string;
  description: string | null;
  request_id: string | null;
  assigned_to: string | null;
  vendor_id: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  started_at: string | null;
  completed_at: string | null;
  labor_cost: number | null;
  material_cost: number | null;
  total_cost: number | null;
  status: string;
  completion_notes: string | null;
  created_at: string;
  maintenance_request?: { title: string; request_number: string };
}

interface MaintenanceRequest {
  id: string;
  request_number: string;
  title: string;
}

interface AppUser {
  id: string;
  organization_id: string;
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<
    MaintenanceRequest[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<WorkOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    request_id: "",
    scheduled_date: "",
    scheduled_time: "",
    labor_cost: "",
    material_cost: "",
    status: "scheduled",
  });

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const [workOrdersRes, requestsRes] = await Promise.all([
      supabase
        .from("maintenance_work_orders")
        .select(
          "*, maintenance_request:maintenance_requests(title, request_number)"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("maintenance_requests")
        .select("id, request_number, title")
        .in("status", ["open", "assigned", "in_progress"])
        .order("created_at", { ascending: false }),
    ]);

    setWorkOrders((workOrdersRes.data as WorkOrder[]) || []);
    setMaintenanceRequests((requestsRes.data as MaintenanceRequest[]) || []);
    setLoading(false);
  }

  function generateWorkOrderNumber() {
    const prefix = "WO";
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  }

  function openCreateModal() {
    setEditingOrder(null);
    setFormData({
      title: "",
      description: "",
      request_id: "",
      scheduled_date: "",
      scheduled_time: "",
      labor_cost: "",
      material_cost: "",
      status: "scheduled",
    });
    setIsModalOpen(true);
  }

  function openEditModal(order: WorkOrder) {
    setEditingOrder(order);
    setFormData({
      title: order.title,
      description: order.description || "",
      request_id: order.request_id || "",
      scheduled_date: order.scheduled_date || "",
      scheduled_time: order.scheduled_time || "",
      labor_cost: order.labor_cost?.toString() || "",
      material_cost: order.material_cost?.toString() || "",
      status: order.status,
    });
    setIsModalOpen(true);
  }

  function openViewModal(order: WorkOrder) {
    setViewingOrder(order);
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

    const laborCost = formData.labor_cost
      ? parseFloat(formData.labor_cost)
      : null;
    const materialCost = formData.material_cost
      ? parseFloat(formData.material_cost)
      : null;
    const totalCost = (laborCost || 0) + (materialCost || 0);

    const orderData = {
      title: formData.title,
      description: formData.description || null,
      request_id: formData.request_id || null,
      scheduled_date: formData.scheduled_date || null,
      scheduled_time: formData.scheduled_time || null,
      labor_cost: laborCost,
      material_cost: materialCost,
      total_cost: totalCost > 0 ? totalCost : null,
      status: formData.status,
    };

    if (editingOrder) {
      const updateData: Record<string, unknown> = { ...orderData };
      if (
        formData.status === "in_progress" &&
        editingOrder.status !== "in_progress" &&
        !editingOrder.started_at
      ) {
        updateData.started_at = new Date().toISOString();
      }
      if (
        formData.status === "completed" &&
        editingOrder.status !== "completed"
      ) {
        updateData.completed_at = new Date().toISOString();
      }
      await supabase
        .from("maintenance_work_orders")
        .update(updateData as never)
        .eq("id", editingOrder.id);
    } else {
      await supabase.from("maintenance_work_orders").insert({
        ...orderData,
        work_order_number: generateWorkOrderNumber(),
        created_by: (appUser as any).id,
      } as never);
    }

    setIsModalOpen(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    await supabase.from("maintenance_work_orders").delete().eq("id", id);

    setDeleteConfirmId(null);
    fetchData();
  }

  async function updateStatus(
    id: string,
    status: string,
    currentOrder: WorkOrder
  ) {
    const updateData: Record<string, unknown> = { status };
    if (status === "in_progress" && !currentOrder.started_at) {
      updateData.started_at = new Date().toISOString();
    }
    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    await supabase
      .from("maintenance_work_orders")
      .update(updateData as never)
      .eq("id", id);

    fetchData();
  }

  const filteredOrders = workOrders.filter((order) => {
    const matchesSearch =
      order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.work_order_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-gray-100 text-gray-800",
    on_hold: "bg-orange-100 text-orange-800",
  };

  const stats = {
    total: workOrders.length,
    scheduled: workOrders.filter((w) => w.status === "scheduled").length,
    inProgress: workOrders.filter((w) => w.status === "in_progress").length,
    completed: workOrders.filter((w) => w.status === "completed").length,
    totalCost: workOrders.reduce((sum, w) => sum + (w.total_cost || 0), 0),
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
              <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage maintenance work orders and assignments
              </p>
            </div>
          </div>
          <Button onClick={openCreateModal}>
            <PlusIcon className="h-5 w-5 mr-2" />
            New Work Order
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <div className="text-center p-4">
              <ClipboardDocumentListIcon className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.total}
              </p>
              <p className="text-sm text-gray-500">Total Orders</p>
            </div>
          </Card>
          <Card>
            <div className="text-center p-4">
              <p className="text-2xl font-bold text-blue-600">
                {stats.scheduled}
              </p>
              <p className="text-sm text-gray-500">Scheduled</p>
            </div>
          </Card>
          <Card>
            <div className="text-center p-4">
              <p className="text-2xl font-bold text-yellow-600">
                {stats.inProgress}
              </p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
          </Card>
          <Card>
            <div className="text-center p-4">
              <p className="text-2xl font-bold text-green-600">
                {stats.completed}
              </p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </Card>
          <Card>
            <div className="text-center p-4">
              <CurrencyDollarIcon className="h-6 w-6 text-indigo-400 mx-auto" />
              <p className="text-2xl font-bold text-indigo-600">
                ${stats.totalCost.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Total Cost</p>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search work orders..."
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
              <option value="">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading work orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="h-12 w-12 text-gray-300 mx-auto" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No work orders found
              </h3>
              <p className="mt-2 text-gray-500">
                Create a new work order to get started.
              </p>
              <Button onClick={openCreateModal} className="mt-4">
                <PlusIcon className="h-5 w-5 mr-2" />
                New Work Order
              </Button>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Work Order #</TableHeader>
                  <TableHeader>Title</TableHeader>
                  <TableHeader>Related Request</TableHeader>
                  <TableHeader>Scheduled</TableHeader>
                  <TableHeader>Cost</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.work_order_number}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{order.title}</div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {(
                        order.maintenance_request as
                          | { request_number: string }
                          | undefined
                      )?.request_number || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {order.scheduled_date
                        ? new Date(order.scheduled_date).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {order.total_cost
                        ? `$${order.total_cost.toLocaleString()}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateStatus(order.id, e.target.value, order)
                        }
                        className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${
                          statusColors[order.status]
                        }`}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="on_hold">On Hold</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openViewModal(order)}
                          className="text-gray-600 hover:text-gray-900"
                          title="View"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openEditModal(order)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(order.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
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
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOrder ? "Edit Work Order" : "New Work Order"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Work order title"
            required
          />
          <FormTextarea
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Detailed work description..."
            rows={3}
          />
          <FormSelect
            label="Related Maintenance Request (Optional)"
            value={formData.request_id}
            onChange={(e) =>
              setFormData({ ...formData, request_id: e.target.value })
            }
          >
            <option value="">Select Request</option>
            {maintenanceRequests.map((r) => (
              <option key={r.id} value={r.id}>
                {r.request_number} - {r.title}
              </option>
            ))}
          </FormSelect>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Scheduled Date"
              type="date"
              value={formData.scheduled_date}
              onChange={(e) =>
                setFormData({ ...formData, scheduled_date: e.target.value })
              }
            />
            <FormInput
              label="Scheduled Time"
              type="time"
              value={formData.scheduled_time}
              onChange={(e) =>
                setFormData({ ...formData, scheduled_time: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormInput
              label="Labor Cost"
              type="number"
              step="0.01"
              value={formData.labor_cost}
              onChange={(e) =>
                setFormData({ ...formData, labor_cost: e.target.value })
              }
              placeholder="0.00"
            />
            <FormInput
              label="Material Cost"
              type="number"
              step="0.01"
              value={formData.material_cost}
              onChange={(e) =>
                setFormData({ ...formData, material_cost: e.target.value })
              }
              placeholder="0.00"
            />
            <FormSelect
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </FormSelect>
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
              {editingOrder ? "Update Work Order" : "Create Work Order"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Work Order Details"
        size="lg"
      >
        {viewingOrder && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {viewingOrder.title}
                </h3>
                <p className="text-gray-500">
                  {viewingOrder.work_order_number}
                </p>
              </div>
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  statusColors[viewingOrder.status]
                }`}
              >
                {viewingOrder.status.replace("_", " ")}
              </span>
            </div>

            {viewingOrder.description && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-gray-700">{viewingOrder.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Related Request</p>
                <p className="font-medium">
                  {(
                    viewingOrder.maintenance_request as
                      | { request_number: string }
                      | undefined
                  )?.request_number || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Scheduled Date</p>
                <p className="font-medium">
                  {viewingOrder.scheduled_date
                    ? new Date(viewingOrder.scheduled_date).toLocaleDateString()
                    : "Not scheduled"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Started</p>
                <p className="font-medium">
                  {viewingOrder.started_at
                    ? new Date(viewingOrder.started_at).toLocaleString()
                    : "Not started"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="font-medium">
                  {viewingOrder.completed_at
                    ? new Date(viewingOrder.completed_at).toLocaleString()
                    : "Not completed"}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Cost Breakdown</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500">Labor</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ${(viewingOrder.labor_cost || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Materials</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ${(viewingOrder.material_cost || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-lg font-semibold text-indigo-600">
                    ${(viewingOrder.total_cost || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {viewingOrder.completion_notes && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Completion Notes</p>
                <p className="text-gray-700">{viewingOrder.completion_notes}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsViewModalOpen(false);
                  openEditModal(viewingOrder);
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
        title="Delete Work Order"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this work order? This action cannot
            be undone.
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
              Delete Work Order
            </Button>
          </div>
        </div>
      </Modal>
    </RoleGuard>
  );
}
