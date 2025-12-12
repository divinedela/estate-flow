import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/auth/role-guard";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PencilIcon,
  FolderIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";

interface IssueDetails {
  id: string;
  title: string;
  description: string | null;
  issue_type: string;
  severity: string;
  status: string;
  project_id: string;
  project_name: string;
  project_code: string;
  reported_by: string | null;
  assigned_to: string | null;
  created_at: string;
  resolved_at: string | null;
}

async function getIssueDetails(id: string): Promise<IssueDetails | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("app_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!(profile as any)?.organization_id) return null;

  const { data: issueData } = await supabase
    .from("project_issues")
    .select(
      `
      id,
      title,
      description,
      issue_type,
      severity,
      status,
      project_id,
      created_at,
      resolved_date,
      project:projects(name, project_code),
      reporter:app_users!reported_by(full_name),
      assignee:app_users!assigned_to(full_name)
    `
    )
    .eq("id", id)
    .single();

  if (!issueData) return null;

  const issue = issueData as any;

  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    issue_type: issue.issue_type,
    severity: issue.severity,
    status: issue.status,
    project_id: issue.project_id,
    project_name: issue.project?.name || "Unknown",
    project_code: issue.project?.project_code || "N/A",
    reported_by: issue.reporter?.full_name || "Unknown",
    assigned_to: issue.assignee?.full_name || null,
    created_at: issue.created_at,
    resolved_at: issue.resolved_date,
  };
}

export default async function IssueDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const issue = await getIssueDetails(params.id);

  if (!issue) {
    notFound();
  }

  const severityColors: Record<string, string> = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  const statusColors: Record<string, string> = {
    open: "bg-blue-100 text-blue-800",
    in_progress: "bg-purple-100 text-purple-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
  };

  const typeColors: Record<string, string> = {
    risk: "bg-yellow-50 text-yellow-700",
    blocker: "bg-red-50 text-red-700",
    quality: "bg-blue-50 text-blue-700",
    safety: "bg-orange-50 text-orange-700",
    other: "bg-gray-50 text-gray-700",
  };

  const severityIcons: Record<string, any> = {
    low: ClockIcon,
    medium: ExclamationTriangleIcon,
    high: ExclamationTriangleIcon,
    critical: ShieldExclamationIcon,
  };

  const SeverityIcon = severityIcons[issue.severity] || ClockIcon;

  return (
    <RoleGuard
      allowedRoles={[
        "super_admin",
        "project_manager",
        "site_engineer",
        "executive",
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Issue Details</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage issue information
            </p>
          </div>
          <Link href={`/projects/issues/${issue.id}/edit`}>
            <Button>
              <PencilIcon className="h-5 w-5 mr-2" />
              Edit Issue
            </Button>
          </Link>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Card>
            <div className="flex items-center">
              <div
                className={`p-3 rounded-full ${
                  issue.status === "resolved" || issue.status === "closed"
                    ? "bg-green-100"
                    : "bg-yellow-100"
                }`}
              >
                {issue.status === "resolved" || issue.status === "closed" ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                ) : (
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                )}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {issue.status.replace("_", " ")}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div
                className={`p-3 rounded-full ${
                  issue.severity === "critical"
                    ? "bg-red-100"
                    : issue.severity === "high"
                    ? "bg-orange-100"
                    : "bg-yellow-100"
                }`}
              >
                <SeverityIcon
                  className={`h-6 w-6 ${
                    issue.severity === "critical"
                      ? "text-red-600"
                      : issue.severity === "high"
                      ? "text-orange-600"
                      : "text-yellow-600"
                  }`}
                />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Severity</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {issue.severity}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100">
                <FolderIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Project</p>
                <p className="text-lg font-semibold text-gray-900">
                  {issue.project_code}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Issue Details */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {issue.title}
                    </h2>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        typeColors[issue.issue_type] || typeColors.other
                      }`}
                    >
                      {issue.issue_type}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {issue.description || "No description provided"}
                  </p>
                </div>

                {/* Project Info */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    Project Information
                  </h3>
                  <div className="flex items-center">
                    <FolderIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {issue.project_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {issue.project_code}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Issue Metadata */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Issue Information
              </h3>
              <div className="space-y-4">
                {/* Severity */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Severity
                  </p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      severityColors[issue.severity] || severityColors.medium
                    }`}
                  >
                    {issue.severity}
                  </span>
                </div>

                {/* Status */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Status
                  </p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      statusColors[issue.status] || statusColors.open
                    }`}
                  >
                    {issue.status.replace("_", " ")}
                  </span>
                </div>

                {/* Type */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Type
                  </p>
                  <span
                    className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      typeColors[issue.issue_type] || typeColors.other
                    }`}
                  >
                    {issue.issue_type}
                  </span>
                </div>

                {/* Reported By */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Reported By
                  </p>
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {issue.reported_by}
                    </span>
                  </div>
                </div>

                {/* Assigned To */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Assigned To
                  </p>
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {issue.assigned_to || "Unassigned"}
                    </span>
                  </div>
                </div>

                {/* Created Date */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Created Date
                  </p>
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {new Date(issue.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Resolved Date */}
                {issue.resolved_at && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                      Resolved Date
                    </p>
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm text-gray-900">
                        {new Date(issue.resolved_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  href={`/projects/issues/${issue.id}/edit`}
                  className="block"
                >
                  <Button className="w-full justify-center">
                    <PencilIcon className="h-5 w-5 mr-2" />
                    Edit Issue
                  </Button>
                </Link>
                <Link href="/projects/issues" className="block">
                  <Button variant="secondary" className="w-full justify-center">
                    Back to Issues
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
