import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

type NodeType =
  | "AUDIT_AREA"
  | "PROCESS"
  | "CONTROL"
  | "TEST_STEP"
  | "FINDING"
  | "EVIDENCE";

function isNodeType(value: string): value is NodeType {
  return (
    value === "AUDIT_AREA" ||
    value === "PROCESS" ||
    value === "CONTROL" ||
    value === "TEST_STEP" ||
    value === "FINDING" ||
    value === "EVIDENCE"
  );
}

function getPath(nodeType: NodeType, itemId: string) {
  switch (nodeType) {
    case "AUDIT_AREA":
      return `/audit-areas/${itemId}`;
    case "PROCESS":
      return `/processes/${itemId}`;
    case "CONTROL":
      return `/controls/${itemId}`;
    case "TEST_STEP":
      return `/test-steps/${itemId}`;
    case "FINDING":
      return `/finding/${itemId}`;
    case "EVIDENCE":
      return `/evidence/${itemId}`;
  }
}

async function proxy(
  method: "PATCH" | "DELETE",
  request: Request,
  params: { nodeType: string; itemId: string }
) {
  const session = await getServerSession(authOptions);
  const token = session?.apiAccessToken;

  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!isNodeType(params.nodeType)) {
    return new NextResponse("Invalid node type.", { status: 400 });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return new NextResponse("NEXT_PUBLIC_API_URL missing", { status: 500 });
  }

  const path = getPath(params.nodeType, params.itemId);

  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  if (method === "PATCH") {
    init.body = JSON.stringify(await request.json());
  }

  const res = await fetch(`${apiUrl}${path}`, init);
  const text = await res.text();

  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ nodeType: string; itemId: string }> }
) {
  try {
    return await proxy("PATCH", request, await params);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update component.";
    return new NextResponse(message, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ nodeType: string; itemId: string }> }
) {
  try {
    return await proxy("DELETE", request, await params);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete component.";
    return new NextResponse(message, { status: 500 });
  }
}