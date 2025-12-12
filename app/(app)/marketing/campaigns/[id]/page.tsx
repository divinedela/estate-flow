"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/auth/role-guard";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  MegaphoneIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  PencilIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  campaign_type: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  actual_spend: number | null;
  target_audience: string | null;
  channels: string[] | null;
  goals: string | null;
  created_at: string;
}

interface CampaignStats {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<CampaignStats>({
    totalLeads: 0,
    convertedLeads: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (params.id) {
      fetchCampaign();
    }
  }, [params.id]);

  async function fetchCampaign() {
    setLoading(true);

    // Fetch campaign
    const { data: campaignData, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", params.id as string)
      .single();

    if (error || !campaignData) {
      router.push("/marketing/campaigns");
      return;
    }

    // Fetch leads for this campaign
    const { data: leadsData } = await supabase
      .from("leads")
      .select("id, status")
      .eq("campaign_id", params.id as string);

    const totalLeads = leadsData?.length || 0;
    const convertedLeads =
      (leadsData as any[])?.filter((l: any) => l.status === "converted")
        .length || 0;
    const conversionRate =
      totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    setCampaign(campaignData);
    setStats({ totalLeads, convertedLeads, conversionRate });
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Campaign not found</p>
        <Link
          href="/marketing/campaigns"
          className="text-indigo-600 hover:text-indigo-500 mt-2 inline-block"
        >
          Back to Campaigns
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    scheduled: "bg-blue-100 text-blue-800",
    active: "bg-green-100 text-green-800",
    paused: "bg-yellow-100 text-yellow-800",
    completed: "bg-purple-100 text-purple-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const budgetUsed =
    campaign.budget && campaign.actual_spend
      ? (campaign.actual_spend / campaign.budget) * 100
      : 0;

  return (
    <RoleGuard allowedRoles={["super_admin", "marketing_officer"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/marketing/campaigns"
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {campaign.name}
              </h1>
              <p className="text-sm text-gray-500">
                {campaign.campaign_type || "Marketing Campaign"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                statusColors[campaign.status]
              }`}
            >
              {campaign.status}
            </span>
            <Link href={`/marketing/campaigns/${campaign.id}/edit`}>
              <Button>
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="text-center">
              <UserGroupIcon className="h-8 w-8 text-blue-500 mx-auto" />
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.totalLeads}
              </p>
              <p className="text-sm text-gray-500">Total Leads</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <ChartBarIcon className="h-8 w-8 text-green-500 mx-auto" />
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.convertedLeads}
              </p>
              <p className="text-sm text-gray-500">Conversions</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {stats.conversionRate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">Conversion Rate</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <CurrencyDollarIcon className="h-8 w-8 text-yellow-500 mx-auto" />
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${campaign.actual_spend?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-500">Spent</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card title="Campaign Description">
              <p className="text-gray-700 whitespace-pre-wrap">
                {campaign.description || "No description provided."}
              </p>
            </Card>

            {/* Campaign Details */}
            <Card title="Campaign Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <MegaphoneIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Campaign Type</p>
                    <p className="font-medium capitalize">
                      {campaign.campaign_type || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium">
                      {campaign.start_date
                        ? new Date(campaign.start_date).toLocaleDateString()
                        : "N/A"}
                      {" - "}
                      {campaign.end_date
                        ? new Date(campaign.end_date).toLocaleDateString()
                        : "Ongoing"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Target Audience</p>
                  <p className="font-medium">
                    {campaign.target_audience || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Channels</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {campaign.channels && campaign.channels.length > 0 ? (
                      campaign.channels.map((channel, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {channel}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Goals */}
            {campaign.goals && (
              <Card title="Campaign Goals">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {campaign.goals}
                </p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Budget */}
            <Card title="Budget">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Budget</span>
                  <span className="font-medium">
                    ${campaign.budget?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Spent</span>
                  <span className="font-medium">
                    ${campaign.actual_spend?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Remaining</span>
                  <span className="font-medium text-green-600">
                    $
                    {(
                      (campaign.budget || 0) - (campaign.actual_spend || 0)
                    ).toLocaleString()}
                  </span>
                </div>
                {campaign.budget && campaign.budget > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Budget Used</span>
                      <span>{budgetUsed.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          budgetUsed > 100
                            ? "bg-red-600"
                            : budgetUsed > 80
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card title="Quick Actions">
              <div className="space-y-2">
                <Link href={`/marketing/campaigns/${campaign.id}/edit`}>
                  <Button variant="secondary" className="w-full justify-start">
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit Campaign
                  </Button>
                </Link>
                <Link href={`/marketing/leads?campaign=${campaign.id}`}>
                  <Button variant="secondary" className="w-full justify-start">
                    <UserGroupIcon className="h-4 w-4 mr-2" />
                    View Leads
                  </Button>
                </Link>
                <Link href="/marketing/leads/new">
                  <Button variant="secondary" className="w-full justify-start">
                    <UserGroupIcon className="h-4 w-4 mr-2" />
                    Add Lead
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Timeline */}
            <Card title="Timeline">
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium">Created</p>
                    <p className="text-gray-500">
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {campaign.start_date && (
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium">Start Date</p>
                      <p className="text-gray-500">
                        {new Date(campaign.start_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                {campaign.end_date && (
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium">End Date</p>
                      <p className="text-gray-500">
                        {new Date(campaign.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
