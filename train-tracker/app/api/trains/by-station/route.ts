import { NextResponse } from "next/server";
import { RapidApiError, requestRapidApi } from "@/lib/rapidApi";

const ERROR_MESSAGES = {
  404: "No arrivals or departures found for that station",
  default: "Unable to load station board data"
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
      defaultPath: "/api/v1/getTrainsByStation",
      envUrlKey: "RAPIDAPI_TRAINS_BY_STATION_URL",
      query: {
        stationCode,
        hours
      },
      errorMessages: ERROR_MESSAGES
    });

    const dataLayer = payload?.data ?? payload;
    const trains = Array.isArray(dataLayer?.trains)
      ? dataLayer.trains
      : dataLayer?.arrivals ?? dataLayer?.departures ?? [];

    const normalized = (Array.isArray(trains) ? trains : []).map((entry: any, index: number) => ({
      trainNumber: entry?.train_number ?? entry?.trainNumber ?? entry?.number ?? `T${index}`,
      trainName: entry?.train_name ?? entry?.trainName ?? entry?.name ?? null,
      scheduledArrival: entry?.scheduled_arrival ?? entry?.scheduledArrival ?? entry?.arrival ?? null,
      scheduledDeparture: entry?.scheduled_departure ?? entry?.scheduledDeparture ?? entry?.departure ?? null,
      platform: entry?.platform ?? entry?.platform_number ?? entry?.platformNumber ?? null,
      delayMinutes:
        entry?.delay_minutes ?? entry?.delayMinutes ?? entry?.late_mins ?? entry?.lateMins ?? null,
      direction: entry?.direction ?? entry?.arr_dep ?? entry?.mode ?? null
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

    console.error("trains-by-station route error", error);
    return NextResponse.json({ message: "Unable to load station board data" }, { status: 500 });
  }
}
