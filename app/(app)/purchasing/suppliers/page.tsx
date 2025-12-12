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
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserGroupIcon,
  StarIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";

interface Supplier {
  id: string;
  supplier_code: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  phone_secondary: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  tax_id: string | null;
  payment_terms: string | null;
  currency: string;
  rating: number | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    phone_secondary: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    tax_id: "",
    payment_terms: "",
    currency: "USD",
    rating: "",
    status: "active",
    notes: "",
  });

  const supabase = createClient();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("app_users")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!(profile as any)?.organization_id) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("organization_id", (profile as any).organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching suppliers:", error);
    }
    setSuppliers(data || []);
    setLoading(false);
  }

  function openCreateModal() {
    setEditingSupplier(null);
    setFormData({
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      phone_secondary: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postal_code: "",
      tax_id: "",
      payment_terms: "",
      currency: "USD",
      rating: "",
      status: "active",
      notes: "",
    });
    setIsModalOpen(true);
  }

  function openEditModal(supplier: Supplier) {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      phone_secondary: supplier.phone_secondary || "",
      address: supplier.address || "",
      city: supplier.city || "",
      state: supplier.state || "",
      country: supplier.country || "",
      postal_code: supplier.postal_code || "",
      tax_id: supplier.tax_id || "",
      payment_terms: supplier.payment_terms || "",
      currency: supplier.currency,
      rating: supplier.rating?.toString() || "",
      status: supplier.status,
      notes: supplier.notes || "",
    });
    setIsModalOpen(true);
  }

  function openViewModal(supplier: Supplier) {
    setViewingSupplier(supplier);
    setIsViewModalOpen(true);
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

    const supplierData = {
      name: formData.name,
      contact_person: formData.contact_person || null,
      email: formData.email || null,
      phone: formData.phone || null,
      phone_secondary: formData.phone_secondary || null,
      address: formData.address || null,
      city: formData.city || null,
      state: formData.state || null,
      country: formData.country || null,
      postal_code: formData.postal_code || null,
      tax_id: formData.tax_id || null,
      payment_terms: formData.payment_terms || null,
      currency: formData.currency,
      rating: formData.rating ? parseInt(formData.rating) : null,
      status: formData.status,
      notes: formData.notes || null,
      organization_id: (profile as any).organization_id,
    };

    if (editingSupplier) {
      await (supabase.from("suppliers") as any)
        .update(supplierData as any)
        .eq("id", editingSupplier.id);
    } else {
      const supplierCode = `SUP-${Date.now().toString().slice(-6)}`;
      await (supabase.from("suppliers") as any).insert({
        ...supplierData,
        supplier_code: supplierCode,
        created_by: user.id,
      } as any);
    }

    setIsModalOpen(false);
    fetchSuppliers();
  }

  async function handleDelete(id: string) {
    if (
      confirm(
        "Are you sure you want to delete this supplier? This action cannot be undone."
      )
    ) {
      await supabase.from("suppliers").delete().eq("id", id);
      fetchSuppliers();
    }
  }

  async function toggleStatus(supplier: Supplier) {
    const newStatus = supplier.status === "active" ? "inactive" : "active";
    await (supabase.from("suppliers") as any)
      .update({ status: newStatus } as any)
      .eq("id", supplier.id);
    fetchSuppliers();
  }

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.supplier_code
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      supplier.contact_person
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || supplier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    blacklisted: "bg-red-100 text-red-800",
  };

  const paymentTermsOptions = [
    { value: "COD", label: "Cash on Delivery (COD)" },
    { value: "Net 15", label: "Net 15 Days" },
    { value: "Net 30", label: "Net 30 Days" },
    { value: "Net 45", label: "Net 45 Days" },
    { value: "Net 60", label: "Net 60 Days" },
    { value: "Advance", label: "Advance Payment" },
    { value: "50% Advance", label: "50% Advance" },
  ];

  const currencyOptions = [
    "USD",
    "EUR",
    "GBP",
    "CAD",
    "AUD",
    "NGN",
    "GHS",
    "KES",
    "ZAR",
    "INR",
    "CNY",
    "JPY",
  ];

  const stats = {
    total: suppliers.length,
    active: suppliers.filter((s) => s.status === "active").length,
    inactive: suppliers.filter((s) => s.status === "inactive").length,
    avgRating:
      suppliers.filter((s) => s.rating).length > 0
        ? (
            suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) /
            suppliers.filter((s) => s.rating).length
          ).toFixed(1)
        : "N/A",
  };

  const renderStars = (rating: number | null) => {
    if (!rating)
      return <span className="text-gray-400 text-sm">Not rated</span>;
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) =>
          star <= rating ? (
            <StarSolidIcon key={star} className="h-4 w-4 text-yellow-400" />
          ) : (
            <StarIcon key={star} className="h-4 w-4 text-gray-300" />
          )
        )}
      </div>
    );
  };

  return (
    <RoleGuard allowedRoles={["super_admin", "procurement_officer"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/purchasing"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <Link
                  href="/purchasing"
                  className="text-sm text-emerald-600 hover:text-emerald-500"
                >
                  Purchasing Dashboard
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-sm text-gray-500">Suppliers</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage supplier information and relationships
              </p>
            </div>
          </div>
          <Button onClick={openCreateModal}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Supplier
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="text-center">
              <UserGroupIcon className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.total}
              </p>
              <p className="text-sm text-gray-500">Total Suppliers</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {stats.active}
              </p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">
                {stats.inactive}
              </p>
              <p className="text-sm text-gray-500">Inactive</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="flex items-center justify-center">
                <StarSolidIcon className="h-6 w-6 text-yellow-400 mr-1" />
                <span className="text-2xl font-bold text-gray-900">
                  {stats.avgRating}
                </span>
              </div>
              <p className="text-sm text-gray-500">Avg Rating</p>
            </div>
          </Card>
        </div>

        <Card>
          <div className="mb-4 flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-1"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading suppliers...</p>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Supplier Code</TableHeader>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Contact</TableHeader>
                  <TableHeader>Email</TableHeader>
                  <TableHeader>Phone</TableHeader>
                  <TableHeader>Rating</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-gray-500 py-8"
                    >
                      No suppliers found.{" "}
                      <button
                        onClick={openCreateModal}
                        className="text-emerald-600 hover:text-emerald-500"
                      >
                        Add your first supplier
                      </button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">
                        {supplier.supplier_code}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{supplier.name}</p>
                          {supplier.city && (
                            <p className="text-sm text-gray-500">
                              {supplier.city}, {supplier.country}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{supplier.contact_person || "-"}</TableCell>
                      <TableCell>{supplier.email || "-"}</TableCell>
                      <TableCell>{supplier.phone || "-"}</TableCell>
                      <TableCell>{renderStars(supplier.rating)}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleStatus(supplier)}
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            statusColors[supplier.status]
                          } cursor-pointer hover:opacity-80`}
                        >
                          {supplier.status}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openViewModal(supplier)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openEditModal(supplier)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit Supplier"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(supplier.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Supplier"
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? "Edit Supplier" : "Add New Supplier"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Supplier Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., ABC Supplies Ltd"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Contact Person"
              value={formData.contact_person}
              onChange={(e) =>
                setFormData({ ...formData, contact_person: e.target.value })
              }
              placeholder="Primary contact name"
            />
            <FormInput
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="email@supplier.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+1 234 567 8900"
            />
            <FormInput
              label="Secondary Phone"
              value={formData.phone_secondary}
              onChange={(e) =>
                setFormData({ ...formData, phone_secondary: e.target.value })
              }
              placeholder="Alternative number"
            />
          </div>
          <FormTextarea
            label="Address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            placeholder="Street address"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="City"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              placeholder="City"
            />
            <FormInput
              label="State/Region"
              value={formData.state}
              onChange={(e) =>
                setFormData({ ...formData, state: e.target.value })
              }
              placeholder="State or Region"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Country"
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              placeholder="Country"
            />
            <FormInput
              label="Postal Code"
              value={formData.postal_code}
              onChange={(e) =>
                setFormData({ ...formData, postal_code: e.target.value })
              }
              placeholder="Postal/ZIP Code"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Tax ID"
              value={formData.tax_id}
              onChange={(e) =>
                setFormData({ ...formData, tax_id: e.target.value })
              }
              placeholder="Tax identification number"
            />
            <FormSelect
              label="Payment Terms"
              value={formData.payment_terms}
              onChange={(e) =>
                setFormData({ ...formData, payment_terms: e.target.value })
              }
            >
              <option value="">Select Payment Terms</option>
              {paymentTermsOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormSelect
              label="Currency"
              value={formData.currency}
              onChange={(e) =>
                setFormData({ ...formData, currency: e.target.value })
              }
            >
              {currencyOptions.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </FormSelect>
            <FormSelect
              label="Rating"
              value={formData.rating}
              onChange={(e) =>
                setFormData({ ...formData, rating: e.target.value })
              }
            >
              <option value="">Not Rated</option>
              <option value="1">1 Star</option>
              <option value="2">2 Stars</option>
              <option value="3">3 Stars</option>
              <option value="4">4 Stars</option>
              <option value="5">5 Stars</option>
            </FormSelect>
            <FormSelect
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blacklisted">Blacklisted</option>
            </FormSelect>
          </div>
          <FormTextarea
            label="Notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Additional notes about this supplier..."
            rows={3}
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
              {editingSupplier ? "Update Supplier" : "Add Supplier"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      {viewingSupplier && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Supplier: ${viewingSupplier.name}`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Supplier Code</p>
                <p className="text-lg font-semibold">
                  {viewingSupplier.supplier_code}
                </p>
              </div>
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  statusColors[viewingSupplier.status]
                }`}
              >
                {viewingSupplier.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">
                  Contact Information
                </h4>
                <div className="space-y-2">
                  {viewingSupplier.contact_person && (
                    <div className="flex items-center text-sm">
                      <UserGroupIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{viewingSupplier.contact_person}</span>
                    </div>
                  )}
                  {viewingSupplier.email && (
                    <div className="flex items-center text-sm">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <a
                        href={`mailto:${viewingSupplier.email}`}
                        className="text-emerald-600 hover:underline"
                      >
                        {viewingSupplier.email}
                      </a>
                    </div>
                  )}
                  {viewingSupplier.phone && (
                    <div className="flex items-center text-sm">
                      <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{viewingSupplier.phone}</span>
                    </div>
                  )}
                  {viewingSupplier.phone_secondary && (
                    <div className="flex items-center text-sm">
                      <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{viewingSupplier.phone_secondary} (Alt)</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">
                  Address
                </h4>
                <div className="flex items-start text-sm">
                  <MapPinIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    {viewingSupplier.address && (
                      <p>{viewingSupplier.address}</p>
                    )}
                    {(viewingSupplier.city || viewingSupplier.state) && (
                      <p>
                        {[viewingSupplier.city, viewingSupplier.state]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    {(viewingSupplier.country ||
                      viewingSupplier.postal_code) && (
                      <p>
                        {[viewingSupplier.country, viewingSupplier.postal_code]
                          .filter(Boolean)
                          .join(" ")}
                      </p>
                    )}
                    {!viewingSupplier.address &&
                      !viewingSupplier.city &&
                      !viewingSupplier.country && (
                        <p className="text-gray-400">No address provided</p>
                      )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">
                  Business Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax ID:</span>
                    <span>{viewingSupplier.tax_id || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Terms:</span>
                    <span>{viewingSupplier.payment_terms || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Currency:</span>
                    <span>{viewingSupplier.currency}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">
                  Rating
                </h4>
                <div className="flex items-center space-x-2">
                  {renderStars(viewingSupplier.rating)}
                  {viewingSupplier.rating && (
                    <span className="text-sm text-gray-500">
                      ({viewingSupplier.rating}/5)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {viewingSupplier.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Notes
                </h4>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                  {viewingSupplier.notes}
                </p>
              </div>
            )}

            <div className="text-sm text-gray-500">
              Added on{" "}
              {new Date(viewingSupplier.created_at).toLocaleDateString()}
            </div>

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
                  openEditModal(viewingSupplier);
                }}
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Supplier
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </RoleGuard>
  );
}
