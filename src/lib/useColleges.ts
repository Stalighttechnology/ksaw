import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { COLLEGES as DEFAULT_COLLEGES } from "@/components/reg/options";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORAGE_BUCKET = "registrations";
const MANIFEST_FOLDER = "manifests";
const LOCAL_STORAGE_KEY = "ksaw_custom_colleges_cache";

function getLocalCachedColleges(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setLocalCachedColleges(list: string[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore localStorage write errors
  }
}

// Fetch the latest custom colleges manifest from Supabase Storage
export async function fetchCustomColleges(): Promise<string[]> {
  try {
    const { data: files, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(MANIFEST_FOLDER, {
        limit: 100,
      });

    if (error || !files || files.length === 0) {
      return getLocalCachedColleges();
    }

    const manifestFiles = files
      .filter((f) => f.name.startsWith("colleges_") && f.name.endsWith(".json"))
      .sort((a, b) => {
        const tsA = parseInt(a.name.replace(/\D/g, ""), 10) || 0;
        const tsB = parseInt(b.name.replace(/\D/g, ""), 10) || 0;
        return tsB - tsA;
      });

    if (manifestFiles.length === 0) {
      return getLocalCachedColleges();
    }

    const latest = manifestFiles[0];
    const { data: fileBlob, error: dlError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(`${MANIFEST_FOLDER}/${latest.name}`);

    if (dlError || !fileBlob) {
      return getLocalCachedColleges();
    }

    const text = await fileBlob.text();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      const clean = parsed.filter((c): c is string => typeof c === "string" && c.trim().length > 0);
      setLocalCachedColleges(clean);
      return clean;
    }
    return getLocalCachedColleges();
  } catch (err) {
    console.error("Failed to load custom colleges manifest:", err);
    return getLocalCachedColleges();
  }
}

// Save a new versioned custom colleges manifest to Supabase Storage (Append-only insert)
export async function saveCustomColleges(colleges: string[]): Promise<void> {
  const cleanList = Array.from(
    new Set(colleges.map((c) => c.trim()).filter((c) => c.length > 0))
  ).sort((a, b) => a.localeCompare(b));

  setLocalCachedColleges(cleanList);

  const jsonBlob = new Blob([JSON.stringify(cleanList, null, 2)], {
    type: "application/json",
  });

  const timestamp = Date.now();
  const manifestFileName = `${MANIFEST_FOLDER}/colleges_${timestamp}.json`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(manifestFileName, jsonBlob, {
      contentType: "application/json",
    });

  if (error) {
    console.error("Cloud manifest upload error:", error);
    // If cloud upload fails, local storage cache is already updated
    throw new Error(error.message || "Failed to save colleges to cloud storage.");
  }
}

export function useColleges() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["custom_colleges"],
    queryFn: fetchCustomColleges,
    initialData: getLocalCachedColleges,
    staleTime: 5000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const customColleges = query.data ?? [];

  // Combine default base colleges + custom colleges without duplicates
  const allColleges = Array.from(
    new Set([...DEFAULT_COLLEGES, ...customColleges])
  ).sort((a, b) => a.localeCompare(b));

  const addCollegeMutation = useMutation({
    mutationFn: async (newCollegeName: string) => {
      const trimmed = newCollegeName.trim();
      if (!trimmed) throw new Error("College name cannot be empty");

      const current = await fetchCustomColleges();
      if (
        DEFAULT_COLLEGES.some((c) => c.toLowerCase() === trimmed.toLowerCase()) ||
        current.some((c) => c.toLowerCase() === trimmed.toLowerCase())
      ) {
        throw new Error("This college already exists in the list");
      }

      const updated = [...current, trimmed];
      await saveCustomColleges(updated);
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["custom_colleges"], updated);
      void queryClient.invalidateQueries({ queryKey: ["custom_colleges"] });
      toast.success("College added successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add college");
    },
  });

  const removeCollegeMutation = useMutation({
    mutationFn: async (collegeToRemove: string) => {
      const current = await fetchCustomColleges();
      const updated = current.filter(
        (c) => c.toLowerCase() !== collegeToRemove.trim().toLowerCase()
      );
      await saveCustomColleges(updated);
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["custom_colleges"], updated);
      void queryClient.invalidateQueries({ queryKey: ["custom_colleges"] });
      toast.success("College removed from custom list!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to remove college");
    },
  });

  return {
    colleges: allColleges,
    customColleges,
    isLoading: query.isLoading,
    addCollege: addCollegeMutation.mutateAsync,
    isAdding: addCollegeMutation.isPending,
    removeCollege: removeCollegeMutation.mutateAsync,
    isRemoving: removeCollegeMutation.isPending,
  };
}
