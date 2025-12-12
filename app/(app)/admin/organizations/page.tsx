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
import { Database } from "@/types/database";
import {
  BuildingLibraryIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

type OrganizationUpdate =
  Database["public"]["Tables"]["organizations"]["Update"];
type OrganizationInsert =
  Database["public"]["Tables"]["organizations"]["Insert"];

interface Organization {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  created_at: string;
  user_count?: number;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    phone: "",
    email: "",
  });

  const supabase = createClient();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  async function fetchOrganizations() {
    setLoading(true);

    const { data: orgsData } = await supabase
      .from("organizations")
      .select("*")
      .order("name");

    // Get user count for each organization
    const orgsWithCount = await Promise.all(
      ((orgsData || []) as Organization[]).map(async (org) => {
        const { count } = await supabase
          .from("app_users")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", org.id);

        return { ...org, user_count: count || 0 };
      })
    );

    setOrganizations(orgsWithCount);
    setLoading(false);
  }

  function openCreateModal() {
    setEditingOrg(null);
    setFormData({
      name: "",
      code: "",
      address: "",
      phone: "",
      email: "",
    });
    setIsModalOpen(true);
  }

  function openEditModal(org: Organization) {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      code: org.code || "",
      address: org.address || "",
      phone: org.phone || "",
      email: org.email || "",
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const orgData = {
      name: formData.name,
      code: formData.code || null,
      address: formData.address || null,
      phone: formData.phone || null,
      email: formData.email || null,
    };

    if (editingOrg) {
      await (supabase.from("organizations") as any)
        .update(orgData)
        .eq("id", editingOrg.id);
    } else {
      await (supabase.from("organizations") as any).insert(orgData);
    }

    setIsModalOpen(false);
    fetchOrganizations();
  }

  async function handleDelete(org: Organization) {
    if (org.user_count && org.user_count > 0) {
      alert(
        "Cannot delete organization with active users. Please reassign users first."
      );
      return;
    }

    if (confirm(`Are you sure you want to delete "${org.name}"?`)) {
      await supabase.from("organizations").delete().eq("id", org.id);

      fetchOrganizations();
    }
  }

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
                Organizations
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage organizations and branches
              </p>
            </div>
          </div>
          <Button onClick={openCreateModal}>
            <BuildingLibraryIcon className="h-5 w-5 mr-2" />
            Add Organization
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">
                {organizations.length}
              </p>
              <p className="text-sm text-gray-500">Total Organizations</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {organizations.reduce(
                  (sum, org) => sum + (org.user_count || 0),
                  0
                )}
              </p>
              <p className="text-sm text-gray-500">Total Users</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {
                  organizations.filter(
                    (org) => org.user_count && org.user_count > 0
                  ).length
                }
              </p>
              <p className="text-sm text-gray-500">Active Organizations</p>
            </div>
          </Card>
        </div>

        <Card>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading organizations...</p>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Organization</TableHeader>
                  <TableHeader>Code</TableHeader>
                  <TableHeader>Contact</TableHeader>
                  <TableHeader>Users</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {organizations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-gray-500 py-8"
                    >
                      No organizations found. Create your first organization.
                    </TableCell>
                  </TableRow>
                ) : (
                  organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {org.name}
                          </p>
                          {org.address && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {org.address}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {org.code ? (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                            {org.code}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {org.email && <p>{org.email}</p>}
                          {org.phone && (
                            <p className="text-gray-500">{org.phone}</p>
                          )}
                          {!org.email && !org.phone && (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                          {org.user_count} users
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(org)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(org)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOrg ? "Edit Organization" : "Add New Organization"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Organization Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Estate Flow Inc."
            required
          />
          <FormInput
            label="Organization Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g., EF001"
          />
          <FormTextarea
            label="Address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            placeholder="Full address..."
            rows={2}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="contact@company.com"
            />
            <FormInput
              label="Phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+1 234 567 8900"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingOrg ? "Update Organization" : "Create Organization"}
            </Button>
          </div>
        </form>
      </Modal>
    </RoleGuard>
  );
}
