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
import { Modal } from "@/components/ui/modal";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { FormTextarea } from "@/components/ui/form-textarea";
import { RoleGuard } from "@/components/auth/role-guard";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

interface Item {
  id: string;
  item_code: string;
  name: string;
  description: string | null;
  category: string | null;
  unit_of_measure: string;
  item_type: string | null;
  barcode: string | null;
  manufacturer: string | null;
  model_number: string | null;
  unit_price: number | null;
  selling_price: number | null;
  min_stock_level: number | null;
  max_stock_level: number | null;
  lead_time_days: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  total_stock?: number;
  stock_value?: number;
  is_low_stock?: boolean;
}

interface Supplier {
  id: string;
  name: string;
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    item_code: "",
    name: "",
    description: "",
    category: "",
    unit_of_measure: "pcs",
    item_type: "material",
    barcode: "",
    manufacturer: "",
    model_number: "",
    unit_price: "",
    selling_price: "",
    min_stock_level: "",
    max_stock_level: "",
    lead_time_days: "",
    notes: "",
    is_active: true,
  });

  // Stats
  const [stats, setStats] = useState({
    totalItems: 0,
    activeItems: 0,
    lowStockItems: 0,
    totalValue: 0,
  });

  useEffect(() => {
    fetchItems();
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const supabase = createClient();
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

    const { data } = await supabase
      .from("suppliers")
      .select("id, name")
      .eq("organization_id", (profile as any).organization_id)
      .order("name");

    setSuppliers((data || []) as Supplier[]);
  };

  const fetchItems = async () => {
    setLoading(true);
    const supabase = createClient();

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
      .from("items")
      .select("*")
      .eq("organization_id", (profile as any).organization_id)
      .order("name");

    if (error) {
      console.error("Error fetching items:", error);
      setLoading(false);
      return;
    }

    // Get stock levels for each item
    const itemsWithStock = await Promise.all(
      ((data || []) as any[]).map(async (item: any) => {
        const { data: stockLevels } = await supabase
          .from("stock_levels")
          .select("quantity")
          .eq("item_id", (item as any).id);

        const totalStock = (stockLevels || []).reduce(
          (sum, sl: any) => sum + Number((sl as any).quantity),
          0
        );
        const unitPrice = Number(item.unit_price) || 0;
        const stockValue = totalStock * unitPrice;
        const minStock = Number(item.min_stock_level) || 0;
        const isLowStock = minStock > 0 && totalStock <= minStock;

        return {
          ...item,
          total_stock: totalStock,
          stock_value: stockValue,
          is_low_stock: isLowStock,
        };
      })
    );

    setItems(itemsWithStock as Item[]);

    // Calculate stats
    const totalItems = itemsWithStock.length;
    const activeItems = itemsWithStock.filter((i) => i.is_active).length;
    const lowStockItems = itemsWithStock.filter((i) => i.is_low_stock).length;
    const totalValue = itemsWithStock.reduce(
      (sum, i) => sum + (i.stock_value || 0),
      0
    );

    setStats({ totalItems, activeItems, lowStockItems, totalValue });
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      item_code: "",
      name: "",
      description: "",
      category: "",
      unit_of_measure: "pcs",
      item_type: "material",
      barcode: "",
      manufacturer: "",
      model_number: "",
      unit_price: "",
      selling_price: "",
      min_stock_level: "",
      max_stock_level: "",
      lead_time_days: "",
      notes: "",
      is_active: true,
    });
    setEditingItem(null);
  };

  const generateItemCode = () => {
    const prefix = formData.category
      ? formData.category.substring(0, 3).toUpperCase()
      : "ITM";
    const timestamp = Date.now().toString().slice(-6);
    setFormData({ ...formData, item_code: `${prefix}-${timestamp}` });
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setFormData({
      item_code: item.item_code,
      name: item.name,
      description: item.description || "",
      category: item.category || "",
      unit_of_measure: item.unit_of_measure,
      item_type: item.item_type || "material",
      barcode: item.barcode || "",
      manufacturer: item.manufacturer || "",
      model_number: item.model_number || "",
      unit_price: item.unit_price?.toString() || "",
      selling_price: item.selling_price?.toString() || "",
      min_stock_level: item.min_stock_level?.toString() || "",
      max_stock_level: item.max_stock_level?.toString() || "",
      lead_time_days: item.lead_time_days?.toString() || "",
      notes: item.notes || "",
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const duplicateItem = (item: Item) => {
    setEditingItem(null);
    setFormData({
      item_code: "",
      name: `${item.name} (Copy)`,
      description: item.description || "",
      category: item.category || "",
      unit_of_measure: item.unit_of_measure,
      item_type: item.item_type || "material",
      barcode: "",
      manufacturer: item.manufacturer || "",
      model_number: item.model_number || "",
      unit_price: item.unit_price?.toString() || "",
      selling_price: item.selling_price?.toString() || "",
      min_stock_level: item.min_stock_level?.toString() || "",
      max_stock_level: item.max_stock_level?.toString() || "",
      lead_time_days: item.lead_time_days?.toString() || "",
      notes: item.notes || "",
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("app_users")
        .select("organization_id, id")
        .eq("user_id", user.id)
        .single();

      if (!(profile as any)?.organization_id)
        throw new Error("No organization");

      const itemData = {
        item_code: formData.item_code,
        name: formData.name,
        description: formData.description || null,
        category: formData.category || null,
        unit_of_measure: formData.unit_of_measure,
        item_type: formData.item_type || null,
        barcode: formData.barcode || null,
        manufacturer: formData.manufacturer || null,
        model_number: formData.model_number || null,
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : 0,
        selling_price: formData.selling_price
          ? parseFloat(formData.selling_price)
          : null,
        min_stock_level: formData.min_stock_level
          ? parseFloat(formData.min_stock_level)
          : 0,
        max_stock_level: formData.max_stock_level
          ? parseFloat(formData.max_stock_level)
          : null,
        lead_time_days: formData.lead_time_days
          ? parseInt(formData.lead_time_days)
          : 0,
        notes: formData.notes || null,
        is_active: formData.is_active,
        organization_id: (profile as any).organization_id,
      };

      if (editingItem) {
        const { error } = await (supabase.from("items") as any)
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await (supabase.from("items") as any).insert({
          ...itemData,
          created_by: (profile as any).id,
        });

        if (error) throw error;
      }

      setIsModalOpen(false);
      resetForm();
      fetchItems();
    } catch (error: any) {
      console.error("Error saving item:", error);
      alert("Error saving item: " + (error.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this item? This will also delete related stock levels."
      )
    )
      return;

    const supabase = createClient();
    const { error } = await supabase.from("items").delete().eq("id", id);

    if (error) {
      alert("Error deleting item: " + error.message);
    } else {
      setItems(items.filter((i) => i.id !== id));
      fetchItems(); // Refresh stats
    }
  };

  const toggleActive = async (item: Item) => {
    const supabase = createClient();
    const { error } = await (supabase.from("items") as any)
      .update({ is_active: !item.is_active })
      .eq("id", item.id);

    if (error) {
      alert("Error updating item: " + error.message);
    } else {
      fetchItems();
    }
  };

  const exportItems = () => {
    const csvContent = [
      [
        "Item Code",
        "Name",
        "Category",
        "Unit",
        "Unit Price",
        "Stock",
        "Stock Value",
        "Min Stock",
        "Status",
      ].join(","),
      ...filteredItems.map((item) =>
        [
          item.item_code,
          `"${item.name}"`,
          item.category || "",
          item.unit_of_measure,
          item.unit_price || 0,
          item.total_stock || 0,
          item.stock_value?.toFixed(2) || 0,
          item.min_stock_level || 0,
          item.is_active ? "Active" : "Inactive",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-items-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.barcode &&
        item.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    const matchesStock =
      !stockFilter ||
      (stockFilter === "low" && item.is_low_stock) ||
      (stockFilter === "out" && (item.total_stock || 0) === 0) ||
      (stockFilter === "in" && (item.total_stock || 0) > 0);
    return matchesSearch && matchesCategory && matchesStock;
  });

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <RoleGuard
      allowedRoles={["super_admin", "inventory_officer", "project_manager"]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/inventory">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Inventory Items
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage inventory items, pricing, and stock levels
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="secondary" onClick={exportItems}>
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Export
            </Button>
            <Button onClick={openCreateModal}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalItems}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <CubeIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Items</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.activeItems}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CubeIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.lowStockItems}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {formatCurrency(stats.totalValue)}
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {stats.lowStockItems > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <p className="font-medium text-red-800">Low Stock Alert</p>
                <p className="text-sm text-red-600">
                  {stats.lowStockItems} item(s) are below minimum stock level.
                  Consider reordering.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, code, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat || ""}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Stock Levels</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </Card>

        {/* Items Table */}
        <Card>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading items...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Item Code</TableHeader>
                    <TableHeader>Name</TableHeader>
                    <TableHeader>Category</TableHeader>
                    <TableHeader>Unit Price</TableHeader>
                    <TableHeader>Stock</TableHeader>
                    <TableHeader>Stock Value</TableHeader>
                    <TableHeader>Min Level</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center text-gray-500 py-8"
                      >
                        {searchTerm || categoryFilter || stockFilter
                          ? "No items match your filters"
                          : "No items found. Add your first item."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow
                        key={item.id}
                        className={item.is_low_stock ? "bg-red-50" : ""}
                      >
                        <TableCell>
                          <span className="font-mono text-sm">
                            {item.item_code}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.name}
                            </p>
                            {item.manufacturer && (
                              <p className="text-xs text-gray-500">
                                {item.manufacturer}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize text-sm">
                            {item.category || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {formatCurrency(item.unit_price)}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">
                            /{item.unit_of_measure}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {item.is_low_stock && (
                              <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                            )}
                            <span
                              className={`font-medium ${
                                (item.total_stock || 0) === 0
                                  ? "text-red-600"
                                  : item.is_low_stock
                                  ? "text-orange-600"
                                  : "text-green-600"
                              }`}
                            >
                              {item.total_stock || 0}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              {item.unit_of_measure}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(item.stock_value)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {item.min_stock_level || 0} {item.unit_of_measure}
                          </span>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => toggleActive(item)}
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              item.is_active
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            }`}
                          >
                            {item.is_active ? "Active" : "Inactive"}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => duplicateItem(item)}
                              className="p-1 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded"
                              title="Duplicate"
                            >
                              <DocumentDuplicateIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingItem ? "Edit Item" : "Add New Item"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="border-b pb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Basic Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormInput
                  label="Item Code"
                  required
                  value={formData.item_code}
                  onChange={(e) =>
                    setFormData({ ...formData, item_code: e.target.value })
                  }
                  placeholder="e.g., ITM-001"
                />
                {!editingItem && (
                  <button
                    type="button"
                    onClick={generateItemCode}
                    className="text-xs text-indigo-600 hover:text-indigo-500 mt-1"
                  >
                    Auto-generate code
                  </button>
                )}
              </div>
              <FormInput
                label="Name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Item name"
              />
            </div>
            <div className="mt-4">
              <FormTextarea
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Item description..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <FormSelect
                label="Category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                options={[
                  { value: "", label: "Select Category" },
                  {
                    value: "construction_materials",
                    label: "Construction Materials",
                  },
                  { value: "tools", label: "Tools" },
                  { value: "equipment", label: "Equipment" },
                  { value: "office_supplies", label: "Office Supplies" },
                  { value: "electrical", label: "Electrical" },
                  { value: "plumbing", label: "Plumbing" },
                  { value: "safety", label: "Safety Equipment" },
                  { value: "hardware", label: "Hardware" },
                  { value: "paint", label: "Paint & Finishing" },
                  { value: "lumber", label: "Lumber & Wood" },
                  { value: "concrete", label: "Concrete & Masonry" },
                  { value: "other", label: "Other" },
                ]}
              />
              <FormSelect
                label="Item Type"
                value={formData.item_type}
                onChange={(e) =>
                  setFormData({ ...formData, item_type: e.target.value })
                }
                options={[
                  { value: "material", label: "Material" },
                  { value: "tool", label: "Tool" },
                  { value: "equipment", label: "Equipment" },
                  { value: "consumable", label: "Consumable" },
                  { value: "spare_part", label: "Spare Part" },
                ]}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="border-b pb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Pricing & Units
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <FormSelect
                label="Unit of Measure"
                value={formData.unit_of_measure}
                onChange={(e) =>
                  setFormData({ ...formData, unit_of_measure: e.target.value })
                }
                options={[
                  { value: "pcs", label: "Pieces (pcs)" },
                  { value: "kg", label: "Kilograms (kg)" },
                  { value: "g", label: "Grams (g)" },
                  { value: "m", label: "Meters (m)" },
                  { value: "cm", label: "Centimeters (cm)" },
                  { value: "m2", label: "Square Meters (m²)" },
                  { value: "m3", label: "Cubic Meters (m³)" },
                  { value: "l", label: "Liters (l)" },
                  { value: "ml", label: "Milliliters (ml)" },
                  { value: "box", label: "Box" },
                  { value: "pack", label: "Pack" },
                  { value: "set", label: "Set" },
                  { value: "roll", label: "Roll" },
                  { value: "bag", label: "Bag" },
                  { value: "sheet", label: "Sheet" },
                ]}
              />
              <FormInput
                label="Unit Price (Cost)"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price}
                onChange={(e) =>
                  setFormData({ ...formData, unit_price: e.target.value })
                }
                placeholder="0.00"
              />
              <FormInput
                label="Selling Price"
                type="number"
                step="0.01"
                min="0"
                value={formData.selling_price}
                onChange={(e) =>
                  setFormData({ ...formData, selling_price: e.target.value })
                }
                placeholder="0.00 (optional)"
              />
            </div>
          </div>

          {/* Stock Levels */}
          <div className="border-b pb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Stock Levels
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <FormInput
                label="Min Stock Level"
                type="number"
                step="0.001"
                min="0"
                value={formData.min_stock_level}
                onChange={(e) =>
                  setFormData({ ...formData, min_stock_level: e.target.value })
                }
                placeholder="Reorder point"
              />
              <FormInput
                label="Max Stock Level"
                type="number"
                step="0.001"
                min="0"
                value={formData.max_stock_level}
                onChange={(e) =>
                  setFormData({ ...formData, max_stock_level: e.target.value })
                }
                placeholder="Optional"
              />
              <FormInput
                label="Lead Time (days)"
                type="number"
                min="0"
                value={formData.lead_time_days}
                onChange={(e) =>
                  setFormData({ ...formData, lead_time_days: e.target.value })
                }
                placeholder="0"
              />
            </div>
          </div>

          {/* Additional Info */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Additional Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Manufacturer"
                value={formData.manufacturer}
                onChange={(e) =>
                  setFormData({ ...formData, manufacturer: e.target.value })
                }
                placeholder="Optional"
              />
              <FormInput
                label="Model Number"
                value={formData.model_number}
                onChange={(e) =>
                  setFormData({ ...formData, model_number: e.target.value })
                }
                placeholder="Optional"
              />
            </div>
            <div className="mt-4">
              <FormInput
                label="Barcode / SKU"
                value={formData.barcode}
                onChange={(e) =>
                  setFormData({ ...formData, barcode: e.target.value })
                }
                placeholder="Optional"
              />
            </div>
            <div className="mt-4">
              <FormTextarea
                label="Notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="is_active"
                className="ml-2 block text-sm text-gray-900"
              >
                Active Item
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : editingItem ? "Update Item" : "Add Item"}
            </Button>
          </div>
        </form>
      </Modal>
    </RoleGuard>
  );
}
