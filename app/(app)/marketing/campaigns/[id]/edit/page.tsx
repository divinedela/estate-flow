"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { FormTextarea } from "@/components/ui/form-textarea";
import { RoleGuard } from "@/components/auth/role-guard";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    campaign_type: "",
    status: "draft",
    start_date: "",
    end_date: "",
    budget: "",
    actual_spend: "",
    target_audience: "",
    channels: [] as string[],
    goals: "",
  });

  const supabase = createClient();

  useEffect(() => {
    if (params.id) {
      fetchCampaign();
    }
  }, [params.id]);

  async function fetchCampaign() {
    setLoading(true);

    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", params.id as string)
      .single();

    if (error || !data) {
      router.push("/marketing/campaigns");
      return;
    }

    const campaignData = data as any;
    setFormData({
      name: campaignData.name || "",
      description: campaignData.description || "",
      campaign_type: campaignData.campaign_type || "",
      status: campaignData.status || "draft",
      start_date: campaignData.start_date || "",
      end_date: campaignData.end_date || "",
      budget: campaignData.budget?.toString() || "",
      actual_spend: campaignData.actual_spend?.toString() || "",
      target_audience: campaignData.target_audience || "",
      channels: campaignData.channels || [],
      goals: campaignData.goals || "",
    });
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error } = await (supabase.from("campaigns") as any)
      .update({
        name: formData.name,
        description: formData.description || null,
        campaign_type: formData.campaign_type || null,
        status: formData.status,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        actual_spend: formData.actual_spend
          ? parseFloat(formData.actual_spend)
          : null,
        target_audience: formData.target_audience || null,
        channels: formData.channels.length > 0 ? formData.channels : null,
        goals: formData.goals || null,
      })
      .eq("id", params.id as string);

    setSaving(false);

    if (error) {
      alert("Error updating campaign: " + error.message);
      return;
    }

    router.push(`/marketing/campaigns/${params.id}`);
  }

  function handleChannelChange(channel: string) {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const campaignTypes = [
    "digital",
    "print",
    "email",
    "social_media",
    "event",
    "referral",
    "other",
  ];
  const channelOptions = [
    "Facebook",
    "Instagram",
    "Twitter",
    "LinkedIn",
    "Google Ads",
    "Email",
    "Print",
    "TV",
    "Radio",
    "Billboard",
    "Event",
    "Referral",
  ];

  return (
    <RoleGuard allowedRoles={["super_admin", "marketing_officer"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link
            href={`/marketing/campaigns/${params.id}`}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Campaign</h1>
            <p className="text-sm text-gray-500">Update campaign information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card title="Basic Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Campaign Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
              <FormSelect
                label="Status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </FormSelect>
              <FormSelect
                label="Campaign Type"
                value={formData.campaign_type}
                onChange={(e) =>
                  setFormData({ ...formData, campaign_type: e.target.value })
                }
              >
                <option value="">Select Type</option>
                {campaignTypes.map((type) => (
                  <option key={type} value={type}>
                    {type
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </FormSelect>
              <FormInput
                label="Target Audience"
                value={formData.target_audience}
                onChange={(e) =>
                  setFormData({ ...formData, target_audience: e.target.value })
                }
                placeholder="e.g., First-time home buyers"
              />
            </div>
            <div className="mt-6">
              <FormTextarea
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Campaign description..."
                rows={3}
              />
            </div>
          </Card>

          {/* Schedule */}
          <Card title="Schedule">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Start Date"
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
              />
              <FormInput
                label="End Date"
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
              />
            </div>
          </Card>

          {/* Budget */}
          <Card title="Budget">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Budget"
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={(e) =>
                  setFormData({ ...formData, budget: e.target.value })
                }
                placeholder="0.00"
              />
              <FormInput
                label="Actual Spend"
                type="number"
                step="0.01"
                value={formData.actual_spend}
                onChange={(e) =>
                  setFormData({ ...formData, actual_spend: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
          </Card>

          {/* Channels */}
          <Card title="Marketing Channels">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {channelOptions.map((channel) => (
                <label
                  key={channel}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.channels.includes(channel)}
                    onChange={() => handleChannelChange(channel)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{channel}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* Goals */}
          <Card title="Campaign Goals">
            <FormTextarea
              label="Goals & Objectives"
              value={formData.goals}
              onChange={(e) =>
                setFormData({ ...formData, goals: e.target.value })
              }
              placeholder="What are the goals of this campaign?"
              rows={4}
            />
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link href={`/marketing/campaigns/${params.id}`}>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}
