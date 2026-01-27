import { NextResponse } from "next/server";

const DEFAULT_RAPID_HOST = "irctc1.p.rapidapi.com";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trainNumber = searchParams.get("trainNumber")?.trim();
  const startDay = searchParams.get("startDay")?.trim() ?? "0";

  if (!trainNumber) {
    return NextResponse.json({ message: "Enter a valid train number" }, { status: 400 });
  }

  const rapidKey = process.env.RAPIDAPI_KEY;
  const rapidHost = process.env.RAPIDAPI_HOST ?? DEFAULT_RAPID_HOST;
  const liveStatusUrl = process.env.RAPIDAPI_LIVE_STATUS_URL ?? `https://${rapidHost}/api/v1/liveTrainStatus`;

  if (!rapidKey) {
    return NextResponse.json({ message: "Live data is temporarily unavailable" }, { status: 503 });
  }

  try {
    const upstreamUrl = new URL(liveStatusUrl);
    upstreamUrl.searchParams.set("trainNo", trainNumber);
    upstreamUrl.searchParams.set("startDay", startDay);

    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        "X-RapidAPI-Key": rapidKey,
        "X-RapidAPI-Host": rapidHost
      },
      cache: "no-store"
    });

    if (!upstreamResponse.ok) {
      const errorMessage = upstreamResponse.status === 404 ? "Train not found" : "Unable to fetch live data, try again";
      return NextResponse.json({ message: errorMessage }, { status: upstreamResponse.status });
    }

    const payload: any = await upstreamResponse.json();
    const dataLayer = payload?.data ?? payload;
    const currentInfo =
      dataLayer?.current_location_info ??
      dataLayer?.currentLocationInfo ??
      payload?.current_location_info ??
      payload?.currentLocationInfo ??
      null;

    const normalized = {
      trainName: dataLayer?.train_name ?? dataLayer?.trainName ?? payload?.trainName ?? "Unknown train",
      trainNumber: dataLayer?.train_number ?? dataLayer?.trainNumber ?? trainNumber,
      delayMinutes:
        currentInfo?.delay_mins ??
        currentInfo?.delayMinutes ??
        currentInfo?.late_mins ??
        currentInfo?.lateMins ??
        dataLayer?.delay_minutes ??
        dataLayer?.delayMinutes ??
        null,
      platform:
        currentInfo?.platform_number ??
        currentInfo?.platformNumber ??
        currentInfo?.platform ??
        dataLayer?.platform ??
        null,
      runningStatus:
        currentInfo?.status ??
        currentInfo?.status_desc ??
        currentInfo?.statusDesc ??
        dataLayer?.current_status ??
        dataLayer?.currentStatus ??
        payload?.message ??
        "Unavailable",
      lastUpdated:
        currentInfo?.last_updated ??
        currentInfo?.lastUpdated ??
        dataLayer?.last_updated ??
        payload?.timestamp ??
        new Date().toISOString()
    };

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("train-status error", error);
    return NextResponse.json({ message: "Unable to fetch live data, try again" }, { status: 500 });
  }
}
