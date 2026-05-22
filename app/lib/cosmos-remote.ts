import type { CosmosConfig, CosmosContent, CosmosSnapshot } from "./cosmos-storage";

export type RemoteCosmosState = {
  configured: boolean;
  config?: CosmosConfig;
  content?: CosmosContent;
  snapshot?: CosmosSnapshot | null;
};

export async function fetchRemoteCosmosState() {
  const response = await fetch("/api/cosmos", { cache: "no-store" });
  if (!response.ok) return { configured: false } satisfies RemoteCosmosState;
  return (await response.json()) as RemoteCosmosState;
}

export async function pushRemoteCosmosState(payload: {
  config: CosmosConfig;
  content: CosmosContent;
  snapshot: CosmosSnapshot | null;
  adminToken: string;
}) {
  const response = await fetch("/api/cosmos", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-cosmos-admin-token": payload.adminToken
    },
    body: JSON.stringify({
      config: payload.config,
      content: payload.content,
      snapshot: payload.snapshot
    })
  });

  return response.ok;
}
