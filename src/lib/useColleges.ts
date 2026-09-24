import { useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { COLLEGES as DEFAULT_COLLEGES, getCollegeAliases, normalizeCollegeName } from "@/components/reg/options";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORAGE_BUCKET = "registrations";
const MANIFEST_FILE_NAME = "colleges_manifest.json";
const COLLEGES_FOLDER = "manifests/colleges";
const FALLBACK_MANIFEST_FOLDER = "manifests";
const LOCAL_STORAGE_KEY = "ksaw_custom_colleges_cache";
const SYNC_CHANNEL_NAME = "ksaw_colleges_sync_channel";

export const NEW_KSAWU_COLLEGES: readonly string[] = [
  "KSAWU - BVVS Akkamahadevi Women's Arts, Science & Commerce College, Bagalkot",
  "KSAWU - Shri Jagadguru Gurusiddeshwara Vidyavardhak & Sanskritika Samsthe's College of Education for Women, Guledgudd",
  "KSAWU - Sri Hucheshwar Vidyavardhak Sangha's Education College for Women, Kamatgi",
  "KSAWU - Sri Vijay Mahantesh Arts & Commerce College for Women, Ilkal",
  "KSAWU - Shri Basaveshwar Education Society's Akkamahadevi Arts College for Women, Bailhongal",
  "KSAWU - KLE Society's Institute of Fashion Technology and Apparel Design College, Belagavi",
  "KSAWU - J.M.M's Sundrabai B. Patil Women's College of Education, Tilakwadi, Belgaum",
  "KSAWU - Smt. Ahalyabai A. Patil Arts & Commerce College for Women, Chikodi",
  "KSAWU - Smt. Allum Sumangalamma Memorial Degree College for Women, Gandhi Nagar, Ballari",
  "KSAWU - Gujjam... Education Society's College of Education for Women (B.Ed), Bhalki",
  "KSAWU - Ramchandra Veerappa Arts & Science College for Women, Humnabad",
  "KSAWU - Smt. K.S. Jiglur Arts & Dr. (Smt.) S.M. Sheshgiri Commerce College for Women, Dharwad",
  "KSAWU - S.J.M.V's Business Administration College for Women, J.C. Nagar, Hubli",
  "KSAWU - S.J.M.V's Arts & Commerce College for Women, J.C. Nagar, Hubli",
  "KSAWU - Shasthriji Vasati Education College for Women, Okkalgeri, Gadag",
  "KSAWU - S.J.M.V: B.A.J.S.S Arts & Commerce College for Women, Church Road, Ranebennur",
  "KSAWU - Raj Rajeshwari Arts & Commerce College for Women, Ranebennur",
  "KSAWU - Reshmi Educational & Charitable Trust's, Kum. Sharaneshwari Reshmi Women's B.Ed College, Kalaburgi",
  "KSAWU - Bi Bi Raza Degree College for Women (Arts & Science), Rouza Buzurg, Kalaburgi",
  "KSAWU - Godutai Dodappa Appa Arts, Commerce and Science Degree College for Women, Kalaburgi",
  "KSAWU - HKE Society's Smt Veeramma Gangasiri College for Women, PDA Engg College Road, Aiwan-E-Shahi Area, Kalaburgi",
  "KSAWU - Godutai College of Education for Women, Sharananagar, Kalaburgi",
  "KSAWU - Reshmi Educational and Charitable Trust's Sharaneshwari Reshmi Women's Degree College, Kalaburgi",
  "KSAWU - Kudal Sangam Education Societies Arts College for Women, Shahabad",
  "KSAWU - Sri. Gurubasappa Revanasiddappa Goled Arts & Commerce College for Women, Shahabad",
  "KSAWU - Kalmath Sri Channabasava Swamy Arts & Commerce College for Women, Gangavati",
  "KSAWU - Soma Subhadramma Ramagoud Arts & Commerce College for Women, Station Road, Raichur",
  "KSAWU - Sharda Arts & Commerce College for Women, Adarsh Colony, Sindhanoor",
  "KSAWU - Shri. Valabellary Channabasaveshwar Educational Trust, Patil Women's Degree College, Sindhanoor",
  "KSAWU - Smt. Uggama Devi Bhavarlal Theosophical Narhar College for Women, Asundi Bheemrao Nagar, Hampi Road, Hospet",
  "KSAWU - Shri Padmaraj Vidyavardhak Society's Shri Padmaraj Women's Degree College, Sindagi",
  "KSAWU - Matoshri Kantamma Sangannagouda Patil (Sasnoor) College of Education for Women, Hirur",
  "KSAWU - Secab's A.R.S. Inamdar Arts, Science & Commerce College for Women, Noubag, Vijayapura",
  "KSAWU - Sri. Bapugoud Darshanpur Memorial College for Women, Shahapur",
  "KSAWU - Shri Amareshwar Education Trust's Janani Arts College for Women, Surpur",
];

const ALL_BUILTIN_DEFAULTS = [...DEFAULT_COLLEGES, ...NEW_KSAWU_COLLEGES];
const ALL_BUILTIN_DEFAULTS_LOWER = new Set(
  ALL_BUILTIN_DEFAULTS.map((c) => c.trim().toLowerCase())
);

export function isBuiltInDefaultCollege(name: string): boolean {
  return ALL_BUILTIN_DEFAULTS_LOWER.has(name.trim().toLowerCase());
}

export function findMatchingBuiltInCollege(name: string): string | undefined {
  const targetLower = name.trim().toLowerCase();
  return ALL_BUILTIN_DEFAULTS.find((c) => c.trim().toLowerCase() === targetLower);
}

function getLocalCachedColleges(): string[] {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage?.getItem(LOCAL_STORAGE_KEY) : null;
    const parsed = raw ? JSON.parse(raw) : [];
    const fromStorage = Array.isArray(parsed) ? parsed : [];
    return Array.from(
      new Set(
        [...fromStorage, ...NEW_KSAWU_COLLEGES]
          .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
          .map((c) => c.trim())
      )
    );
  } catch {
    return [...NEW_KSAWU_COLLEGES];
  }
}

function setLocalCachedColleges(list: string[]): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage?.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore localStorage write errors
  }
}

function broadcastCollegesUpdate(list: string[]): void {
  try {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      channel.postMessage(list);
      channel.close();
    }
  } catch {
    // Ignore broadcast errors
  }
}

// Fetch custom colleges using multi-tier cloud strategy + DB recovery + local cache
export async function fetchCustomColleges(): Promise<string[]> {
  const collectedColleges = new Set<string>();
  const removedMarkers = new Set<string>();

  const processManifestArray = (rawArr: unknown) => {
    if (Array.isArray(rawArr)) {
      for (const raw of rawArr) {
        if (typeof raw === "string") {
          const trimmed = raw.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith("__removed__:")) {
            removedMarkers.add(trimmed);
          } else {
            collectedColleges.add(trimmed);
          }
        }
      }
    }
  };

  // 1. Direct Public HTTP Fetch from Supabase CDN / Storage
  try {
    const { data: pubData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(MANIFEST_FILE_NAME);

    if (pubData?.publicUrl) {
      const res = await fetch(`${pubData.publicUrl}?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        processManifestArray(json);
      }
    }
  } catch (pubErr) {
    console.warn("Public CDN manifest fetch notice:", pubErr);
  }

  // 2. Direct Supabase Storage Download for root manifest
  try {
    const { data: blob } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(MANIFEST_FILE_NAME);

    if (blob) {
      const text = await blob.text();
      const parsed = JSON.parse(text);
      processManifestArray(parsed);
    }
  } catch (dlErr) {
    console.warn("Root manifest download notice:", dlErr);
  }

  // 3. Scan manifest folders in cloud storage
  try {
    const folders = [COLLEGES_FOLDER, FALLBACK_MANIFEST_FOLDER, ""];
    const targetFiles: { folder: string; name: string }[] = [];

    for (const folder of folders) {
      try {
        const { data: files } = await supabase.storage
          .from(STORAGE_BUCKET)
          .list(folder, { limit: 100 });

        if (files && files.length > 0) {
          const jsonFiles = files
            .filter((f) => f.name.endsWith(".json") && f.name.includes("college"))
            .sort((a, b) => {
              const tsA = parseInt(a.name.replace(/\D/g, ""), 10) || 0;
              const tsB = parseInt(b.name.replace(/\D/g, ""), 10) || 0;
              return tsB - tsA;
            });

          for (const f of jsonFiles.slice(0, 5)) {
            targetFiles.push({ folder, name: f.name });
          }
        }
      } catch {
        // Ignore folder list failure
      }
    }

    if (targetFiles.length > 0) {
      const downloads = await Promise.allSettled(
        targetFiles.map(async (item) => {
          const path = item.folder ? `${item.folder}/${item.name}` : item.name;
          const { data: blob } = await supabase.storage
            .from(STORAGE_BUCKET)
            .download(path);
          if (!blob) return null;
          const text = await blob.text();
          return JSON.parse(text);
        })
      );

      for (const res of downloads) {
        if (res.status === "fulfilled" && res.value) {
          processManifestArray(res.value);
        }
      }
    }
  } catch (scanErr) {
    console.warn("Folder manifest scanning notice:", scanErr);
  }

  // 4. Recover any custom institution names from existing database registrations
  try {
    const { data: dbRecords } = await supabase
      .from("registrations")
      .select("institution_name")
      .not("institution_name", "is", null)
      .limit(1000);

    if (dbRecords && dbRecords.length > 0) {
      const defaultLower = new Set(DEFAULT_COLLEGES.map((c) => c.toLowerCase()));
      for (const record of dbRecords) {
        const inst = record.institution_name?.trim();
        if (inst && !defaultLower.has(inst.toLowerCase())) {
          collectedColleges.add(inst);
        }
      }
    }
  } catch (dbErr) {
    console.warn("DB institution recovery notice:", dbErr);
  }

  // 5. Include all predefined KSAWU institutions and local cache
  for (const c of NEW_KSAWU_COLLEGES) {
    collectedColleges.add(c);
  }

  const localCached = getLocalCachedColleges();
  for (const c of localCached) {
    if (c.startsWith("__removed__:")) {
      removedMarkers.add(c);
    } else {
      collectedColleges.add(c);
    }
  }

  // 6. Active custom colleges automatically override and purge any conflicting removed markers
  for (const raw of collectedColleges) {
    const rawLower = raw.trim().toLowerCase();
    for (const marker of Array.from(removedMarkers)) {
      const markerTarget = marker.replace("__removed__:", "").trim().toLowerCase();
      if (markerTarget === rawLower) {
        removedMarkers.delete(marker);
      }
    }
  }

  // 7. Filter removed markers and resolve canonical names
  const removedNamesLower = new Set(
    Array.from(removedMarkers).map((m) =>
      m.replace("__removed__:", "").trim().toLowerCase()
    )
  );

  const activeColleges: string[] = [];
  const seenLower = new Set<string>();
  const seenAlphaNumeric = new Set<string>();
  const defaultLower = new Set(DEFAULT_COLLEGES.map((c) => c.toLowerCase()));
  const defaultAlphaNumeric = new Set(
    DEFAULT_COLLEGES.map((c) => c.toLowerCase().replace(/[^a-z0-9]/g, ""))
  );

  for (const raw of collectedColleges) {
    const canonical = normalizeCollegeName(raw) || raw;
    const lower = canonical.toLowerCase();
    const rawLower = raw.toLowerCase();
    const alphaKey = canonical.toLowerCase().replace(/[^a-z0-9]/g, "");
    const rawAlphaKey = raw.toLowerCase().replace(/[^a-z0-9]/g, "");

    // If marked as removed (and is a default), skip
    if (
      removedNamesLower.has(lower) ||
      removedNamesLower.has(rawLower) ||
      removedNamesLower.has(alphaKey) ||
      removedNamesLower.has(rawAlphaKey)
    ) {
      continue;
    }

    if (defaultLower.has(lower) || defaultAlphaNumeric.has(alphaKey)) {
      continue;
    }

    if (!seenLower.has(lower) && !seenAlphaNumeric.has(alphaKey)) {
      seenLower.add(lower);
      seenAlphaNumeric.add(alphaKey);
      const aliases = getCollegeAliases(canonical);
      for (const a of aliases) {
        seenLower.add(a.trim().toLowerCase());
        seenAlphaNumeric.add(a.toLowerCase().replace(/[^a-z0-9]/g, ""));
      }
      activeColleges.push(canonical);
    }
  }

  activeColleges.sort((a, b) => a.localeCompare(b));

  // ONLY retain removedMarkers that actually belong to built-in defaults and are NOT active
  const activeLowerSet = new Set(activeColleges.map((ac) => ac.toLowerCase()));
  const validRemovedMarkers = Array.from(removedMarkers).filter((m) => {
    const target = m.replace("__removed__:", "").trim().toLowerCase();
    return isBuiltInDefaultCollege(target) && !activeLowerSet.has(target);
  });

  const finalMasterList = [...activeColleges, ...validRemovedMarkers];
  setLocalCachedColleges(finalMasterList);
  return finalMasterList;
}

// Save a consolidated custom colleges manifest to Supabase Cloud Server (Multi-location)
export async function saveCustomColleges(colleges: string[]): Promise<void> {
  const activeItems = new Set(
    colleges
      .filter((c) => !c.startsWith("__removed__:") && c.trim().length > 0)
      .map((c) => c.trim().toLowerCase())
  );

  const cleanList = Array.from(
    new Set(
      colleges
        .map((c) => c.trim())
        .filter((c) => {
          if (!c) return false;
          if (c.startsWith("__removed__:")) {
            const target = c.replace("__removed__:", "").trim().toLowerCase();
            // If the item is present as active, discard the removed marker
            if (activeItems.has(target)) return false;
            // Only keep removed markers for actual built-in defaults
            if (!isBuiltInDefaultCollege(target)) return false;
          }
          return true;
        })
    )
  ).sort((a, b) => {
    const aRem = a.startsWith("__removed__:");
    const bRem = b.startsWith("__removed__:");
    if (aRem && !bRem) return 1;
    if (!aRem && bRem) return -1;
    return a.localeCompare(b);
  });

  // 1. Update local cache & broadcast to other tabs immediately
  setLocalCachedColleges(cleanList);
  broadcastCollegesUpdate(cleanList);

  const jsonBlob = new Blob([JSON.stringify(cleanList, null, 2)], {
    type: "application/json",
  });

  const timestamp = Date.now();
  let uploaded = false;
  let lastError: Error | null = null;

  // Target 1: Root manifest file (with upsert)
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(MANIFEST_FILE_NAME, jsonBlob, {
        contentType: "application/json",
        upsert: true,
      });

    if (!error) {
      uploaded = true;
    } else {
      lastError = new Error(error.message);
    }
  } catch (err: any) {
    lastError = err;
  }

  // Target 2: Dedicated manifests folder with timestamp
  try {
    const folderPath = `${COLLEGES_FOLDER}/colleges_${timestamp}.json`;
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(folderPath, jsonBlob, {
        contentType: "application/json",
      });

    if (!error) {
      uploaded = true;
    }
  } catch {
    // Ignore folder upload fallback notice
  }

  // Target 3: Root timestamped file
  try {
    const rootTsPath = `colleges_${timestamp}.json`;
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(rootTsPath, jsonBlob, {
        contentType: "application/json",
      });

    if (!error) {
      uploaded = true;
    }
  } catch {
    // Ignore root timestamp upload notice
  }

  if (!uploaded && lastError) {
    console.error("Cloud server manifest upload error:", lastError);
    throw new Error(lastError.message || "Failed to save colleges to cloud storage.");
  }
}

export function useColleges() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["custom_colleges"],
    queryFn: fetchCustomColleges,
    placeholderData: getLocalCachedColleges,
    staleTime: 5 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });

  // Cross-tab real-time sync listener
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        channel.onmessage = (event) => {
          if (Array.isArray(event?.data)) {
            queryClient.setQueryData(["custom_colleges"], event.data);
          }
        };
      }
    } catch {
      // Ignore broadcast channel init errors
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            queryClient.setQueryData(["custom_colleges"], parsed);
          }
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, [queryClient]);

  const rawCustomColleges = query.data ?? [];

  const { visibleDefaults, customColleges, allColleges } = useMemo(() => {
    const activeCustomNames = rawCustomColleges
      .filter((c) => !c.startsWith("__removed__:") && c.trim().length > 0)
      .map((c) => normalizeCollegeName(c.trim()) || c.trim());

    const activeCustomLowerSet = new Set(activeCustomNames.map((c) => c.toLowerCase()));

    const removedDefaults = new Set(
      rawCustomColleges
        .filter((c) => c.startsWith("__removed__:"))
        .map((c) => c.replace("__removed__:", "").trim().toLowerCase())
        .filter((c) => !activeCustomLowerSet.has(c))
    );

    const defaults = Array.from(
      new Set(
        DEFAULT_COLLEGES
          .map((c) => c.trim())
          .filter((c) => {
            const lower = c.toLowerCase();
            if (removedDefaults.has(lower)) return false;
            const aliases = getCollegeAliases(c).map((a) => a.toLowerCase());
            const hasCustomAlias = activeCustomNames.some(
              (raw) => aliases.includes(raw.toLowerCase()) && raw.toLowerCase() !== lower
            );
            if (hasCustomAlias) return false;
            return true;
          })
      )
    );

    const custom: string[] = [];
    const customSeen = new Set<string>();
    const customAlphaSeen = new Set<string>();
    const defaultAlpha = new Set(defaults.map((d) => d.toLowerCase().replace(/[^a-z0-9]/g, "")));

    for (const raw of activeCustomNames) {
      const canonical = normalizeCollegeName(raw) || raw;
      const lower = canonical.toLowerCase();
      const alpha = canonical.toLowerCase().replace(/[^a-z0-9]/g, "");

      if (defaults.some((d) => d.toLowerCase() === lower) || defaultAlpha.has(alpha)) continue;

      if (!customSeen.has(lower) && !customAlphaSeen.has(alpha)) {
        customSeen.add(lower);
        customAlphaSeen.add(alpha);
        const aliases = getCollegeAliases(canonical);
        for (const a of aliases) {
          customSeen.add(a.trim().toLowerCase());
          customAlphaSeen.add(a.toLowerCase().replace(/[^a-z0-9]/g, ""));
        }
        custom.push(canonical);
      }
    }

    const seen = new Set<string>();
    const seenAlpha = new Set<string>();
    const all: string[] = [];
    for (const c of [...custom, ...defaults]) {
      const canonical = normalizeCollegeName(c) || c;
      const key = canonical.trim().toLowerCase();
      const alpha = canonical.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (key && !seen.has(key) && !seenAlpha.has(alpha)) {
        seen.add(key);
        seenAlpha.add(alpha);
        const aliases = getCollegeAliases(canonical);
        for (const a of aliases) {
          seen.add(a.trim().toLowerCase());
          seenAlpha.add(a.toLowerCase().replace(/[^a-z0-9]/g, ""));
        }
        all.push(canonical);
      }
    }
    all.sort((a, b) => a.localeCompare(b));

    return {
      visibleDefaults: defaults,
      customColleges: custom,
      allColleges: all,
    };
  }, [rawCustomColleges]);

  const addCollegeMutation = useMutation({
    mutationFn: async (newCollegeName: string) => {
      const trimmed = newCollegeName.trim();
      if (!trimmed) throw new Error("College name cannot be empty");

      const current = await fetchCustomColleges();
      const currentActive = current.filter((c) => !c.startsWith("__removed__:") && c.trim().length > 0);
      const currentVisibleDefaults = DEFAULT_COLLEGES.map((c) => c.trim()).filter((c) => {
        const lower = c.toLowerCase();
        return !current.some((m) => m.toLowerCase() === `__removed__:${lower}`);
      });

      const currentAll = Array.from(new Set([...currentVisibleDefaults, ...currentActive]));

      if (currentAll.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
        throw new Error("This college already exists in the list");
      }

      // Purge any __removed__ marker for this name
      const filtered = current.filter(
        (c) =>
          c.toLowerCase() !== `__removed__:${trimmed.toLowerCase()}` &&
          c.trim().toLowerCase() !== trimmed.toLowerCase()
      );

      const updated = isBuiltInDefaultCollege(trimmed)
        ? filtered
        : [...filtered, trimmed];

      await saveCustomColleges(updated);
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["custom_colleges"], updated);
      void queryClient.invalidateQueries({ queryKey: ["custom_colleges"] });
      void queryClient.invalidateQueries({ queryKey: ["registrations"] });
      void queryClient.invalidateQueries({ queryKey: ["all_registrations"] });
      void queryClient.invalidateQueries({ queryKey: ["registration-stats"] });
      toast.success("College added & synced to server successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add college");
    },
  });

  const removeCollegeMutation = useMutation({
    mutationFn: async (collegeToRemove: string) => {
      const trimmed = collegeToRemove.trim();
      const current = await fetchCustomColleges();
      const matchedBuiltIn = findMatchingBuiltInCollege(trimmed);

      let updated: string[];
      if (matchedBuiltIn) {
        // For built-ins, add __removed__ marker to suppress it
        const filtered = current.filter(
          (c) =>
            c.trim().toLowerCase() !== trimmed.toLowerCase() &&
            c.trim().toLowerCase() !== matchedBuiltIn.trim().toLowerCase() &&
            c.toLowerCase() !== `__removed__:${matchedBuiltIn.trim().toLowerCase()}`
        );
        updated = [...filtered, `__removed__:${matchedBuiltIn.trim()}`];
      } else {
        // For custom colleges, simply remove from list and clean any stale markers
        updated = current.filter(
          (c) =>
            c.trim().toLowerCase() !== trimmed.toLowerCase() &&
            c.toLowerCase() !== `__removed__:${trimmed.toLowerCase()}`
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
      const currentActive = current.filter((c) => !c.startsWith("__removed__:") && c.trim().length > 0);
      const currentVisibleDefaults = DEFAULT_COLLEGES.map((c) => c.trim()).filter((c) => {
        const lower = c.toLowerCase();
        return !current.some((m) => m.toLowerCase() === `__removed__:${lower}`);
      });

      const currentAll = Array.from(new Set([...currentVisibleDefaults, ...currentActive]));

      if (
        currentAll.some(
          (c) =>
            c.toLowerCase() === trimmedNew.toLowerCase() &&
            c.toLowerCase() !== trimmedOld.toLowerCase()
        )
      ) {
        throw new Error("A college with this name already exists");
      }

      const matchedBuiltInOld = findMatchingBuiltInCollege(trimmedOld);

      // Remove oldName and clean any __removed__ marker for the new name or old name
      const filtered = current.filter((c) => {
        const lower = c.trim().toLowerCase();
        if (lower === trimmedOld.toLowerCase()) return false;
        if (matchedBuiltInOld && lower === matchedBuiltInOld.trim().toLowerCase()) return false;
        if (lower === `__removed__:${trimmedNew.toLowerCase()}`) return false;
        if (lower === `__removed__:${trimmedOld.toLowerCase()}`) return false;
        return true;
      });

      let updated: string[];
      if (matchedBuiltInOld) {
        // If old name was a built-in default, mark the built-in as removed so it doesn't re-appear
        updated = [...filtered, `__removed__:${matchedBuiltInOld.trim()}`, trimmedNew];
      } else {
        // If old name was a custom college, simply replace with trimmedNew (do NOT mark custom as removed!)
        updated = [...filtered, trimmedNew];
      }

      await saveCustomColleges(updated);

      // Also update existing applicant records in Supabase database so past registrations stay synced
      try {
        const oldVariants = Array.from(new Set([trimmedOld, ...getCollegeAliases(trimmedOld)]));
        for (const variant of oldVariants) {
          if (!variant) continue;
          await supabase
            .from("registrations")
            .update({ institution_name: trimmedNew })
            .eq("institution_name", variant);

          await supabase
            .from("registrations")
            .update({ institution_name: trimmedNew })
            .ilike("institution_name", variant);
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
      toast.success("College and existing records updated & synced successfully!");
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

