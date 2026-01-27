import { NextResponse } from "next/server";

const DEFAULT_RAPID_HOST = "irctc1.p.rapidapi.com";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from")?.trim();
  const to = searchParams.get("to")?.trim();
  const hours = searchParams.get("hours")?.trim() ?? "1";

  if (!from || !to) {
    return NextResponse.json({ message: "Enter both departure and destination station codes" }, { status: 400 });
  }

  if (from.toLowerCase() === to.toLowerCase()) {
    return NextResponse.json({ message: "Departure and destination cannot be the same" }, { status: 400 });
  }

  const rapidKey = process.env.RAPIDAPI_KEY;
  const rapidHost = process.env.RAPIDAPI_HOST ?? DEFAULT_RAPID_HOST;
  const liveStationUrl = process.env.RAPIDAPI_LIVE_STATION_URL ?? `https://${rapidHost}/api/v3/getLiveStation`;

  if (!rapidKey) {
    return NextResponse.json({ message: "Live route search is temporarily unavailable" }, { status: 503 });
  }

  try {
    const upstreamUrl = new URL(liveStationUrl);
    upstreamUrl.searchParams.set("hours", hours);
    upstreamUrl.searchParams.set("fromStationCode", from.toUpperCase());
    upstreamUrl.searchParams.set("toStationCode", to.toUpperCase());

    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        "X-RapidAPI-Key": rapidKey,
        "X-RapidAPI-Host": rapidHost
      },
      cache: "no-store"
    });

    if (!upstreamResponse.ok) {
      const fallbackMessage = upstreamResponse.status === 404 ? "No trains found for this route" : "Unable to fetch route options";
      return NextResponse.json({ message: fallbackMessage }, { status: upstreamResponse.status });
    }

    const payload: any = await upstreamResponse.json();
    const rawOptions =
      payload?.data?.trains ??
      payload?.data?.availableTrains ??
      payload?.data ??
      payload?.options ??
      payload?.trains ??
      [];

    if (!Array.isArray(rawOptions) || rawOptions.length === 0) {
      return NextResponse.json({ message: "No direct trains found for this route" }, { status: 404 });
    }

    const normalized = rawOptions.map((option: any, index: number) => ({
      trainName: option?.train_name ?? option?.trainName ?? option?.name ?? "Unnamed train",
      trainNumber: option?.train_number ?? option?.trainNumber ?? option?.number ?? `TEMP-${index}`,
      departureTime: option?.departure_time ?? option?.departureTime ?? option?.departure ?? null,
      arrivalTime: option?.arrival_time ?? option?.arrivalTime ?? option?.arrival ?? null,
      duration: option?.duration ?? option?.travel_time ?? option?.travelTime ?? null,
      delayMinutes: option?.delay_minutes ?? option?.delayMinutes ?? option?.late_mins ?? option?.lateMins ?? null,
      platform: option?.platform_number ?? option?.platformNumber ?? option?.platform ?? null
    }));

    return NextResponse.json({ from: from.toUpperCase(), to: to.toUpperCase(), options: normalized });
  } catch (error) {
    console.error("find-trains route error", error);
    return NextResponse.json({ message: "Unable to fetch route options" }, { status: 500 });
  }
}
