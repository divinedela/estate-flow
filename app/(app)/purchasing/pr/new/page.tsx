"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { FormTextarea } from "@/components/ui/form-textarea";
import { RoleGuard } from "@/components/auth/role-guard";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";

type Project = any;
type Item = any;

interface PRItem {
  id: string;
  item_id: string;
  description: string;
  quantity: string;
  unit_of_measure: string;
  estimated_unit_price: string;
  estimated_total_price: string;
  notes: string;
}

export default function NewPRPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [prItems, setPRItems] = useState<PRItem[]>([
    {
      id: "1",
      item_id: "",
      description: "",
      quantity: "",
      unit_of_measure: "pcs",
      estimated_unit_price: "",
      estimated_total_price: "",
      notes: "",
    },
  ]);

  const [formData, setFormData] = useState({
    pr_number: "",
    project_id: "",
    department: "",
    purpose: "",
    priority: "medium",
    status: "draft",
    requested_date: new Date().toISOString().split("T")[0],
    required_date: "",
    notes: "",
  });

  // Fetch projects and items
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

      const orgId = (profile as any).organization_id;

      // Fetch projects
      const { data: projectsData } = await supabase
        .from("projects")
        .select("id, name, project_code")
        .eq("organization_id", orgId)
        .order("name");

      if (projectsData) {
        setProjects(projectsData as Project[]);
      }

      // Fetch items
      const { data: itemsData } = await supabase
        .from("items")
        .select("id, name, item_code, unit_of_measure")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .order("name");

      if (itemsData) {
        setItems(itemsData as Item[]);
      }
    }

    fetchData();
  }, []);

  const addItem = () => {
    setPRItems([
      ...prItems,
      {
        id: Date.now().toString(),
        item_id: "",
        description: "",
        quantity: "",
        unit_of_measure: "pcs",
        estimated_unit_price: "",
        estimated_total_price: "",
        notes: "",
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (prItems.length > 1) {
      setPRItems(prItems.filter((item: any) => (item as any).id !== id));
    }
  };

  const updateItem = (id: string, field: keyof PRItem, value: string) => {
    setPRItems(
      prItems.map((item: any) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };

          // Auto-calculate total price
          if (field === "quantity" || field === "estimated_unit_price") {
            const qty = parseFloat(updated.quantity) || 0;
            const price = parseFloat(updated.estimated_unit_price) || 0;
            updated.estimated_total_price = (qty * price).toFixed(2);
          }

          // Auto-fill description and unit from item
          if (field === "item_id" && value) {
            const selectedItem = items.find((i) => i.id === value);
            if (selectedItem) {
              updated.description = selectedItem.name;
              updated.unit_of_measure = selectedItem.unit_of_measure || "pcs";
            }
          }

          return updated;
        }
        return item;
      })
    );
  };

  const generatePRNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `PR-${year}${month}${day}-${random}`;
  };

  useEffect(() => {
    if (!formData.pr_number) {
      setFormData({ ...formData, pr_number: generatePRNumber() });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("app_users")
        .select("organization_id, id")
        .eq("user_id", user.id)
        .single();

      if (!profile || !("organization_id" in profile))
        throw new Error("User profile not found");

      const orgId = (profile as { organization_id: string | null })
        .organization_id;
      const appUserId = (profile as { id: string }).id;
      if (!orgId) throw new Error("User organization not found");

      // Validate items
      const validItems = prItems.filter(
        (item: any) =>
          (item as any).description &&
          (item as any).quantity &&
          parseFloat((item as any).quantity) > 0
      );

      if (validItems.length === 0) {
        alert("Please add at least one item with description and quantity");
        setLoading(false);
        return;
      }

      // Create PR
      const prData: any = {
        organization_id: orgId,
        pr_number: formData.pr_number,
        requested_by: appUserId,
        project_id: formData.project_id || null,
        department: formData.department || null,
        purpose: formData.purpose || null,
        priority: formData.priority,
        status: formData.status,
        requested_date:
          formData.requested_date || new Date().toISOString().split("T")[0],
        required_date: formData.required_date || null,
        notes: formData.notes || null,
      };

      const { data: pr, error: prError } = await supabase
        .from("purchase_requisitions")
        .insert(prData)
        .select("id")
        .single();

      if (prError) throw prError;

      // Create PR items
      const itemsData = validItems.map((item: any) => ({
        pr_id: (pr as any).id,
        item_id: (item as any).item_id || null,
        description: (item as any).description,
        quantity: parseFloat((item as any).quantity),
        unit_of_measure: (item as any).unit_of_measure || null,
        estimated_unit_price: (item as any).estimated_unit_price
          ? parseFloat((item as any).estimated_unit_price)
          : null,
        estimated_total_price: (item as any).estimated_total_price
          ? parseFloat((item as any).estimated_total_price)
          : null,
        notes: (item as any).notes || null,
      }));

      const { error: itemsError } = await (
        supabase.from("purchase_requisition_items") as any
      ).insert(itemsData);

      if (itemsError) throw itemsError;

      router.push("/purchasing");
    } catch (error) {
      console.error("Error creating PR:", error);
      alert("Failed to create purchase requisition. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["super_admin", "procurement_officer"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Create Purchase Requisition
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Request items for purchase
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PR Header Information */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormInput
                label="PR Number"
                required
                value={formData.pr_number}
                onChange={(e) =>
                  setFormData({ ...formData, pr_number: e.target.value })
                }
                placeholder="PR-2024-001"
              />
              <FormSelect
                label="Status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "submitted", label: "Submitted" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
              />
              <FormSelect
                label="Project (Optional)"
                value={formData.project_id}
                onChange={(e) =>
                  setFormData({ ...formData, project_id: e.target.value })
                }
                options={[
                  { value: "", label: "No Project" },
                  ...projects.map((project) => ({
                    value: project.id,
                    label: `${project.name} (${project.project_code})`,
                  })),
                ]}
              />
              <FormInput
                label="Department"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                placeholder="e.g., Construction, Office"
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
              <FormInput
                label="Requested Date"
                type="date"
                required
                value={formData.requested_date}
                onChange={(e) =>
                  setFormData({ ...formData, requested_date: e.target.value })
                }
              />
              <FormInput
                label="Required Date"
                type="date"
                value={formData.required_date}
                onChange={(e) =>
                  setFormData({ ...formData, required_date: e.target.value })
                }
              />
            </div>

            <FormTextarea
              label="Purpose"
              rows={3}
              value={formData.purpose}
              onChange={(e) =>
                setFormData({ ...formData, purpose: e.target.value })
              }
              placeholder="Purpose of this purchase requisition..."
            />

            {/* PR Items */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Items</h2>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addItem}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {prItems.map((item: any, index) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-700">
                        Item {index + 1}
                      </h3>
                      {prItems.length > 1 && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="sm:col-span-2">
                        <FormSelect
                          label="Item (Optional)"
                          value={item.item_id}
                          onChange={(e) =>
                            updateItem(item.id, "item_id", e.target.value)
                          }
                          options={[
                            { value: "", label: "Select Item" },
                            ...items.map((i) => ({
                              value: i.id,
                              label: `${i.name} (${i.item_code})`,
                            })),
                          ]}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <FormInput
                          label="Description"
                          required
                          value={item.description}
                          onChange={(e) =>
                            updateItem(item.id, "description", e.target.value)
                          }
                          placeholder="Item description"
                        />
                      </div>
                      <FormInput
                        label="Quantity"
                        type="number"
                        step="0.001"
                        required
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, "quantity", e.target.value)
                        }
                        placeholder="0"
                      />
                      <FormInput
                        label="Unit of Measure"
                        value={item.unit_of_measure}
                        onChange={(e) =>
                          updateItem(item.id, "unit_of_measure", e.target.value)
                        }
                        placeholder="pcs, kg, m, etc."
                      />
                      <FormInput
                        label="Estimated Unit Price"
                        type="number"
                        step="0.01"
                        value={item.estimated_unit_price}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "estimated_unit_price",
                            e.target.value
                          )
                        }
                        placeholder="0.00"
                      />
                      <FormInput
                        label="Estimated Total Price"
                        type="number"
                        step="0.01"
                        value={item.estimated_total_price}
                        readOnly
                        className="bg-gray-50"
                      />
                      <div className="sm:col-span-2">
                        <FormInput
                          label="Notes"
                          value={item.notes}
                          onChange={(e) =>
                            updateItem(item.id, "notes", e.target.value)
                          }
                          placeholder="Item-specific notes"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <FormTextarea
              label="Notes"
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional notes about this PR..."
            />

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create PR"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </RoleGuard>
  );
}
