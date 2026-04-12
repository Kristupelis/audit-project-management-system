import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const session = await getServerSession(authOptions);
    const token = session?.apiAccessToken;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/projects/${id}/report`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return new NextResponse(text || "Failed to generate report.", {
        status: res.status,
        headers: {
          "Content-Type":
            res.headers.get("content-type") ?? "text/plain; charset=utf-8",
        },
      });
    }

    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/pdf",
        "Content-Disposition":
          res.headers.get("content-disposition") ??
          `attachment; filename="project-report-${id}.pdf"`,
      },
    });
  } catch {
    return new NextResponse(
      "Could not connect to the API while generating the report. Please try again.",
      {
        status: 500,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      },
    );
  }
}