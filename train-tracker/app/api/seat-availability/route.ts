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
  404: "No seat availability found for the given inputs",
  default: "Unable to fetch seat availability right now"
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
    passengerAge: searchParams.get("age")?.trim()
  };

  try {
    const payload: any = await requestRapidApi({
      defaultPath: "/api/v1/checkSeatAvailability",
      envUrlKey: "RAPIDAPI_SEAT_AVAILABILITY_URL",
      query: payloadParams,
      errorMessages: ERROR_MESSAGES
    });

    const dataLayer = payload?.data ?? payload;
    const options = dataLayer?.availability ?? dataLayer?.data ?? dataLayer?.options ?? [];
    const rows = Array.isArray(options) ? options : [];

    const normalized = rows.map((row: any) => ({
      date: row?.date ?? row?.journeyDate ?? row?.journey_date ?? null,
      status: row?.status ?? row?.availability ?? row?.availabilityStatus ?? null,
      probability: row?.confirm_probability ?? row?.probability ?? row?.chances ?? null,
      statusCode: row?.status_code ?? row?.statusCode ?? null,
      classCode: row?.class ?? row?.classCode ?? payloadParams.classCode,
      updatedAt: row?.updated_at ?? row?.updatedAt ?? null
    }));

    return NextResponse.json({
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

    console.error("seat-availability route error", error);
    return NextResponse.json({ message: "Unable to fetch seat availability" }, { status: 500 });
  }
}
