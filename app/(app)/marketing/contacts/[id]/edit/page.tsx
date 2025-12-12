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

export default function EditContactPage() {
  const router = useRouter();
  const params = useParams();
  const contactId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    phone_secondary: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    company: "",
    job_title: "",
    source: "",
    status: "active",
    notes: "",
  });

  // Fetch contact data
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

      // Fetch contact
      const { data: contact, error: contactError } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", contactId)
        .eq("organization_id", (profile as any).organization_id)
        .single();

      if (contactError || !contact) {
        console.error("Error fetching contact:", contactError);
        router.push("/marketing/contacts");
        return;
      }

      // Populate form with contact data
      const contactData = contact as any;
      setFormData({
        first_name: contactData.first_name || "",
        last_name: contactData.last_name || "",
        email: contactData.email || "",
        phone: contactData.phone || "",
        phone_secondary: contactData.phone_secondary || "",
        address: contactData.address || "",
        city: contactData.city || "",
        state: contactData.state || "",
        country: contactData.country || "",
        postal_code: contactData.postal_code || "",
        company: contactData.company || "",
        job_title: contactData.job_title || "",
        source: contactData.source || "",
        status: contactData.status || "active",
        notes: contactData.notes || "",
      });

      setLoading(false);
    }

    fetchData();
  }, [contactId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updateData: any = {
        first_name: formData.first_name,
        last_name: formData.last_name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        phone_secondary: formData.phone_secondary || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || null,
        postal_code: formData.postal_code || null,
        company: formData.company || null,
        job_title: formData.job_title || null,
        source: formData.source || null,
        status: formData.status,
        notes: formData.notes || null,
      };

      const { error } = await (supabase.from("contacts") as any)
        .update(updateData)
        .eq("id", contactId);

      if (error) throw error;

      router.push(`/marketing/contacts/${contactId}`);
      router.refresh();
    } catch (error) {
      console.error("Error updating contact:", error);
      alert("Failed to update contact. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={["super_admin", "marketing_officer"]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-500">Loading contact...</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["super_admin", "marketing_officer"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Contact</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update contact information
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormInput
                label="First Name"
                required
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                placeholder="John"
              />
              <FormInput
                label="Last Name"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                placeholder="Doe"
              />
              <FormInput
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="john.doe@example.com"
              />
              <FormInput
                label="Phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+1234567890"
              />
              <FormInput
                label="Secondary Phone"
                value={formData.phone_secondary}
                onChange={(e) =>
                  setFormData({ ...formData, phone_secondary: e.target.value })
                }
                placeholder="+1234567890"
              />
              <FormInput
                label="Company"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                placeholder="Company Name"
              />
              <FormInput
                label="Job Title"
                value={formData.job_title}
                onChange={(e) =>
                  setFormData({ ...formData, job_title: e.target.value })
                }
                placeholder="Job Title"
              />
              <FormInput
                label="Source"
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value })
                }
                placeholder="How they found us"
              />
              <FormSelect
                label="Status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                  { value: "do_not_contact", label: "Do Not Contact" },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormInput
                label="Address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Street Address"
              />
              <FormInput
                label="City"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                placeholder="City"
              />
              <FormInput
                label="State/Province"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                placeholder="State"
              />
              <FormInput
                label="Country"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                placeholder="Country"
              />
              <FormInput
                label="Postal Code"
                value={formData.postal_code}
                onChange={(e) =>
                  setFormData({ ...formData, postal_code: e.target.value })
                }
                placeholder="12345"
              />
            </div>

            <FormTextarea
              label="Notes"
              rows={4}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional notes about this contact..."
            />

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push(`/marketing/contacts/${contactId}`)}
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
