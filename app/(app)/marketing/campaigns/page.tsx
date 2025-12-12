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
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  ArrowLeftIcon,
  EyeIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

async function getCampaigns() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("app_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!(profile as any)?.organization_id) return [];

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("organization_id", (profile as any).organization_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching campaigns:", error);
    return [];
  }

  return campaigns || [];
}

async function getCampaignStats() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { total: 0, active: 0, completed: 0, draft: 0 };

  const { data: profile } = await supabase
    .from("app_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!(profile as any)?.organization_id)
    return { total: 0, active: 0, completed: 0, draft: 0 };

  const orgId = (profile as any).organization_id;

  const { count: total } = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId);

  const { count: active } = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "active");

  const { count: completed } = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "completed");

  const { count: draft } = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "draft");

  return {
    total: total || 0,
    active: active || 0,
    completed: completed || 0,
    draft: draft || 0,
  };
}

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();
  const stats = await getCampaignStats();

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    active: "bg-green-100 text-green-800",
    paused: "bg-yellow-100 text-yellow-800",
    completed: "bg-blue-100 text-blue-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const typeColors: Record<string, string> = {
    email: "bg-blue-100 text-blue-800",
    social: "bg-purple-100 text-purple-800",
    sms: "bg-green-100 text-green-800",
    event: "bg-orange-100 text-orange-800",
    print: "bg-gray-100 text-gray-800",
    digital: "bg-indigo-100 text-indigo-800",
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  return (
    <RoleGuard allowedRoles={["super_admin", "marketing_officer"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/marketing"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <Link
                  href="/marketing"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Marketing
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-sm text-gray-500">Campaigns</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            </div>
          </div>
          <Link href="/marketing/campaigns/new">
            <Button>New Campaign</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Campaigns</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-blue-600">
              {stats.completed}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Draft</p>
            <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <Button variant="secondary" className="whitespace-nowrap">
            All ({stats.total})
          </Button>
          <Button variant="secondary" className="whitespace-nowrap">
            Active ({stats.active})
          </Button>
          <Button variant="secondary" className="whitespace-nowrap">
            Completed ({stats.completed})
          </Button>
          <Button variant="secondary" className="whitespace-nowrap">
            Draft ({stats.draft})
          </Button>
        </div>

        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Start Date</TableHeader>
                <TableHeader>End Date</TableHeader>
                <TableHeader>Budget</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Leads</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {campaigns.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-gray-500 py-8"
                  >
                    No campaigns found.{" "}
                    <Link
                      href="/marketing/campaigns/new"
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      Create your first campaign
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign: any) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">
                          {campaign.name}
                        </p>
                        {campaign.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                            {campaign.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          typeColors[campaign.type] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {campaign.type || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(campaign.start_date)}</TableCell>
                    <TableCell>{formatDate(campaign.end_date)}</TableCell>
                    <TableCell>{formatCurrency(campaign.budget)}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          statusColors[campaign.status] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {campaign.leads_generated || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/marketing/campaigns/${campaign.id}`}
                          className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                          title="View"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <Link
                          href={`/marketing/campaigns/${campaign.id}/edit`}
                          className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </RoleGuard>
  );
}
