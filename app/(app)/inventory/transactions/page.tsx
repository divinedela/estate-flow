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
  ArrowsRightLeftIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  EyeIcon,
  DocumentTextIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  CubeIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface Transaction {
  id: string;
  transaction_type: string;
  quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  transaction_date: string;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  item?: {
    name: string;
    item_code: string;
    unit_of_measure: string;
  };
  location?: {
    name: string;
    country: string | null;
  };
  created_by_user?: {
    full_name: string | null;
  };
  project?: {
    name: string;
  };
}

interface Item {
  id: string;
  name: string;
  item_code: string;
  unit_of_measure: string;
  unit_price: number | null;
  category: string | null;
}

interface Location {
  id: string;
  name: string;
  code: string | null;
  country: string | null;
  location_type: string | null;
}

interface Project {
  id: string;
  name: string;
  project_code: string;
}

interface StockLevel {
  quantity: number;
  location_id: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingTransaction, setViewingTransaction] =
    useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  // Current stock for selected item
  const [currentStock, setCurrentStock] = useState<StockLevel[]>([]);
  const [selectedItemInfo, setSelectedItemInfo] = useState<Item | null>(null);

  const [formData, setFormData] = useState({
    item_id: "",
    transaction_type: "inbound",
    quantity: "",
    unit_cost: "",
    location_id: "",
    from_location_id: "",
    to_location_id: "",
    transaction_date: new Date().toISOString().split("T")[0],
    reference_type: "",
    reference_id: "",
    project_id: "",
    notes: "",
  });

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch current stock when item changes
  useEffect(() => {
    if (formData.item_id) {
      fetchItemStock(formData.item_id);
      const item = items.find((i) => i.id === formData.item_id);
      setSelectedItemInfo(item || null);
      // Auto-fill unit cost from item
      if (item?.unit_price && !formData.unit_cost) {
        setFormData((prev) => ({
          ...prev,
          unit_cost: item.unit_price?.toString() || "",
        }));
      }
    } else {
      setCurrentStock([]);
      setSelectedItemInfo(null);
    }
  }, [formData.item_id, items]);

  async function fetchItemStock(itemId: string) {
    const { data } = await supabase
      .from("stock_levels")
      .select("quantity, location_id")
      .eq("item_id", itemId);

    setCurrentStock((data || []) as StockLevel[]);
  }

  async function fetchData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = (await supabase
      .from("app_users")
      .select("organization_id")
      .eq("user_id", user.id)
      .single()) as { data: { organization_id: string } | null };

    if (!(profile as any)?.organization_id) {
      setLoading(false);
      return;
    }

    const orgId = (profile as any).organization_id;

    // Fetch transactions with related data
    const { data: transactionsData } = await supabase
      .from("stock_transactions")
      .select(
        `
        *,
        item:items(name, item_code, unit_of_measure),
        location:stock_locations(name, country),
        project:projects(name)
      `
      )
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(100);

    // Fetch items
    const { data: itemsData } = await supabase
      .from("items")
      .select("id, name, item_code, unit_of_measure, unit_price, category")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .order("name");

    // Fetch locations
    const { data: locationsData } = await supabase
      .from("stock_locations")
      .select("id, name, code, country, location_type")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .order("name");

    // Fetch projects
    const { data: projectsData } = await supabase
      .from("projects")
      .select("id, name, project_code")
      .eq("organization_id", orgId)
      .in("status", ["active", "planning"])
      .order("name");

    setTransactions((transactionsData || []) as Transaction[]);
    setItems((itemsData || []) as Item[]);
    setLocations((locationsData || []) as Location[]);
    setProjects((projectsData || []) as Project[]);
    setLoading(false);
  }

  function resetForm() {
    setFormData({
      item_id: "",
      transaction_type: "inbound",
      quantity: "",
      unit_cost: "",
      location_id: "",
      from_location_id: "",
      to_location_id: "",
      transaction_date: new Date().toISOString().split("T")[0],
      reference_type: "",
      reference_id: "",
      project_id: "",
      notes: "",
    });
    setCurrentStock([]);
    setSelectedItemInfo(null);
  }

  function getStockAtLocation(locationId: string): number {
    const stock = currentStock.find((s) => s.location_id === locationId);
    return stock?.quantity || 0;
  }

  function validateTransaction(): string | null {
    const qty = parseFloat(formData.quantity);

    if (!formData.item_id) return "Please select an item";
    if (!qty || qty <= 0) return "Please enter a valid quantity";

    if (formData.transaction_type === "outbound") {
      const locationId = formData.from_location_id || formData.location_id;
      if (!locationId) return "Please select a location";
      const available = getStockAtLocation(locationId);
      if (qty > available) {
        return `Insufficient stock. Available: ${available} ${
          selectedItemInfo?.unit_of_measure || "units"
        }`;
      }
    }

    if (formData.transaction_type === "transfer") {
      if (!formData.from_location_id) return "Please select source location";
      if (!formData.to_location_id) return "Please select destination location";
      if (formData.from_location_id === formData.to_location_id) {
        return "Source and destination must be different";
      }
      const available = getStockAtLocation(formData.from_location_id);
      if (qty > available) {
        return `Insufficient stock at source. Available: ${available} ${
          selectedItemInfo?.unit_of_measure || "units"
        }`;
      }
    }

    if (
      formData.transaction_type === "inbound" &&
      !formData.to_location_id &&
      !formData.location_id
    ) {
      return "Please select a destination location";
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationError = validateTransaction();
    if (validationError) {
      alert(validationError);
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = (await supabase
        .from("app_users")
        .select("organization_id, id")
        .eq("user_id", user.id)
        .single()) as { data: { organization_id: string; id: string } | null };

      if (!(profile as any)?.organization_id)
        throw new Error("No organization");

      const quantity = parseFloat(formData.quantity);
      const unitCost = formData.unit_cost
        ? parseFloat(formData.unit_cost)
        : null;

      // Determine location based on transaction type
      let locationId = formData.location_id;
      if (formData.transaction_type === "inbound") {
        locationId = formData.to_location_id || formData.location_id;
      } else if (formData.transaction_type === "outbound") {
        locationId = formData.from_location_id || formData.location_id;
      } else if (formData.transaction_type === "transfer") {
        locationId = formData.from_location_id; // For transfers, location_id is the source
      }

      const transactionData = {
        organization_id: (profile as any).organization_id,
        item_id: formData.item_id,
        location_id: locationId,
        transaction_type: formData.transaction_type,
        quantity: quantity,
        unit_cost: unitCost,
        total_cost: unitCost ? unitCost * quantity : null,
        transaction_date: formData.transaction_date,
        reference_type: formData.reference_type || null,
        reference_id: formData.reference_id || null,
        project_id: formData.project_id || null,
        notes: formData.notes || null,
        created_by: (profile as any).id,
      };

      const { error } = await supabase
        .from("stock_transactions")
        .insert(transactionData as any);

      if (error) throw error;

      // For transfers, create a second transaction for the destination
      if (formData.transaction_type === "transfer" && formData.to_location_id) {
        const { error: transferError } = await supabase
          .from("stock_transactions")
          .insert({
            ...transactionData,
            location_id: formData.to_location_id,
            transaction_type: "inbound",
            notes: `Transfer from ${
              locations.find((l) => l.id === formData.from_location_id)?.name ||
              "unknown"
            }. ${formData.notes || ""}`.trim(),
          } as any);

        if (transferError) {
          console.error("Transfer destination error:", transferError);
        }
      }

      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error creating transaction:", error);
      alert(
        "Error creating transaction: " + (error.message || "Unknown error")
      );
    } finally {
      setSaving(false);
    }
  }

  function viewTransaction(txn: Transaction) {
    setViewingTransaction(txn);
    setIsViewModalOpen(true);
  }

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      txn.item?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.item?.item_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || txn.transaction_type === typeFilter;
    const matchesDate = !dateFilter || txn.transaction_date === dateFilter;
    const matchesLocation =
      !locationFilter || txn.location?.name === locationFilter;
    return matchesSearch && matchesType && matchesDate && matchesLocation;
  });

  const typeColors: Record<string, string> = {
    inbound: "bg-green-100 text-green-800",
    outbound: "bg-red-100 text-red-800",
    transfer: "bg-blue-100 text-blue-800",
    adjustment: "bg-yellow-100 text-yellow-800",
    return: "bg-purple-100 text-purple-800",
  };

  const typeIcons: Record<string, React.ReactNode> = {
    inbound: <ArrowDownIcon className="h-4 w-4" />,
    outbound: <ArrowUpIcon className="h-4 w-4" />,
    transfer: <ArrowsRightLeftIcon className="h-4 w-4" />,
    adjustment: <WrenchScrewdriverIcon className="h-4 w-4" />,
    return: <ArrowPathIcon className="h-4 w-4" />,
  };

  // Calculate stats
  const today = new Date().toISOString().split("T")[0];
  const todayTransactions = transactions.filter(
    (t) => t.transaction_date === today
  );
  const stats = {
    total: transactions.length,
    today: todayTransactions.length,
    inbound: transactions.filter((t) => t.transaction_type === "inbound")
      .length,
    outbound: transactions.filter((t) => t.transaction_type === "outbound")
      .length,
    transfers: transactions.filter((t) => t.transaction_type === "transfer")
      .length,
    todayValue: todayTransactions.reduce(
      (sum, t) => sum + (t.total_cost || 0),
      0
    ),
  };

  const formatCurrency = (amount: number | null) => {
    if (amount == null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const uniqueLocations = [
    ...new Set(transactions.map((t) => t.location?.name).filter(Boolean)),
  ];

  return (
    <RoleGuard
      allowedRoles={["super_admin", "inventory_officer", "project_manager"]}
    >
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
                Stock Transactions
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Track all inventory movements and adjustments
              </p>
            </div>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusIcon className="h-5 w-5 mr-2" />
            New Transaction
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <div className="text-center">
              <ArrowsRightLeftIcon className="h-6 w-6 text-gray-400 mx-auto" />
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.total}
              </p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <CalendarDaysIcon className="h-6 w-6 text-indigo-500 mx-auto" />
              <p className="text-2xl font-bold text-indigo-600 mt-1">
                {stats.today}
              </p>
              <p className="text-xs text-gray-500">Today</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <ArrowDownIcon className="h-6 w-6 text-green-500 mx-auto" />
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.inbound}
              </p>
              <p className="text-xs text-gray-500">Inbound</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <ArrowUpIcon className="h-6 w-6 text-red-500 mx-auto" />
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats.outbound}
              </p>
              <p className="text-xs text-gray-500">Outbound</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <ArrowsRightLeftIcon className="h-6 w-6 text-blue-500 mx-auto" />
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {stats.transfers}
              </p>
              <p className="text-xs text-gray-500">Transfers</p>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by item name, code, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
              <option value="transfer">Transfer</option>
              <option value="adjustment">Adjustment</option>
              <option value="return">Return</option>
            </select>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Locations</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc || ""}>
                  {loc}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </Card>

        {/* Transactions Table */}
        <Card>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading transactions...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Date</TableHeader>
                    <TableHeader>Item</TableHeader>
                    <TableHeader>Type</TableHeader>
                    <TableHeader>Quantity</TableHeader>
                    <TableHeader>Location</TableHeader>
                    <TableHeader>Unit Cost</TableHeader>
                    <TableHeader>Total</TableHeader>
                    <TableHeader>Reference</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center text-gray-500 py-8"
                      >
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {new Date(
                                txn.transaction_date
                              ).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(txn.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">
                              {txn.item?.name || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {txn.item?.item_code}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                              typeColors[txn.transaction_type] ||
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {typeIcons[txn.transaction_type]}
                            <span className="ml-1 capitalize">
                              {txn.transaction_type}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-medium ${
                              txn.transaction_type === "outbound"
                                ? "text-red-600"
                                : txn.transaction_type === "inbound"
                                ? "text-green-600"
                                : "text-blue-600"
                            }`}
                          >
                            {txn.transaction_type === "outbound"
                              ? "-"
                              : txn.transaction_type === "inbound"
                              ? "+"
                              : ""}
                            {txn.quantity} {txn.item?.unit_of_measure || ""}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm">
                              {txn.location?.name || "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(txn.unit_cost)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(txn.total_cost)}
                        </TableCell>
                        <TableCell>
                          {txn.reference_type ? (
                            <span className="text-xs text-gray-500">
                              {txn.reference_type}
                            </span>
                          ) : txn.project?.name ? (
                            <span className="text-xs text-indigo-600">
                              {txn.project.name}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => viewTransaction(txn)}
                            className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
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

      {/* New Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title="New Stock Transaction"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Selection */}
          <div className="border-b pb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              <CubeIcon className="h-4 w-4 inline mr-1" />
              Item Details
            </h4>
            <FormSelect
              label="Select Item"
              value={formData.item_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  item_id: e.target.value,
                  unit_cost: "",
                })
              }
              options={[
                { value: "", label: "Choose an item..." },
                ...items.map((item) => ({
                  value: item.id,
                  label: `${item.name} (${item.item_code}) - ${item.unit_of_measure}`,
                })),
              ]}
            />

            {/* Show current stock info */}
            {selectedItemInfo && currentStock.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">
                  Current Stock Levels:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {currentStock.map((stock) => {
                    const loc = locations.find(
                      (l) => l.id === stock.location_id
                    );
                    return (
                      <div
                        key={stock.location_id}
                        className="text-sm text-blue-700"
                      >
                        {loc?.name}:{" "}
                        <span className="font-medium">
                          {stock.quantity} {selectedItemInfo.unit_of_measure}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Transaction Type & Quantity */}
          <div className="border-b pb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              <ArrowsRightLeftIcon className="h-4 w-4 inline mr-1" />
              Transaction Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Transaction Type"
                value={formData.transaction_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    transaction_type: e.target.value,
                    from_location_id: "",
                    to_location_id: "",
                    location_id: "",
                  })
                }
                options={[
                  { value: "inbound", label: "📥 Inbound (Receive Stock)" },
                  { value: "outbound", label: "📤 Outbound (Issue Stock)" },
                  {
                    value: "transfer",
                    label: "🔄 Transfer (Between Locations)",
                  },
                  {
                    value: "adjustment",
                    label: "🔧 Adjustment (Stock Correction)",
                  },
                  { value: "return", label: "↩️ Return (Returned Stock)" },
                ]}
              />
              <FormInput
                label={`Quantity (${
                  selectedItemInfo?.unit_of_measure || "units"
                })`}
                type="number"
                min="0.001"
                step="0.001"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                required
              />
            </div>
            <div className="mt-4">
              <FormInput
                label="Transaction Date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) =>
                  setFormData({ ...formData, transaction_date: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Location Selection - Dynamic based on type */}
          <div className="border-b pb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              <MapPinIcon className="h-4 w-4 inline mr-1" />
              Location
            </h4>

            {formData.transaction_type === "transfer" ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormSelect
                    label="From Location"
                    value={formData.from_location_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        from_location_id: e.target.value,
                      })
                    }
                    options={[
                      { value: "", label: "Select source..." },
                      ...locations.map((loc) => {
                        const stock = getStockAtLocation(loc.id);
                        return {
                          value: loc.id,
                          label: `${loc.name}${
                            loc.country ? ` (${loc.country})` : ""
                          } - Stock: ${stock}`,
                        };
                      }),
                    ]}
                  />
                  {formData.from_location_id && (
                    <p className="text-xs text-gray-500 mt-1">
                      Available: {getStockAtLocation(formData.from_location_id)}{" "}
                      {selectedItemInfo?.unit_of_measure || "units"}
                    </p>
                  )}
                </div>
                <FormSelect
                  label="To Location"
                  value={formData.to_location_id}
                  onChange={(e) =>
                    setFormData({ ...formData, to_location_id: e.target.value })
                  }
                  options={[
                    { value: "", label: "Select destination..." },
                    ...locations
                      .filter((loc) => loc.id !== formData.from_location_id)
                      .map((loc) => ({
                        value: loc.id,
                        label: `${loc.name}${
                          loc.country ? ` (${loc.country})` : ""
                        }`,
                      })),
                  ]}
                />
              </div>
            ) : formData.transaction_type === "inbound" ||
              formData.transaction_type === "return" ? (
              <FormSelect
                label="Destination Location"
                value={formData.to_location_id}
                onChange={(e) =>
                  setFormData({ ...formData, to_location_id: e.target.value })
                }
                options={[
                  { value: "", label: "Select destination..." },
                  ...locations.map((loc) => ({
                    value: loc.id,
                    label: `${loc.name}${
                      loc.country ? ` (${loc.country})` : ""
                    }`,
                  })),
                ]}
              />
            ) : (
              <div>
                <FormSelect
                  label="From Location"
                  value={formData.from_location_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      from_location_id: e.target.value,
                    })
                  }
                  options={[
                    { value: "", label: "Select location..." },
                    ...locations.map((loc) => {
                      const stock = getStockAtLocation(loc.id);
                      return {
                        value: loc.id,
                        label: `${loc.name}${
                          loc.country ? ` (${loc.country})` : ""
                        } - Stock: ${stock}`,
                      };
                    }),
                  ]}
                />
                {formData.from_location_id &&
                  formData.transaction_type === "outbound" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Available: {getStockAtLocation(formData.from_location_id)}{" "}
                      {selectedItemInfo?.unit_of_measure || "units"}
                    </p>
                  )}
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="border-b pb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Pricing</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Unit Cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_cost}
                onChange={(e) =>
                  setFormData({ ...formData, unit_cost: e.target.value })
                }
                placeholder="0.00"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Cost
                </label>
                <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-900 font-medium">
                  {formData.unit_cost && formData.quantity
                    ? formatCurrency(
                        parseFloat(formData.unit_cost) *
                          parseFloat(formData.quantity)
                      )
                    : "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Reference & Project */}
          <div className="border-b pb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Reference (Optional)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Reference Type"
                value={formData.reference_type}
                onChange={(e) =>
                  setFormData({ ...formData, reference_type: e.target.value })
                }
                options={[
                  { value: "", label: "None" },
                  { value: "purchase_order", label: "Purchase Order" },
                  { value: "goods_receipt", label: "Goods Receipt" },
                  { value: "sales_order", label: "Sales Order" },
                  { value: "work_order", label: "Work Order" },
                  { value: "manual", label: "Manual Entry" },
                ]}
              />
              <FormInput
                label="Reference ID"
                value={formData.reference_id}
                onChange={(e) =>
                  setFormData({ ...formData, reference_id: e.target.value })
                }
                placeholder="PO-001, WO-123, etc."
              />
            </div>
            <div className="mt-4">
              <FormSelect
                label="Link to Project"
                value={formData.project_id}
                onChange={(e) =>
                  setFormData({ ...formData, project_id: e.target.value })
                }
                options={[
                  { value: "", label: "No project" },
                  ...projects.map((p) => ({
                    value: p.id,
                    label: `${p.name} (${p.project_code})`,
                  })),
                ]}
              />
            </div>
          </div>

          {/* Notes */}
          <FormTextarea
            label="Notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Additional notes about this transaction..."
            rows={2}
          />

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
              {saving ? "Recording..." : "Record Transaction"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Transaction Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Transaction Details"
      >
        {viewingTransaction && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">
                  {new Date(
                    viewingTransaction.transaction_date
                  ).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <span
                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    typeColors[viewingTransaction.transaction_type]
                  }`}
                >
                  {viewingTransaction.transaction_type}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Item</p>
              <p className="font-medium">{viewingTransaction.item?.name}</p>
              <p className="text-xs text-gray-500">
                {viewingTransaction.item?.item_code}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Quantity</p>
                <p className="font-medium">
                  {viewingTransaction.quantity}{" "}
                  {viewingTransaction.item?.unit_of_measure}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unit Cost</p>
                <p className="font-medium">
                  {formatCurrency(viewingTransaction.unit_cost)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Cost</p>
                <p className="font-medium">
                  {formatCurrency(viewingTransaction.total_cost)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium">
                {viewingTransaction.location?.name || "N/A"}
              </p>
            </div>
            {viewingTransaction.project && (
              <div>
                <p className="text-sm text-gray-500">Project</p>
                <p className="font-medium">{viewingTransaction.project.name}</p>
              </div>
            )}
            {viewingTransaction.reference_type && (
              <div>
                <p className="text-sm text-gray-500">Reference</p>
                <p className="font-medium">
                  {viewingTransaction.reference_type}:{" "}
                  {viewingTransaction.reference_id}
                </p>
              </div>
            )}
            {viewingTransaction.notes && (
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-gray-700">{viewingTransaction.notes}</p>
              </div>
            )}
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-400">
                Created:{" "}
                {new Date(viewingTransaction.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </RoleGuard>
  );
}
