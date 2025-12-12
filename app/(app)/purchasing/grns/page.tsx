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
  ClipboardDocumentCheckIcon,
  PlusIcon,
  EyeIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface GoodsReceipt {
  id: string;
  grn_number: string;
  po_id: string | null;
  po_number?: string;
  supplier_id: string | null;
  supplier_name?: string;
  received_date: string;
  received_by: string | null;
  status: string;
  total_items: number | null;
  total_quantity: number | null;
  notes: string | null;
  created_at: string;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_name?: string;
}

export default function GoodsReceiptsPage() {
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formData, setFormData] = useState({
    po_id: "",
    received_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    // Fetch GRNs
    const { data: grnsData } = await supabase
      .from("goods_receipts")
      .select(
        `
        *,
        po:purchase_orders(po_number, supplier:suppliers(name))
      `
      )
      .order("created_at", { ascending: false });

    // Fetch open POs for creating new GRN
    const { data: posData } = await supabase
      .from("purchase_orders")
      .select(
        `
        id,
        po_number,
        supplier:suppliers(name)
      `
      )
      .in("status", ["sent", "confirmed", "partial"])
      .order("po_number");

    setReceipts(
      (grnsData as any[])?.map((grn: any) => ({
        ...grn,
        po_number: grn.po?.po_number,
        supplier_name: grn.po?.supplier?.name,
      })) || []
    );

    setPurchaseOrders(
      (posData as any[])?.map((po: any) => ({
        ...po,
        supplier_name: po.supplier?.name,
      })) || []
    );

    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const grnNumber = `GRN-${Date.now().toString().slice(-8)}`;

    // Get PO details
    const selectedPO = purchaseOrders.find((po) => po.id === formData.po_id);

    await (supabase.from("goods_receipts") as any).insert({
      grn_number: grnNumber,
      po_id: formData.po_id,
      received_date: formData.received_date,
      notes: formData.notes || null,
      status: "pending",
    });

    setIsModalOpen(false);
    setFormData({
      po_id: "",
      received_date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    fetchData();
  }

  async function updateStatus(id: string, status: string) {
    await (supabase.from("goods_receipts") as any)
      .update({ status })
      .eq("id", id);

    fetchData();
  }

  const filteredReceipts = receipts.filter((grn) => {
    const matchesSearch =
      grn.grn_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grn.po_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || grn.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    verified: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  const stats = {
    total: receipts.length,
    pending: receipts.filter((g) => g.status === "pending").length,
    completed: receipts.filter((g) => g.status === "completed").length,
    thisMonth: receipts.filter((g) => {
      const date = new Date(g.received_date);
      const now = new Date();
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length,
  };

  return (
    <RoleGuard
      allowedRoles={["super_admin", "procurement_officer", "inventory_officer"]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/purchasing">
              <Button variant="secondary" size="sm">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Goods Receipts (GRN)
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Record and verify received goods
              </p>
            </div>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusIcon className="h-5 w-5 mr-2" />
            New GRN
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="text-center">
              <ClipboardDocumentCheckIcon className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.total}
              </p>
              <p className="text-sm text-gray-500">Total GRNs</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </p>
              <p className="text-sm text-gray-500">Pending Verification</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {stats.completed}
              </p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {stats.thisMonth}
              </p>
              <p className="text-sm text-gray-500">This Month</p>
            </div>
          </Card>
        </div>

        <Card>
          <div className="mb-4 flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search GRNs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading receipts...</p>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>GRN Number</TableHeader>
                  <TableHeader>PO Number</TableHeader>
                  <TableHeader>Supplier</TableHeader>
                  <TableHeader>Received Date</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReceipts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-gray-500 py-8"
                    >
                      No goods receipts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReceipts.map((grn) => (
                    <TableRow key={grn.id}>
                      <TableCell className="font-medium">
                        {grn.grn_number}
                      </TableCell>
                      <TableCell>{grn.po_number || "N/A"}</TableCell>
                      <TableCell>{grn.supplier_name || "N/A"}</TableCell>
                      <TableCell>
                        {new Date(grn.received_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            statusColors[grn.status]
                          }`}
                        >
                          {grn.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <button className="text-indigo-600 hover:text-indigo-900">
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          {grn.status === "pending" && (
                            <select
                              value={grn.status}
                              onChange={(e) =>
                                updateStatus(grn.id, e.target.value)
                              }
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="pending">Pending</option>
                              <option value="verified">Verified</option>
                              <option value="completed">Completed</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          )}
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
        title="New Goods Receipt"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormSelect
            label="Purchase Order"
            value={formData.po_id}
            onChange={(e) =>
              setFormData({ ...formData, po_id: e.target.value })
            }
            required
          >
            <option value="">Select PO</option>
            {purchaseOrders.map((po) => (
              <option key={po.id} value={po.id}>
                {po.po_number} - {po.supplier_name}
              </option>
            ))}
          </FormSelect>
          <FormInput
            label="Received Date"
            type="date"
            value={formData.received_date}
            onChange={(e) =>
              setFormData({ ...formData, received_date: e.target.value })
            }
            required
          />
          <FormTextarea
            label="Notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Any notes about the delivery..."
            rows={3}
          />
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              After creating the GRN, you can add individual line items and
              quantities received.
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create GRN</Button>
          </div>
        </form>
      </Modal>
    </RoleGuard>
  );
}
