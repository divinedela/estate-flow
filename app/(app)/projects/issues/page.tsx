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
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  BugAntIcon,
  ShieldExclamationIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";

interface Issue {
  id: string;
  title: string;
  description: string | null;
  issue_type: string;
  severity: string;
  status: string;
  project_id: string;
  project_name: string;
  reported_by: string | null;
  assigned_to: string | null;
  created_at: string;
  resolved_at: string | null;
}

async function getProjectIssues() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      issues: [] as Issue[],
      totalIssues: 0,
      openIssues: 0,
      inProgressIssues: 0,
      resolvedIssues: 0,
      criticalIssues: 0,
    };
  }

  const { data: profile } = await supabase
    .from("app_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!(profile as any)?.organization_id) {
    return {
      issues: [] as Issue[],
      totalIssues: 0,
      openIssues: 0,
      inProgressIssues: 0,
      resolvedIssues: 0,
      criticalIssues: 0,
    };
  }

  // Fetch issues from database
  const { data: issuesData } = await supabase
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
      project:projects(name),
      reporter:app_users!reported_by(full_name),
      assignee:app_users!assigned_to(full_name)
    `
    )
    .eq("projects.organization_id", (profile as any).organization_id)
    .order("created_at", { ascending: false });

  const issues = (issuesData || []).map((issue: any) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    issue_type: issue.issue_type,
    severity: issue.severity,
    status: issue.status,
    project_id: issue.project_id,
    project_name: issue.project?.name || "Unknown",
    reported_by: issue.reporter?.full_name || null,
    assigned_to: issue.assignee?.full_name || null,
    created_at: issue.created_at,
    resolved_at: issue.resolved_date,
  })) as Issue[];

  const totalIssues = issues.length;
  const openIssues = issues.filter((i) => i.status === "open").length;
  const inProgressIssues = issues.filter(
    (i) => i.status === "in_progress"
  ).length;
  const resolvedIssues = issues.filter((i) => i.status === "resolved").length;
  const criticalIssues = issues.filter((i) => i.severity === "critical").length;

  return {
    issues,
    totalIssues,
    openIssues,
    inProgressIssues,
    resolvedIssues,
    criticalIssues,
  };
}

export default async function IssuesPage() {
  const stats = await getProjectIssues();

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
    bug: "bg-red-50 text-red-700",
    issue: "bg-orange-50 text-orange-700",
    enhancement: "bg-blue-50 text-blue-700",
    question: "bg-purple-50 text-purple-700",
  };

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
            <h1 className="text-3xl font-bold text-gray-900">
              Issues Tracking
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Track and resolve project issues and bugs
            </p>
          </div>
          <Link href="/projects/issues/new">
            <Button>
              <PlusIcon className="h-5 w-5 mr-2" />
              Report Issue
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100">
                <ExclamationTriangleIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Issues
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalIssues}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <ClockIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Open</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.openIssues}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <BugAntIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.inProgressIssues}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Resolved</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.resolvedIssues}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <ShieldExclamationIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Critical</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.criticalIssues}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-wrap gap-4 items-center">
            <select className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Projects</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Types</option>
              <option value="bug">Bug</option>
              <option value="issue">Issue</option>
              <option value="enhancement">Enhancement</option>
              <option value="question">Question</option>
            </select>
          </div>
        </Card>

        {/* Issues Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Issue</TableHeader>
                  <TableHeader>Project</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Severity</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Reported</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.issues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No issues
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No issues have been reported yet.
                      </p>
                      <div className="mt-6">
                        <Button className="inline-flex items-center">
                          <PlusIcon className="h-5 w-5 mr-2" />
                          Report Issue
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.issues.map((issue) => (
                    <TableRow key={issue.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {issue.title}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {issue.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <FolderIcon className="h-4 w-4 mr-1 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {issue.project_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            typeColors[issue.issue_type] || typeColors.issue
                          }`}
                        >
                          {issue.issue_type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            severityColors[issue.severity] ||
                            severityColors.medium
                          }`}
                        >
                          {issue.severity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            statusColors[issue.status] || statusColors.open
                          }`}
                        >
                          {issue.status.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(issue.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        <Link
                          href={`/projects/issues/${issue.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Details
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </RoleGuard>
  );
}
