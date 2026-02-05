import { NextResponse } from "next/server";
import { RapidApiError, requestRapidApi } from "@/lib/rapidApi";

const ERROR_MESSAGES = {
  404: "No trains found for that search",
  default: "Unable to search for trains right now"
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();

  if (!query) {
    return NextResponse.json({ message: "Enter a station, route, or train number" }, { status: 400 });
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

    return NextResponse.json({ query, matches: normalized });
  } catch (error) {
    if (error instanceof RapidApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error("search-train route error", error);
    return NextResponse.json({ message: "Unable to search for trains" }, { status: 500 });
  }
}
