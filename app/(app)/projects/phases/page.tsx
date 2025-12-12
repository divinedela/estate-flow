"use client";

import { useState, useEffect } from "react";
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
import { Modal } from "@/components/ui/modal";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { FormTextarea } from "@/components/ui/form-textarea";
import { RoleGuard } from "@/components/auth/role-guard";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ArrowsUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

interface Project {
  id: string;
  name: string;
  project_code: string;
}

interface Phase {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  phase_order: number;
  start_date: string | null;
  end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  budget: number | null;
  actual_cost: number | null;
  progress_percentage: number | null;
  status: string;
  created_at: string;
  project?: {
    name: string;
    project_code: string;
  };
}

export default function PhasesPage() {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    project_id: "",
    name: "",
    description: "",
    phase_order: "1",
    start_date: "",
    end_date: "",
    budget: "",
    status: "not_started",
    progress_percentage: "0",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("app_users")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!(profile as any)?.organization_id) {
      setLoading(false);
      return;
    }

    // Fetch projects
    const { data: projectsData } = await supabase
      .from("projects")
      .select("id, name, project_code")
      .eq("organization_id", (profile as any).organization_id)
      .order("name");

    setProjects((projectsData || []) as Project[]);

    // Fetch phases
    const projectIds = (projectsData || []).map((p: any) => p.id);
    if (projectIds.length > 0) {
      const { data: phasesData, error } = await supabase
        .from("project_phases")
        .select(
          `
          *,
          project:projects(name, project_code)
        `
        )
        .in("project_id", projectIds)
        .order("phase_order", { ascending: true });

      if (error) {
        console.error("Error fetching phases:", error);
      } else {
        setPhases((phasesData || []) as Phase[]);
      }
    }

    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      project_id: "",
      name: "",
      description: "",
      phase_order: "1",
      start_date: "",
      end_date: "",
      budget: "",
      status: "not_started",
      progress_percentage: "0",
    });
    setEditingPhase(null);
  };

  const openCreateModal = () => {
    resetForm();
    // Set default phase order based on selected project's existing phases
    setIsModalOpen(true);
  };

  const openEditModal = (phase: Phase) => {
    setEditingPhase(phase);
    setFormData({
      project_id: phase.project_id,
      name: phase.name,
      description: phase.description || "",
      phase_order: phase.phase_order.toString(),
      start_date: phase.start_date || "",
      end_date: phase.end_date || "",
      budget: phase.budget?.toString() || "",
      status: phase.status,
      progress_percentage: phase.progress_percentage?.toString() || "0",
    });
    setIsModalOpen(true);
  };

  const getNextPhaseOrder = (projectId: string) => {
    const projectPhases = phases.filter((p) => p.project_id === projectId);
    if (projectPhases.length === 0) return 1;
    return Math.max(...projectPhases.map((p) => p.phase_order)) + 1;
  };

  const handleProjectChange = (projectId: string) => {
    const nextOrder = getNextPhaseOrder(projectId);
    setFormData({
      ...formData,
      project_id: projectId,
      phase_order: nextOrder.toString(),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();

      const phaseData = {
        project_id: formData.project_id,
        name: formData.name,
        description: formData.description || null,
        phase_order: parseInt(formData.phase_order),
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        status: formData.status,
        progress_percentage: parseFloat(formData.progress_percentage) || 0,
      };

      if (editingPhase) {
        const { error } = await (supabase.from("project_phases") as any)
          .update(phaseData)
          .eq("id", editingPhase.id);

        if (error) throw error;
      } else {
        const { error } = await (supabase.from("project_phases") as any).insert(
          phaseData
        );

        if (error) throw error;
      }

      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving phase:", error);
      alert("Error saving phase");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this phase? This will also affect any tasks linked to this phase."
      )
    )
      return;

    const supabase = createClient();
    const { error } = await supabase
      .from("project_phases")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Error deleting phase: " + error.message);
    } else {
      setPhases(phases.filter((p) => p.id !== id));
    }
  };

  const handleReorder = async (phase: Phase, direction: "up" | "down") => {
    const projectPhases = phases
      .filter((p) => p.project_id === phase.project_id)
      .sort((a, b) => a.phase_order - b.phase_order);

    const currentIndex = projectPhases.findIndex((p) => p.id === phase.id);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === projectPhases.length - 1)
    ) {
      return;
    }

    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const swapPhase = projectPhases[swapIndex];

    const supabase = createClient();

    // Swap phase orders
    const { error: error1 } = await (supabase.from("project_phases") as any)
      .update({ phase_order: swapPhase.phase_order })
      .eq("id", phase.id);

    const { error: error2 } = await (supabase.from("project_phases") as any)
      .update({ phase_order: phase.phase_order })
      .eq("id", swapPhase.id);

    if (error1 || error2) {
      alert("Error reordering phases");
    } else {
      fetchData();
    }
  };

  const filteredPhases = phases.filter((phase) => {
    const matchesSearch = phase.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || phase.status === statusFilter;
    const matchesProject = !projectFilter || phase.project_id === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const statusColors: Record<string, string> = {
    not_started: "bg-gray-100 text-gray-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    on_hold: "bg-yellow-100 text-yellow-800",
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

  return (
    <RoleGuard
      allowedRoles={["super_admin", "project_manager", "site_engineer"]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/projects">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Project Phases
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage project phases and milestones
              </p>
            </div>
          </div>
          <Button onClick={openCreateModal}>
            <PlusIcon className="h-5 w-5 mr-2" />
            New Phase
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search phases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
        </Card>

        {/* Phases Table */}
        <Card>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading phases...</p>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Order</TableHeader>
                  <TableHeader>Phase Name</TableHeader>
                  <TableHeader>Project</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Progress</TableHeader>
                  <TableHeader>Dates</TableHeader>
                  <TableHeader>Budget</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPhases.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-gray-500 py-8"
                    >
                      {searchTerm || statusFilter || projectFilter
                        ? "No phases match your filters"
                        : "No phases found. Create your first phase."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPhases.map((phase) => {
                    const progress = Number(phase.progress_percentage) || 0;
                    const projectPhases = phases
                      .filter((p) => p.project_id === phase.project_id)
                      .sort((a, b) => a.phase_order - b.phase_order);
                    const isFirst = projectPhases[0]?.id === phase.id;
                    const isLast =
                      projectPhases[projectPhases.length - 1]?.id === phase.id;

                    return (
                      <TableRow key={phase.id}>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <span className="w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-700 font-semibold rounded-full text-sm">
                              {phase.phase_order}
                            </span>
                            <div className="flex flex-col">
                              <button
                                onClick={() => handleReorder(phase, "up")}
                                disabled={isFirst}
                                className={`p-0.5 ${
                                  isFirst
                                    ? "text-gray-300"
                                    : "text-gray-500 hover:text-indigo-600"
                                }`}
                              >
                                <ChevronUpIcon className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleReorder(phase, "down")}
                                disabled={isLast}
                                className={`p-0.5 ${
                                  isLast
                                    ? "text-gray-300"
                                    : "text-gray-500 hover:text-indigo-600"
                                }`}
                              >
                                <ChevronDownIcon className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">
                              {phase.name}
                            </p>
                            {phase.description && (
                              <p className="text-xs text-gray-500 truncate max-w-xs">
                                {phase.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {phase.project?.name || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              statusColors[phase.status] ||
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {phase.status.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">
                              {progress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-gray-600">
                            {phase.start_date ? (
                              <>
                                <p>
                                  Start:{" "}
                                  {new Date(
                                    phase.start_date
                                  ).toLocaleDateString()}
                                </p>
                                {phase.end_date && (
                                  <p>
                                    End:{" "}
                                    {new Date(
                                      phase.end_date
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                              </>
                            ) : (
                              "No dates set"
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="text-gray-600">
                              {formatCurrency(phase.budget)}
                            </p>
                            {phase.actual_cost != null &&
                              phase.actual_cost > 0 && (
                                <p className="text-xs text-gray-500">
                                  Actual: {formatCurrency(phase.actual_cost)}
                                </p>
                              )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => openEditModal(phase)}
                              className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(phase.id)}
                              className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingPhase ? "Edit Phase" : "Create New Phase"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormSelect
            label="Project"
            required
            value={formData.project_id}
            onChange={(e) => handleProjectChange(e.target.value)}
            options={[
              { value: "", label: "Select Project" },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
          <FormInput
            label="Phase Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Foundation, Framing, Finishing"
          />
          <FormTextarea
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Phase description..."
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Phase Order"
              type="number"
              required
              min="1"
              value={formData.phase_order}
              onChange={(e) =>
                setFormData({ ...formData, phase_order: e.target.value })
              }
            />
            <FormSelect
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              options={[
                { value: "not_started", label: "Not Started" },
                { value: "in_progress", label: "In Progress" },
                { value: "completed", label: "Completed" },
                { value: "on_hold", label: "On Hold" },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
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
              label="Progress %"
              type="number"
              min="0"
              max="100"
              value={formData.progress_percentage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  progress_percentage: e.target.value,
                })
              }
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingPhase
                ? "Update Phase"
                : "Create Phase"}
            </Button>
          </div>
        </form>
      </Modal>
    </RoleGuard>
  );
}
