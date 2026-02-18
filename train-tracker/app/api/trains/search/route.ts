import { NextResponse } from "next/server";
import { RapidApiError, requestRapidApi } from "@/lib/rapidApi";
import { validationErrorResponse, successResponse, errorResponse, internalErrorResponse, getPaginationParams, createPaginationMeta } from "@/lib/api-response";

const ERROR_MESSAGES = {
  404: "No trains found for that search",
  default: "Unable to search for trains right now"
};

/**
 * GET /api/trains/search
 * Search trains by station, route, or train number
 * Query params:
 *   - query (required): Station name, route, or train number to search
 *   - page (optional, default: 1): Page number for pagination
 *   - limit (optional, default: 10): Results per page
 * Returns: { success: true, data: [...trains], meta: { query, page, limit, total, hasMore } }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();
  
  const { page, limit, skip } = getPaginationParams(request.url, { page: 1, limit: 10 });

  if (!query || query.length < 2) {
    return validationErrorResponse({
      query: "Search query is required and must be at least 2 characters"
    });
  }

  try {
    const payload: any = await requestRapidApi({
      defaultPath: "/api/v1/searchTrain",
      envUrlKey: "RAPIDAPI_SEARCH_TRAIN_URL",
      query: { query },
      errorMessages: ERROR_MESSAGES
    });

    const rawRows = payload?.data ?? payload?.trains ?? payload?.train ?? payload?.results ?? [];
    const rows = Array.isArray(rawRows) ? rawRows : [];

    const normalized = rows.map((row: any, index: number) => ({
      trainName: row?.train_name ?? row?.trainName ?? row?.name ?? `Train ${index + 1}`,
      trainNumber: row?.train_number ?? row?.trainNumber ?? row?.number ?? row?.code ?? `TEMP-${index}`,
      from: {
        code:
          row?.from_station_code ??
          row?.fromStationCode ??
          row?.from?.station_code ??
          row?.from?.stationCode ??
          null,
        name:
          row?.from_station_name ??
          row?.fromStationName ??
          row?.from?.station_name ??
          row?.from?.stationName ??
          null
      },
      to: {
        code:
          row?.to_station_code ??
          row?.toStationCode ??
          row?.to?.station_code ??
          row?.to?.stationCode ??
          null,
        name:
          row?.to_station_name ??
          row?.toStationName ??
          row?.to?.station_name ??
          row?.to?.stationName ??
          null
      },
      travelTime: row?.travel_time ?? row?.duration ?? row?.travelTime ?? null,
      runDays: row?.run_days ?? row?.runDays ?? row?.frequency ?? null,
      trainType: row?.train_type ?? row?.trainType ?? row?.type ?? null
    }));

    // Apply pagination
    const total = normalized.length;
    const paginatedResults = normalized.slice(skip, skip + limit);

    return successResponse(
      paginatedResults,
      "Trains found",
      200,
      createPaginationMeta(page, limit, total)
    );
  } catch (error) {
    if (error instanceof RapidApiError) {
      return errorResponse(error.message, error.status);
    }

    console.error("Trains search error:", error);
    return internalErrorResponse("Unable to search for trains at this moment");
  }
}
