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

type RequestBody = {
  nodeType: NodeType;
  parentId: string | null;
  payload: Record<string, unknown>;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await getServerSession(authOptions);
    const token = session?.apiAccessToken;

    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = (await request.json()) as RequestBody;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      return new NextResponse("NEXT_PUBLIC_API_URL missing", { status: 500 });
    }

    let path = "";
    const methodBody: unknown = body.payload;

    switch (body.nodeType) {
      case "AUDIT_AREA":
        path = `/projects/${projectId}/audit-areas`;
        break;
      case "PROCESS":
        if (!body.parentId) {
          return new NextResponse("Parent audit area is required.", { status: 400 });
        }
        path = `/audit-areas/${body.parentId}/processes`;
        break;
      case "CONTROL":
        if (!body.parentId) {
          return new NextResponse("Parent process is required.", { status: 400 });
        }
        path = `/processes/${body.parentId}/controls`;
        break;
      case "TEST_STEP":
        if (!body.parentId) {
          return new NextResponse("Parent control is required.", { status: 400 });
        }
        path = `/controls/${body.parentId}/test-steps`;
        break;
      case "FINDING":
        if (!body.parentId) {
          return new NextResponse("Parent process is required.", { status: 400 });
        }
        path = `/processes/${body.parentId}/finding`;
        break;
      case "EVIDENCE":
        if (!body.parentId) {
          return new NextResponse("Parent process is required.", { status: 400 });
        }
        path = `/processes/${body.parentId}/evidence`;
        break;
      default:
        return new NextResponse("Invalid node type.", { status: 400 });
    }

    const res = await fetch(`${apiUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(methodBody),
    });

    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create component.";
    return new NextResponse(message, { status: 500 });
  }
}