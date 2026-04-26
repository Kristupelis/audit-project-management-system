export type NodeType =
  | "AUDIT_AREA"
  | "PROCESS"
  | "CONTROL"
  | "TEST_STEP"
  | "FINDING"
  | "EVIDENCE";

export type AuditAreaData = {
  id: string;
  projectId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  objective?: string | null;
  scope?: string | null;
  riskLevel?: string | null;
  residualRisk?: string | null;
  status: string;
  areaOwner?: string | null;
  notes?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type ProcessData = {
  id: string;
  auditAreaId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  objective?: string | null;
  processOwner?: string | null;
  frequency?: string | null;
  riskLevel?: string | null;
  status: string;
  systemsInvolved?: string | null;
  keyInputs?: string | null;
  keyOutputs?: string | null;
  notes?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type ControlData = {
  id: string;
  processId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  controlObjective?: string | null;
  controlType?: string | null;
  controlNature?: string | null;
  controlOwner?: string | null;
  frequency?: string | null;
  keyControl: boolean;
  relatedRisk?: string | null;
  expectedEvidence?: string | null;
  testingStrategy?: string | null;
  status: string;
  notes?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type TestStepData = {
  id: string;
  controlId: string;
  stepNo?: number | null;
  description: string;
  expectedResult?: string | null;
  actualResult?: string | null;
  testMethod?: string | null;
  status: string;
  sampleReference?: string | null;
  performedBy?: string | null;
  performedAt?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  notes?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type FindingData = {
  id: string;
  processId: string;
  title: string;
  code?: string | null;
  description: string;
  criteria?: string | null;
  condition?: string | null;
  cause?: string | null;
  effect?: string | null;
  recommendation?: string | null;
  managementResponse?: string | null;
  actionOwner?: string | null;
  dueDate?: string | null;
  severity: string;
  status: string;
  identifiedAt?: string | null;
  closedAt?: string | null;
  notes?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type EvidenceFileData = {
  id: string;
  originalName: string;
  mimeType?: string | null;
  extension?: string | null;
  sizeBytes?: number | null;
  uploadedAt: string;
  scanStatus: string;
};

export type EvidenceData = {
  id: string;
  processId: string;
  title: string;
  description?: string | null;
  type: string;
  source?: string | null;
  referenceNo?: string | null;
  externalUrl?: string | null;
  collectedBy?: string | null;
  collectedAt?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  reliabilityLevel?: string | null;
  confidentiality?: string | null;
  status: string;
  version?: string | null;
  notes?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  files?: EvidenceFileData[];
};

export type TreeNode =
  | {
      id: string;
      nodeType: "AUDIT_AREA";
      label: string;
      parentId: null;
      children: TreeNode[];
      canRead: boolean;
      data: AuditAreaData | null;
    }
  | {
      id: string;
      nodeType: "PROCESS";
      label: string;
      parentId: string;
      children: TreeNode[];
      canRead: boolean;
      data: ProcessData | null;
    }
  | {
      id: string;
      nodeType: "CONTROL";
      label: string;
      parentId: string;
      children: TreeNode[];
      canRead: boolean;
      data: ControlData | null;
    }
  | {
      id: string;
      nodeType: "TEST_STEP";
      label: string;
      parentId: string;
      children: TreeNode[];
      canRead: boolean;
      data: TestStepData | null;
    }
  | {
      id: string;
      nodeType: "FINDING";
      label: string;
      parentId: string;
      children: TreeNode[];
      canRead: boolean;
      data: FindingData | null;
    }
  | {
      id: string;
      nodeType: "EVIDENCE";
      label: string;
      parentId: string;
      children: TreeNode[];
      canRead: boolean;
      data: EvidenceData | null;
    };

export type ProgressSummary = {
  totalProcesses: number;
  percent: number;
  completed: number;
  closed: number;
  inProgress: number;
  notStarted: number;
  notApplicable: number;
};

export type StructureResponse = {
  tree: TreeNode[];
  progress: ProgressSummary;
};

export type SelectedDetails =
  | AuditAreaData
  | ProcessData
  | ControlData
  | TestStepData
  | FindingData
  | EvidenceData
  | null;