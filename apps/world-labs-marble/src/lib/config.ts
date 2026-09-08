import type { AppConfig } from "@/lib/types"

export async function fetchAppConfig(): Promise<AppConfig> {
  const response = await fetch("/api/config")
  if (!response.ok) {
    throw new Error("Could not load app config from the local API.")
  }
  return (await response.json()) as AppConfig
}
