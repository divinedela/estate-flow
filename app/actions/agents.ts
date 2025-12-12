"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface AgentFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  licenseNumber?: string;
  licenseExpiryDate?: string;
  licenseState?: string;
  employmentStatus: string;
  employmentType: string;
  hireDate?: string;
  specializations?: string[];
  agentLevel: string;
  managerId?: string;
  commissionType: string;
  commissionRate: number;
  profilePhotoUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
}

/**
 * Get all agents for the organization
 */
export async function getAgents() {
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

    const { data: agents, error } = await supabase
      .from("agents")
      .select(
        `
        *,
        manager:manager_id(
          id,
          first_name,
          last_name
        )
      `
      )
      .eq("organization_id", (profile as any).organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching agents:", error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: agents || [] };
  } catch (error: any) {
    console.error("Error in getAgents:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch agents",
      data: [],
    };
  }
}

/**
 * Get a single agent by ID
 */
export async function getAgent(agentId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: agent, error } = await supabase
      .from("agents")
      .select(
        `
        *,
        manager:manager_id(
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .eq("id", agentId)
      .single();

    if (error) {
      console.error("Error fetching agent:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: agent };
  } catch (error: any) {
    console.error("Error in getAgent:", error);
    return { success: false, error: error.message || "Failed to fetch agent" };
  }
}

/**
 * Create a new agent
 */
export async function createAgent(data: AgentFormData) {
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

    // Generate agent code
    const agentCode = `AG${Date.now().toString().slice(-8)}`;

    const { data: agent, error } = await (supabase.from("agents") as any)
      .insert({
        organization_id: (profile as any).organization_id,
        agent_code: agentCode,
        first_name: (data as any).firstName,
        last_name: data.lastName,
        email: data.email,
        phone: (data as any).phone,
        mobile: (data as any).mobile,
        license_number: (data as any).licenseNumber,
        license_expiry_date: (data as any).licenseExpiryDate,
        license_state: (data as any).licenseState,
        employment_status: (data as any).employmentStatus,
        employment_type: (data as any).employmentType,
        hire_date: (data as any).hireDate,
        specializations: (data as any).specializations,
        agent_level: (data as any).agentLevel,
        manager_id: (data as any).managerId || null,
        commission_type: (data as any).commissionType,
        commission_rate: (data as any).commissionRate,
        profile_photo_url: (data as any).profilePhotoUrl,
        address: (data as any).address,
        city: (data as any).city,
        state: (data as any).state,
        postal_code: (data as any).postalCode,
        country: (data as any).country,
        notes: (data as any).notes,
        created_by: (profile as any).id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating agent:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/agents");
    return { success: true, data: agent };
  } catch (error: any) {
    console.error("Error in createAgent:", error);
    return { success: false, error: error.message || "Failed to create agent" };
  }
}

/**
 * Update an agent
 */
export async function updateAgent(
  agentId: string,
  data: Partial<AgentFormData>
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const updateData: any = {
      first_name: (data as any).firstName,
      last_name: (data as any).lastName,
      email: (data as any).email,
      phone: (data as any).phone,
      mobile: (data as any).mobile,
      license_number: (data as any).licenseNumber,
      license_expiry_date: (data as any).licenseExpiryDate,
      license_state: (data as any).licenseState,
      employment_status: (data as any).employmentStatus,
      employment_type: (data as any).employmentType,
      hire_date: (data as any).hireDate,
      specializations: (data as any).specializations,
      agent_level: (data as any).agentLevel,
      manager_id: (data as any).managerId || null,
      commission_type: (data as any).commissionType,
      commission_rate: (data as any).commissionRate,
      profile_photo_url: (data as any).profilePhotoUrl,
      address: (data as any).address,
      city: (data as any).city,
      state: (data as any).state,
      postal_code: (data as any).postalCode,
      country: (data as any).country,
      notes: data.notes,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const { data: agent, error } = await (supabase.from("agents") as any)
      .update(updateData)
      .eq("id", agentId)
      .select()
      .single();

    if (error) {
      console.error("Error updating agent:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/agents");
    revalidatePath(`/agents/${agentId}`);
    return { success: true, data: agent };
  } catch (error: any) {
    console.error("Error in updateAgent:", error);
    return { success: false, error: error.message || "Failed to update agent" };
  }
}

/**
 * Delete an agent
 */
export async function deleteAgent(agentId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await (supabase.from("agents") as any)
      .delete()
      .eq("id", agentId);

    if (error) {
      console.error("Error deleting agent:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/agents");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteAgent:", error);
    return { success: false, error: error.message || "Failed to delete agent" };
  }
}

/**
 * Get agent statistics
 */
export async function getAgentStats() {
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
          totalAgents: 0,
          activeAgents: 0,
          onLeaveAgents: 0,
          inactiveAgents: 0,
          totalSales: 0,
          totalCommission: 0,
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
          totalAgents: 0,
          activeAgents: 0,
          onLeaveAgents: 0,
          inactiveAgents: 0,
          totalSales: 0,
          totalCommission: 0,
        },
      };
    }

    const { data: agents } = await supabase
      .from("agents")
      .select("employment_status, total_sales_count, total_commission_earned")
      .eq("organization_id", (profile as any).organization_id);

    const stats = {
      totalAgents: agents?.length || 0,
      activeAgents:
        (agents as any[])?.filter((a: any) => a.employment_status === "active")
          .length || 0,
      onLeaveAgents:
        (agents as any[])?.filter(
          (a: any) => a.employment_status === "on_leave"
        ).length || 0,
      inactiveAgents:
        (agents as any[])?.filter(
          (a: any) => a.employment_status === "inactive"
        ).length || 0,
      totalSales:
        (agents as any[])?.reduce(
          (sum: number, a: any) => sum + (a.total_sales_count || 0),
          0
        ) || 0,
      totalCommission:
        (agents as any[])?.reduce(
          (sum: number, a: any) => sum + Number(a.total_commission_earned || 0),
          0
        ) || 0,
    };

    return { success: true, data: stats };
  } catch (error: any) {
    console.error("Error in getAgentStats:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch agent stats",
      data: {
        totalAgents: 0,
        activeAgents: 0,
        onLeaveAgents: 0,
        inactiveAgents: 0,
        totalSales: 0,
        totalCommission: 0,
      },
    };
  }
}

/**
 * Get top performing agents
 */
export async function getTopAgents(limit: number = 5) {
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

    const { data: agents, error } = await supabase
      .from("agents")
      .select(
        "id, first_name, last_name, total_sales_count, total_sales_value, total_commission_earned"
      )
      .eq("organization_id", (profile as any).organization_id)
      .eq("employment_status", "active")
      .order("total_commission_earned", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching top agents:", error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: agents || [] };
  } catch (error: any) {
    console.error("Error in getTopAgents:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch top agents",
      data: [],
    };
  }
}

/**
 * Get current user's agent profile
 */
export async function getCurrentAgentProfile() {
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

    // Get agent by user email or user_id
    const { data: agent, error } = await supabase
      .from("agents")
      .select(
        `
        *,
        manager:manager_id(
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .eq("organization_id", (profile as any).organization_id)
      .or(`email.eq.${user.email},user_id.eq.${(profile as any).id}`)
      .single();

    if (error) {
      console.error("Error fetching agent profile:", error);
      return { success: false, error: "Agent profile not found" };
    }

    return { success: true, data: agent };
  } catch (error: any) {
    console.error("Error in getCurrentAgentProfile:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch agent profile",
    };
  }
}

/**
 * Get agent dashboard statistics
 */
export async function getAgentDashboardStats(agentId: string) {
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
          totalClients: 0,
          activeDeals: 0,
          totalCommission: 0,
          monthlyCommission: 0,
          totalSales: 0,
          averageDealSize: 0,
        },
      };
    }

    // Get agent data
    const { data: agent } = await supabase
      .from("agents")
      .select(
        "total_sales_count, total_sales_value, total_commission_earned, average_deal_size"
      )
      .eq("id", agentId)
      .single();

    // Get client count
    const { count: clientCount } = await supabase
      .from("agent_clients")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .eq("status", "active");

    // Get this month's commission
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyCommissions } = await supabase
      .from("agent_commissions")
      .select("commission_amount")
      .eq("agent_id", agentId)
      .gte("created_at", startOfMonth.toISOString());

    const monthlyCommission =
      (monthlyCommissions as any[])?.reduce(
        (sum: number, c: any) => sum + Number(c.commission_amount || 0),
        0
      ) || 0;

    // Get active deals count (pending commissions)
    const { count: activeDeals } = await supabase
      .from("agent_commissions")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .eq("status", "pending");

    const stats = {
      totalClients: clientCount || 0,
      activeDeals: activeDeals || 0,
      totalCommission: Number((agent as any)?.total_commission_earned || 0),
      monthlyCommission: monthlyCommission,
      totalSales: (agent as any)?.total_sales_count || 0,
      averageDealSize: Number((agent as any)?.average_deal_size || 0),
    };

    return { success: true, data: stats };
  } catch (error: any) {
    console.error("Error in getAgentDashboardStats:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch dashboard stats",
      data: {
        totalClients: 0,
        activeDeals: 0,
        totalCommission: 0,
        monthlyCommission: 0,
        totalSales: 0,
        averageDealSize: 0,
      },
    };
  }
}

/**
 * Get recent agent activities
 */
export async function getAgentRecentActivities(
  agentId: string,
  limit: number = 10
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated", data: [] };
    }

    const { data: activities, error } = await supabase
      .from("agent_activities")
      .select("*")
      .eq("agent_id", agentId)
      .order("activity_date", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching activities:", error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: activities || [] };
  } catch (error: any) {
    console.error("Error in getAgentRecentActivities:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch activities",
      data: [],
    };
  }
}

/**
 * Get agent's assigned clients
 */
export async function getAgentClients(agentId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated", data: [] };
    }

    const { data: clients, error } = await supabase
      .from("agent_clients")
      .select("*")
      .eq("agent_id", agentId)
      .order("assigned_date", { ascending: false });

    if (error) {
      console.error("Error fetching agent clients:", error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: clients || [] };
  } catch (error: any) {
    console.error("Error in getAgentClients:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch clients",
      data: [],
    };
  }
}

/**
 * Get agent's recent commissions
 */
export async function getAgentCommissions(agentId: string, limit: number = 5) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated", data: [] };
    }

    const { data: commissions, error } = await supabase
      .from("agent_commissions")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching commissions:", error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: commissions || [] };
  } catch (error: any) {
    console.error("Error in getAgentCommissions:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch commissions",
      data: [],
    };
  }
}

/**
 * Get team performance stats for agent manager
 */
export async function getTeamPerformanceStats() {
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
          totalTeamMembers: 0,
          activeAgents: 0,
          totalTeamSales: 0,
          totalTeamCommission: 0,
          monthlyTeamSales: 0,
          monthlyTeamCommission: 0,
          averagePerformance: 0,
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
          totalTeamMembers: 0,
          activeAgents: 0,
          totalTeamSales: 0,
          totalTeamCommission: 0,
          monthlyTeamSales: 0,
          monthlyTeamCommission: 0,
          averagePerformance: 0,
        },
      };
    }

    // Get all agents in organization
    const { data: agents } = await supabase
      .from("agents")
      .select("*")
      .eq("organization_id", (profile as any).organization_id);

    const activeAgents =
      (agents as any[])?.filter((a: any) => a.employment_status === "active") ||
      [];
    const totalSales =
      (agents as any[])?.reduce(
        (sum: number, a: any) => sum + (a.total_sales_count || 0),
        0
      ) || 0;
    const totalCommission =
      (agents as any[])?.reduce(
        (sum: number, a: any) => sum + Number(a.total_commission_earned || 0),
        0
      ) || 0;

    // Get this month's data
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyCommissions } = await supabase
      .from("agent_commissions")
      .select("commission_amount, agent_id")
      .gte("created_at", startOfMonth.toISOString());

    const monthlyCommission =
      (monthlyCommissions as any[])?.reduce(
        (sum: number, c: any) => sum + Number(c.commission_amount || 0),
        0
      ) || 0;
    const monthlySales = monthlyCommissions?.length || 0;

    const stats = {
      totalTeamMembers: agents?.length || 0,
      activeAgents: activeAgents.length,
      totalTeamSales: totalSales,
      totalTeamCommission: totalCommission,
      monthlyTeamSales: monthlySales,
      monthlyTeamCommission: monthlyCommission,
      averagePerformance:
        activeAgents.length > 0 ? totalCommission / activeAgents.length : 0,
    };

    return { success: true, data: stats };
  } catch (error: any) {
    console.error("Error in getTeamPerformanceStats:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch team stats",
      data: {
        totalTeamMembers: 0,
        activeAgents: 0,
        totalTeamSales: 0,
        totalTeamCommission: 0,
        monthlyTeamSales: 0,
        monthlyTeamCommission: 0,
        averagePerformance: 0,
      },
    };
  }
}

/**
 * Get pending commission approvals
 */
export async function getPendingCommissions(limit: number = 10) {
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

    const { data: commissions, error } = await supabase
      .from("agent_commissions")
      .select(
        `
        *,
        agent:agent_id(
          id,
          first_name,
          last_name,
          agent_code
        )
      `
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching pending commissions:", error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: commissions || [] };
  } catch (error: any) {
    console.error("Error in getPendingCommissions:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch pending commissions",
      data: [],
    };
  }
}

/**
 * Get team leaderboard
 */
export async function getTeamLeaderboard(limit: number = 10) {
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

    const { data: agents, error } = await supabase
      .from("agents")
      .select(
        "id, agent_code, first_name, last_name, total_sales_count, total_sales_value, total_commission_earned, employment_status, agent_level"
      )
      .eq("organization_id", (profile as any).organization_id)
      .eq("employment_status", "active")
      .order("total_commission_earned", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching team leaderboard:", error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: agents || [] };
  } catch (error: any) {
    console.error("Error in getTeamLeaderboard:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch team leaderboard",
      data: [],
    };
  }
}
