import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/auth/role-guard";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getLead(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Get user's organization
  const { data: profile } = await supabase
    .from("app_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!(profile as any)?.organization_id) return null;

  // Fetch lead with related data
  const { data: lead, error } = await supabase
    .from("leads")
    .select(
      `
      *,
      contact:contacts(
        id,
        first_name,
        last_name,
        email,
        phone,
        company,
        job_title
      ),
      campaign:campaigns(
        id,
        name
      ),
      assigned_user:app_users!leads_assigned_to_fkey(
        id,
        full_name,
        email
      )
    `
    )
    .eq("id", id)
    .eq("organization_id", (profile as any).organization_id)
    .single();

  if (error || !lead) return null;

  return lead as any;
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = (await getLead(id)) as any;

  if (!lead) {
    notFound();
  }

  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-yellow-100 text-yellow-800",
    qualified: "bg-purple-100 text-purple-800",
    hot: "bg-red-100 text-red-800",
    warm: "bg-orange-100 text-orange-800",
    cold: "bg-gray-100 text-gray-800",
    converted: "bg-green-100 text-green-800",
    lost: "bg-red-100 text-red-800",
  };

  const priorityColors: Record<string, string> = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-red-100 text-red-800",
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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

  const formatDateTime = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const contact = lead.contact as any;
  const campaign = lead.campaign as any;
  const assignedUser = lead.assigned_user as any;
  const contactName = contact
    ? `${contact.first_name || ""} ${contact.last_name || ""}`.trim() || "N/A"
    : "No Contact";

  return (
    <RoleGuard allowedRoles={["super_admin", "marketing_officer"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/marketing/leads">
                <Button variant="secondary" size="sm">
                  ← Back to Leads
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Lead Details
                </h1>
                <p className="mt-1 text-sm text-gray-500">{contactName}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/marketing/leads/${id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
          </div>
        </div>

        {/* Status and Priority Badges */}
        <div className="flex items-center gap-4">
          <div>
            <span className="text-sm font-medium text-gray-500">Status:</span>
            <span
              className={`ml-2 px-3 py-1 text-sm font-medium rounded-full ${
                statusColors[lead.status || "new"] || statusColors.new
              }`}
            >
              {lead.status || "new"}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Priority:</span>
            <span
              className={`ml-2 px-3 py-1 text-sm font-medium rounded-full ${
                priorityColors[lead.priority || "medium"] ||
                priorityColors.medium
              }`}
            >
              {lead.priority || "medium"}
            </span>
          </div>
          {lead.interest_type && (
            <div>
              <span className="text-sm font-medium text-gray-500">
                Interest:
              </span>
              <span className="ml-2 text-sm font-semibold text-gray-900 capitalize">
                {lead.interest_type}
              </span>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            {contact && (
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Contact Information
                  </h2>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Name
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {contactName}
                      </dd>
                    </div>
                    {contact.email && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Email
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {contact.email}
                        </dd>
                      </div>
                    )}
                    {contact.phone && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Phone
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {contact.phone}
                        </dd>
                      </div>
                    )}
                    {contact.company && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Company
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {contact.company}
                        </dd>
                      </div>
                    )}
                    {contact.job_title && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Job Title
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {contact.job_title}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </Card>
            )}

            {/* Lead Information */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Lead Information
                </h2>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Lead Source
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">
                      {lead.lead_source || "N/A"}
                    </dd>
                  </div>
                  {campaign && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Campaign
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {campaign.name}
                      </dd>
                    </div>
                  )}
                  {assignedUser && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Assigned To
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {assignedUser.full_name || assignedUser.email}
                      </dd>
                    </div>
                  )}
                  {lead.preferred_property_type && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Preferred Property Type
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 capitalize">
                        {lead.preferred_property_type}
                      </dd>
                    </div>
                  )}
                  {lead.preferred_location && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">
                        Preferred Location
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {lead.preferred_location}
                      </dd>
                    </div>
                  )}
                  {lead.expected_timeline && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Expected Timeline
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {lead.expected_timeline}
                      </dd>
                    </div>
                  )}
                  {lead.next_follow_up_date && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Next Follow-up
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDateTime(lead.next_follow_up_date)}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </Card>

            {/* Notes */}
            {lead.notes && (
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Notes
                  </h2>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {lead.notes}
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Budget & Metadata */}
          <div className="space-y-6">
            {/* Budget Information */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Budget Range
                </h2>
                <div className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Minimum
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900">
                      {formatCurrency(
                        lead.budget_min ? Number(lead.budget_min) : null
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Maximum
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900">
                      {formatCurrency(
                        lead.budget_max ? Number(lead.budget_max) : null
                      )}
                    </dd>
                  </div>
                </div>
              </div>
            </Card>

            {/* Metadata */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Metadata
                </h2>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Created
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(lead.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Last Updated
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(lead.updated_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </dd>
                  </div>
                  {lead.converted_at && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Converted At
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDateTime(lead.converted_at)}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
