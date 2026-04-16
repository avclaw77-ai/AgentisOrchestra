import type { DepartmentTemplate } from "@/types"
export type { DepartmentTemplate }

// =============================================================================
// Department templates -- pre-configured agent setups per department type
// =============================================================================

export const DEPARTMENT_TEMPLATES: Record<string, DepartmentTemplate> = {
  engineering: {
    name: "Engineering",
    description: "Software development and infrastructure",
    color: "#3b82f6",
    agents: [
      {
        id: "dev",
        name: "Dev",
        role: "Software development",
        model: "claude-cli:sonnet",
      },
      {
        id: "qa",
        name: "QA",
        role: "Testing & code review",
        model: "claude-cli:haiku",
      },
      {
        id: "ops",
        name: "Ops",
        role: "Infrastructure & deployment",
        model: "claude-cli:sonnet",
      },
    ],
  },
  research: {
    name: "Research",
    description: "Market research, competitive analysis, exploration",
    color: "#f59e0b",
    agents: [
      {
        id: "rnd",
        name: "RnD",
        role: "Research & prototyping",
        model: "perplexity:sonar-pro",
      },
    ],
  },
  design: {
    name: "Design",
    description: "Visual design, UX, and brand",
    color: "#8b5cf6",
    agents: [
      {
        id: "uiux",
        name: "UIUX",
        role: "Visual design & UX",
        model: "claude-cli:opus",
      },
    ],
  },
  operations: {
    name: "Operations",
    description: "CEO support, scheduling, communications",
    color: "#ec4899",
    agents: [
      {
        id: "maxx",
        name: "Maxx",
        role: "CEO assistant",
        model: "claude-cli:sonnet",
      },
    ],
  },
  sales: {
    name: "Sales",
    description: "Lead generation, proposals, client relations",
    color: "#10b981",
    agents: [
      {
        id: "sales",
        name: "Sales",
        role: "Lead generation & proposals",
        model: "claude-cli:sonnet",
      },
    ],
  },
  support: {
    name: "Support",
    description: "Customer support and documentation",
    color: "#6366f1",
    agents: [
      {
        id: "support",
        name: "Support",
        role: "Customer support",
        model: "claude-cli:haiku",
      },
    ],
  },
} as const

// =============================================================================
// Connector agent templates -- system integration agents
// =============================================================================

export interface ConnectorTemplate {
  id: string
  name: string
  role: string
  description: string
  icon: string
  model: string
  persona: string
  connectionFields: { key: string; label: string; type: "text" | "password" | "url"; required: boolean }[]
}

export const CONNECTOR_TEMPLATES: ConnectorTemplate[] = [
  {
    id: "rest-api",
    name: "REST API Connector",
    role: "External REST API integration",
    description: "Connects to any REST API. Reads and writes data via HTTP requests with configurable auth.",
    icon: "Globe",
    model: "claude-cli:haiku",
    persona: `You are a system connector agent. Your sole purpose is to interact with an external REST API on behalf of other agents.

When asked to fetch or send data:
1. Use the configured base URL and authentication
2. Make the appropriate HTTP request (GET/POST/PUT/DELETE)
3. Parse the response and return structured data
4. Handle errors gracefully -- report status codes and error messages
5. Never expose raw credentials in your responses

You do NOT make decisions. You fetch and deliver data. Other agents interpret it.`,
    connectionFields: [
      { key: "baseUrl", label: "API Base URL", type: "url", required: true },
      { key: "authType", label: "Auth Type (bearer/basic/apikey)", type: "text", required: true },
      { key: "authToken", label: "Auth Token / API Key", type: "password", required: true },
      { key: "headers", label: "Custom Headers (JSON)", type: "text", required: false },
    ],
  },
  {
    id: "database",
    name: "Database Connector",
    role: "External database read access",
    description: "Connects to PostgreSQL or MySQL databases. Read-only queries for reporting and data access.",
    icon: "Database",
    model: "claude-cli:haiku",
    persona: `You are a system connector agent with read-only access to an external database.

When asked for data:
1. Translate the request into a SQL query
2. Execute against the configured database
3. Return results in a structured format
4. NEVER execute INSERT, UPDATE, DELETE, DROP, or any write operation
5. NEVER expose connection strings or credentials

You are a data gateway. Other agents ask you questions, you query the database and return answers.`,
    connectionFields: [
      { key: "connectionString", label: "Connection String", type: "password", required: true },
      { key: "dbType", label: "Database Type (postgres/mysql)", type: "text", required: true },
      { key: "readOnly", label: "Read-Only Mode (true/false)", type: "text", required: false },
    ],
  },
  {
    id: "file-storage",
    name: "File Storage Connector",
    role: "External file system / S3 access",
    description: "Reads and writes files from mounted volumes, S3 buckets, or network shares.",
    icon: "FolderOpen",
    model: "claude-cli:haiku",
    persona: `You are a system connector agent for file storage access.

When asked to read or write files:
1. Use the configured storage path or S3 bucket
2. List, read, and write files as requested
3. Report file sizes, dates, and types
4. Handle missing files gracefully
5. NEVER access paths outside the configured root
6. NEVER expose storage credentials

You manage file I/O so other agents don't need direct filesystem access.`,
    connectionFields: [
      { key: "storageType", label: "Storage Type (local/s3)", type: "text", required: true },
      { key: "rootPath", label: "Root Path or S3 Bucket", type: "text", required: true },
      { key: "accessKey", label: "Access Key (S3 only)", type: "password", required: false },
      { key: "secretKey", label: "Secret Key (S3 only)", type: "password", required: false },
      { key: "region", label: "Region (S3 only)", type: "text", required: false },
    ],
  },
]

export function getConnectorTemplate(id: string): ConnectorTemplate | undefined {
  return CONNECTOR_TEMPLATES.find((t) => t.id === id)
}

export type DepartmentTemplateKey = keyof typeof DEPARTMENT_TEMPLATES

/**
 * Returns all available template keys.
 */
export function getTemplateKeys(): DepartmentTemplateKey[] {
  return Object.keys(DEPARTMENT_TEMPLATES) as DepartmentTemplateKey[]
}

/**
 * Returns a deep copy of a template by key, or null if not found.
 */
export function getTemplate(key: string): DepartmentTemplate | null {
  const template = DEPARTMENT_TEMPLATES[key]
  if (!template) return null
  return JSON.parse(JSON.stringify(template)) as DepartmentTemplate
}
