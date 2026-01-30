import { NextResponse } from "next/server";
import { RapidApiError, requestRapidApi } from "@/lib/rapidApi";

const REQUIRED_FIELDS: Array<{ key: string; message: string }> = [
  { key: "trainNumber", message: "Enter a train number" },
  { key: "from", message: "Enter the origin station code" },
  { key: "to", message: "Enter the destination station code" },
  { key: "class", message: "Choose a class code" },
  { key: "date", message: "Provide journey date (YYYYMMDD)" }
];

const ERROR_MESSAGES = {
  404: "No seat availability found for the given filters",
  default: "Unable to fetch seat availability" 
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  for (const field of REQUIRED_FIELDS) {
    if (!searchParams.get(field.key)?.trim()) {
      return NextResponse.json({ message: field.message }, { status: 400 });
    }
  }

  const payloadParams = {
    trainNo: searchParams.get("trainNumber")?.trim(),
    fromStationCode: searchParams.get("from")?.trim(),
    toStationCode: searchParams.get("to")?.trim(),
    classCode: searchParams.get("class")?.trim(),
    quota: searchParams.get("quota")?.trim() ?? "GN",
    date: searchParams.get("date")?.trim(),
    flexiQuota: searchParams.get("flexiQuota")?.trim(),
    currentBookingStatus: searchParams.get("currentStatus")?.trim()
  };

  try {
    const payload: any = await requestRapidApi({
      defaultPath: "/api/v2/checkSeatAvailability",
      envUrlKey: "RAPIDAPI_SEAT_AVAILABILITY_V2_URL",
      query: payloadParams,
      errorMessages: ERROR_MESSAGES
    });

    const dataLayer = payload?.data ?? payload;
    const rows = Array.isArray(dataLayer?.availability) ? dataLayer.availability : dataLayer?.options ?? [];
    const normalized = (Array.isArray(rows) ? rows : []).map((row: any) => ({
      date: row?.date ?? row?.journeyDate ?? null,
      status: row?.status ?? row?.availability ?? null,
      statusCode: row?.status_code ?? row?.statusCode ?? null,
      classCode: row?.class ?? row?.classCode ?? payloadParams.classCode,
      confirmProbability: row?.confirm_probability ?? row?.probability ?? null,
      bookingType: row?.booking_type ?? row?.bookingType ?? null
    }));

    return NextResponse.json({
      version: "v2",
      trainNumber: payloadParams.trainNo,
      from: payloadParams.fromStationCode,
      to: payloadParams.toStationCode,
      classCode: payloadParams.classCode,
      quota: payloadParams.quota,
      availability: normalized
    });
  } catch (error) {
    if (error instanceof RapidApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error("seat-availability v2 route error", error);
    return NextResponse.json({ message: "Unable to fetch seat availability" }, { status: 500 });
  }
}
