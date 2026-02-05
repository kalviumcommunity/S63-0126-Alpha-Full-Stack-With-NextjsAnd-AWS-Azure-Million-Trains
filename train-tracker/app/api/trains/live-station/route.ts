import { NextResponse } from "next/server";
import { RapidApiError, requestRapidApi } from "@/lib/rapidApi";

const ERROR_MESSAGES = {
  404: "Live station board not available",
  default: "Unable to fetch live station data"
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stationCode = searchParams.get("stationCode")?.trim();
  const hours = searchParams.get("hours")?.trim() ?? "2";

  if (!stationCode) {
    return NextResponse.json({ message: "Enter a station code" }, { status: 400 });
  }

  try {
    const payload: any = await requestRapidApi({
      defaultPath: "/api/v1/getLiveStation",
      envUrlKey: "RAPIDAPI_LIVE_STATION_URL",
      query: {
        stationCode,
        hours
      },
      errorMessages: ERROR_MESSAGES
    });

    const dataLayer = payload?.data ?? payload;
    const rows = Array.isArray(dataLayer?.trains) ? dataLayer.trains : dataLayer ?? [];

    const normalized = (Array.isArray(rows) ? rows : []).map((entry: any, index: number) => ({
      trainNumber: entry?.train_number ?? entry?.trainNumber ?? entry?.number ?? `T${index}`,
      trainName: entry?.train_name ?? entry?.trainName ?? entry?.name ?? null,
      actualArrival: entry?.actual_arrival ?? entry?.actualArrival ?? null,
      actualDeparture: entry?.actual_departure ?? entry?.actualDeparture ?? null,
      scheduledArrival: entry?.scheduled_arrival ?? entry?.scheduledArrival ?? entry?.arrival ?? null,
      scheduledDeparture: entry?.scheduled_departure ?? entry?.scheduledDeparture ?? entry?.departure ?? null,
      delayMinutes: entry?.delay_minutes ?? entry?.delayMinutes ?? entry?.late_mins ?? null,
      platform: entry?.platform ?? entry?.platform_number ?? entry?.platformNumber ?? null,
      currentStatus: entry?.status ?? entry?.current_status ?? entry?.currentStatus ?? null
    }));

    return NextResponse.json({ stationCode, hours, trains: normalized });
  } catch (error) {
    if (error instanceof RapidApiError) {
      if (error.status === 404) {
        return NextResponse.json({
          stationCode,
          hours,
          trains: [],
          message: error.message
        });
      }

      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error("live-station route error", error);
    return NextResponse.json({ message: "Unable to fetch live station data" }, { status: 500 });
  }
}
