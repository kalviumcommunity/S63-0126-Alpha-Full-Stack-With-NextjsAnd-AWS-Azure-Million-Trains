import { NextResponse } from "next/server";
import { RapidApiError, requestRapidApi } from "@/lib/rapidApi";

const REQUIRED_FIELDS: Array<{ key: string; message: string }> = [
  { key: "trainNumber", message: "Enter a train number" },
  { key: "from", message: "Provide the origin station code" },
  { key: "to", message: "Provide the destination station code" },
  { key: "class", message: "Select a class code" }
];

const ERROR_MESSAGES = {
  404: "Fare not available for the given inputs",
  default: "Unable to fetch fare details right now"
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  for (const field of REQUIRED_FIELDS) {
    if (!searchParams.get(field.key)?.trim()) {
      return NextResponse.json({ message: field.message }, { status: 400 });
    }
  }

  const query = {
    trainNo: searchParams.get("trainNumber")?.trim(),
    fromStationCode: searchParams.get("from")?.trim(),
    toStationCode: searchParams.get("to")?.trim(),
    quota: searchParams.get("quota")?.trim() ?? "GN",
    classType: searchParams.get("class")?.trim(),
    age: searchParams.get("age")?.trim(),
    date: searchParams.get("date")?.trim()
  };

  try {
    const payload: any = await requestRapidApi({
      defaultPath: "/api/v1/getFare",
      envUrlKey: "RAPIDAPI_FARE_URL",
      query,
      errorMessages: ERROR_MESSAGES
    });

    const dataLayer = payload?.data ?? payload;
    const fareBreakup = dataLayer?.fare_breakup ?? dataLayer?.fareBreakup ?? [];
    const segments = Array.isArray(fareBreakup) ? fareBreakup : [];
    const normalizedSegments = segments.map((segment: any) => ({
      head: segment?.head ?? segment?.title ?? null,
      amount: segment?.amount ?? segment?.value ?? null
    }));

    return NextResponse.json({
      trainNumber: query.trainNo,
      classType: query.classType,
      quota: query.quota,
      from: query.fromStationCode,
      to: query.toStationCode,
      totalFare: dataLayer?.total_fare ?? dataLayer?.totalFare ?? dataLayer?.fare ?? null,
      currency: dataLayer?.currency ?? "INR",
      segments: normalizedSegments
    });
  } catch (error) {
    if (error instanceof RapidApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error("fare route error", error);
    return NextResponse.json({ message: "Unable to fetch fare details" }, { status: 500 });
  }
}
