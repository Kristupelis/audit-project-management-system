export type TranslationDictionary = {
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    close: string;
    loading: string;
    error: string;
  };
  projects: {
    title: string;
    createProject: string;
    editProject: string;
    deleteProject: string;
    projectDetails: string;
    description: string;
    scope: string;
    objective: string;
    methodology: string;
    auditedEntity: string;
    location: string;
    leadAuditor: string;
    status: string;
    type: string;
    priority: string;
    updated: string;
    deleting: string;
    deleteFailed: string;
    confirmDeleteTitle: string;
    confirmDeleteMessage: string;
    confirmDeleteWarning: string;
    basicInformation: string;
    projectName: string;
    projectCode: string;
    auditDetails: string;
    methodologyStandard: string;
    context: string;
    dates: string;
    auditedPeriodStart: string;
    auditedPeriodEnd: string;
    plannedStartDate: string;
    plannedEndDate: string;
    actualStartDate: string;
    actualEndDate: string;
    saving: string;
    creating: string;
    saveChanges: string;
    backToProjects: string;
    auditedPeriod: string;
    genReport: string;
  };
  main: {
    projects: string;
    account: string;
    signOut: string;
    createProject: string;
    loggedIn: string;
    message: string;
    noProjects: string;
    code: string;
    updated: string;
  };
  sessionExpiry: {
    soon: string;
    soon2: string;
    soon3: string;
    continue: string;
    logOut: string;
    expired: string;
    expired2: string;
    signIn: string;
  };
  roles: {
    owner: string;
    member: string;
  };
  enums: {
    projectStatus: {
      PLANNING: string;
      ACTIVE: string;
      FIELDWORK: string;
      REVIEW: string;
      CLOSED: string;
      ARCHIVED: string;
    };
    auditType: {
      INTERNAL: string;
      EXTERNAL: string;
      IT: string;
      FINANCIAL: string;
      COMPLIANCE: string;
      OPERATIONAL: string;
      OTHER: string;
    };
    priority: {
      LOW: string;
      MEDIUM: string;
      HIGH: string;
      CRITICAL: string;
    };
  };
  confirmations: {
    signOutTitle: string;
    signOutMessage: string;
  };
  auth: {
    notLoggedIn: string;
    login: string;
  };
  rolesPage: {
    roles: string;
  };
  structure: {
        projectStructure: string;
        createComponent: string;
        loadingStructure: string;
        noComponents: string;
        selectComponent: string;
        goBack: string;
        childComponents: string;
        open: string;
        cancelEdit: string;
        addTestStep: string;
        addChildComponent: string;
        componentType: string;
        richCreateFormsMoved: string;
        openCreatePage: string;
        noPermissionToOpenDetails: string;
        deleteNodeMessage: string;
        deleteNodeWarning: string;
        yes: string;
        no: string;
        auditArea: string;
        process: string;
        control: string;
        testStep: string;
        finding: string;
        evidence: string;
        name: string;
        code: string;
        description: string;
        objective: string;
        scope: string;
        riskLevel: string;
        residualRisk: string;
        status: string;
        areaOwner: string;
        notes: string;
        processOwner: string;
        frequency: string;
        systemsInvolved: string;
        keyInputs: string;
        keyOutputs: string;
        controlObjective: string;
        controlType: string;
        controlNature: string;
        controlOwner: string;
        keyControl: string;
        relatedRisk: string;
        expectedEvidence: string;
        testingStrategy: string;
        stepNo: string;
        expectedResult: string;
        actualResult: string;
        testMethod: string;
        sampleReference: string;
        performedBy: string;
        performedAt: string;
        reviewedBy: string;
        reviewedAt: string;
        title: string;
        criteria: string;
        condition: string;
        cause: string;
        effect: string;
        recommendation: string;
        managementResponse: string;
        actionOwner: string;
        dueDate: string;
        severity: string;
        identifiedAt: string;
        closedAt: string;
        type: string;
        source: string;
        referenceNo: string;
        externalUrl: string;
        collectedBy: string;
        collectedAt: string;
        validFrom: string;
        validTo: string;
        reliabilityLevel: string;
        confidentiality: string;
        version: string;
        riskLevelValues?: Record<string, string>;
        severityValues?: Record<string, string>;
        createComponentPageTitle: string;
        backToProject: string;
        selectParent: string;
        creatingComponent: string;
        nameRequired: string;
        titleRequired: string;
        typeRequired: string;
        descriptionRequired: string;
        notStarted: string;
        inProgress: string;
        completed: string;
        closed: string;
        notApplicable: string;
        daily: string;
        weekly: string;
        monthly: string;
        quarterly: string;
        yearly: string;
        adHoc: string;
        preventive: string;
        detective: string;
        corrective: string;
        manual: string;
        automated: string;
        itDependentManual: string;
        inquiry: string;
        inspection: string;
        observation: string;
        reperformance: string;
        walkthrough: string;
        analyticalProcedure: string;
        mixed: string;
        passed: string;
        failed: string;
        blocked: string;
        draft: string;
        openStatus: string;
        accepted: string;
        resolved: string;
        rejected: string;
        requested: string;
        received: string;
        reviewed: string;
        public: string;
        internal: string;
        confidential: string;
        restricted: string;
        low: string;
        medium: string;
        high: string;
        critical: string;
        createComponentFailed: string;
        updateComponentFailed: string;
        select: string;
    };
    members: {
        title: string;
        userEmailPlaceholder: string;
        add: string;
        noMembers: string;
        makeOwner: string;
        remove: string;
        confirmRemoveTitle: string;
        confirmRemoveMessage: string;
        confirmTransferTitle: string;
        confirmTransferMessage: string;
        };
    audit: {
        memberFilter: string;
        allMembers: string;
        dateFilter: string;
        noDateFilter: string;
        afterDate: string;
        beforeDate: string;
        dateLabel: string;
        previewTitle: string;
        openAllLogs: string;
        loading: string;
        noEntries: string;
        details: string;
        actorLabel: string;
        systemActor: string;
        actions: Record<string, string>;
        entities: Record<string, string>;
        auditLogTitle: string;
        actionFilter: string;
        entityFilter: string;
        allActions: string;
        allEntities: string;
        applyFilters: string;
        resetFilters: string;
        totalLogs: string;
        noEntriesFound: string;
        previous: string;
        next: string;
        pageLabel: string;
        ofLabel: string;
    };
    rolesManagement: {
        notLoggedIn: string;
        backToProject: string;
        backToRoles: string;
        createRole: string;
        editRole: string;
        deleteRole: string;
        updateRole: string;
        roleDetails: string;
        roleName: string;
        permissionRules: string;
        addRule: string;
        removeRule: string;
        rule: string;
        resourceType: string;
        scopeMode: string;
        allItems: string;
        specificItem: string;
        selectItem: string;
        actions: string;
        assignMembers: string;
        noRoles: string;
        noRolesHint: string;
        onlyOwnersCanCreate: string;
        onlyOwnersCanEdit: string;
        confirmDeleteTitle: string;
        confirmDeleteMessage: string;
        confirmDeleteWarning: string;
        deleteFailed: string;
        loadStructureFailed: string;
        resourceProject: string;
        resourceAuditArea: string;
        resourceProcess: string;
        resourceControl: string;
        resourceTestStep: string;
        resourceFinding: string;
        resourceEvidence: string;
        actionView: string;
        actionCreate: string;
        actionEdit: string;
        actionDelete: string;
        allScope: string;
        specificScope: string;
        };
    authPages: {
        loginTitle: string;
        email: string;
        password: string;
        signIn: string;
        signingIn: string;
        register: string;
        loginFailed: string;
        invalidEmailOrPassword: string;
        missingLoginSession: string;
        invalidAuthCode: string;
        setup2faTitle: string;
        verify2faTitle: string;
        setup2faDescription: string;
        loadingQrCode: string;
        manualSetupKey: string;
        accountLabel: string;
        confirmSetupCodeLabel: string;
        authCodeLabel: string;
        finishSetup: string;
        finishingSetup: string;
        verify: string;
        verifying: string;
        backToLogin: string;
        failedToLoad2faSetup: string;
        setupSecretNotLoaded: string;
        setup2faFailed: string;
        verificationFailed: string;
        createAccount: string;
        creatingAccount: string;
        name: string;
        yourName: string;
        createAccountTitle: string;
        passwordRequirements: string;
        blockedTitle: string;
        blockedMessage: string;
        blockedReasonLabel: string;
        blockedContactMessage: string;
        sessionEndedTitle: string;
        sessionEndedMessage: string;
    };
    accountPage: {
        title: string;
        loggedInAs: string;
        twoFactorTitle: string;
        setup2fa: string;
        generating: string;
        scanQrDescription: string;
        secretLabel: string;
        enterCode: string;
        enable2fa: string;
        enabling: string;
        enabledSuccess: string;
        setupFailed: string;
        enableFailed: string;
        pleaseLoginFirst: string;
    };
};

const en: TranslationDictionary = {
  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    close: "Close",
    loading: "Loading...",
    error: "Error",
  },
  projects: {
    title: "Projects",
    createProject: "Create project",
    editProject: "Edit project",
    deleteProject: "Delete project",
    projectDetails: "Project details",
    description: "Description",
    scope: "Scope",
    objective: "Objective",
    methodology: "Methodology",
    auditedEntity: "Audited entity",
    location: "Location",
    leadAuditor: "Lead auditor",
    status: "Status",
    type: "Type",
    priority: "Priority",
    updated: "Updated",
    deleting: "Deleting...",
    deleteFailed: "Failed to delete project.",
    confirmDeleteTitle: "Confirm deletion",
    confirmDeleteMessage: "Are you sure you want to delete this project?",
    confirmDeleteWarning: "This action cannot be undone.",
    basicInformation: "Basic information",
    projectName: "Project name",
    projectCode: "Project code",
    auditDetails: "Audit details",
    methodologyStandard: "Methodology / standard",
    context: "Context",
    dates: "Dates",
    auditedPeriodStart: "Audited period start",
    auditedPeriodEnd: "Audited period end",
    plannedStartDate: "Planned start date",
    plannedEndDate: "Planned end date",
    actualStartDate: "Actual start date",
    actualEndDate: "Actual end date",
    saving: "Saving...",
    creating: "Creating...",
    saveChanges: "Save changes",
    backToProjects: "Back to projects",
    auditedPeriod: "Audited period",
    genReport: "Generate report",
  },
  main: {
    projects: "Projects",
    account: "Account",
    signOut: "Sign out",
    createProject: "Create project",
    loggedIn: "Logged in as:",
    message: "View existing audit projects or create a new one.",
    noProjects: "There are no projects yet.",
    code: "Code:",
    updated: "Updated:",
  },
  sessionExpiry: {
    soon: "Session expiring soon",
    soon2: "Your session will expire soon. Save your work now.",
    soon3:
      "This app currently uses only an access token, so once the session expires you will need to sign in again.",
    continue: "Continue working",
    logOut: "Log out now",
    expired: "Session expired",
    expired2: "Your session has expired. Please sign in again to continue.",
    signIn: "Sign in again",
  },
  roles: {
    owner: "OWNER",
    member: "MEMBER",
  },
  enums: {
    projectStatus: {
      PLANNING: "Planning",
      ACTIVE: "Active",
      FIELDWORK: "Fieldwork",
      REVIEW: "Review",
      CLOSED: "Closed",
      ARCHIVED: "Archived",
    },
    auditType: {
      INTERNAL: "Internal",
      EXTERNAL: "External",
      IT: "IT",
      FINANCIAL: "Financial",
      COMPLIANCE: "Compliance",
      OPERATIONAL: "Operational",
      OTHER: "Other",
    },
    priority: {
      LOW: "Low",
      MEDIUM: "Medium",
      HIGH: "High",
      CRITICAL: "Critical",
    },
  },
  confirmations: {
    signOutTitle: "Confirm sign out",
    signOutMessage: "Are you sure you want to sign out?",
  },
  auth: {
    notLoggedIn: "Not logged in.",
    login: "Login",
  },
  rolesPage: {
    roles: "Roles",
  },
  structure: {
        projectStructure: "Project structure",
        createComponent: "Create component",
        createComponentFailed: "Failed to create component.",
        updateComponentFailed: "Failed to update component.",
        loadingStructure: "Loading structure...",
        noComponents: "No components in this project yet.",
        selectComponent: "Select a component from the tree.",
        goBack: "Go back",
        childComponents: "Child components",
        open: "Open",
        cancelEdit: "Cancel edit",
        addTestStep: "Add test step",
        addChildComponent: "Add child component",
        componentType: "Component type",
        richCreateFormsMoved:
            "Continue in the dedicated create page with the child type and parent preselected.",
        openCreatePage: "Open create page",
        noPermissionToOpenDetails:
            "You can see this component in the tree, but you do not have permission to open its details.",
        deleteNodeMessage: "Delete",
        deleteNodeWarning:
            "All related child components of this component will also be deleted.",
        yes: "Yes",
        no: "No",
        auditArea: "Audit area",
        process: "Process",
        control: "Control",
        testStep: "Test step",
        finding: "Finding",
        evidence: "Evidence",
        name: "Name",
        code: "Code",
        description: "Description",
        objective: "Objective",
        scope: "Scope",
        riskLevel: "Risk level",
        residualRisk: "Residual risk",
        status: "Status",
        areaOwner: "Area owner",
        notes: "Notes",
        processOwner: "Process owner",
        frequency: "Frequency",
        systemsInvolved: "Systems involved",
        keyInputs: "Key inputs",
        keyOutputs: "Key outputs",
        controlObjective: "Control objective",
        controlType: "Control type",
        controlNature: "Control nature",
        controlOwner: "Control owner",
        keyControl: "Key control",
        relatedRisk: "Related risk",
        expectedEvidence: "Expected evidence",
        testingStrategy: "Testing strategy",
        stepNo: "Step no",
        expectedResult: "Expected result",
        actualResult: "Actual result",
        testMethod: "Test method",
        sampleReference: "Sample reference",
        performedBy: "Performed by",
        performedAt: "Performed at",
        reviewedBy: "Reviewed by",
        reviewedAt: "Reviewed at",
        title: "Title",
        criteria: "Criteria",
        condition: "Condition",
        cause: "Cause",
        effect: "Effect",
        recommendation: "Recommendation",
        managementResponse: "Management response",
        actionOwner: "Action owner",
        dueDate: "Due date",
        severity: "Severity",
        identifiedAt: "Identified at",
        closedAt: "Closed at",
        type: "Type",
        source: "Source",
        referenceNo: "Reference number",
        externalUrl: "External URL",
        collectedBy: "Collected by",
        collectedAt: "Collected at",
        validFrom: "Valid from",
        validTo: "Valid to",
        reliabilityLevel: "Reliability level",
        confidentiality: "Confidentiality",
        version: "Version",
        riskLevelValues: {
            LOW: "Low",
            MEDIUM: "Medium",
            HIGH: "High",
            CRITICAL: "Critical",
        },
        severityValues: {
            LOW: "Low",
            MEDIUM: "Medium",
            HIGH: "High",
            CRITICAL: "Critical",
        },
        createComponentPageTitle: "Create component",
        backToProject: "Back to project",
        selectParent: "Select parent",
        creatingComponent: "Creating...",
        nameRequired: "Name is required.",
        titleRequired: "Title is required.",
        typeRequired: "Type is required.",
        descriptionRequired: "Description is required.",
        notStarted: "Not started",
        inProgress: "In progress",
        completed: "Completed",
        closed: "Closed",
        notApplicable: "Not applicable",
        daily: "Daily",
        weekly: "Weekly",
        monthly: "Monthly",
        quarterly: "Quarterly",
        yearly: "Yearly",
        adHoc: "Ad hoc",
        preventive: "Preventive",
        detective: "Detective",
        corrective: "Corrective",
        manual: "Manual",
        automated: "Automated",
        itDependentManual: "IT-dependent manual",
        inquiry: "Inquiry",
        inspection: "Inspection",
        observation: "Observation",
        reperformance: "Reperformance",
        walkthrough: "Walkthrough",
        analyticalProcedure: "Analytical procedure",
        mixed: "Mixed",
        passed: "Passed",
        failed: "Failed",
        blocked: "Blocked",
        draft: "Draft",
        openStatus: "Open",
        accepted: "Accepted",
        resolved: "Resolved",
        rejected: "Rejected",
        requested: "Requested",
        received: "Received",
        reviewed: "Reviewed",
        public: "Public",
        internal: "Internal",
        confidential: "Confidential",
        restricted: "Restricted",
        low: "Low",
        medium: "Medium",
        high: "High",
        critical: "Critical",
        select: "Select",
    },
    members: {
        title: "Members",
        userEmailPlaceholder: "User email",
        add: "Add",
        noMembers: "No members yet.",
        makeOwner: "Make owner",
        remove: "Remove",
        confirmRemoveTitle: "Confirm member removal",
        confirmRemoveMessage: "Remove this member:",
        confirmTransferTitle: "Confirm ownership transfer",
        confirmTransferMessage: "Transfer ownership to:",
        },
    audit: {
        memberFilter: "Member",
        allMembers: "All members",
        dateFilter: "Date filter",
        noDateFilter: "No date filter",
        afterDate: "After date",
        beforeDate: "Before date",
        dateLabel: "Date",
        previewTitle: "Audit log (recent 20)",
        openAllLogs: "Open all logs",
        loading: "Loading audit log...",
        noEntries: "No audit entries yet.",
        details: "details",
        actorLabel: "actor:",
        systemActor: "system",
        actions: {
            PROJECT_CREATED: "Project created",
            PROJECT_UPDATED: "Project updated",
            PROJECT_DELETED: "Project deleted",
            MEMBER_ADDED: "Member added",
            MEMBER_ROLE_UPDATED: "Member role updated",
            MEMBER_REMOVED: "Member removed",
            OWNER_TRANSFERRED: "Ownership transferred",
            ROLE_CREATED: "Role created",
            ROLE_UPDATED: "Role updated",
            ROLE_DELETED: "Role deleted",
            ROLE_ASSIGNED_TO_MEMBER: "Role assigned to member",
            ROLE_REMOVED_FROM_MEMBER: "Role removed from member",
            DIRECT_PERMISSION_GRANTED: "Direct permission granted",
            DIRECT_PERMISSION_REVOKED: "Direct permission revoked",
            AUDIT_AREA_CREATED: "Audit area created",
            AUDIT_AREA_UPDATED: "Audit area updated",
            AUDIT_AREA_DELETED: "Audit area deleted",
            PROCESS_CREATED: "Process created",
            PROCESS_UPDATED: "Process updated",
            PROCESS_DELETED: "Process deleted",
            CONTROL_CREATED: "Control created",
            CONTROL_UPDATED: "Control updated",
            CONTROL_DELETED: "Control deleted",
            TEST_STEP_CREATED: "Test step created",
            TEST_STEP_UPDATED: "Test step updated",
            TEST_STEP_DELETED: "Test step deleted",
            EVIDENCE_CREATED: "Evidence created",
            EVIDENCE_UPDATED: "Evidence updated",
            EVIDENCE_DELETED: "Evidence deleted",
            FINDING_CREATED: "Finding created",
            FINDING_UPDATED: "Finding updated",
            FINDING_DELETED: "Finding deleted",
        },
        entities: {
            Project: "Project",
            ProjectMember: "Project member",
            ProjectRole: "Project role",
            AuditArea: "Audit area",
            Process: "Process",
            Control: "Control",
            TestStep: "Test step",
            Evidence: "Evidence",
            Finding: "Finding",
        },
        auditLogTitle: "Audit log",
        actionFilter: "Action",
        entityFilter: "Entity",
        allActions: "All actions",
        allEntities: "All entities",
        applyFilters: "Apply filters",
        resetFilters: "Reset",
        totalLogs: "Total logs:",
        noEntriesFound: "No audit entries found.",
        previous: "Previous",
        next: "Next",
        pageLabel: "Page",
        ofLabel: "of",
    },
    rolesManagement: {
        notLoggedIn: "Not logged in.",
        backToProject: "Back to project",
        backToRoles: "Back to roles",
        createRole: "Create role",
        editRole: "Edit role",
        deleteRole: "Delete role",
        updateRole: "Update role",
        roleDetails: "Role details",
        roleName: "Role name",
        permissionRules: "Permission rules",
        addRule: "Add rule",
        removeRule: "Remove",
        rule: "Rule",
        resourceType: "Resource type",
        scopeMode: "Scope mode",
        allItems: "All",
        specificItem: "Specific",
        selectItem: "Select item",
        actions: "Actions",
        assignMembers: "Assign members",
        noRoles: "There are no roles created.",
        noRolesHint: 'If you want to create a role, press "Create role".',
        onlyOwnersCanCreate: "Only project owners or superadmins can create roles.",
        onlyOwnersCanEdit: "Only project owners or superadmins can edit roles.",
        confirmDeleteTitle: "Confirm deletion",
        confirmDeleteMessage: "Are you sure you want to delete this role?",
        confirmDeleteWarning: "This action cannot be undone.",
        deleteFailed: "Failed to delete role.",
        loadStructureFailed: "Failed to load project structure.",
        resourceProject: "Project",
        resourceAuditArea: "Audit area",
        resourceProcess: "Process",
        resourceControl: "Control",
        resourceTestStep: "Test step",
        resourceFinding: "Finding",
        resourceEvidence: "Evidence",
        actionView: "View",
        actionCreate: "Create",
        actionEdit: "Edit",
        actionDelete: "Delete",
        allScope: "All",
        specificScope: "Specific",
    },
    authPages: {
        loginTitle: "Login",
        email: "Email",
        password: "Password",
        signIn: "Sign in",
        signingIn: "Signing in...",
        register: "Register",
        loginFailed: "Login failed.",
        invalidEmailOrPassword: "Invalid email or password.",
        missingLoginSession: "Missing login session.",
        invalidAuthCode: "Enter a valid 6-digit authentication code.",
        setup2faTitle: "Set up two-factor authentication",
        verify2faTitle: "Two-factor authentication",
        setup2faDescription:
            "Scan this QR code in your authenticator app, then enter the 6-digit code to finish setup.",
        loadingQrCode: "Loading QR code...",
        manualSetupKey: "Manual setup key",
        accountLabel: "Enter the 6-digit code from your authenticator app for",
        confirmSetupCodeLabel: "Authentication code to confirm setup",
        authCodeLabel: "Authentication code",
        finishSetup: "Finish setup",
        finishingSetup: "Finishing setup...",
        verify: "Verify",
        verifying: "Verifying...",
        backToLogin: "Back to login",
        failedToLoad2faSetup: "Failed to load 2FA setup.",
        setupSecretNotLoaded: "2FA secret was not loaded.",
        setup2faFailed: "2FA setup failed.",
        verificationFailed: "Verification failed.",
        createAccount: "Create account",
        creatingAccount: "Creating...",
        name: "Name",
        yourName: "Your name",
        createAccountTitle: "Create account",
        passwordRequirements:
            "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.",
        blockedTitle: "Account blocked",
        blockedMessage: "Your account is blocked.",
        blockedReasonLabel: "Reason",
        blockedContactMessage:
          "For unblock requests, contact ckristupas@gmail.com.",
        sessionEndedTitle: "Session ended",
        sessionEndedMessage:
          "Your session has ended because your account was changed, blocked, deleted, or your sign-in status is no longer valid.",
    },
    accountPage: {
        title: "Account",
        loggedInAs: "Logged in as",
        twoFactorTitle: "Two-factor authentication (TOTP)",
        setup2fa: "Setup 2FA",
        generating: "Generating...",
        scanQrDescription:
            "Scan this QR code using Google Authenticator (or Authy / Microsoft Authenticator).",
        secretLabel: "Secret (base32):",
        enterCode: "Enter 6-digit code",
        enable2fa: "Enable 2FA",
        enabling: "Enabling...",
        enabledSuccess: "2FA enabled ✅",
        setupFailed: "Setup failed.",
        enableFailed: "Enable failed.",
        pleaseLoginFirst: "Please login first.",
    },
};

export default en;