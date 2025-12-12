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
import { FormSelect } from "@/components/ui/form-select";
import { createClient } from "@/lib/supabase/client";
import { createUser, updateUser } from "@/app/actions/admin";
import Link from "next/link";

interface AppUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  organization_id: string | null;
  is_active: boolean;
  created_at: string;
  user_roles?: { role: { id: string; name: string } }[];
}

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface Organization {
  id: string;
  name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [roleFilter, setRoleFilter] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    organization_id: "",
    role_id: "",
    is_active: true,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from("app_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) {
        console.error("Error fetching users:", usersError);
      }

      // Fetch user roles separately to avoid relationship ambiguity
      const { data: userRolesData } = await supabase
        .from("user_roles")
        .select("user_id, role:roles(id, name)");

      // Fetch roles
      const { data: rolesData } = await supabase
        .from("roles")
        .select("*")
        .order("name");

      // Fetch organizations
      const { data: orgsData } = await supabase
        .from("organizations")
        .select("id, name")
        .order("name");

      // Merge user roles into users
      const usersWithRoles = (usersData || []).map((user: any) => {
        const userRole = ((userRolesData || []) as any[]).find(
          (ur: any) => ur.user_id === user.id
        );
        return {
          ...user,
          user_roles: userRole ? [{ role: (userRole as any).role }] : [],
        };
      });

      setUsers(usersWithRoles as AppUser[]);
      setRoles((rolesData as Role[]) || []);
      setOrganizations((orgsData as Organization[]) || []);
    } catch (error) {
      console.error("Error:", error);
    }

    setLoading(false);
  }

  function openCreateModal() {
    setEditingUser(null);
    setFormData({
      email: "",
      password: "",
      full_name: "",
      phone: "",
      organization_id: organizations[0]?.id || "",
      role_id:
        roles.find((r) => r.name === "executive")?.id || roles[0]?.id || "",
      is_active: true,
    });
    setIsModalOpen(true);
  }

  function openEditModal(user: AppUser) {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: "",
      full_name: user.full_name || "",
      phone: user.phone || "",
      organization_id: user.organization_id || "",
      role_id: user.user_roles?.[0]?.role?.id || "",
      is_active: user.is_active,
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      if (editingUser) {
        // Update existing user using server action
        const result = await updateUser({
          id: editingUser.id,
          full_name: formData.full_name,
          phone: formData.phone,
          organization_id: formData.organization_id,
          role_id: formData.role_id,
          is_active: formData.is_active,
        });

        if (result.error) {
          throw new Error(result.error);
        }

        setMessage({ type: "success", text: "User updated successfully!" });
      } else {
        // Create new user using server action
        if (!formData.email || !formData.password) {
          throw new Error("Email and password are required");
        }

        if (formData.password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }

        const result = await createUser({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          organization_id: formData.organization_id,
          role_id: formData.role_id,
          is_active: formData.is_active,
        });

        if (result.error) {
          throw new Error(result.error);
        }

        setMessage({
          type: "success",
          text: "User created successfully! They can now log in with their email and password.",
        });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error saving user:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to save user",
      });
    }

    setSubmitting(false);

    // Clear success message after 5 seconds
    if (message?.type === "success") {
      setTimeout(() => setMessage(null), 5000);
    }
  }

  async function toggleUserStatus(user: AppUser) {
    try {
      const { error } = await (supabase.from("app_users") as any)
        .update({ is_active: !user.is_active })
        .eq("id", user.id);

      if (error) throw error;

      setMessage({
        type: "success",
        text: `User ${
          !user.is_active ? "activated" : "deactivated"
        } successfully`,
      });
      fetchData();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to update user status",
      });
    }

    setTimeout(() => setMessage(null), 3000);
  }

  async function deleteUser(user: AppUser) {
    if (
      !confirm(
        `Are you sure you want to delete ${
          user.full_name || user.email
        }? This will remove them from the system but not delete their login credentials.`
      )
    ) {
      return;
    }

    try {
      // Delete user roles first
      await supabase.from("user_roles").delete().eq("user_id", user.id);

      // Delete app user
      const { error } = await supabase
        .from("app_users")
        .delete()
        .eq("id", user.id);

      if (error) throw error;

      setMessage({ type: "success", text: "User removed successfully" });
      fetchData();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to delete user",
      });
    }

    setTimeout(() => setMessage(null), 3000);
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);

    const matchesRole =
      !roleFilter || user.user_roles?.some((ur) => ur.role?.id === roleFilter);

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Stats
  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    inactive: users.filter((u) => !u.is_active).length,
    noRole: users.filter((u) => !u.user_roles || u.user_roles.length === 0)
      .length,
  };

  return (
    <RoleGuard allowedRoles={["super_admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <Link
                  href="/admin"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Admin Dashboard
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-sm text-gray-500">Users</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Users Management
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Create and manage system users
              </p>
            </div>
          </div>
          <Button onClick={openCreateModal}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 mr-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
              />
            </svg>
            Add User
          </Button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`rounded-lg p-4 ${
              message.type === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-start">
              {message.type === "success" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-green-600 mr-2 flex-shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-red-600 mr-2 flex-shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
              )}
              <p
                className={`text-sm ${
                  message.type === "success" ? "text-green-800" : "text-red-800"
                }`}
              >
                {message.text}
              </p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-gray-400 mx-auto"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.total}
              </p>
              <p className="text-sm text-gray-500">Total Users</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-green-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {stats.active}
              </p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-red-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {stats.inactive}
              </p>
              <p className="text-sm text-gray-500">Inactive</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-yellow-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-yellow-600 mt-2">
                {stats.noRole}
              </p>
              <p className="text-sm text-gray-500">No Role</p>
            </div>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          {/* Filters */}
          <div className="mb-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "active" | "inactive")
              }
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading users...</p>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>User</TableHeader>
                  <TableHeader>Role</TableHeader>
                  <TableHeader>Organization</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Created</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-gray-500 py-8"
                    >
                      {users.length === 0 ? (
                        <div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-12 h-12 text-gray-300 mx-auto mb-2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                            />
                          </svg>
                          <p>No users found.</p>
                          <p className="text-sm mt-1">
                            Click "Add User" to create your first user.
                          </p>
                        </div>
                      ) : (
                        "No users match your search criteria."
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-medium text-sm">
                              {(user.full_name || user.email)
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900">
                              {user.full_name || "No Name"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.user_roles && user.user_roles.length > 0 ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                            {user.user_roles[0]?.role?.name?.replace(
                              "_",
                              " "
                            ) || "Unknown"}
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            No Role
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {organizations.find(
                          (o) => o.id === user.organization_id
                        )?.name || (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleUserStatus(user)}
                          className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer hover:opacity-80 ${
                            user.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </button>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-indigo-600 hover:text-indigo-900 p-1"
                            title="Edit User"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteUser(user)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete User"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                              />
                            </svg>
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
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? "Edit User" : "Create New User"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            disabled={!!editingUser}
            placeholder="user@example.com"
            required
          />

          {!editingUser && (
            <FormInput
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Minimum 6 characters"
              required
            />
          )}

          <FormInput
            label="Full Name"
            value={formData.full_name}
            onChange={(e) =>
              setFormData({ ...formData, full_name: e.target.value })
            }
            placeholder="John Doe"
          />

          <FormInput
            label="Phone Number"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="+1 234 567 8900"
          />

          <FormSelect
            label="Organization"
            value={formData.organization_id}
            onChange={(e) =>
              setFormData({ ...formData, organization_id: e.target.value })
            }
            required
          >
            <option value="">Select Organization</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </FormSelect>

          <FormSelect
            label="Role"
            value={formData.role_id}
            onChange={(e) =>
              setFormData({ ...formData, role_id: e.target.value })
            }
            required
          >
            <option value="">Select Role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name.replace("_", " ")}
              </option>
            ))}
          </FormSelect>

          <div className="flex items-center py-2">
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, is_active: !formData.is_active })
              }
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                formData.is_active ? "bg-indigo-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formData.is_active ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="ml-3 text-sm text-gray-900">
              {formData.is_active ? "Active" : "Inactive"}
            </span>
          </div>

          {!editingUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The user will receive their login
                credentials. They can use the email and password you set to log
                in.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Saving..."
                : editingUser
                ? "Update User"
                : "Create User"}
            </Button>
          </div>
        </form>
      </Modal>
    </RoleGuard>
  );
}
