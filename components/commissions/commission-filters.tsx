"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  agent_code: string;
}

interface CommissionFiltersProps {
  agents: Agent[];
  currentAgent?: string;
  currentStatus?: string;
}

export function CommissionFilters({
  agents,
  currentAgent,
  currentStatus,
}: CommissionFiltersProps) {
  const router = useRouter();

  const handleAgentChange = (agentId: string) => {
    const params = new URLSearchParams();
    if (agentId) params.set("agent", agentId);
    if (currentStatus) params.set("status", currentStatus);

    const queryString = params.toString();
    router.push(
      queryString ? `/agents/commissions?${queryString}` : "/agents/commissions"
    );
  };

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams();
    if (currentAgent) params.set("agent", currentAgent);
    if (status) params.set("status", status);

    const queryString = params.toString();
    router.push(
      queryString ? `/agents/commissions?${queryString}` : "/agents/commissions"
    );
  };

  const clearFilters = () => {
    router.push("/agents/commissions");
  };

  return (
    <Card>
      <div className="flex items-center gap-4">
        <FunnelIcon className="h-5 w-5 text-gray-400" />
        <div className="flex-1 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Agent
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={currentAgent || ""}
              onChange={(e) => handleAgentChange(e.target.value)}
            >
              <option value="">All Agents</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.first_name} {agent.last_name} ({agent.agent_code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={currentStatus || ""}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {(currentAgent || currentStatus) && (
            <div className="flex items-end">
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
