"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createCommission } from "@/app/actions/commissions";
import { getAgents } from "@/app/actions/agents";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";

export default function NewCommissionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    agentId: "",
    transactionType: "sale",
    dealDescription: "",
    saleAmount: 0,
    commissionRate: 3.0,
    splitPercentage: 100,
    transactionDate: new Date().toISOString().split("T")[0],
    expectedPaymentDate: "",
    notes: "",
  });

  const [calculatedCommission, setCalculatedCommission] = useState({
    commissionAmount: 0,
    finalCommission: 0,
  });

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    // Recalculate commission when amounts change
    const commissionAmount =
      (formData.saleAmount * formData.commissionRate) / 100;
    const finalCommission = (commissionAmount * formData.splitPercentage) / 100;
    setCalculatedCommission({ commissionAmount, finalCommission });
  }, [formData.saleAmount, formData.commissionRate, formData.splitPercentage]);

  const loadAgents = async () => {
    const result = await getAgents();
    if (result.success) {
      setAgents(
        result.data.filter((a: any) => a.employment_status === "active")
      );
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!formData.agentId) {
        setError("Please select an agent");
        setIsSubmitting(false);
        return;
      }

      if (formData.saleAmount <= 0) {
        setError("Sale amount must be greater than 0");
        setIsSubmitting(false);
        return;
      }

      const result = await createCommission(formData);

      if (!result.success) {
        setError(result.error || "Failed to create commission");
        setIsSubmitting(false);
        return;
      }

      router.push("/agents/commissions");
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsSubmitting(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/agents/commissions">
          <Button variant="secondary" size="sm">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Record Commission
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Record a new commission for an agent
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Agent Selection */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Agent Information
          </h3>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label
                htmlFor="agentId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select Agent *
              </label>
              <select
                id="agentId"
                required
                value={formData.agentId}
                onChange={(e) => {
                  const agent = agents.find((a) => a.id === e.target.value);
                  setFormData({
                    ...formData,
                    agentId: e.target.value,
                    commissionRate: agent?.commission_rate || 3.0,
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select an agent</option>
                {agents.map((agent: any) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.first_name} {agent.last_name} ({agent.agent_code}) -{" "}
                    {agent.commission_rate}%
                  </option>
                ))}
              </select>
              {agents.length === 0 && (
                <p className="mt-2 text-sm text-red-600">
                  No active agents found. Please create an agent first.
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Transaction Details */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Transaction Details
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="transactionType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Transaction Type *
              </label>
              <select
                id="transactionType"
                required
                value={formData.transactionType}
                onChange={(e) =>
                  setFormData({ ...formData, transactionType: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="sale">Sale</option>
                <option value="lease">Lease</option>
                <option value="renewal">Renewal</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="transactionDate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Transaction Date *
              </label>
              <input
                type="date"
                id="transactionDate"
                required
                value={formData.transactionDate}
                onChange={(e) =>
                  setFormData({ ...formData, transactionDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="dealDescription"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Deal Description *
              </label>
              <input
                type="text"
                id="dealDescription"
                required
                value={formData.dealDescription}
                onChange={(e) =>
                  setFormData({ ...formData, dealDescription: e.target.value })
                }
                placeholder="e.g., 123 Main St - Residential Sale"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </Card>

        {/* Financial Details */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Financial Details
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="saleAmount"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Sale Amount ($) *
              </label>
              <input
                type="number"
                id="saleAmount"
                required
                step="0.01"
                min="0"
                value={formData.saleAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    saleAmount: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="commissionRate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Commission Rate (%) *
              </label>
              <input
                type="number"
                id="commissionRate"
                required
                step="0.01"
                min="0"
                max="100"
                value={formData.commissionRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    commissionRate: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="splitPercentage"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Split Percentage (%) *
              </label>
              <input
                type="number"
                id="splitPercentage"
                required
                step="0.01"
                min="0"
                max="100"
                value={formData.splitPercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    splitPercentage: parseFloat(e.target.value) || 100,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                100% if agent receives full commission, less if split with
                others
              </p>
            </div>

            <div>
              <label
                htmlFor="expectedPaymentDate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Expected Payment Date
              </label>
              <input
                type="date"
                id="expectedPaymentDate"
                value={formData.expectedPaymentDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expectedPaymentDate: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Commission Calculation Display */}
          <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <h4 className="text-sm font-semibold text-indigo-900 mb-3">
              Commission Breakdown
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Sale Amount:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(formData.saleAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Commission Rate:</span>
                <span className="font-medium text-gray-900">
                  {formData.commissionRate}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Commission Amount:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(calculatedCommission.commissionAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Split Percentage:</span>
                <span className="font-medium text-gray-900">
                  {formData.splitPercentage}%
                </span>
              </div>
              <div className="h-px bg-indigo-200 my-2"></div>
              <div className="flex justify-between text-base">
                <span className="font-semibold text-indigo-900">
                  Final Commission:
                </span>
                <span className="font-bold text-indigo-600 text-lg">
                  {formatCurrency(calculatedCommission.finalCommission)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Additional Notes */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Additional Information
          </h3>
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Notes
            </label>
            <textarea
              id="notes"
              rows={4}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Additional notes about this commission..."
            />
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <Link href="/agents/commissions">
            <Button type="button" variant="secondary" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting || agents.length === 0}>
            {isSubmitting ? "Creating..." : "Record Commission"}
          </Button>
        </div>
      </form>
    </div>
  );
}
