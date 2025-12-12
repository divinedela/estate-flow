import { RoleGuard } from "@/components/auth/role-guard";
import { createClient } from "@/lib/supabase/server";
import { DocumentsPageClient } from "./documents-page-client";

interface ProjectDocument {
  id: string;
  project_id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category: string;
  description: string | null;
  created_at: string;
  project: {
    name: string;
    project_code: string;
  };
  uploader: {
    full_name: string;
  };
}

async function getProjectDocuments() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      documents: [] as ProjectDocument[],
      projects: [],
      totalDocuments: 0,
      totalSize: 0,
      categoryCounts: {} as Record<string, number>,
    };
  }

  const { data: profile } = await supabase
    .from("app_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!(profile as any)?.organization_id) {
    return {
      documents: [] as ProjectDocument[],
      projects: [],
      totalDocuments: 0,
      totalSize: 0,
      categoryCounts: {} as Record<string, number>,
    };
  }

  // Fetch all projects for the organization
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, project_code")
    .eq("organization_id", (profile as any).organization_id)
    .order("name");

  // Fetch all documents with project and uploader info
  const { data: documents } = await supabase
    .from("project_documents")
    .select(
      `
      id,
      project_id,
      name,
      file_url,
      file_type,
      file_size,
      category,
      description,
      created_at,
      project:projects!inner(name, project_code, organization_id),
      uploader:app_users!project_documents_uploaded_by_fkey(full_name)
    `
    )
    .eq("project.organization_id", (profile as any).organization_id)
    .order("created_at", { ascending: false });

  const typedDocuments = (documents || []) as any[];

  const totalDocuments = typedDocuments.length;
  const totalSize = typedDocuments.reduce(
    (sum, doc) => sum + (doc.file_size || 0),
    0
  );
  const categoryCounts = typedDocuments.reduce((acc, doc) => {
    acc[doc.category] = (acc[doc.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    documents: typedDocuments,
    projects: projects || [],
    totalDocuments,
    totalSize,
    categoryCounts,
  };
}

export default async function ProjectDocumentsPage() {
  const stats = await getProjectDocuments();

  return (
    <RoleGuard
      allowedRoles={[
        "super_admin",
        "project_manager",
        "site_engineer",
        "executive",
      ]}
    >
      <DocumentsPageClient
        initialDocuments={stats.documents}
        projects={stats.projects}
        totalDocuments={stats.totalDocuments}
        totalSize={stats.totalSize}
        categoryCounts={stats.categoryCounts}
      />
    </RoleGuard>
  );
}
