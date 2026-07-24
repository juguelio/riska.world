export type WorldIdEnvironment = "production" | "staging";
export type WorldIdDeployment = "production" | "prod-test" | "testnet";

export const RISKA_WORLD_ID_POLICY_ACTION =
  process.env.NEXT_PUBLIC_WORLD_ID_POLICY_ACTION ?? "riska-policy-human-v1";

export function getWorldIdEnvironmentForDeployment(deployment: WorldIdDeployment): WorldIdEnvironment {
  return deployment === "testnet" ? "staging" : "production";
}

// World ID apps are registered per environment in the Developer Portal, and the
// simulator only accepts requests from a staging app. A production app id always
// produces a production request no matter what `environment` the client passes,
// so the staging deployment needs its own app id. Falls back to the single app id
// when no staging one is configured, which keeps existing setups working.
export function getWorldAppId(
  deployment: WorldIdDeployment = "production"
): `app_${string}` | undefined {
  const stagingAppId = process.env.NEXT_PUBLIC_WORLD_APP_ID_STAGING;
  const appId =
    getWorldIdEnvironmentForDeployment(deployment) === "staging" && stagingAppId
      ? stagingAppId
      : process.env.NEXT_PUBLIC_WORLD_APP_ID;

  if (!appId || !appId.startsWith("app_")) {
    return undefined;
  }

  return appId as `app_${string}`;
}

export function normalizeWorldIdSignal(walletAddress: string) {
  return walletAddress.toLowerCase();
}

export function getWorldIdSimulatorIdentitySelectorUrl(href: string) {
  try {
    const url = new URL(href);

    if (url.hostname !== "simulator.worldcoin.org") {
      return null;
    }

    url.pathname = "/select-id";
    return url.toString();
  } catch {
    return null;
  }
}
