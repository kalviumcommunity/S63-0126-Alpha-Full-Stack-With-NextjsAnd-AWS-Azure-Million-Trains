import { NextResponse } from "next/server";
import { RapidApiError, requestRapidApi } from "@/lib/rapidApi";

const ERROR_MESSAGES = {
  404: "No classes published for this train",
  default: "Unable to load train class information"
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trainNumber = searchParams.get("trainNumber")?.trim();

  if (!trainNumber) {
    return NextResponse.json({ message: "Enter a train number" }, { status: 400 });
  }

  try {
    const payload: any = await requestRapidApi({
      defaultPath: "/api/v1/getTrainClasses",
      envUrlKey: "RAPIDAPI_TRAIN_CLASSES_URL",
      query: { trainNo: trainNumber },
      errorMessages: ERROR_MESSAGES
    });

    const rawClasses = payload?.data ?? payload?.classes ?? payload ?? [];
    const classes = Array.isArray(rawClasses) ? rawClasses : rawClasses?.availableClasses ?? [];
    const normalized = (Array.isArray(classes) ? classes : []).map((item: any, index: number) => ({
      code: item?.code ?? item?.class_code ?? item?.classCode ?? `C${index}`,
      name: item?.name ?? item?.class_name ?? item?.className ?? null,
      available: item?.available ?? item?.is_available ?? item?.status ?? true
    }));

    return NextResponse.json({ trainNumber, classes: normalized });
  } catch (error) {
    if (error instanceof RapidApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error("train-classes route error", error);
    return NextResponse.json({ message: "Unable to load train class information" }, { status: 500 });
  }
}
