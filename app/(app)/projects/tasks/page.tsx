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
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface Project {
  id: string;
  name: string;
  project_code: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  progress_percentage: number | null;
  project_id: string;
  assigned_to: string | null;
  project?: {
    name: string;
    project_code: string;
  };
  assignee?: {
    full_name: string | null;
    email: string | null;
  };
}

interface Employee {
  id: string;
  full_name: string | null;
  email: string | null;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_id: "",
    assigned_to: "",
    status: "todo",
    priority: "medium",
    due_date: "",
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

    // Fetch employees
    const { data: employeesData } = await supabase
      .from("app_users")
      .select("id, full_name, email")
      .eq("organization_id", (profile as any).organization_id)
      .eq("is_active", true)
      .order("full_name");

    setEmployees((employeesData || []) as Employee[]);

    // Fetch tasks
    const projectIds = (projectsData || []).map((p: any) => p.id);
    if (projectIds.length > 0) {
      const { data: tasksData, error } = await supabase
        .from("project_tasks")
        .select(
          `
          *,
          project:projects(name, project_code),
          assignee:app_users!project_tasks_assigned_to_fkey(full_name, email)
        `
        )
        .in("project_id", projectIds)
        .order("due_date", { ascending: true });

      if (error) {
        console.error("Error fetching tasks:", error);
      } else {
        setTasks((tasksData || []) as Task[]);
      }
    }

    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      project_id: "",
      assigned_to: "",
      status: "todo",
      priority: "medium",
      due_date: "",
      progress_percentage: "0",
    });
    setEditingTask(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      project_id: task.project_id,
      assigned_to: task.assigned_to || "",
      status: task.status,
      priority: task.priority,
      due_date: task.due_date || "",
      progress_percentage: task.progress_percentage?.toString() || "0",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();

      const taskData = {
        title: formData.title,
        description: formData.description || null,
        project_id: formData.project_id,
        assigned_to: formData.assigned_to || null,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date || null,
        progress_percentage: parseFloat(formData.progress_percentage) || 0,
      };

      if (editingTask) {
        const { error } = await (supabase.from("project_tasks") as any)
          .update(taskData)
          .eq("id", editingTask.id);

        if (error) throw error;
      } else {
        const { error } = await (supabase.from("project_tasks") as any).insert(
          taskData
        );

        if (error) throw error;
      }

      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving task:", error);
      alert("Error saving task");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("project_tasks")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Error deleting task: " + error.message);
    } else {
      setTasks(tasks.filter((t) => t.id !== id));
    }
  };

  const handleMarkComplete = async (task: Task) => {
    const supabase = createClient();
    const { error } = await (supabase.from("project_tasks") as any)
      .update({ status: "completed", progress_percentage: 100 })
      .eq("id", task.id);

    if (error) {
      alert("Error updating task: " + error.message);
    } else {
      fetchData();
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesProject = !projectFilter || task.project_id === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const statusColors: Record<string, string> = {
    todo: "bg-gray-100 text-gray-800",
    in_progress: "bg-blue-100 text-blue-800",
    review: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    blocked: "bg-red-100 text-red-800",
  };

  const priorityColors: Record<string, string> = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
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
                Project Tasks
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and track project tasks
              </p>
            </div>
          </div>
          <Button onClick={openCreateModal}>
            <PlusIcon className="h-5 w-5 mr-2" />
            New Task
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
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
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </Card>

        {/* Tasks Table */}
        <Card>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading tasks...</p>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Task</TableHeader>
                  <TableHeader>Project</TableHeader>
                  <TableHeader>Assigned To</TableHeader>
                  <TableHeader>Priority</TableHeader>
                  <TableHeader>Due Date</TableHeader>
                  <TableHeader>Progress</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-gray-500 py-8"
                    >
                      {searchTerm || statusFilter || projectFilter
                        ? "No tasks match your filters"
                        : "No tasks found. Create your first task."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((task) => {
                    const progress = Number(task.progress_percentage) || 0;
                    const isOverdue =
                      task.due_date &&
                      task.due_date < new Date().toISOString().split("T")[0] &&
                      task.status !== "completed";
                    return (
                      <TableRow
                        key={task.id}
                        className={isOverdue ? "bg-red-50" : ""}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-gray-500 truncate max-w-xs">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {task.project?.name || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {task.assignee?.full_name ||
                              task.assignee?.email ||
                              "Unassigned"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              priorityColors[task.priority] ||
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-sm ${
                              isOverdue
                                ? "text-red-600 font-medium"
                                : "text-gray-600"
                            }`}
                          >
                            {task.due_date
                              ? new Date(task.due_date).toLocaleDateString()
                              : "No date"}
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
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              statusColors[task.status] ||
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {task.status.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {task.status !== "completed" && (
                              <button
                                onClick={() => handleMarkComplete(task)}
                                className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                                title="Mark Complete"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => openEditModal(task)}
                              className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(task.id)}
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
        title={editingTask ? "Edit Task" : "Create New Task"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Task Title"
            required
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Enter task title"
          />
          <FormTextarea
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Task description..."
            rows={3}
          />
          <FormSelect
            label="Project"
            required
            value={formData.project_id}
            onChange={(e) =>
              setFormData({ ...formData, project_id: e.target.value })
            }
            options={[
              { value: "", label: "Select Project" },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
          <FormSelect
            label="Assigned To"
            value={formData.assigned_to}
            onChange={(e) =>
              setFormData({ ...formData, assigned_to: e.target.value })
            }
            options={[
              { value: "", label: "Unassigned" },
              ...employees.map((e) => ({
                value: e.id,
                label: e.full_name || e.email || "Unknown",
              })),
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              options={[
                { value: "todo", label: "To Do" },
                { value: "in_progress", label: "In Progress" },
                { value: "review", label: "Review" },
                { value: "completed", label: "Completed" },
                { value: "blocked", label: "Blocked" },
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Due Date"
              type="date"
              value={formData.due_date}
              onChange={(e) =>
                setFormData({ ...formData, due_date: e.target.value })
              }
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
                : editingTask
                ? "Update Task"
                : "Create Task"}
            </Button>
          </div>
        </form>
      </Modal>
    </RoleGuard>
  );
}
