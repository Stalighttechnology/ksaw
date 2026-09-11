import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORAGE_BUCKET = "registrations";
const LIVE_MANIFEST_PATH = "manifests/maintenance_live.json";
const LOCAL_STORAGE_KEY = "ksaw_maintenance_state";
const SYNC_CHANNEL_NAME = "ksaw_maintenance_sync_channel";

export interface MaintenanceConfig {
  enabled: boolean;
  message?: string;
  updatedAt?: string;
}

const DEFAULT_CONFIG: MaintenanceConfig = {
  enabled: false,
  message: "The applicant registration portal is temporarily offline for scheduled system maintenance. Submissions are temporarily paused. Please check back shortly.",
};

function getLocalCachedMaintenance(): MaintenanceConfig {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return typeof parsed?.enabled === "boolean" ? parsed : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

function setLocalCachedMaintenance(config: MaintenanceConfig): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore localStorage errors
  }
}

// Broadcast to other tabs in the same browser
function broadcastMaintenanceUpdate(config: MaintenanceConfig): void {
  try {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      channel.postMessage(config);
      channel.close();
    }
  } catch {
    // Ignore broadcast errors
  }
}

// Fetch the current maintenance manifest from Supabase Storage
export async function fetchMaintenanceConfig(): Promise<MaintenanceConfig> {
  try {
    // 1. Try to download the primary live manifest directly
    const { data: fileBlob, error: dlError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(LIVE_MANIFEST_PATH);

    if (!dlError && fileBlob) {
      const text = await fileBlob.text();
      const parsed = JSON.parse(text);
      const config: MaintenanceConfig = {
        enabled: Boolean(parsed.enabled),
        message: parsed.message || DEFAULT_CONFIG.message,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
      setLocalCachedMaintenance(config);
      return config;
    }

    // 2. Fallback: list manifests folder if live file not found yet
    const { data: files } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list("manifests", { limit: 50 });

    if (files && files.length > 0) {
      const manifestFiles = files
        .filter((f) => f.name.startsWith("maintenance_") && f.name.endsWith(".json"))
        .sort((a, b) => {
          const tsA = parseInt(a.name.replace(/\D/g, ""), 10) || 0;
          const tsB = parseInt(b.name.replace(/\D/g, ""), 10) || 0;
          return tsB - tsA;
        });

      if (manifestFiles.length > 0) {
        const latest = manifestFiles[0];
        const { data: fallbackBlob } = await supabase.storage
          .from(STORAGE_BUCKET)
          .download(`manifests/${latest.name}`);

        if (fallbackBlob) {
          const text = await fallbackBlob.text();
          const parsed = JSON.parse(text);
          const config: MaintenanceConfig = {
            enabled: Boolean(parsed.enabled),
            message: parsed.message || DEFAULT_CONFIG.message,
            updatedAt: parsed.updatedAt || new Date().toISOString(),
          };
          setLocalCachedMaintenance(config);
          return config;
        }
      }
    }

    return getLocalCachedMaintenance();
  } catch (err) {
    console.error("Failed to fetch maintenance status:", err);
    return getLocalCachedMaintenance();
  }
}

// Save the new maintenance state to Supabase Storage and broadcast to all tabs
export async function saveMaintenanceConfig(config: MaintenanceConfig): Promise<void> {
  setLocalCachedMaintenance(config);
  broadcastMaintenanceUpdate(config);

  const payload = {
    ...config,
    updatedAt: new Date().toISOString(),
  };

  const jsonBlob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  // 1. Overwrite primary live manifest
  const { error: liveErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(LIVE_MANIFEST_PATH, jsonBlob, {
      contentType: "application/json",
      upsert: true,
    });

  // 2. Also save timestamped historical manifest
  const timestamp = Date.now();
  await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(`manifests/maintenance_${timestamp}.json`, jsonBlob, {
      contentType: "application/json",
      upsert: true,
    });

  if (liveErr) {
    console.error("Live maintenance upload error:", liveErr);
    throw new Error(liveErr.message || "Failed to update maintenance mode in cloud storage.");
  }
}

export function useMaintenance() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["maintenance_config"],
    queryFn: fetchMaintenanceConfig,
    initialData: getLocalCachedMaintenance,
    staleTime: 0, // Always consider stale so refetch happens immediately
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 10_000,
  });

  // Multi-tab instant sync listener
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        channel.onmessage = (event) => {
          if (event?.data && typeof event.data.enabled === "boolean") {
            queryClient.setQueryData(["maintenance_config"], event.data);
          }
        };
      }
    } catch {
      // Ignore broadcast channel init errors
    }

    // Storage event fallback for cross-tab sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (typeof parsed?.enabled === "boolean") {
            queryClient.setQueryData(["maintenance_config"], parsed);
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

  const mutation = useMutation({
    mutationFn: saveMaintenanceConfig,
    onSuccess: (_, variables) => {
      queryClient.setQueryData(["maintenance_config"], variables);
      void queryClient.invalidateQueries({ queryKey: ["maintenance_config"] });
      if (variables.enabled) {
        toast.warning("Maintenance Mode Activated: Public applicant form is now closed.");
      } else {
        toast.success("Maintenance Mode Deactivated: Public applicant form is now live & open.");
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update maintenance mode.");
    },
  });

  const toggleMaintenance = (newVal?: boolean) => {
    const nextState = newVal !== undefined ? newVal : !Boolean(query.data?.enabled);
    mutation.mutate({
      ...query.data,
      enabled: nextState,
    });
  };

  return {
    isMaintenance: Boolean(query.data?.enabled),
    message: query.data?.message || DEFAULT_CONFIG.message,
    isLoading: query.isLoading,
    isUpdating: mutation.isPending,
    toggleMaintenance,
  };
}
