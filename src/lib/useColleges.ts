import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { COLLEGES as DEFAULT_COLLEGES, normalizeCollegeName } from "@/components/reg/options";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORAGE_BUCKET = "registrations";
const COLLEGES_FOLDER = "manifests/colleges";
const FALLBACK_MANIFEST_FOLDER = "manifests";
const LOCAL_STORAGE_KEY = "ksaw_custom_colleges_cache";

function getLocalCachedColleges(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return Array.from(
      new Set(
        parsed
          .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
          .map((c) => (c.startsWith("__removed__:") ? c : normalizeCollegeName(c) || c.trim()))
      )
    );
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

// Fetch the latest custom colleges manifest from Supabase Storage (checks manifests/colleges with fallback to manifests)
export async function fetchCustomColleges(): Promise<string[]> {
  try {
    let folder = COLLEGES_FOLDER;
    let { data: files, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folder, { limit: 100 });

    if (error || !files || files.length === 0) {
      folder = FALLBACK_MANIFEST_FOLDER;
      const res = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(folder, { limit: 100 });
      files = res.data;
      error = res.error;
    }

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
    if (!latest) return getLocalCachedColleges();
    const { data: fileBlob, error: dlError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(`${folder}/${latest.name}`);

    if (dlError || !fileBlob) {
      return getLocalCachedColleges();
    }

    const text = await fileBlob.text();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      const clean = Array.from(
        new Set(
          parsed
            .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
            .map((c) => (c.startsWith("__removed__:") ? c : normalizeCollegeName(c) || c.trim()))
        )
      );
      setLocalCachedColleges(clean);
      return clean;
    }
    return getLocalCachedColleges();
  } catch (err) {
    console.error("Failed to load custom colleges manifest:", err);
    return getLocalCachedColleges();
  }
}

// Save a new versioned custom colleges manifest to Supabase Storage (Dedicated folder)
export async function saveCustomColleges(colleges: string[]): Promise<void> {
  const cleanList = Array.from(
    new Set(
      colleges
        .map((c) => c.trim())
        .filter((c) => c.length > 0)
        .map((c) => (c.startsWith("__removed__:") ? c : normalizeCollegeName(c) || c))
    )
  ).sort((a, b) => a.localeCompare(b));

  setLocalCachedColleges(cleanList);

  const jsonBlob = new Blob([JSON.stringify(cleanList, null, 2)], {
    type: "application/json",
  });

  const timestamp = Date.now();
  const manifestFileName = `${COLLEGES_FOLDER}/colleges_${timestamp}.json`;

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
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const rawCustomColleges = query.data ?? [];
  const removedDefaults = new Set(
    rawCustomColleges
      .filter((c) => c.startsWith("__removed__:"))
      .map((c) => c.replace("__removed__:", "").trim().toLowerCase())
  );

  const visibleDefaults = Array.from(
    new Set(
      DEFAULT_COLLEGES
        .map((c) => normalizeCollegeName(c) || c.trim())
        .filter((c) => !removedDefaults.has(c.trim().toLowerCase()))
    )
  );

  const customColleges = Array.from(
    new Set(
      rawCustomColleges
        .filter((c) => !c.startsWith("__removed__:"))
        .map((c) => normalizeCollegeName(c) || c.trim())
        .filter((c) => !visibleDefaults.some((d) => d.toLowerCase() === c.toLowerCase()))
    )
  );

  // Combine active base colleges + custom colleges without duplicates.
  // Uses a case-insensitive seen-set so no two entries that differ only in casing
  // or trailing whitespace appear in the final dropdown list.
  // visibleDefaults are added first (they take priority), then any custom
  // colleges whose lowercase form has not yet been seen.
  const allColleges = (() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const c of [...visibleDefaults, ...customColleges]) {
      const key = c.trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        result.push(c);
      }
    }
    return result.sort((a, b) => a.localeCompare(b));
  })();

  const addCollegeMutation = useMutation({
    mutationFn: async (newCollegeName: string) => {
      const trimmed = newCollegeName.trim();
      if (!trimmed) throw new Error("College name cannot be empty");

      const current = await fetchCustomColleges();
      const currentRemoved = new Set(
        current
          .filter((c) => c.startsWith("__removed__:"))
          .map((c) => c.replace("__removed__:", "").trim().toLowerCase())
      );
      const currentVisibleDefaults = DEFAULT_COLLEGES.filter(
        (c) => !currentRemoved.has(c.trim().toLowerCase())
      );
      const currentCustom = current.filter((c) => !c.startsWith("__removed__:"));
      const currentAll = Array.from(new Set([...currentVisibleDefaults, ...currentCustom]));

      if (currentAll.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
        throw new Error("This college already exists in the list");
      }

      // If it was in removed defaults, un-remove it; otherwise add to custom
      const updated = current.filter(
        (c) => c.toLowerCase() !== `__removed__:${trimmed.toLowerCase()}`
      );
      if (!DEFAULT_COLLEGES.some((c) => c.trim().toLowerCase() === trimmed.toLowerCase())) {
        updated.push(trimmed);
      }

      await saveCustomColleges(updated);
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["custom_colleges"], updated);
      void queryClient.invalidateQueries({ queryKey: ["custom_colleges"] });
      void queryClient.invalidateQueries({ queryKey: ["registrations"] });
      void queryClient.invalidateQueries({ queryKey: ["all_registrations"] });
      void queryClient.invalidateQueries({ queryKey: ["registration-stats"] });
      toast.success("College added successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add college");
    },
  });

  const removeCollegeMutation = useMutation({
    mutationFn: async (collegeToRemove: string) => {
      const trimmed = collegeToRemove.trim();
      const current = await fetchCustomColleges();
      let updated: string[];

      const isDefault = DEFAULT_COLLEGES.some(
        (c) => c.trim().toLowerCase() === trimmed.toLowerCase()
      );

      if (isDefault) {
        // Add marker to hide default college
        updated = [
          ...current.filter((c) => c.trim().toLowerCase() !== trimmed.toLowerCase()),
          `__removed__:${trimmed}`,
        ];
      } else {
        // Remove from custom list
        updated = current.filter(
          (c) =>
            c.trim().toLowerCase() !== trimmed.toLowerCase() &&
            c.trim().toLowerCase() !== `__removed__:${trimmed.toLowerCase()}`
        );
      }

      await saveCustomColleges(updated);
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["custom_colleges"], updated);
      void queryClient.invalidateQueries({ queryKey: ["custom_colleges"] });
      void queryClient.invalidateQueries({ queryKey: ["registrations"] });
      void queryClient.invalidateQueries({ queryKey: ["all_registrations"] });
      void queryClient.invalidateQueries({ queryKey: ["registration-stats"] });
      toast.success("College removed from list!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to remove college");
    },
  });

  const editCollegeMutation = useMutation({
    mutationFn: async ({ oldName, newName }: { oldName: string; newName: string }) => {
      const trimmedNew = newName.trim();
      const trimmedOld = oldName.trim();
      if (!trimmedNew) throw new Error("College name cannot be empty");
      if (trimmedNew.toLowerCase() === trimmedOld.toLowerCase()) {
        return await fetchCustomColleges();
      }

      const current = await fetchCustomColleges();
      const currentRemoved = new Set(
        current
          .filter((c) => c.startsWith("__removed__:"))
          .map((c) => c.replace("__removed__:", "").trim().toLowerCase())
      );
      const currentVisibleDefaults = DEFAULT_COLLEGES.filter(
        (c) => !currentRemoved.has(c.trim().toLowerCase())
      );
      const currentCustom = current.filter((c) => !c.startsWith("__removed__:"));
      const currentAll = Array.from(new Set([...currentVisibleDefaults, ...currentCustom]));

      if (
        currentAll.some(
          (c) =>
            c.toLowerCase() === trimmedNew.toLowerCase() &&
            c.toLowerCase() !== trimmedOld.toLowerCase()
        )
      ) {
        throw new Error("A college with this name already exists");
      }

      let updated: string[];
      const isOldDefault = DEFAULT_COLLEGES.some(
        (c) => c.trim().toLowerCase() === trimmedOld.toLowerCase()
      );

      if (isOldDefault) {
        // Hide old default college and add new custom name
        updated = [
          ...current.filter((c) => c.trim().toLowerCase() !== trimmedOld.toLowerCase()),
          `__removed__:${trimmedOld}`,
          trimmedNew,
        ];
      } else {
        // Update in custom list
        updated = current.map((c) =>
          c.trim().toLowerCase() === trimmedOld.toLowerCase() ? trimmedNew : c
        );
      }

      await saveCustomColleges(updated);

      // Also update existing applicant records in Supabase database so past registrations stay synced
      try {
        const { error: dbErr } = await supabase
          .from("registrations")
          .update({ institution_name: trimmedNew })
          .or(`institution_name.eq.${trimmedOld},institution_name.ilike.%${trimmedOld}%`);

        if (dbErr) {
          console.warn("Notice: Could not update existing registration records with new college name:", dbErr);
        }
      } catch (dbErr) {
        console.warn("DB update exception:", dbErr);
      }

      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["custom_colleges"], updated);
      void queryClient.invalidateQueries({ queryKey: ["custom_colleges"] });
      void queryClient.invalidateQueries({ queryKey: ["registrations"] });
      void queryClient.invalidateQueries({ queryKey: ["all_registrations"] });
      void queryClient.invalidateQueries({ queryKey: ["registration-stats"] });
      toast.success("College and existing records updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update college");
    },
  });

  return {
    colleges: allColleges,
    customColleges,
    isLoading: query.isLoading,
    addCollege: addCollegeMutation.mutateAsync,
    isAdding: addCollegeMutation.isPending,
    editCollege: (oldName: string, newName: string) =>
      editCollegeMutation.mutateAsync({ oldName, newName }),
    isEditing: editCollegeMutation.isPending,
    removeCollege: removeCollegeMutation.mutateAsync,
    isRemoving: removeCollegeMutation.isPending,
  };
}
