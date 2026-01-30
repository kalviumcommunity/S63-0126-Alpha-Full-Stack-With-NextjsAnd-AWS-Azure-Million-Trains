import { NextResponse } from "next/server";
import { RapidApiError, requestRapidApi } from "@/lib/rapidApi";

const ERROR_MESSAGES = {
  404: "Train schedule not found",
  default: "Unable to load the train schedule right now"
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trainNumber = searchParams.get("trainNumber")?.trim();

  if (!trainNumber) {
    return NextResponse.json({ message: "Enter a valid train number" }, { status: 400 });
  }

  try {
    const payload: any = await requestRapidApi({
      defaultPath: "/api/v1/getTrainSchedule",
      envUrlKey: "RAPIDAPI_TRAIN_SCHEDULE_URL",
      query: { trainNo: trainNumber },
      errorMessages: ERROR_MESSAGES
    });

    const dataLayer = payload?.data ?? payload?.schedule ?? payload ?? {};
    const legs = Array.isArray(dataLayer?.route ?? dataLayer?.stations)
      ? dataLayer.route ?? dataLayer.stations
      : dataLayer?.data ?? [];
    const timetable = Array.isArray(legs) ? legs : [];

    const normalizedRoute = timetable.map((stop: any, index: number) => ({
      sequence: stop?.serial_no ?? stop?.serialNo ?? stop?.sr_no ?? stop?.srNo ?? index + 1,
      stationCode: stop?.station_code ?? stop?.stationCode ?? stop?.scode ?? null,
      stationName: stop?.station_name ?? stop?.stationName ?? stop?.sname ?? null,
      arrival: stop?.arrival_time ?? stop?.arrivalTime ?? stop?.arr ?? null,
      departure: stop?.departure_time ?? stop?.departureTime ?? stop?.dep ?? null,
      haltMinutes: stop?.halt ?? stop?.halt_minutes ?? stop?.haltMinutes ?? null,
      distanceKm: stop?.distance ?? stop?.distance_km ?? stop?.distanceInKm ?? null,
      day: stop?.day ?? stop?.day_count ?? stop?.dayCount ?? null
    }));

    return NextResponse.json({
      trainNumber: dataLayer?.train_number ?? dataLayer?.trainNumber ?? trainNumber,
      trainName: dataLayer?.train_name ?? dataLayer?.trainName ?? payload?.trainName ?? "Unknown train",
      startStation: dataLayer?.from_station ?? dataLayer?.fromStation ?? dataLayer?.origin ?? null,
      endStation: dataLayer?.to_station ?? dataLayer?.toStation ?? dataLayer?.destination ?? null,
      runDays: dataLayer?.run_days ?? dataLayer?.runDays ?? dataLayer?.frequency ?? null,
      route: normalizedRoute
    });
  } catch (error) {
    if (error instanceof RapidApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error("train-schedule route error", error);
    return NextResponse.json({ message: "Unable to fetch the train schedule" }, { status: 500 });
  }
}
