import { NextResponse } from "next/server";

const DEFAULT_RAPID_HOST = "irctc1.p.rapidapi.com";
const STATION_CODE_REGEX = /^[A-Z]{2,5}$/;

async function resolveStationCode(
  value: string,
  label: "from" | "to",
  rapidKey: string,
  rapidHost: string,
  searchStationUrl: string
): Promise<string | null> {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const upperCandidate = trimmed.toUpperCase();
  if (STATION_CODE_REGEX.test(upperCandidate)) {
    return upperCandidate;
  }

  const lookupUrl = new URL(searchStationUrl);
  lookupUrl.searchParams.set("query", trimmed);

  const lookupResponse = await fetch(lookupUrl, {
    headers: {
      "X-RapidAPI-Key": rapidKey,
      "X-RapidAPI-Host": rapidHost
    },
    cache: "no-store"
  });

  if (!lookupResponse.ok) {
    console.error(`Station lookup failed for ${label}="${trimmed}"`, lookupResponse.status);
    return null;
  }

  const lookupPayload: any = await lookupResponse.json();
  const firstHit = lookupPayload?.data?.[0] ?? lookupPayload?.stations?.[0] ?? null;

  if (!firstHit?.scode && !firstHit?.station_code) {
    return null;
  }

  return (firstHit.scode ?? firstHit.station_code).toUpperCase();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromInput = searchParams.get("from") ?? "";
  const toInput = searchParams.get("to") ?? "";
  const dateOfJourney = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  if (!fromInput.trim() || !toInput.trim()) {
    return NextResponse.json({ message: "Enter both departure and destination stations" }, { status: 400 });
  }

  const rapidKey = process.env.RAPIDAPI_KEY;
  const rapidHost = process.env.RAPIDAPI_HOST ?? DEFAULT_RAPID_HOST;
  const trainsBetweenUrl = process.env.RAPIDAPI_TRAINS_BETWEEN_URL ?? `https://${rapidHost}/api/v3/trainBetweenStations`;
  const searchStationUrl = process.env.RAPIDAPI_SEARCH_STATION_URL ?? `https://${rapidHost}/api/v1/searchStation`;

  if (!rapidKey) {
    return NextResponse.json({ message: "Live route search is temporarily unavailable" }, { status: 503 });
  }

  try {
    const [fromCode, toCode] = await Promise.all([
      resolveStationCode(fromInput, "from", rapidKey, rapidHost, searchStationUrl),
      resolveStationCode(toInput, "to", rapidKey, rapidHost, searchStationUrl)
    ]);

    if (!fromCode || !toCode) {
      return NextResponse.json({ message: "We could not find one or both station codes. Try a different spelling." }, { status: 404 });
    }

    if (fromCode === toCode) {
      return NextResponse.json({ message: "Departure and destination cannot be the same" }, { status: 400 });
    }

    const upstreamUrl = new URL(trainsBetweenUrl);
    upstreamUrl.searchParams.set("fromStationCode", fromCode);
    upstreamUrl.searchParams.set("toStationCode", toCode);
    upstreamUrl.searchParams.set("dateOfJourney", dateOfJourney);

    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        "X-RapidAPI-Key": rapidKey,
        "X-RapidAPI-Host": rapidHost,
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });

    if (!upstreamResponse.ok) {
      const fallback = upstreamResponse.status === 404 ? "No trains found for this route" : "Unable to fetch route options";
      return NextResponse.json({ message: fallback }, { status: upstreamResponse.status });
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
      departureTime:
        option?.departure_time ??
        option?.from_std ??
        option?.departureTime ??
        option?.from_std_time ??
        null,
      arrivalTime:
        option?.arrival_time ??
        option?.to_sta ??
        option?.arrivalTime ??
        option?.to_sta_time ??
        null,
      duration: option?.duration ?? option?.travel_time ?? option?.travelTime ?? null,
      delayMinutes: option?.delay_minutes ?? option?.delayMinutes ?? option?.late_mins ?? option?.lateMins ?? null,
      platform: option?.platform_number ?? option?.platformNumber ?? option?.from_platform ?? option?.platform ?? null,
      classes: option?.classes ?? option?.class_type ?? option?.availableClasses ?? null
    }));

    return NextResponse.json({ from: fromCode, to: toCode, date: dateOfJourney, options: normalized });
  } catch (error) {
    console.error("find-trains route error", error);
    return NextResponse.json({ message: "Unable to fetch route options" }, { status: 500 });
  }
}
