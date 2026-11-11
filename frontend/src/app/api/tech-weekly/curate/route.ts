import { NextResponse } from "next/server";
import {
  curateReviewSubmission,
  curateSelectWeeklyPick,
} from "@/features/data/tech-weekly-curation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body =
  | {
      intent: "review";
      submissionId: string;
      status: "approved" | "rejected" | "submitted";
      reviewNote?: string;
    }
  | {
      intent: "pick";
      submissionId: string;
      reviewNote?: string;
    };

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (!body?.submissionId || typeof body.submissionId !== "string") {
    return NextResponse.json(
      { success: false, error: "submissionId is required." },
      { status: 400 },
    );
  }

  try {
    if (body.intent === "review") {
      if (!["approved", "rejected", "submitted"].includes(body.status)) {
        return NextResponse.json(
          { success: false, error: "Invalid review status." },
          { status: 400 },
        );
      }
      const result = await curateReviewSubmission({
        submissionId: body.submissionId,
        status: body.status,
        reviewNote: body.reviewNote,
      });
      return NextResponse.json(result, {
        status: result.success ? 200 : 400,
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    if (body.intent === "pick") {
      const result = await curateSelectWeeklyPick({
        submissionId: body.submissionId,
        reviewNote: body.reviewNote,
      });
      return NextResponse.json(result, {
        status: result.success ? 200 : 400,
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    return NextResponse.json(
      { success: false, error: "Unknown curation intent." },
      { status: 400 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Curation request failed unexpectedly.",
      },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
