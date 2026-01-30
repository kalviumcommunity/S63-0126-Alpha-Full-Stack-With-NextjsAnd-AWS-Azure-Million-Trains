import { NextResponse } from "next/server";
import { RapidApiError, requestRapidApi } from "@/lib/rapidApi";

const ERROR_MESSAGES = {
  400: "Enter a valid 10-digit PNR",
  404: "PNR details were not found",
  default: "Unable to fetch the latest PNR status"
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pnr = searchParams.get("pnr")?.trim();

  if (!pnr || pnr.length !== 10) {
    return NextResponse.json({ message: "Enter a valid 10-digit PNR" }, { status: 400 });
  }

  try {
    const payload: any = await requestRapidApi({
      defaultPath: "/api/v3/getPNRStatus",
      envUrlKey: "RAPIDAPI_PNR_STATUS_URL",
      query: { pnrNumber: pnr },
      errorMessages: ERROR_MESSAGES
    });

    const dataLayer = payload?.data ?? payload;
    const passengerRows = dataLayer?.passengers ?? dataLayer?.passenger_info ?? dataLayer?.passengerInfo ?? [];
    const passengers = Array.isArray(passengerRows) ? passengerRows : [];

    const normalizedPassengers = passengers.map((row: any, index: number) => ({
      passenger: row?.passenger ?? row?.passenger_no ?? row?.passengerNo ?? index + 1,
      bookingStatus: row?.booking_status ?? row?.bookingStatus ?? row?.old_status ?? null,
      currentStatus: row?.current_status ?? row?.currentStatus ?? row?.new_status ?? null,
      coachPosition: row?.coach_position ?? row?.coachPosition ?? row?.coach ?? null,
      berth: row?.berth ?? row?.berthNo ?? null
    }));

    const journeyClass =
      dataLayer?.class ??
      dataLayer?.journey_class ??
      dataLayer?.class_type ??
      dataLayer?.journeyClass ??
      null;

    return NextResponse.json({
      pnr,
      trainNumber: dataLayer?.train_number ?? dataLayer?.trainNumber ?? null,
      trainName: dataLayer?.train_name ?? dataLayer?.trainName ?? null,
      from: dataLayer?.from_station ?? dataLayer?.fromStation ?? dataLayer?.boarding_point ?? null,
      to: dataLayer?.to_station ?? dataLayer?.toStation ?? dataLayer?.destination ?? null,
      boardingPoint: dataLayer?.boarding_point ?? dataLayer?.boardingPoint ?? null,
      chartPrepared: dataLayer?.chart_prepared ?? dataLayer?.chartPrepared ?? false,
      journeyDate: dataLayer?.journey_date ?? dataLayer?.journeyDate ?? null,
      journeyClass,
      passengers: normalizedPassengers
    });
  } catch (error) {
    if (error instanceof RapidApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error("pnr-status route error", error);
    return NextResponse.json({ message: "Unable to load the PNR status" }, { status: 500 });
  }
}
