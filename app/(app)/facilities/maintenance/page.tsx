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
  WrenchScrewdriverIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface MaintenanceRequest {
  id: string;
  request_number: string;
  title: string;
  description: string | null;
  facility_id: string | null;
  unit_id: string | null;
  asset_id: string | null;
  request_type: string | null;
  priority: string;
  status: string;
  requested_by: string | null;
  assigned_to: string | null;
  requested_date: string | null;
  completed_date: string | null;
  completion_notes: string | null;
  created_at: string;
  facility?: { name: string };
  unit?: { unit_number: string };
  asset?: { name: string };
}

interface Facility {
  id: string;
  name: string;
  facility_code: string;
}

interface Unit {
  id: string;
  unit_number: string;
  facility_id: string;
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

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] =
    useState<MaintenanceRequest | null>(null);
  const [viewingRequest, setViewingRequest] =
    useState<MaintenanceRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    facility_id: "",
    unit_id: "",
    asset_id: "",
    request_type: "repair",
    priority: "medium",
    status: "open",
    requested_date: new Date().toISOString().split("T")[0],
  });

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const [requestsRes, facilitiesRes, unitsRes, assetsRes] = await Promise.all(
      [
        supabase
          .from("maintenance_requests")
          .select(
            "*, facility:facilities(name), unit:facility_units(unit_number), asset:assets(name)"
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("facilities")
          .select("id, name, facility_code")
          .order("name"),
        supabase
          .from("facility_units")
          .select("id, unit_number, facility_id")
          .order("unit_number"),
        supabase.from("assets").select("id, name, asset_code").order("name"),
      ]
    );

    setRequests((requestsRes.data as MaintenanceRequest[]) || []);
    setFacilities((facilitiesRes.data as Facility[]) || []);
    setUnits((unitsRes.data as Unit[]) || []);
    setAssets((assetsRes.data as Asset[]) || []);
    setLoading(false);
  }

  function generateRequestNumber() {
    const prefix = "MR";
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  }

  function openCreateModal() {
    setEditingRequest(null);
    setFormData({
      title: "",
      description: "",
      facility_id: "",
      unit_id: "",
      asset_id: "",
      request_type: "repair",
      priority: "medium",
      status: "open",
      requested_date: new Date().toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  }

  function openEditModal(request: MaintenanceRequest) {
    setEditingRequest(request);
    setFormData({
      title: request.title,
      description: request.description || "",
      facility_id: request.facility_id || "",
      unit_id: request.unit_id || "",
      asset_id: request.asset_id || "",
      request_type: request.request_type || "repair",
      priority: request.priority,
      status: request.status,
      requested_date:
        request.requested_date || new Date().toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  }

  function openViewModal(request: MaintenanceRequest) {
    setViewingRequest(request);
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

    const requestData = {
      title: formData.title,
      description: formData.description || null,
      facility_id: formData.facility_id || null,
      unit_id: formData.unit_id || null,
      asset_id: formData.asset_id || null,
      request_type: formData.request_type,
      priority: formData.priority,
      status: formData.status,
      requested_date: formData.requested_date,
      organization_id: appUser.organization_id,
    };

    if (editingRequest) {
      const updateData: Record<string, unknown> = { ...requestData };
      if (
        formData.status === "completed" &&
        editingRequest.status !== "completed"
      ) {
        updateData.completed_date = new Date().toISOString().split("T")[0];
      }
      await supabase
        .from("maintenance_requests")
        .update(updateData as never)
        .eq("id", editingRequest.id);
    } else {
      await supabase.from("maintenance_requests").insert({
        ...requestData,
        request_number: generateRequestNumber(),
        requested_by: (appUser as any).id,
      } as never);
    }

    setIsModalOpen(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    await supabase.from("maintenance_requests").delete().eq("id", id);

    setDeleteConfirmId(null);
    fetchData();
  }

  async function updateStatus(id: string, status: string) {
    const updateData: Record<string, unknown> = { status };
    if (status === "completed") {
      updateData.completed_date = new Date().toISOString().split("T")[0];
    }

    await supabase
      .from("maintenance_requests")
      .update(updateData as never)
      .eq("id", id);

    fetchData();
  }

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.request_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || req.status === statusFilter;
    const matchesPriority = !priorityFilter || req.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const filteredUnits = formData.facility_id
    ? units.filter((u) => u.facility_id === formData.facility_id)
    : units;

  const requestTypes = [
    { value: "repair", label: "Repair" },
    { value: "preventive", label: "Preventive" },
    { value: "inspection", label: "Inspection" },
    { value: "emergency", label: "Emergency" },
    { value: "upgrade", label: "Upgrade" },
  ];

  const statusColors: Record<string, string> = {
    open: "bg-blue-100 text-blue-800",
    assigned: "bg-indigo-100 text-indigo-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-gray-100 text-gray-800",
  };

  const priorityColors: Record<string, string> = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
    emergency: "bg-red-200 text-red-900",
  };

  const stats = {
    total: requests.length,
    open: requests.filter((r) => r.status === "open").length,
    inProgress: requests.filter(
      (r) => r.status === "in_progress" || r.status === "assigned"
    ).length,
    completed: requests.filter((r) => r.status === "completed").length,
    urgent: requests.filter(
      (r) => r.priority === "urgent" || r.priority === "emergency"
    ).length,
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
                Maintenance Requests
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage facility maintenance requests and tickets
              </p>
            </div>
          </div>
          <Button onClick={openCreateModal}>
            <PlusIcon className="h-5 w-5 mr-2" />
            New Request
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <div className="text-center p-4">
              <WrenchScrewdriverIcon className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.total}
              </p>
              <p className="text-sm text-gray-500">Total Requests</p>
            </div>
          </Card>
          <Card>
            <div className="text-center p-4">
              <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
              <p className="text-sm text-gray-500">Open</p>
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
              <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
              <p className="text-sm text-gray-500">Urgent</p>
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
                placeholder="Search requests..."
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
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <WrenchScrewdriverIcon className="h-12 w-12 text-gray-300 mx-auto" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No maintenance requests found
              </h3>
              <p className="mt-2 text-gray-500">
                Create a new request to get started.
              </p>
              <Button onClick={openCreateModal} className="mt-4">
                <PlusIcon className="h-5 w-5 mr-2" />
                New Request
              </Button>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Request #</TableHeader>
                  <TableHeader>Title</TableHeader>
                  <TableHeader>Facility</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Priority</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.request_number}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{request.title}</div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {(request.facility as { name: string } | undefined)
                        ?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                        {request.request_type || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          priorityColors[request.priority]
                        }`}
                      >
                        {request.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <select
                        value={request.status}
                        onChange={(e) =>
                          updateStatus(request.id, e.target.value)
                        }
                        className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${
                          statusColors[request.status]
                        }`}
                      >
                        <option value="open">Open</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {request.requested_date
                        ? new Date(request.requested_date).toLocaleDateString()
                        : new Date(request.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openViewModal(request)}
                          className="text-gray-600 hover:text-gray-900"
                          title="View"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openEditModal(request)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(request.id)}
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
        title={
          editingRequest
            ? "Edit Maintenance Request"
            : "New Maintenance Request"
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Brief description of the issue"
            required
          />
          <FormTextarea
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Detailed description of the maintenance request..."
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Facility"
              value={formData.facility_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  facility_id: e.target.value,
                  unit_id: "",
                })
              }
            >
              <option value="">Select Facility</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </FormSelect>
            <FormSelect
              label="Unit"
              value={formData.unit_id}
              onChange={(e) =>
                setFormData({ ...formData, unit_id: e.target.value })
              }
            >
              <option value="">Select Unit (Optional)</option>
              {filteredUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_number}
                </option>
              ))}
            </FormSelect>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Asset (Optional)"
              value={formData.asset_id}
              onChange={(e) =>
                setFormData({ ...formData, asset_id: e.target.value })
              }
            >
              <option value="">Select Asset</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.asset_code})
                </option>
              ))}
            </FormSelect>
            <FormSelect
              label="Request Type"
              value={formData.request_type}
              onChange={(e) =>
                setFormData({ ...formData, request_type: e.target.value })
              }
            >
              {requestTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </FormSelect>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormSelect
              label="Priority"
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value })
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
            </FormSelect>
            <FormSelect
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </FormSelect>
            <FormInput
              label="Requested Date"
              type="date"
              value={formData.requested_date}
              onChange={(e) =>
                setFormData({ ...formData, requested_date: e.target.value })
              }
            />
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
              {editingRequest ? "Update Request" : "Create Request"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Request Details"
        size="lg"
      >
        {viewingRequest && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {viewingRequest.title}
                </h3>
                <p className="text-gray-500">{viewingRequest.request_number}</p>
              </div>
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  statusColors[viewingRequest.status]
                }`}
              >
                {viewingRequest.status.replace("_", " ")}
              </span>
            </div>

            {viewingRequest.description && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-gray-700">{viewingRequest.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Facility</p>
                <p className="font-medium">
                  {(viewingRequest.facility as { name: string } | undefined)
                    ?.name || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unit</p>
                <p className="font-medium">
                  {(viewingRequest.unit as { unit_number: string } | undefined)
                    ?.unit_number || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium">
                  {viewingRequest.request_type || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Priority</p>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    priorityColors[viewingRequest.priority]
                  }`}
                >
                  {viewingRequest.priority}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Requested Date</p>
                <p className="font-medium">
                  {viewingRequest.requested_date
                    ? new Date(
                        viewingRequest.requested_date
                      ).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed Date</p>
                <p className="font-medium">
                  {viewingRequest.completed_date
                    ? new Date(
                        viewingRequest.completed_date
                      ).toLocaleDateString()
                    : "Not completed"}
                </p>
              </div>
            </div>

            {viewingRequest.completion_notes && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Completion Notes</p>
                <p className="text-gray-700">
                  {viewingRequest.completion_notes}
                </p>
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
                  openEditModal(viewingRequest);
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
        title="Delete Request"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this maintenance request? This
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
              Delete Request
            </Button>
          </div>
        </div>
      </Modal>
    </RoleGuard>
  );
}
