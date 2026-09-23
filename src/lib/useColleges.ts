import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { COLLEGES as DEFAULT_COLLEGES, getCollegeAliases, normalizeCollegeName } from "@/components/reg/options";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORAGE_BUCKET = "registrations";
const COLLEGES_FOLDER = "manifests/colleges";
const FALLBACK_MANIFEST_FOLDER = "manifests";
const LOCAL_STORAGE_KEY = "ksaw_custom_colleges_cache";

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

// Fetch custom colleges with cross-folder manifest union and database recovery
export async function fetchCustomColleges(): Promise<string[]> {
  try {
    const folders = [COLLEGES_FOLDER, FALLBACK_MANIFEST_FOLDER];
    const targetFiles: { folder: string; name: string }[] = [];

    // 1. Scan manifest folders in cloud storage (pick recent timestamped manifests)
    for (const folder of folders) {
      try {
        const { data: files } = await supabase.storage
          .from(STORAGE_BUCKET)
          .list(folder, { limit: 100 });

        if (files && files.length > 0) {
          const jsonFiles = files
            .filter((f) => f.name.endsWith(".json"))
            .sort((a, b) => {
              const tsA = parseInt(a.name.replace(/\D/g, ""), 10) || 0;
              const tsB = parseInt(b.name.replace(/\D/g, ""), 10) || 0;
              return tsB - tsA;
            });

          // Take the top 5 most recent manifests from each folder for instant merging
          for (const f of jsonFiles.slice(0, 5)) {
            targetFiles.push({ folder, name: f.name });
          }
        }
      } catch (scanErr) {
        console.warn(`Storage folder scan error for ${folder}:`, scanErr);
      }
    }

    const collectedColleges = new Set<string>();
    const removedMarkers = new Set<string>();

    // 2. Download and merge colleges from discovered storage manifests in parallel
    if (targetFiles.length > 0) {
      const downloads = await Promise.allSettled(
        targetFiles.map(async (item) => {
          const { data: blob } = await supabase.storage
            .from(STORAGE_BUCKET)
            .download(`${item.folder}/${item.name}`);
          if (!blob) return null;
          const text = await blob.text();
          return JSON.parse(text);
        })
      );

      for (const res of downloads) {
        if (res.status === "fulfilled" && Array.isArray(res.value)) {
          for (const raw of res.value) {
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
      }
    }

    // 3. Recover any custom institution names from existing database registrations
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

    // 4. Include all new KSAWU institutions and local cache
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

    // 5. Remove any colleges explicitly marked as removed and resolve aliases to canonical single names
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

      // If removed explicitly or if this raw variation was marked removed, skip
      if (
        removedNamesLower.has(lower) ||
        removedNamesLower.has(rawLower) ||
        removedNamesLower.has(alphaKey) ||
        removedNamesLower.has(rawAlphaKey)
      ) {
        continue;
      }

      // If this maps to a default college, skip from custom list
      if (defaultLower.has(lower) || defaultAlphaNumeric.has(alphaKey)) {
        continue;
      }

      if (!seenLower.has(lower) && !seenAlphaNumeric.has(alphaKey)) {
        seenLower.add(lower);
        seenAlphaNumeric.add(alphaKey);
        // Mark all aliases as seen so old spelling variations don't get added
        const aliases = getCollegeAliases(canonical);
        for (const a of aliases) {
          seenLower.add(a.trim().toLowerCase());
          seenAlphaNumeric.add(a.toLowerCase().replace(/[^a-z0-9]/g, ""));
        }
        activeColleges.push(canonical);
      }
    }

    activeColleges.sort((a, b) => a.localeCompare(b));

    const finalMasterList = [...activeColleges, ...Array.from(removedMarkers)];

    // Cache locally immediately
    setLocalCachedColleges(finalMasterList);

    // Background-sync the consolidated list to cloud storage
    if (finalMasterList.length >= localCached.length) {
      void saveCustomColleges(finalMasterList).catch((err) => {
        console.warn("Background manifest sync notice:", err);
      });
    }

    // Safe background update for known duplicate pairs to ensure DB registrations point to canonical names
    try {
      const dbPairs: [string, string][] = [
        ["KSAWU VIJAYAPURA", "KSAWU - Karnataka State Akkamahadevi Women University, Jnana Shakti Campus, Vijayapura"],
        ["B.V.V Sangha's Danammadevi Arts, Commerce and Science College for Women, Mudhol.", "KSAWU - B.V.V. Sangha's Danammadevi Arts, Commerce and Science College for Women, Mudhol"],
        ["KASWU-Sri. Siddrameshwar Education Society's chandrageri College of Education for Women Shivabasava nagar, Belguam-591 102,", "KSAWU - Sri Siddrameshwar Education Society's Chandragiri College of Education for Women, Shivabasava Nagar, Belgaum"],
        ["Akkamahadevi Arts & Commerce College for Women, Basavakalyan", "KSAWU - Akkamahadevi Arts & Commerce College for Women, Basavakalyan"],
        ["Akkamahadevi Mahila Mahavidyalay, Bidar-", "KSAWU - Akkamahadevi Mahila Mahavidyalay, Bidar"],
        ["Sri. Shivalingeshwar Degree College for Women, Haveri-", "KSAWU - Sri Shivalingeshwar Degree College for Women, Haveri"],
        ["B.A.J.S.S. Arts & Commerce College for Women Ranebennur", "KSAWU - B.A.J.S.S. Arts & Commerce College for Women, Ranebennur"],
        ["Anjuman Degree College for Women, Shamshuddin Circle Near Hotel cola paradise Bhatkal", "KSAWU - Anjuman Degree College for Women, Shamsuddin Circle, Bhatkal"],
        ["Bethel Christian Fellowship Association ® Bethel Women's Degree College, Virupapura, Anegundi Road, Gangavathi", "KSAWU - Bethel Christian Fellowship Association® Bethel Women's Degree College, Virupapura, Anegundi Road, Gangavati"],
        ["B.L.D.E's Society's Smt. Bangaramma Sajjan Arts, Commerce and Science College for Women, S.S College Campus BLDE Hospital Road, Vijayapura", "KSAWU - B.L.D.E's Society's Smt. Bangaramma Sajjan Arts, Commerce and Science College for Women, S.S College Campus, BLDE Hospital Road, Vijayapura"],
        ["B.D.E Society's Arts Science and Commerce College foe Women, Vijayapur", "KSAWU - B.D.E Society's Arts and Commerce College for Women, Vijayapura"],
        ["Bi Bi Raza Degree College or Women, (Arts & Science) Rouza Buzurg Kalaburgi -585 104,", "KSAWU - Bi Bi Raza Degree College for Women (Arts & Science), Rouza Buzurg, Kalaburgi"],
        ["Godutai Doddappa Appa rts, Commerce and Science Degree College for Women, Kalaburgi.", "KSAWU - Godutai Dodappa Appa Arts, Commerce and Science Degree College for Women, Kalaburgi"],
        ["Godutai College of Education for women, Sharananagar, Kalaburgi", "KSAWU - Godutai College of Education for Women, Sharananagar, Kalaburgi"],
        ["HKE Society's Smt Veeramma Gangasiri College for Women, PDA Engg Coollege Road Aiwan-E-Shahi Area Station Bazar Kalaburagi", "KSAWU - HKE Society's Smt Veeramma Gangasiri College for Women, PDA Engg College Road, Aiwan-E-Shahi Area, Kalaburgi"],
        ["Reshmi Educational & Charitable Trust's, Kum Sharaneshwari Reshmi Womens B.Ed College, Kalaburgi", "KSAWU - Reshmi Educational & Charitable Trust's, Kum. Sharaneshwari Reshmi Women's B.Ed College, Kalaburgi"],
        ["Reshmi Educational and Charitable trust Sharaneshwari Reshmi womens degree college (BA, BSC, BOM, BBA, BCA) Kalaburgi", "KSAWU - Reshmi Educational and Charitable Trust's Sharaneshwari Reshmi Women's Degree College, Kalaburgi"],
        ["BVVS Akkamahadevi Women's Arts ,Science & Commerce College, Bagalkot-587101", "KSAWU - BVVS Akkamahadevi Women's Arts, Science & Commerce College, Bagalkot"],
        ["Education Society's Akkamahadevi Arts college for women Bailhonga", "KSAWU - Shri Basaveshwar Education Society's Akkamahadevi Arts College for Women, Bailhongal"],
        ["Gujjamma Education society's, College of Education for women (B.Ed) Near R.E.C ,Humnabad Road, Bhalki", "KSAWU - Gujjam... Education Society's College of Education for Women (B.Ed), Bhalki"],
        ["J.M.M's Sundrabai B. Patil women's College of Education Tilakwadi, Belguam-590 006,", "KSAWU - J.M.M's Sundrabai B. Patil Women's College of Education, Tilakwadi, Belgaum"],
        ["KLE Society's Institute of Fashion Technology and apparel Design Womens College, College Road, Belgaum", "KSAWU - KLE Society's Institute of Fashion Technology and Apparel Design College, Belagavi"],
        ["Kalmath Sri Chanabasava Swamy Arts & Commerce College for Women, Gangavati", "KSAWU - Kalmath Sri Channabasava Swamy Arts & Commerce College for Women, Gangavati"],
        ["Kudal Sangam Education Societies Arts College for Women, Shahabad", "KSAWU - Kudal Sangam Education Societies Arts College for Women, Shahabad"],
        ["Matoshri Kantamma Sanganagouda Patil (Sasnoor) College of Education for women, Hirur , Vijayapura", "KSAWU - Matoshri Kantamma Sangannagouda Patil (Sasnoor) College of Education for Women, Hirur"],
        ["S.J.M. V's Arts & Commerce College for Women J.C. Nagar, Hubli", "KSAWU - S.J.M.V's Arts & Commerce College for Women, J.C. Nagar, Hubli"],
        ["S.J.M.V's Business Administration College for Women J.C. Nagar, Hubli-", "KSAWU - S.J.M.V's Business Administration College for Women, J.C. Nagar, Hubli"],
        ["S.J.M.V: B.A.J.S.S Arts & Commerce College for Women Church Road, Post Box No:52, Ranebennur", "KSAWU - S.J.M.V: B.A.J.S.S Arts & Commerce College for Women, Church Road, Ranebennur"],
        ["Secab's A.R.S. Inamdar Arts, Science & Commerce College for Women, Noubag Vijayapura", "KSAWU - Secab's A.R.S. Inamdar Arts, Science & Commerce College for Women, Noubag, Vijayapura"],
        ["Shastriji Vasati Education, College for women,  Okkalgeri- Gadag", "KSAWU - Shasthriji Vasati Education College for Women, Okkalgeri, Gadag"],
        ["Shri Padmaraj Vidyavardhak Society's Shri. Padmaraj Women's Degree College Sindagi", "KSAWU - Shri Padmaraj Vidyavardhak Society's Shri Padmaraj Women's Degree College, Sindagi"],
        ["Shri. Amareshwar Education Trust's Janani arts college for women, Surpur, Yadgir", "KSAWU - Shri Amareshwar Education Trust's Janani Arts College for Women, Surpur"],
        ["Shri. Valabellary Channabasaveshwar Educational Trust, Patil Womens Degree College Sindhanoor", "KSAWU - Shri. Valabellary Channabasaveshwar Educational Trust, Patil Women's Degree College, Sindhanoor"],
        ["Smt. Ahalyabai A. Patil Arts & Commerce College for Women, Chikkodi", "KSAWU - Smt. Ahalyabai A. Patil Arts & Commerce College for Women, Chikodi"],
        ["Smt. Allum Sumangalamma Memorial Degree College for Wome", "KSAWU - Smt. Allum Sumangalamma Memorial Degree College for Women, Gandhi Nagar, Ballari"],
        ["Smt. K.S. Jiglur Arts & Dr. (Smt) S.M. Sheshgiri Commerce College for Women Near R.N. Stadium, Dharwad", "KSAWU - Smt. K.S. Jiglur Arts & Dr. (Smt.) S.M. Sheshgiri Commerce College for Women, Dharwad"],
        ["Smt. Ugama devi Bhavarlal Theosophical Nahar College for Women, Asundi Bheemrao Nagar, Hampi Road, Hospet", "KSAWU - Smt. Uggama Devi Bhavarlal Theosophical Narhar College for Women, Asundi Bheemrao Nagar, Hampi Road, Hospet"],
        ["Soma Subhadramma Ramangoud Arts & Commerce College for Women Station Road, Raichur", "KSAWU - Soma Subhadramma Ramagoud Arts & Commerce College for Women, Station Road, Raichur"],
        ["Sri Hucheshwar Vidyavardhak Sanghas, Education College for Women, Kamatgi", "KSAWU - Sri Hucheshwar Vidyavardhak Sangha's Education College for Women, Kamatgi"],
        ["Sri. Bapugoud Darshnapur Memorial College for Women, Shahapur, Yadgir", "KSAWU - Sri. Bapugoud Darshanpur Memorial College for Women, Shahapur"],
        ["Sri. Gurubasappa Revansidappa Goled Arts & Commerce College for Women, Shahabad,", "KSAWU - Sri. Gurubasappa Revanasiddappa Goled Arts & Commerce College for Women, Shahabad"],
        ["Sri. Vijay Mahantesh Arts & Commerce College for Women, Ilkal-587 125", "KSAWU - Sri Vijay Mahantesh Arts & Commerce College for Women, Ilkal"],
        ["ri Jagadguru Gurusiddeshwara Vidyavardhak & Sanskritika samsthe's College of Education for women Guledgudda- 587203", "KSAWU - Shri Jagadguru Gurusiddeshwara Vidyavardhak & Sanskritika Samsthe's College of Education for Women, Guledgudd"],
        ["shri Jagadguru Gurusiddeshwara Vidyavardhak & Sanskritika samsthe's College of Education for women Guledgudda- 587203", "KSAWU - Shri Jagadguru Gurusiddeshwara Vidyavardhak & Sanskritika Samsthe's College of Education for Women, Guledgudd"],
        ["Balaji Degree College ,Hanumanth Nagar", "Balaji Degree College -Hanumanth Nagar"],
        ["AMC Engineering College Bannerghatta Road, Bengaluru 560083 Autonomous", "AMC Engineering College Bannerghatta Road, Bengaluru 560083 Autonomous Institution"],
        ["BES College , Jayanagarr", "BES College , Jayanagar"],
        ["A V K COLLEGE FOR WOMEN", "AVK COLLEGE HASSAN"],
        ["Shivakumar", "Shivkumar"],
      ];
      for (const [oldName, newName] of dbPairs) {
        void supabase.from("registrations").update({ institution_name: newName }).eq("institution_name", oldName);
      }
    } catch {
      // Non-critical background sync notice
    }

    return finalMasterList;
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
    )
  ).sort((a, b) => {
    const aRem = a.startsWith("__removed__:");
    const bRem = b.startsWith("__removed__:");
    if (aRem && !bRem) return 1;
    if (!aRem && bRem) return -1;
    return a.localeCompare(b);
  });

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
    throw new Error(error.message || "Failed to save colleges to cloud storage.");
  }
}

export function useColleges() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["custom_colleges"],
    queryFn: fetchCustomColleges,
    placeholderData: getLocalCachedColleges,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const rawCustomColleges = query.data ?? [];

  const { visibleDefaults, customColleges, allColleges } = useMemo(() => {
    const removedDefaults = new Set(
      rawCustomColleges
        .filter((c) => c.startsWith("__removed__:"))
        .map((c) => c.replace("__removed__:", "").trim().toLowerCase())
    );

    const activeCustomNames = rawCustomColleges
      .filter((c) => !c.startsWith("__removed__:") && c.trim().length > 0)
      .map((c) => normalizeCollegeName(c.trim()) || c.trim());

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
      const currentRemoved = new Set(
        current
          .filter((c) => c.startsWith("__removed__:"))
          .map((c) => c.replace("__removed__:", "").trim().toLowerCase())
      );
      const currentVisibleDefaults = DEFAULT_COLLEGES.map((c) => c.trim()).filter(
        (c) => !currentRemoved.has(c.toLowerCase())
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

      const matchedDefault = DEFAULT_COLLEGES.find(
        (c) => c.trim().toLowerCase() === trimmed.toLowerCase()
      );

      if (matchedDefault) {
        // Add marker to hide default college
        updated = [
          ...current.filter(
            (c) =>
              c.trim().toLowerCase() !== trimmed.toLowerCase() &&
              c.trim().toLowerCase() !== matchedDefault.trim().toLowerCase() &&
              c.trim().toLowerCase() !== `__removed__:${matchedDefault.trim().toLowerCase()}`
          ),
          `__removed__:${matchedDefault.trim()}`,
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
      const currentVisibleDefaults = DEFAULT_COLLEGES.map((c) => c.trim()).filter(
        (c) => !currentRemoved.has(c.toLowerCase())
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
      const matchedDefault = DEFAULT_COLLEGES.find(
        (c) => c.trim().toLowerCase() === trimmedOld.toLowerCase()
      );

      if (matchedDefault) {
        // Hide old default college and add new custom name
        updated = [
          ...current.filter(
            (c) =>
              c.trim().toLowerCase() !== trimmedOld.toLowerCase() &&
              c.trim().toLowerCase() !== matchedDefault.trim().toLowerCase() &&
              !c.toLowerCase().startsWith(`__removed__:${matchedDefault.trim().toLowerCase()}`)
          ),
          `__removed__:${matchedDefault.trim()}`,
          trimmedNew,
        ];
      } else {
        // Update in custom list and add removal marker for old name so past storage snapshots cannot resurrect it
        const filtered = current.filter(
          (c) =>
            c.trim().toLowerCase() !== trimmedOld.toLowerCase() &&
            !c.toLowerCase().startsWith(`__removed__:${trimmedOld.toLowerCase()}`)
        );
        updated = [
          ...filtered,
          `__removed__:${trimmedOld.trim()}`,
          trimmedNew,
        ];
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
