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
  CubeIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface Asset {
  id: string;
  asset_code: string;
  name: string;
  asset_type: string | null;
  manufacturer: string | null;
  model_number: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  purchase_cost: number | null;
  warranty_expiry_date: string | null;
  installation_date: string | null;
  location_description: string | null;
  facility_id: string | null;
  unit_id: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  facility?: { name: string };
  unit?: { unit_number: string };
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

interface AppUser {
  id: string;
  organization_id: string;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    asset_type: "",
    manufacturer: "",
    model_number: "",
    serial_number: "",
    purchase_date: "",
    purchase_cost: "",
    warranty_expiry_date: "",
    installation_date: "",
    location_description: "",
    facility_id: "",
    unit_id: "",
    status: "operational",
    notes: "",
  });

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const [assetsRes, facilitiesRes, unitsRes] = await Promise.all([
      supabase
        .from("assets")
        .select(
          "*, facility:facilities(name), unit:facility_units(unit_number)"
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
    ]);

    setAssets((assetsRes.data as Asset[]) || []);
    setFacilities((facilitiesRes.data as Facility[]) || []);
    setUnits((unitsRes.data as Unit[]) || []);
    setLoading(false);
  }

  function generateAssetCode() {
    const prefix = "AST";
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  }

  function openCreateModal() {
    setEditingAsset(null);
    setFormData({
      name: "",
      asset_type: "",
      manufacturer: "",
      model_number: "",
      serial_number: "",
      purchase_date: "",
      purchase_cost: "",
      warranty_expiry_date: "",
      installation_date: "",
      location_description: "",
      facility_id: "",
      unit_id: "",
      status: "operational",
      notes: "",
    });
    setIsModalOpen(true);
  }

  function openEditModal(asset: Asset) {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      asset_type: asset.asset_type || "",
      manufacturer: asset.manufacturer || "",
      model_number: asset.model_number || "",
      serial_number: asset.serial_number || "",
      purchase_date: asset.purchase_date || "",
      purchase_cost: asset.purchase_cost?.toString() || "",
      warranty_expiry_date: asset.warranty_expiry_date || "",
      installation_date: asset.installation_date || "",
      location_description: asset.location_description || "",
      facility_id: asset.facility_id || "",
      unit_id: asset.unit_id || "",
      status: asset.status,
      notes: asset.notes || "",
    });
    setIsModalOpen(true);
  }

  function openViewModal(asset: Asset) {
    setViewingAsset(asset);
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

    const assetData = {
      name: formData.name,
      asset_type: formData.asset_type || null,
      manufacturer: formData.manufacturer || null,
      model_number: formData.model_number || null,
      serial_number: formData.serial_number || null,
      purchase_date: formData.purchase_date || null,
      purchase_cost: formData.purchase_cost
        ? parseFloat(formData.purchase_cost)
        : null,
      warranty_expiry_date: formData.warranty_expiry_date || null,
      installation_date: formData.installation_date || null,
      location_description: formData.location_description || null,
      facility_id: formData.facility_id || null,
      unit_id: formData.unit_id || null,
      status: formData.status,
      notes: formData.notes || null,
      organization_id: appUser.organization_id,
    };

    if (editingAsset) {
      await supabase
        .from("assets")
        .update(assetData as never)
        .eq("id", editingAsset.id);
    } else {
      await supabase.from("assets").insert({
        ...assetData,
        asset_code: generateAssetCode(),
        created_by: (appUser as any).id,
      } as never);
    }

    setIsModalOpen(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    await supabase.from("assets").delete().eq("id", id);

    setDeleteConfirmId(null);
    fetchData();
  }

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.asset_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.serial_number || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || asset.status === statusFilter;
    const matchesType = !typeFilter || asset.asset_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredUnits = formData.facility_id
    ? units.filter((u) => u.facility_id === formData.facility_id)
    : units;

  const assetTypes = [
    { value: "hvac", label: "HVAC" },
    { value: "elevator", label: "Elevator" },
    { value: "generator", label: "Generator" },
    { value: "plumbing", label: "Plumbing" },
    { value: "electrical", label: "Electrical" },
    { value: "security", label: "Security" },
    { value: "fire_safety", label: "Fire Safety" },
    { value: "furniture", label: "Furniture" },
    { value: "equipment", label: "Equipment" },
    { value: "vehicle", label: "Vehicle" },
    { value: "other", label: "Other" },
  ];

  const statusColors: Record<string, string> = {
    operational: "bg-green-100 text-green-800",
    maintenance: "bg-yellow-100 text-yellow-800",
    out_of_service: "bg-red-100 text-red-800",
    retired: "bg-gray-100 text-gray-800",
  };

  const today = new Date();
  const stats = {
    total: assets.length,
    operational: assets.filter((a) => a.status === "operational").length,
    maintenance: assets.filter((a) => a.status === "maintenance").length,
    outOfService: assets.filter((a) => a.status === "out_of_service").length,
    totalValue: assets.reduce((sum, a) => sum + (a.purchase_cost || 0), 0),
    warrantyExpiring: assets.filter((a) => {
      if (!a.warranty_expiry_date) return false;
      const expiryDate = new Date(a.warranty_expiry_date);
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
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
              <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage facility assets and equipment
              </p>
            </div>
          </div>
          <Button onClick={openCreateModal}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Asset
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <div className="text-center p-4">
              <CubeIcon className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.total}
              </p>
              <p className="text-sm text-gray-500">Total Assets</p>
            </div>
          </Card>
          <Card>
            <div className="text-center p-4">
              <p className="text-2xl font-bold text-green-600">
                {stats.operational}
              </p>
              <p className="text-sm text-gray-500">Operational</p>
            </div>
          </Card>
          <Card>
            <div className="text-center p-4">
              <p className="text-2xl font-bold text-yellow-600">
                {stats.maintenance}
              </p>
              <p className="text-sm text-gray-500">In Maintenance</p>
            </div>
          </Card>
          <Card>
            <div className="text-center p-4">
              <p className="text-2xl font-bold text-red-600">
                {stats.outOfService}
              </p>
              <p className="text-sm text-gray-500">Out of Service</p>
            </div>
          </Card>
          <Card>
            <div className="text-center p-4">
              <p className="text-2xl font-bold text-indigo-600">
                ${stats.totalValue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Total Value</p>
            </div>
          </Card>
          <Card>
            <div className="text-center p-4">
              <p className="text-2xl font-bold text-orange-600">
                {stats.warrantyExpiring}
              </p>
              <p className="text-sm text-gray-500">Warranty Expiring</p>
            </div>
          </Card>
        </div>

        {/* Warranty Alert */}
        {stats.warrantyExpiring > 0 && (
          <Card className="border-l-4 border-l-orange-500 bg-orange-50">
            <div className="flex items-center p-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-500 mr-4" />
              <div>
                <h3 className="font-semibold text-orange-800">
                  Warranty Expiring Soon
                </h3>
                <p className="text-sm text-orange-600">
                  {stats.warrantyExpiring} asset(s) have warranties expiring
                  within 30 days
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
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {assetTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="operational">Operational</option>
              <option value="maintenance">Maintenance</option>
              <option value="out_of_service">Out of Service</option>
              <option value="retired">Retired</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading assets...</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-12">
              <CubeIcon className="h-12 w-12 text-gray-300 mx-auto" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No assets found
              </h3>
              <p className="mt-2 text-gray-500">
                Add your first asset to get started.
              </p>
              <Button onClick={openCreateModal} className="mt-4">
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Asset
              </Button>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Asset</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Location</TableHeader>
                  <TableHeader>Value</TableHeader>
                  <TableHeader>Warranty</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAssets.map((asset) => {
                  const warrantyExpired =
                    asset.warranty_expiry_date &&
                    new Date(asset.warranty_expiry_date) < today;
                  const warrantyExpiringSoon =
                    asset.warranty_expiry_date &&
                    !warrantyExpired &&
                    (() => {
                      const expiryDate = new Date(asset.warranty_expiry_date);
                      const thirtyDaysFromNow = new Date(today);
                      thirtyDaysFromNow.setDate(
                        thirtyDaysFromNow.getDate() + 30
                      );
                      return expiryDate <= thirtyDaysFromNow;
                    })();

                  return (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                            <CubeIcon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {asset.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {asset.asset_code}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                          {asset.asset_type?.replace("_", " ") || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {(asset.facility as { name: string } | undefined)
                          ?.name ||
                          asset.location_description ||
                          "-"}
                      </TableCell>
                      <TableCell>
                        {asset.purchase_cost
                          ? `$${asset.purchase_cost.toLocaleString()}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {asset.warranty_expiry_date ? (
                          <span
                            className={`text-sm ${
                              warrantyExpired
                                ? "text-red-600"
                                : warrantyExpiringSoon
                                ? "text-orange-600"
                                : "text-gray-600"
                            }`}
                          >
                            {new Date(
                              asset.warranty_expiry_date
                            ).toLocaleDateString()}
                            {warrantyExpired && " (Expired)"}
                            {warrantyExpiringSoon && " (Expiring)"}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            statusColors[asset.status]
                          }`}
                        >
                          {asset.status.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openViewModal(asset)}
                            className="text-gray-600 hover:text-gray-900"
                            title="View"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openEditModal(asset)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(asset.id)}
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
        title={editingAsset ? "Edit Asset" : "Add New Asset"}
        size="lg"
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[70vh] overflow-y-auto pr-2"
        >
          <FormInput
            label="Asset Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Air Conditioning Unit"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Asset Type"
              value={formData.asset_type}
              onChange={(e) =>
                setFormData({ ...formData, asset_type: e.target.value })
              }
            >
              <option value="">Select Type</option>
              {assetTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </FormSelect>
            <FormSelect
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="operational">Operational</option>
              <option value="maintenance">Maintenance</option>
              <option value="out_of_service">Out of Service</option>
              <option value="retired">Retired</option>
            </FormSelect>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormInput
              label="Manufacturer"
              value={formData.manufacturer}
              onChange={(e) =>
                setFormData({ ...formData, manufacturer: e.target.value })
              }
              placeholder="e.g., Carrier"
            />
            <FormInput
              label="Model Number"
              value={formData.model_number}
              onChange={(e) =>
                setFormData({ ...formData, model_number: e.target.value })
              }
              placeholder="Model #"
            />
            <FormInput
              label="Serial Number"
              value={formData.serial_number}
              onChange={(e) =>
                setFormData({ ...formData, serial_number: e.target.value })
              }
              placeholder="Serial #"
            />
          </div>
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
              label="Unit (Optional)"
              value={formData.unit_id}
              onChange={(e) =>
                setFormData({ ...formData, unit_id: e.target.value })
              }
            >
              <option value="">Select Unit</option>
              {filteredUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_number}
                </option>
              ))}
            </FormSelect>
          </div>
          <FormInput
            label="Location Description"
            value={formData.location_description}
            onChange={(e) =>
              setFormData({ ...formData, location_description: e.target.value })
            }
            placeholder="e.g., Building A, Floor 2, Room 201"
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Purchase Date"
              type="date"
              value={formData.purchase_date}
              onChange={(e) =>
                setFormData({ ...formData, purchase_date: e.target.value })
              }
            />
            <FormInput
              label="Purchase Cost"
              type="number"
              step="0.01"
              value={formData.purchase_cost}
              onChange={(e) =>
                setFormData({ ...formData, purchase_cost: e.target.value })
              }
              placeholder="0.00"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Installation Date"
              type="date"
              value={formData.installation_date}
              onChange={(e) =>
                setFormData({ ...formData, installation_date: e.target.value })
              }
            />
            <FormInput
              label="Warranty Expiry"
              type="date"
              value={formData.warranty_expiry_date}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  warranty_expiry_date: e.target.value,
                })
              }
            />
          </div>
          <FormTextarea
            label="Notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Additional notes about the asset..."
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
            <Button type="submit">
              {editingAsset ? "Update Asset" : "Add Asset"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Asset Details"
        size="lg"
      >
        {viewingAsset && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            <div className="flex items-center">
              <div className="h-16 w-16 bg-gray-100 rounded-xl flex items-center justify-center mr-4">
                <CubeIcon className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {viewingAsset.name}
                </h3>
                <p className="text-gray-500">{viewingAsset.asset_code}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium">
                  {viewingAsset.asset_type?.replace("_", " ") || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    statusColors[viewingAsset.status]
                  }`}
                >
                  {viewingAsset.status.replace("_", " ")}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Manufacturer</p>
                <p className="font-medium">
                  {viewingAsset.manufacturer || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Model</p>
                <p className="font-medium">
                  {viewingAsset.model_number || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Serial Number</p>
                <p className="font-medium">
                  {viewingAsset.serial_number || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">
                  {(viewingAsset.facility as { name: string } | undefined)
                    ?.name ||
                    viewingAsset.location_description ||
                    "N/A"}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">
                Purchase & Warranty
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Purchase Date</p>
                  <p className="font-medium">
                    {viewingAsset.purchase_date
                      ? new Date(
                          viewingAsset.purchase_date
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Purchase Cost</p>
                  <p className="font-medium">
                    {viewingAsset.purchase_cost
                      ? `$${viewingAsset.purchase_cost.toLocaleString()}`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Installation Date</p>
                  <p className="font-medium">
                    {viewingAsset.installation_date
                      ? new Date(
                          viewingAsset.installation_date
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Warranty Expiry</p>
                  <p
                    className={`font-medium ${
                      viewingAsset.warranty_expiry_date &&
                      new Date(viewingAsset.warranty_expiry_date) < today
                        ? "text-red-600"
                        : ""
                    }`}
                  >
                    {viewingAsset.warranty_expiry_date
                      ? new Date(
                          viewingAsset.warranty_expiry_date
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {viewingAsset.notes && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Notes</p>
                <p className="text-gray-700">{viewingAsset.notes}</p>
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
                  openEditModal(viewingAsset);
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
        title="Delete Asset"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this asset? This action cannot be
            undone.
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
              Delete Asset
            </Button>
          </div>
        </div>
      </Modal>
    </RoleGuard>
  );
}
