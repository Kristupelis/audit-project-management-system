import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { apiFetch } from "@/lib/api";

type AuditArea = {
  id: string;
  projectId: string;
  name: string;
  order: number;
  createdAt: string;
};

type Process = {
  id: string;
  auditAreaId: string;
  name: string;
  status: string;
  order: number;
  createdAt: string;
};

type Control = {
  id: string;
  processId: string;
  name: string;
  order: number;
  createdAt: string;
};

type TestStep = {
  id: string;
  controlId: string;
  description: string;
  order: number;
  createdAt: string;
};

type Finding = {
  id: string;
  processId: string;
  title: string;
  description: string;
  severity: string;
  order: number;
  createdAt: string;
};

type Evidence = {
  id: string;
  processId: string;
  title: string;
  type: string;
  fileUrl?: string | null;
  order: number;
  createdAt: string;
};

type TreeNode =
  | {
      id: string;
      nodeType: "AUDIT_AREA";
      label: string;
      parentId: null;
      children: TreeNode[];
      canRead: boolean;
      data: AuditArea | null;
    }
  | {
      id: string;
      nodeType: "PROCESS";
      label: string;
      parentId: string;
      children: TreeNode[];
      canRead: boolean;
      data: Process | null;
    }
  | {
      id: string;
      nodeType: "CONTROL";
      label: string;
      parentId: string;
      children: TreeNode[];
      canRead: boolean;
      data: Control | null;
    }
  | {
      id: string;
      nodeType: "TEST_STEP";
      label: string;
      parentId: string;
      children: TreeNode[];
      canRead: boolean;
      data: TestStep | null;
    }
  | {
      id: string;
      nodeType: "FINDING";
      label: string;
      parentId: string;
      children: TreeNode[];
      canRead: boolean;
      data: Finding | null;
    }
  | {
      id: string;
      nodeType: "EVIDENCE";
      label: string;
      parentId: string;
      children: TreeNode[];
      canRead: boolean;
      data: Evidence | null;
    };

async function canReadNode(
  apiUrl: string,
  token: string,
  nodeType: TreeNode["nodeType"],
  itemId: string
): Promise<boolean> {
  let path = "";

  switch (nodeType) {
    case "AUDIT_AREA":
      path = `/audit-areas/${itemId}`;
      break;
    case "PROCESS":
      path = `/processes/${itemId}`;
      break;
    case "CONTROL":
      path = `/controls/${itemId}`;
      break;
    case "TEST_STEP":
      path = `/test-steps/${itemId}`;
      break;
    case "FINDING":
      path = `/finding/${itemId}`;
      break;
    case "EVIDENCE":
      path = `/evidence/${itemId}`;
      break;
  }

  const res = await fetch(`${apiUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  return res.ok;
}

type ProgressSummary = {
  totalProcesses: number;
  percent: number;
  completed: number;
  closed: number;
  inProgress: number;
  notStarted: number;
  notApplicable: number;
};

function getProcessProgressWeight(status?: string): number {
  switch (status) {
    case "COMPLETED":
    case "CLOSED":
    case "NOT_APPLICABLE":
      return 100;
    case "IN_PROGRESS":
      return 50;
    case "NOT_STARTED":
    default:
      return 0;
  }
}

function buildProgressSummary(statuses: string[]): ProgressSummary {
  const totalProcesses = statuses.length;

  if (totalProcesses === 0) {
    return {
      totalProcesses: 0,
      percent: 0,
      completed: 0,
      closed: 0,
      inProgress: 0,
      notStarted: 0,
      notApplicable: 0,
    };
  }

  const completed = statuses.filter((s) => s === "COMPLETED").length;
  const closed = statuses.filter((s) => s === "CLOSED").length;
  const inProgress = statuses.filter((s) => s === "IN_PROGRESS").length;
  const notStarted = statuses.filter((s) => s === "NOT_STARTED").length;
  const notApplicable = statuses.filter((s) => s === "NOT_APPLICABLE").length;

  const totalWeight = statuses.reduce(
    (sum, status) => sum + getProcessProgressWeight(status),
    0
  );

  return {
    totalProcesses,
    percent: Math.round(totalWeight / totalProcesses),
    completed,
    closed,
    inProgress,
    notStarted,
    notApplicable,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await getServerSession(authOptions);
    const token = session?.apiAccessToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!apiUrl) {
      return new NextResponse("NEXT_PUBLIC_API_URL missing", { status: 500 });
    }

    const auditAreas = await apiFetch<AuditArea[]>(
      `/projects/${projectId}/audit-areas`,
      token
    );

    const allProcessStatuses: string[] = [];

    const areaNodes: TreeNode[] = await Promise.all(
      auditAreas.map(async (area) => {
        const processes = await apiFetch<Process[]>(
          `/audit-areas/${area.id}/processes`,
          token
        );

        processes.forEach((process) => {
          allProcessStatuses.push(process.status);
        });

        const processNodes: TreeNode[] = await Promise.all(
          processes.map(async (process) => {
            const [controls, findings, evidence, processCanRead] = await Promise.all([
              apiFetch<Control[]>(`/processes/${process.id}/controls`, token),
              apiFetch<Finding[]>(`/processes/${process.id}/finding`, token),
              apiFetch<Evidence[]>(`/processes/${process.id}/evidence`, token),
              canReadNode(apiUrl, token, "PROCESS", process.id),
            ]);

            const controlNodes: TreeNode[] = await Promise.all(
              controls.map(async (control) => {
                const [testSteps, controlCanRead] = await Promise.all([
                  apiFetch<TestStep[]>(`/controls/${control.id}/test-steps`, token),
                  canReadNode(apiUrl, token, "CONTROL", control.id),
                ]);

                const testStepNodes: TreeNode[] = await Promise.all(
                  testSteps
                    .sort((a, b) => a.order - b.order)
                    .map(async (step) => {
                      const stepCanRead = await canReadNode(
                        apiUrl,
                        token,
                        "TEST_STEP",
                        step.id
                      );

                      return {
                        id: step.id,
                        nodeType: "TEST_STEP",
                        label:
                          step.description.length > 60
                            ? `${step.description.slice(0, 60)}...`
                            : step.description,
                        parentId: control.id,
                        children: [],
                        canRead: stepCanRead,
                        data: stepCanRead ? step : null,
                      };
                    })
                );

                return {
                  id: control.id,
                  nodeType: "CONTROL",
                  label: control.name,
                  parentId: process.id,
                  children: testStepNodes,
                  canRead: controlCanRead,
                  data: controlCanRead ? control : null,
                };
              })
            );

            const findingNodes: TreeNode[] = await Promise.all(
              findings
                .sort((a, b) => a.order - b.order)
                .map(async (finding) => {
                  const findingCanRead = await canReadNode(
                    apiUrl,
                    token,
                    "FINDING",
                    finding.id
                  );

                  return {
                    id: finding.id,
                    nodeType: "FINDING",
                    label: finding.title,
                    parentId: process.id,
                    children: [],
                    canRead: findingCanRead,
                    data: findingCanRead ? finding : null,
                  };
                })
            );

            const evidenceNodes: TreeNode[] = await Promise.all(
              evidence
                .sort((a, b) => a.order - b.order)
                .map(async (item) => {
                  const evidenceCanRead = await canReadNode(
                    apiUrl,
                    token,
                    "EVIDENCE",
                    item.id
                  );

                  return {
                    id: item.id,
                    nodeType: "EVIDENCE",
                    label: item.title,
                    parentId: process.id,
                    children: [],
                    canRead: evidenceCanRead,
                    data: evidenceCanRead ? item : null,
                  };
                })
            );

            return {
              id: process.id,
              nodeType: "PROCESS",
              label: process.name,
              parentId: area.id,
              children: [
                ...controlNodes.sort((a, b) => {
                  const left = a.data?.order ?? 0;
                  const right = b.data?.order ?? 0;
                  return left - right;
                }),
                ...findingNodes,
                ...evidenceNodes,
              ],
              canRead: processCanRead,
              data: processCanRead ? process : null,
            };
          })
        );

        const areaCanRead = await canReadNode(apiUrl, token, "AUDIT_AREA", area.id);

        return {
          id: area.id,
          nodeType: "AUDIT_AREA",
          label: area.name,
          parentId: null,
          children: processNodes.sort((a, b) => {
            const left = a.data?.order ?? 0;
            const right = b.data?.order ?? 0;
            return left - right;
          }),
          canRead: areaCanRead,
          data: areaCanRead ? area : null,
        };
      })
    );

    const sortedTree = areaNodes.sort((a, b) => {
    const left = a.data?.order ?? 0;
    const right = b.data?.order ?? 0;
    return left - right;
    });

    return NextResponse.json({
      tree: sortedTree,
      progress: buildProgressSummary(allProcessStatuses),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load structure.";
    return new NextResponse(message, { status: 500 });
  }
}