"use client";

import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { XMarkIcon, TrashIcon } from "@heroicons/react/24/outline";

interface FormData {
  project_id: string;
  title: string;
  description: string;
  issue_type: string;
  severity: string;
  status: string;
  assigned_to: string;
}

interface FormErrors {
  project_id?: string;
  title?: string;
  description?: string;
  issue_type?: string;
  severity?: string;
  status?: string;
  assigned_to?: string;
  submit?: string;
}

interface Project {
  id: string;
  name: string;
  project_code: string;
}

interface TeamMember {
  id: string;
  full_name: string;
}

export default function EditIssuePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    project_id: "",
    title: "",
    description: "",
    issue_type: "issue",
    severity: "medium",
    status: "open",
    assigned_to: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient() as SupabaseClient;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("app_users")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (!(profile as any)?.organization_id) return;

      // Load existing issue data
      const { data: issueData } = await supabase
        .from("project_issues")
        .select("*")
        .eq("id", params.id)
        .single();

      if (issueData && typeof issueData === "object") {
        setFormData({
          project_id: issueData.project_id ?? "",
          title: issueData.title ?? "",
          description: issueData.description ?? "",
          issue_type: issueData.issue_type ?? "issue",
          severity: issueData.severity ?? "medium",
          status: issueData.status ?? "open",
          assigned_to: issueData.assigned_to ?? "",
        });
      }

      // Load projects
      const { data: projectsData } = await supabase
        .from("projects")
        .select("id, name, project_code")
        .eq("organization_id", (profile as any)?.organization_id)
        .order("name");

      setProjects(projectsData || []);

      // Load team members
      const { data: teamData } = await supabase
        .from("app_users")
        .select("id, full_name")
        .eq("organization_id", (profile as any)?.organization_id)
        .order("full_name");

      setTeamMembers(teamData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.project_id) {
      newErrors.project_id = "Project is required";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.issue_type) {
      newErrors.issue_type = "Issue type is required";
    }

    if (!formData.severity) {
      newErrors.severity = "Severity is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const supabase = createClient() as SupabaseClient;

      const { error } = await supabase
        .from("project_issues")
        .update({
          project_id: formData.project_id,
          title: formData.title,
          description: formData.description,
          issue_type: formData.issue_type,
          severity: formData.severity,
          status: formData.status,
          assigned_to: formData.assigned_to || null,
        })
        .eq("id", params.id);

      if (error) throw error;

      router.push("/projects/issues");
      router.refresh();
    } catch (error: any) {
      console.error("Error updating issue:", error);
      setErrors({ submit: error.message || "Failed to update issue" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const supabase = createClient() as SupabaseClient;

      const { error } = await supabase
        .from("project_issues")
        .delete()
        .eq("id", params.id);

      if (error) throw error;

      router.push("/projects/issues");
      router.refresh();
    } catch (error: any) {
      console.error("Error deleting issue:", error);
      setErrors({ submit: error.message || "Failed to delete issue" });
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const field = name as keyof FormData;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Issue</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update issue details and status
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => router.push("/projects/issues")}
        >
          <XMarkIcon className="h-5 w-5 mr-2" />
          Cancel
        </Button>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{errors.submit}</div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Project */}
            <div className="sm:col-span-2">
              <label
                htmlFor="project_id"
                className="block text-sm font-medium text-gray-700"
              >
                Project <span className="text-red-500">*</span>
              </label>
              <select
                id="project_id"
                name="project_id"
                value={formData.project_id}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm ${
                  errors.project_id
                    ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                }`}
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.project_code} - {project.name}
                  </option>
                ))}
              </select>
              {errors.project_id && (
                <p className="mt-1 text-sm text-red-600">{errors.project_id}</p>
              )}
            </div>

            {/* Title */}
            <div className="sm:col-span-2">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm ${
                  errors.title
                    ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                }`}
                placeholder="Brief description of the issue"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm ${
                  errors.description
                    ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                }`}
                placeholder="Detailed description of the issue"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Issue Type */}
            <div>
              <label
                htmlFor="issue_type"
                className="block text-sm font-medium text-gray-700"
              >
                Type <span className="text-red-500">*</span>
              </label>
              <select
                id="issue_type"
                name="issue_type"
                value={formData.issue_type}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm ${
                  errors.issue_type
                    ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                }`}
              >
                <option value="risk">Risk</option>
                <option value="blocker">Blocker</option>
                <option value="quality">Quality</option>
                <option value="safety">Safety</option>
                <option value="other">Other</option>
              </select>
              {errors.issue_type && (
                <p className="mt-1 text-sm text-red-600">{errors.issue_type}</p>
              )}
            </div>

            {/* Severity */}
            <div>
              <label
                htmlFor="severity"
                className="block text-sm font-medium text-gray-700"
              >
                Severity <span className="text-red-500">*</span>
              </label>
              <select
                id="severity"
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm ${
                  errors.severity
                    ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                }`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              {errors.severity && (
                <p className="mt-1 text-sm text-red-600">{errors.severity}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Assigned To */}
            <div>
              <label
                htmlFor="assigned_to"
                className="block text-sm font-medium text-gray-700"
              >
                Assign To
              </label>
              <select
                id="assigned_to"
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Delete Issue
            </Button>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/projects/issues")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <Card className="max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Delete Issue
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this issue? This action cannot
                be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
