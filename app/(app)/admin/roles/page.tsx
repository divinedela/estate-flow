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
import { RoleGuard } from "@/components/auth/role-guard";
import { Modal } from "@/components/ui/modal";
import { FormInput } from "@/components/ui/form-input";
import { FormTextarea } from "@/components/ui/form-textarea";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldCheckIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  user_count?: number;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const supabase = createClient();

  useEffect(() => {
    fetchRoles();
  }, []);

  async function fetchRoles() {
    setLoading(true);

    const { data: rolesData } = await supabase
      .from("roles")
      .select("*")
      .order("name");

    // Get user count for each role
    const rolesWithCount = await Promise.all(
      ((rolesData || []) as Role[]).map(async (role) => {
        const { count } = await supabase
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role_id", role.id);

        return { ...role, user_count: count || 0 };
      })
    );

    setRoles(rolesWithCount);
    setLoading(false);
  }

  function openCreateModal() {
    setEditingRole(null);
    setFormData({ name: "", description: "" });
    setIsModalOpen(true);
  }

  function openEditModal(role: Role) {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingRole) {
      await (supabase.from("roles") as any)
        .update({
          name: formData.name,
          description: formData.description,
        })
        .eq("id", editingRole.id);
    } else {
      await (supabase.from("roles") as any).insert({
        name: formData.name,
        description: formData.description,
      });
    }

    setIsModalOpen(false);
    fetchRoles();
  }

  async function handleDelete(role: Role) {
    if (role.is_system) {
      alert("System roles cannot be deleted.");
      return;
    }

    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      await supabase.from("roles").delete().eq("id", role.id);

      fetchRoles();
    }
  }

  const roleColors: Record<string, string> = {
    super_admin: "bg-purple-100 text-purple-800",
    hr_manager: "bg-blue-100 text-blue-800",
    project_manager: "bg-green-100 text-green-800",
    site_engineer: "bg-yellow-100 text-yellow-800",
    marketing_officer: "bg-pink-100 text-pink-800",
    procurement_officer: "bg-orange-100 text-orange-800",
    inventory_officer: "bg-cyan-100 text-cyan-800",
    facility_manager: "bg-teal-100 text-teal-800",
    executive: "bg-gray-100 text-gray-800",
  };

  return (
    <RoleGuard allowedRoles={["super_admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin">
              <Button variant="secondary" size="sm">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Roles Management
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage system roles and permissions
              </p>
            </div>
          </div>
          <Button onClick={openCreateModal}>
            <ShieldCheckIcon className="h-5 w-5 mr-2" />
            Add Role
          </Button>
        </div>

        <Card>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading roles...</p>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Role Name</TableHeader>
                  <TableHeader>Description</TableHeader>
                  <TableHeader>Users</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-gray-500 py-8"
                    >
                      No roles found.
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <span
                          className={`px-3 py-1 text-sm font-medium rounded-full ${
                            roleColors[role.name] || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {role.name
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {role.description || "No description"}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                          {role.user_count} users
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            role.is_system
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {role.is_system ? "System" : "Custom"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(role)}
                            className="text-indigo-600 hover:text-indigo-900"
                            disabled={role.is_system}
                          >
                            <PencilIcon
                              className={`h-5 w-5 ${
                                role.is_system ? "opacity-50" : ""
                              }`}
                            />
                          </button>
                          <button
                            onClick={() => handleDelete(role)}
                            className="text-red-600 hover:text-red-900"
                            disabled={role.is_system}
                          >
                            <TrashIcon
                              className={`h-5 w-5 ${
                                role.is_system ? "opacity-50" : ""
                              }`}
                            />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Role Permissions Info */}
        <Card title="Role Permissions Overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900">Super Admin</h4>
              <p className="text-sm text-purple-700 mt-1">
                Full system access to all modules and settings
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">HR Manager</h4>
              <p className="text-sm text-blue-700 mt-1">
                Manage employees, leave, attendance, documents
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900">Project Manager</h4>
              <p className="text-sm text-green-700 mt-1">
                Manage projects, tasks, milestones, team
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-900">Site Engineer</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Update tasks, report issues, view projects
              </p>
            </div>
            <div className="p-4 bg-pink-50 rounded-lg">
              <h4 className="font-medium text-pink-900">Marketing Officer</h4>
              <p className="text-sm text-pink-700 mt-1">
                Manage leads, contacts, campaigns, properties
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-900">
                Procurement Officer
              </h4>
              <p className="text-sm text-orange-700 mt-1">
                Manage PRs, POs, suppliers, GRNs
              </p>
            </div>
            <div className="p-4 bg-cyan-50 rounded-lg">
              <h4 className="font-medium text-cyan-900">Inventory Officer</h4>
              <p className="text-sm text-cyan-700 mt-1">
                Manage stock, items, transactions, locations
              </p>
            </div>
            <div className="p-4 bg-teal-50 rounded-lg">
              <h4 className="font-medium text-teal-900">Facility Manager</h4>
              <p className="text-sm text-teal-700 mt-1">
                Manage facilities, maintenance, assets
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Executive</h4>
              <p className="text-sm text-gray-700 mt-1">
                Read-only access to dashboards and reports
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? "Edit Role" : "Add New Role"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Role Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., custom_role"
            required
          />
          <FormTextarea
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe the role's responsibilities..."
            rows={3}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingRole ? "Update Role" : "Create Role"}
            </Button>
          </div>
        </form>
      </Modal>
    </RoleGuard>
  );
}
