"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CommissionFormData {
  agentId: string;
  transactionType: string;
  propertyId?: string;
  leadId?: string;
  dealDescription?: string;
  saleAmount: number;
  commissionRate: number;
  splitPercentage?: number;
  transactionDate: string;
  expectedPaymentDate?: string;
  notes?: string;
}

/**
 * Get all commissions for organization
 */
export async function getCommissions(filters?: {
  agentId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated", data: [] };
    }

    const { data: profile } = await supabase
      .from("app_users")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!(profile as any)?.organization_id) {
      return { success: false, error: "Profile not found", data: [] };
    }

    let query = supabase
      .from("agent_commissions")
      .select(
        `
        *,
        agent:agent_id(
          id,
          first_name,
          last_name,
          agent_code,
          email
        ),
        property:properties(
          id,
          name,
          property_code
        ),
        lead:leads(
          id,
          first_name,
          last_name
        )
      `
      )
      .eq("organization_id", (profile as any).organization_id)
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters?.agentId) {
      query = query.eq("agent_id", filters.agentId);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.startDate) {
      query = query.gte("transaction_date", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("transaction_date", filters.endDate);
    }

    const { data: commissions, error } = await query;

    if (error) {
      console.error("Error fetching commissions:", error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: commissions || [] };
  } catch (error: any) {
    console.error("Error in getCommissions:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch commissions",
      data: [],
    };
  }
}

/**
 * Get single commission by ID
 */
export async function getCommission(commissionId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: commission, error } = await supabase
      .from("agent_commissions")
      .select(
        `
        *,
        agent:agent_id(
          id,
          first_name,
          last_name,
          agent_code,
          email,
          phone,
          mobile
        ),
        property:properties(
          id,
          name,
          property_code,
          address
        ),
        lead:leads(
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        approver:approved_by(
          id,
          full_name
        )
      `
      )
      .eq("id", commissionId)
      .single();

    if (error) {
      console.error("Error fetching commission:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: commission };
  } catch (error: any) {
    console.error("Error in getCommission:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch commission",
    };
  }
}

/**
 * Create new commission
 */
export async function createCommission(data: CommissionFormData) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: profile } = await supabase
      .from("app_users")
      .select("id, organization_id")
      .eq("user_id", user.id)
      .single();

    if (!(profile as any)?.organization_id) {
      return { success: false, error: "Profile not found" };
    }

    // Calculate commission amounts
    const commissionAmount = (data.saleAmount * data.commissionRate) / 100;
    const splitPercentage = data.splitPercentage || 100;
    const finalCommission = (commissionAmount * splitPercentage) / 100;

    const { data: commission, error } = await (
      supabase.from("agent_commissions") as any
    )
      .insert({
        organization_id: (profile as any).organization_id,
        agent_id: data.agentId,
        transaction_type: data.transactionType,
        property_id: data.propertyId || null,
        lead_id: data.leadId || null,
        deal_description: data.dealDescription,
        sale_amount: data.saleAmount,
        commission_rate: data.commissionRate,
        commission_amount: commissionAmount,
        split_percentage: splitPercentage,
        final_commission: finalCommission,
        transaction_date: data.transactionDate,
        expected_payment_date: data.expectedPaymentDate,
        notes: data.notes,
        status: "pending",
        payment_status: "unpaid",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating commission:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/agents/commissions");
    revalidatePath("/agents/manager");
    return { success: true, data: commission };
  } catch (error: any) {
    console.error("Error in createCommission:", error);
    return {
      success: false,
      error: error.message || "Failed to create commission",
    };
  }
}

/**
 * Update commission
 */
export async function updateCommission(
  commissionId: string,
  data: Partial<CommissionFormData>
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const updateData: any = {};

    if (data.transactionType)
      updateData.transaction_type = data.transactionType;
    if (data.propertyId !== undefined)
      updateData.property_id = data.propertyId || null;
    if (data.leadId !== undefined) updateData.lead_id = data.leadId || null;
    if (data.dealDescription !== undefined)
      updateData.deal_description = data.dealDescription;
    if (data.transactionDate)
      updateData.transaction_date = data.transactionDate;
    if (data.expectedPaymentDate !== undefined)
      updateData.expected_payment_date = data.expectedPaymentDate;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Recalculate if amounts changed
    if (data.saleAmount || data.commissionRate || data.splitPercentage) {
      const { data: existing } = await supabase
        .from("agent_commissions")
        .select("sale_amount, commission_rate, split_percentage")
        .eq("id", commissionId)
        .single();

      const existingData = existing as any;
      const saleAmount = data.saleAmount ?? existingData?.sale_amount ?? 0;
      const commissionRate =
        data.commissionRate ?? existingData?.commission_rate ?? 0;
      const splitPercentage =
        data.splitPercentage ?? existingData?.split_percentage ?? 100;

      const commissionAmount = (saleAmount * commissionRate) / 100;
      const finalCommission = (commissionAmount * splitPercentage) / 100;

      updateData.sale_amount = saleAmount;
      updateData.commission_rate = commissionRate;
      updateData.split_percentage = splitPercentage;
      updateData.commission_amount = commissionAmount;
      updateData.final_commission = finalCommission;
    }

    const { data: commission, error } = await (
      supabase.from("agent_commissions") as any
    )
      .update(updateData)
      .eq("id", commissionId)
      .select()
      .single();

    if (error) {
      console.error("Error updating commission:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/agents/commissions");
    revalidatePath(`/agents/commissions/${commissionId}`);
    return { success: true, data: commission };
  } catch (error: any) {
    console.error("Error in updateCommission:", error);
    return {
      success: false,
      error: error.message || "Failed to update commission",
    };
  }
}

/**
 * Approve commission
 */
export async function approveCommission(commissionId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: profile } = await supabase
      .from("app_users")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    const { data: commission, error } = await (
      supabase.from("agent_commissions") as any
    )
      .update({
        status: "approved",
        approval_date: new Date().toISOString().split("T")[0],
        approved_by: (profile as any).id,
      })
      .eq("id", commissionId)
      .select()
      .single();

    if (error) {
      console.error("Error approving commission:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/agents/commissions");
    revalidatePath(`/agents/commissions/${commissionId}`);
    revalidatePath("/agents/manager");
    return { success: true, data: commission };
  } catch (error: any) {
    console.error("Error in approveCommission:", error);
    return {
      success: false,
      error: error.message || "Failed to approve commission",
    };
  }
}

/**
 * Reject commission
 */
export async function rejectCommission(commissionId: string, reason?: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: commission, error } = await (
      supabase.from("agent_commissions") as any
    )
      .update({
        status: "rejected",
        dispute_reason: reason,
      })
      .eq("id", commissionId)
      .select()
      .single();

    if (error) {
      console.error("Error rejecting commission:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/agents/commissions");
    revalidatePath(`/agents/commissions/${commissionId}`);
    revalidatePath("/agents/manager");
    return { success: true, data: commission };
  } catch (error: any) {
    console.error("Error in rejectCommission:", error);
    return {
      success: false,
      error: error.message || "Failed to reject commission",
    };
  }
}

/**
 * Mark commission as paid
 */
export async function markCommissionPaid(
  commissionId: string,
  paymentDetails: {
    paymentAmount: number;
    paymentMethod: string;
    paymentReference?: string;
    paymentDate?: string;
  }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: commission, error } = await (
      supabase.from("agent_commissions") as any
    )
      .update({
        status: "paid",
        payment_status: "paid",
        payment_amount: paymentDetails.paymentAmount,
        payment_method: paymentDetails.paymentMethod,
        payment_reference: paymentDetails.paymentReference,
        payment_date:
          paymentDetails.paymentDate || new Date().toISOString().split("T")[0],
      })
      .eq("id", commissionId)
      .select()
      .single();

    if (error) {
      console.error("Error marking commission as paid:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/agents/commissions");
    revalidatePath(`/agents/commissions/${commissionId}`);
    return { success: true, data: commission };
  } catch (error: any) {
    console.error("Error in markCommissionPaid:", error);
    return {
      success: false,
      error: error.message || "Failed to mark commission as paid",
    };
  }
}

/**
 * Delete commission
 */
export async function deleteCommission(commissionId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await (supabase.from("agent_commissions") as any)
      .delete()
      .eq("id", commissionId);

    if (error) {
      console.error("Error deleting commission:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/agents/commissions");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteCommission:", error);
    return {
      success: false,
      error: error.message || "Failed to delete commission",
    };
  }
}

/**
 * Get commission statistics
 */
export async function getCommissionStats(filters?: {
  agentId?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: "Not authenticated",
        data: {
          totalCommissions: 0,
          pendingCommissions: 0,
          approvedCommissions: 0,
          paidCommissions: 0,
          totalAmount: 0,
          pendingAmount: 0,
          paidAmount: 0,
        },
      };
    }

    const { data: profile } = await supabase
      .from("app_users")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!(profile as any)?.organization_id) {
      return {
        success: false,
        error: "Profile not found",
        data: {
          totalCommissions: 0,
          pendingCommissions: 0,
          approvedCommissions: 0,
          paidCommissions: 0,
          totalAmount: 0,
          pendingAmount: 0,
          paidAmount: 0,
        },
      };
    }

    let query = supabase
      .from("agent_commissions")
      .select("status, final_commission")
      .eq("organization_id", (profile as any).organization_id);

    if (filters?.agentId) {
      query = query.eq("agent_id", filters.agentId);
    }
    if (filters?.startDate) {
      query = query.gte("transaction_date", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("transaction_date", filters.endDate);
    }

    const { data: commissions } = await query;

    const stats = {
      totalCommissions: commissions?.length || 0,
      pendingCommissions:
        (commissions as any[])?.filter((c: any) => c.status === "pending")
          .length || 0,
      approvedCommissions:
        (commissions as any[])?.filter((c: any) => c.status === "approved")
          .length || 0,
      paidCommissions:
        (commissions as any[])?.filter((c: any) => c.status === "paid")
          .length || 0,
      totalAmount:
        (commissions as any[])?.reduce(
          (sum: number, c: any) => sum + Number(c.final_commission || 0),
          0
        ) || 0,
      pendingAmount:
        (commissions as any[])
          ?.filter((c: any) => c.status === "pending")
          .reduce(
            (sum: number, c: any) => sum + Number(c.final_commission || 0),
            0
          ) || 0,
      paidAmount:
        (commissions as any[])
          ?.filter((c: any) => c.status === "paid")
          .reduce(
            (sum: number, c: any) => sum + Number(c.final_commission || 0),
            0
          ) || 0,
    };

    return { success: true, data: stats };
  } catch (error: any) {
    console.error("Error in getCommissionStats:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch commission stats",
      data: {
        totalCommissions: 0,
        pendingCommissions: 0,
        approvedCommissions: 0,
        paidCommissions: 0,
        totalAmount: 0,
        pendingAmount: 0,
        paidAmount: 0,
      },
    };
  }
}
