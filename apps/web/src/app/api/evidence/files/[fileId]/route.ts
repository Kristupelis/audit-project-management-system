import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function GET(
  _req: Request,
  context: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await context.params;

  const session = await getServerSession(authOptions);
  const token = session?.apiAccessToken;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/evidence/files/${fileId}/download`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return new NextResponse(text || "Failed to download file", {
      status: res.status,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const arrayBuffer = await res.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    status: res.status,
    headers: {
      "Content-Type":
        res.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition":
        res.headers.get("content-disposition") ?? "attachment",
    },
  });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await context.params;

  const session = await getServerSession(authOptions);
  const token = session?.apiAccessToken;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/evidence/files/${fileId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const text = await res.text();

  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json",
    },
  });
}