"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { FormTextarea } from "@/components/ui/form-textarea";
import { RoleGuard } from "@/components/auth/role-guard";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

type AppUser = Database["public"]["Tables"]["app_users"]["Row"];
type Project = any;

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projectManagers, setProjectManagers] = useState<AppUser[]>([]);
  const [formData, setFormData] = useState({
    project_code: "",
    name: "",
    description: "",
    project_type: "construction",
    status: "planning",
    priority: "medium",
    start_date: "",
    end_date: "",
    actual_start_date: "",
    actual_end_date: "",
    budget: "",
    actual_cost: "",
    location: "",
    address: "",
    latitude: "",
    longitude: "",
    project_manager_id: "",
    progress_percentage: "",
  });

  // Fetch project data and project managers
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
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

      // Fetch project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .eq("organization_id", (profile as any).organization_id)
        .single();

      if (projectError || !project) {
        console.error("Error fetching project:", projectError);
        router.push("/projects");
        return;
      }

      // Populate form with project data
      const projectData = project as any;
      setFormData({
        project_code: projectData.project_code || "",
        name: projectData.name || "",
        description: projectData.description || "",
        project_type: projectData.project_type || "construction",
        status: projectData.status || "planning",
        priority: projectData.priority || "medium",
        start_date: projectData.start_date
          ? new Date(projectData.start_date).toISOString().split("T")[0]
          : "",
        end_date: projectData.end_date
          ? new Date(projectData.end_date).toISOString().split("T")[0]
          : "",
        actual_start_date: projectData.actual_start_date
          ? new Date(projectData.actual_start_date).toISOString().split("T")[0]
          : "",
        actual_end_date: projectData.actual_end_date
          ? new Date(projectData.actual_end_date).toISOString().split("T")[0]
          : "",
        budget: projectData.budget ? projectData.budget.toString() : "",
        actual_cost: projectData.actual_cost
          ? projectData.actual_cost.toString()
          : "",
        location: projectData.location || "",
        address: projectData.address || "",
        latitude: projectData.latitude ? projectData.latitude.toString() : "",
        longitude: projectData.longitude
          ? projectData.longitude.toString()
          : "",
        project_manager_id: projectData.project_manager_id || "",
        progress_percentage: projectData.progress_percentage
          ? projectData.progress_percentage.toString()
          : "",
      });

      // Fetch project managers
      const { data: users } = await supabase
        .from("app_users")
        .select("id, full_name, email")
        .eq("organization_id", (profile as any).organization_id)
        .eq("is_active", true)
        .order("full_name");

      if (users) {
        setProjectManagers(users as AppUser[]);
      }

      setLoading(false);
    }

    fetchData();
  }, [projectId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("app_users")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (!(profile as any)?.organization_id)
        throw new Error("User profile not found");

      const updateData: any = {
        project_code: formData.project_code,
        name: formData.name,
        description: formData.description || null,
        project_type: formData.project_type || null,
        status: formData.status,
        priority: formData.priority,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        actual_start_date: formData.actual_start_date || null,
        actual_end_date: formData.actual_end_date || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        actual_cost: formData.actual_cost
          ? parseFloat(formData.actual_cost)
          : null,
        location: formData.location || null,
        address: formData.address || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        project_manager_id: formData.project_manager_id || null,
        progress_percentage: formData.progress_percentage
          ? parseFloat(formData.progress_percentage)
          : null,
      };

      const { error } = await (supabase.from("projects") as any)
        .update(updateData)
        .eq("id", projectId);

      if (error) throw error;

      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={["super_admin", "project_manager"]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-500">Loading project...</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["super_admin", "project_manager"]}>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/projects">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
            <p className="mt-1 text-sm text-gray-500">
              Update project information
            </p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormInput
                label="Project Code"
                required
                value={formData.project_code}
                onChange={(e) =>
                  setFormData({ ...formData, project_code: e.target.value })
                }
                placeholder="e.g., PROJ-2024-001"
              />
              <FormInput
                label="Project Name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Luxury Apartment Complex"
              />
              <FormSelect
                label="Project Type"
                value={formData.project_type}
                onChange={(e) =>
                  setFormData({ ...formData, project_type: e.target.value })
                }
                options={[
                  { value: "construction", label: "Construction" },
                  { value: "development", label: "Development" },
                  { value: "renovation", label: "Renovation" },
                  { value: "infrastructure", label: "Infrastructure" },
                  { value: "maintenance", label: "Maintenance" },
                ]}
              />
              <FormSelect
                label="Status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                options={[
                  { value: "planning", label: "Planning" },
                  { value: "active", label: "Active" },
                  { value: "on_hold", label: "On Hold" },
                  { value: "completed", label: "Completed" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
              />
              <FormSelect
                label="Priority"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                  { value: "urgent", label: "Urgent" },
                ]}
              />
              <FormSelect
                label="Project Manager"
                value={formData.project_manager_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    project_manager_id: e.target.value,
                  })
                }
                options={[
                  { value: "", label: "Select Project Manager" },
                  ...(projectManagers as any[]).map((user: any) => ({
                    value: user.id,
                    label: user.full_name || user.email || "Unknown",
                  })),
                ]}
              />
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
              <FormInput
                label="Actual Start Date"
                type="date"
                value={formData.actual_start_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    actual_start_date: e.target.value,
                  })
                }
              />
              <FormInput
                label="Actual End Date"
                type="date"
                value={formData.actual_end_date}
                onChange={(e) =>
                  setFormData({ ...formData, actual_end_date: e.target.value })
                }
              />
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
                label="Actual Cost"
                type="number"
                step="0.01"
                value={formData.actual_cost}
                onChange={(e) =>
                  setFormData({ ...formData, actual_cost: e.target.value })
                }
                placeholder="0.00"
              />
              <FormInput
                label="Progress Percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.progress_percentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    progress_percentage: e.target.value,
                  })
                }
                placeholder="0.00"
              />
              <FormInput
                label="Location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="e.g., Downtown District"
              />
            </div>

            <FormTextarea
              label="Description"
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Project description and objectives..."
            />

            <FormTextarea
              label="Address"
              rows={3}
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Full project address..."
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormInput
                label="Latitude (Optional)"
                type="number"
                step="0.00000001"
                value={formData.latitude}
                onChange={(e) =>
                  setFormData({ ...formData, latitude: e.target.value })
                }
                placeholder="e.g., 5.6037"
              />
              <FormInput
                label="Longitude (Optional)"
                type="number"
                step="0.00000001"
                value={formData.longitude}
                onChange={(e) =>
                  setFormData({ ...formData, longitude: e.target.value })
                }
                placeholder="e.g., -0.1870"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push(`/projects/${projectId}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </RoleGuard>
  );
}
