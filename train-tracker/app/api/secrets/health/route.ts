import { NextResponse } from "next/server";
import { successResponse, forbiddenResponse, errorResponse } from "../../../../lib/api-response";
import { loadCloudSecrets } from "../../../../lib/cloud-secrets";

export async function GET(): Promise<NextResponse> {
  const healthEnabled = (process.env.SECRET_HEALTH_ENABLED || "false").toLowerCase() === "true";
  if (!healthEnabled && process.env.NODE_ENV === "production") {
    return forbiddenResponse("Secret health endpoint is disabled");
  }

  const provider = (process.env.SECRET_PROVIDER || "none").toLowerCase();
  if (provider === "none") {
    return errorResponse("Secret provider is not configured", 400);
  }

  try {
    const secrets = await loadCloudSecrets({ applyToEnv: false });
    const keys = Object.keys(secrets);

    return successResponse({
      provider,
      keys,
      count: keys.length
    });
  } catch (error) {
    console.error("Secret health check failed:", error);
    return errorResponse("Failed to retrieve secrets", 500);
  }
}
