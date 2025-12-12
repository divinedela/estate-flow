"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getCommission,
  approveCommission,
  rejectCommission,
  markCommissionPaid,
  deleteCommission,
} from "@/app/actions/commissions";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function CommissionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [commission, setCommission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paymentAmount: 0,
    paymentMethod: "bank_transfer",
    paymentReference: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    loadCommission();
  }, [params.id]);

  const loadCommission = async () => {
    const result = (await getCommission(params.id)) as any;
    if (result.success && result.data) {
      setCommission(result.data);
      setPaymentData((prev) => ({
        ...prev,
        paymentAmount: result.data.final_commission,
      }));
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to approve this commission?")) return;

    setIsProcessing(true);
    const result = await approveCommission(params.id);

    if (result.success) {
      await loadCommission();
      alert("Commission approved successfully!");
    } else {
      alert(result.error || "Failed to approve commission");
    }
    setIsProcessing(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    setIsProcessing(true);
    const result = await rejectCommission(params.id, rejectReason);

    if (result.success) {
      await loadCommission();
      setShowRejectModal(false);
      setRejectReason("");
      alert("Commission rejected");
    } else {
      alert(result.error || "Failed to reject commission");
    }
    setIsProcessing(false);
  };

  const handleMarkPaid = async () => {
    if (paymentData.paymentAmount <= 0) {
      alert("Payment amount must be greater than 0");
      return;
    }

    setIsProcessing(true);
    const result = await markCommissionPaid(params.id, paymentData);

    if (result.success) {
      await loadCommission();
      setShowPaymentModal(false);
      alert("Commission marked as paid!");
    } else {
      alert(result.error || "Failed to mark as paid");
    }
    setIsProcessing(false);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this commission? This action cannot be undone."
      )
    )
      return;

    setIsProcessing(true);
    const result = await deleteCommission(params.id);

    if (result.success) {
      router.push("/agents/commissions");
    } else {
      alert(result.error || "Failed to delete commission");
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!commission) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Commission not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/agents/commissions">
            <Button variant="secondary" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Commission Details
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {commission.deal_description || "Commission Record"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
              statusColors[commission.status] || statusColors.pending
            }`}
          >
            {commission.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Summary */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Financial Details
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Sale Amount</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {formatCurrency(commission.sale_amount)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Commission Rate
                </p>
                <p className="mt-1 text-2xl font-bold text-indigo-600">
                  {commission.commission_rate}%
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Commission Amount
                </p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {formatCurrency(commission.commission_amount)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Split Percentage
                </p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {commission.split_percentage}%
                </p>
              </div>
              <div className="col-span-2 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-500">
                  Final Commission (After Split)
                </p>
                <p className="mt-1 text-3xl font-bold text-green-600">
                  {formatCurrency(commission.final_commission)}
                </p>
              </div>
            </div>
          </Card>

          {/* Transaction Details */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Transaction Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Transaction Type
                </p>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {commission.transaction_type}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Transaction Date
                </p>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(commission.transaction_date)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-500">
                  Deal Description
                </p>
                <p className="mt-1 text-sm text-gray-900">
                  {commission.deal_description || "N/A"}
                </p>
              </div>
              {commission.property && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Property</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {commission.property.name} (
                    {commission.property.property_code})
                  </p>
                </div>
              )}
              {commission.lead && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Lead</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {commission.lead.first_name} {commission.lead.last_name}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Payment Details (if paid) */}
          {commission.status === "paid" && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Payment Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Payment Amount
                  </p>
                  <p className="mt-1 text-sm font-semibold text-green-600">
                    {formatCurrency(commission.payment_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Payment Date
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(commission.payment_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Payment Method
                  </p>
                  <p className="mt-1 text-sm text-gray-900 capitalize">
                    {commission.payment_method?.replace("_", " ")}
                  </p>
                </div>
                {commission.payment_reference && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Payment Reference
                    </p>
                    <p className="mt-1 text-sm text-gray-900">
                      {commission.payment_reference}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Notes */}
          {commission.notes && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Notes
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {commission.notes}
              </p>
            </Card>
          )}

          {/* Rejection Reason */}
          {commission.status === "rejected" && commission.dispute_reason && (
            <Card>
              <h3 className="text-lg font-semibold text-red-900 mb-4">
                Rejection Reason
              </h3>
              <p className="text-sm text-red-700 whitespace-pre-wrap">
                {commission.dispute_reason}
              </p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Agent Information */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="mt-1 text-sm text-gray-900">
                  {commission.agent.first_name} {commission.agent.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Agent Code</p>
                <p className="mt-1 text-sm text-gray-900">
                  {commission.agent.agent_code}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="mt-1 text-sm text-gray-900">
                  {commission.agent.email}
                </p>
              </div>
              {commission.agent.phone && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {commission.agent.phone}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Actions
            </h3>
            <div className="space-y-2">
              {commission.status === "pending" && (
                <>
                  <Button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Approve Commission
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowRejectModal(true)}
                    disabled={isProcessing}
                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <XCircleIcon className="h-5 w-5 mr-2" />
                    Reject Commission
                  </Button>
                </>
              )}

              {commission.status === "approved" && (
                <Button
                  onClick={() => setShowPaymentModal(true)}
                  disabled={isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <BanknotesIcon className="h-5 w-5 mr-2" />
                  Mark as Paid
                </Button>
              )}

              {commission.status !== "paid" && (
                <Button
                  variant="secondary"
                  onClick={handleDelete}
                  disabled={isProcessing}
                  className="w-full border-red-300 text-red-600 hover:bg-red-50"
                >
                  <TrashIcon className="h-5 w-5 mr-2" />
                  Delete Commission
                </Button>
              )}
            </div>
          </Card>

          {/* Timeline */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-gray-400"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Created</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(commission.created_at)}
                  </p>
                </div>
              </div>
              {commission.approval_date && (
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-400"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Approved
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(commission.approval_date)}
                    </p>
                    {commission.approver && (
                      <p className="text-xs text-gray-500">
                        by {commission.approver.full_name}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {commission.payment_date && (
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-green-400"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Paid</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(commission.payment_date)}
                    </p>
                  </div>
                </div>
              )}
              {commission.expected_payment_date &&
                commission.status !== "paid" && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-yellow-400"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Expected Payment
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(commission.expected_payment_date)}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </Card>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Record Payment
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.paymentAmount}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      paymentAmount: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      paymentMethod: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                  <option value="payroll">Payroll</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Reference
                </label>
                <input
                  type="text"
                  value={paymentData.paymentReference}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      paymentReference: e.target.value,
                    })
                  }
                  placeholder="Check #, Transaction ID, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentData.paymentDate}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      paymentDate: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleMarkPaid} disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Confirm Payment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Commission
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection *
                </label>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this commission is being rejected..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={isProcessing}
                className="bg-red-600 hover:bg-red-700"
              >
                {isProcessing ? "Processing..." : "Reject Commission"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
