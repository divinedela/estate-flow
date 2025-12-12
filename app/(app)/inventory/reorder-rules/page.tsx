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
import { createClient } from "@/lib/supabase/client";
import {
  ClipboardDocumentCheckIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface ReorderRule {
  id: string;
  item_id: string;
  item_name?: string;
  item_sku?: string;
  location_id: string | null;
  location_name?: string;
  min_quantity: number;
  reorder_quantity: number;
  max_quantity: number | null;
  is_active: boolean;
  current_stock?: number;
  created_at: string;
}

interface Item {
  id: string;
  name: string;
  sku: string;
}

interface Location {
  id: string;
  name: string;
}

export default function ReorderRulesPage() {
  const [rules, setRules] = useState<ReorderRule[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ReorderRule | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    item_id: "",
    location_id: "",
    min_quantity: "",
    reorder_quantity: "",
    max_quantity: "",
    is_active: true,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    // Fetch reorder rules with item and location info
    const { data: rulesData } = await supabase
      .from("reorder_rules")
      .select(
        `
        *,
        item:items(name, sku),
        location:stock_locations(name)
      `
      )
      .order("created_at", { ascending: false });

    // Fetch items
    const { data: itemsData } = await supabase
      .from("items")
      .select("id, name, sku")
      .order("name");

    // Fetch locations
    const { data: locationsData } = await supabase
      .from("stock_locations")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    // Map rules with additional info
    const mappedRules = ((rulesData || []) as any[]).map((rule: any) => ({
      ...rule,
      item_name: rule.item?.name,
      item_sku: rule.item?.sku,
      location_name: rule.location?.name,
    }));

    setRules(mappedRules);
    setItems(itemsData || []);
    setLocations(locationsData || []);
    setLoading(false);
  }

  function openCreateModal() {
    setEditingRule(null);
    setFormData({
      item_id: "",
      location_id: "",
      min_quantity: "",
      reorder_quantity: "",
      max_quantity: "",
      is_active: true,
    });
    setIsModalOpen(true);
  }

  function openEditModal(rule: ReorderRule) {
    setEditingRule(rule);
    setFormData({
      item_id: rule.item_id,
      location_id: rule.location_id || "",
      min_quantity: rule.min_quantity.toString(),
      reorder_quantity: rule.reorder_quantity.toString(),
      max_quantity: rule.max_quantity?.toString() || "",
      is_active: rule.is_active,
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const ruleData = {
      item_id: formData.item_id,
      location_id: formData.location_id || null,
      min_quantity: parseInt(formData.min_quantity),
      reorder_quantity: parseInt(formData.reorder_quantity),
      max_quantity: formData.max_quantity
        ? parseInt(formData.max_quantity)
        : null,
      is_active: formData.is_active,
    };

    if (editingRule) {
      await (supabase.from("reorder_rules") as any)
        .update(ruleData)
        .eq("id", editingRule.id);
    } else {
      await (supabase.from("reorder_rules") as any).insert(ruleData);
    }

    setIsModalOpen(false);
    fetchData();
  }

  async function handleDelete(rule: ReorderRule) {
    if (confirm("Are you sure you want to delete this reorder rule?")) {
      await supabase.from("reorder_rules").delete().eq("id", rule.id);

      fetchData();
    }
  }

  async function toggleStatus(rule: ReorderRule) {
    await (supabase.from("reorder_rules") as any)
      .update({ is_active: !rule.is_active })
      .eq("id", rule.id);

    fetchData();
  }

  const filteredRules = rules.filter(
    (rule) =>
      rule.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.item_sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate low stock items
  const lowStockRules = rules.filter((rule) => {
    if (!rule.is_active) return false;
    // In a real app, you'd compare with actual stock levels
    return (
      rule.current_stock !== undefined &&
      rule.current_stock <= rule.min_quantity
    );
  });

  const stats = {
    total: rules.length,
    active: rules.filter((r) => r.is_active).length,
    lowStock: lowStockRules.length,
  };

  return (
    <RoleGuard allowedRoles={["super_admin", "inventory_officer"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/inventory">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Reorder Rules
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Configure automatic reorder points and quantities
              </p>
            </div>
          </div>
          <Button onClick={openCreateModal}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Rule
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center">
              <ClipboardDocumentCheckIcon className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.total}
              </p>
              <p className="text-sm text-gray-500">Total Rules</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {stats.active}
              </p>
              <p className="text-sm text-gray-500">Active Rules</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-400 mx-auto" />
              <p className="text-2xl font-bold text-red-600 mt-2">
                {stats.lowStock}
              </p>
              <p className="text-sm text-gray-500">Low Stock Alerts</p>
            </div>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {stats.lowStock > 0 && (
          <Card className="border-red-200 bg-red-50">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <p className="font-medium text-red-800">Low Stock Alert</p>
                <p className="text-sm text-red-600">
                  {stats.lowStock} item(s) have reached their reorder point
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by item name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full max-w-md"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading reorder rules...</p>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Item</TableHeader>
                  <TableHeader>Location</TableHeader>
                  <TableHeader>Min Qty</TableHeader>
                  <TableHeader>Reorder Qty</TableHeader>
                  <TableHeader>Max Qty</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRules.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-gray-500 py-8"
                    >
                      No reorder rules found. Create rules to get low stock
                      alerts.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rule.item_name}</p>
                          <p className="text-sm text-gray-500">
                            {rule.item_sku}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {rule.location_name || "All Locations"}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                          {rule.min_quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                          {rule.reorder_quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        {rule.max_quantity ? (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                            {rule.max_quantity}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            rule.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {rule.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(rule)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => toggleStatus(rule)}
                            className={
                              rule.is_active
                                ? "text-yellow-600 hover:text-yellow-900"
                                : "text-green-600 hover:text-green-900"
                            }
                          >
                            {rule.is_active ? "Disable" : "Enable"}
                          </button>
                          <button
                            onClick={() => handleDelete(rule)}
                            className="text-red-600 hover:text-red-900"
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

        {/* Help Section */}
        <Card title="How Reorder Rules Work">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="font-medium text-red-900">Minimum Quantity</p>
              <p className="text-red-700 mt-1">
                When stock falls to or below this level, an alert is triggered
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-900">Reorder Quantity</p>
              <p className="text-blue-700 mt-1">
                Suggested quantity to order when reorder point is reached
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="font-medium text-green-900">Maximum Quantity</p>
              <p className="text-green-700 mt-1">
                Optional upper limit to prevent overstocking
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRule ? "Edit Reorder Rule" : "Add Reorder Rule"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormSelect
            label="Item"
            value={formData.item_id}
            onChange={(e) =>
              setFormData({ ...formData, item_id: e.target.value })
            }
            required
          >
            <option value="">Select Item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.sku})
              </option>
            ))}
          </FormSelect>
          <FormSelect
            label="Location (Optional)"
            value={formData.location_id}
            onChange={(e) =>
              setFormData({ ...formData, location_id: e.target.value })
            }
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </FormSelect>
          <div className="grid grid-cols-3 gap-4">
            <FormInput
              label="Min Quantity"
              type="number"
              min="0"
              value={formData.min_quantity}
              onChange={(e) =>
                setFormData({ ...formData, min_quantity: e.target.value })
              }
              required
            />
            <FormInput
              label="Reorder Quantity"
              type="number"
              min="1"
              value={formData.reorder_quantity}
              onChange={(e) =>
                setFormData({ ...formData, reorder_quantity: e.target.value })
              }
              required
            />
            <FormInput
              label="Max Quantity"
              type="number"
              min="0"
              value={formData.max_quantity}
              onChange={(e) =>
                setFormData({ ...formData, max_quantity: e.target.value })
              }
              placeholder="Optional"
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
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor="is_active"
              className="ml-2 block text-sm text-gray-900"
            >
              Active Rule
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
              {editingRule ? "Update Rule" : "Create Rule"}
            </Button>
          </div>
        </form>
      </Modal>
    </RoleGuard>
  );
}
