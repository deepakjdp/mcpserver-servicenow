import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import express, { Request, Response } from "express";
import cors from "cors";
import axios, { AxiosInstance, AxiosError } from "axios";
import { z } from "zod";

// Environment variables for ServiceNow authentication
const SERVICENOW_INSTANCE_URL = process.env.SERVICENOW_INSTANCE_URL;
const SERVICENOW_USERNAME = process.env.SERVICENOW_USERNAME;
const SERVICENOW_PASSWORD = process.env.SERVICENOW_PASSWORD;
const PORT = process.env.PORT || 3000;

if (!SERVICENOW_INSTANCE_URL || !SERVICENOW_USERNAME || !SERVICENOW_PASSWORD) {
  console.error(
    "Missing required environment variables: SERVICENOW_INSTANCE_URL, SERVICENOW_USERNAME, SERVICENOW_PASSWORD"
  );
  process.exit(1);
}

// ServiceNow API Types
interface ServiceNowIncident {
  sys_id: string;
  number: string;
  short_description: string;
  description?: string;
  state: string;
  priority: string;
  urgency: string;
  impact: string;
  assigned_to?: {
    link: string;
    value: string;
  };
  assignment_group?: {
    link: string;
    value: string;
  };
  caller_id?: {
    link: string;
    value: string;
  };
  opened_at: string;
  updated_at: string;
  closed_at?: string;
  work_notes?: string;
  close_notes?: string;
  resolution_code?: string;
  category?: string;
  subcategory?: string;
}

interface ServiceNowResponse<T> {
  result: T;
}

interface ServiceNowListResponse<T> {
  result: T[];
}

// Create axios instance for ServiceNow API
const createServiceNowClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: `${SERVICENOW_INSTANCE_URL}/api/now`,
    auth: {
      username: SERVICENOW_USERNAME,
      password: SERVICENOW_PASSWORD,
    },
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  return instance;
};

const serviceNowClient = createServiceNowClient();

// Zod schemas for tool parameters
const GetIncidentSchema = z.object({
  incident_id: z
    .string()
    .describe("Incident number (e.g., INC0010001) or sys_id"),
});

const ListIncidentsSchema = z.object({
  state: z
    .string()
    .optional()
    .describe(
      "Filter by state: 1=New, 2=In Progress, 3=On Hold, 6=Resolved, 7=Closed"
    ),
  priority: z
    .string()
    .optional()
    .describe("Filter by priority: 1=Critical, 2=High, 3=Moderate, 4=Low, 5=Planning"),
  assigned_to: z
    .string()
    .optional()
    .describe("Filter by assigned user (sys_id or username)"),
  assignment_group: z
    .string()
    .optional()
    .describe("Filter by assignment group (sys_id or group name)"),
  caller_id: z
    .string()
    .optional()
    .describe("Filter by caller (sys_id or username)"),
  created_after: z
    .string()
    .optional()
    .describe("Filter incidents created after this date (ISO 8601 format)"),
  created_before: z
    .string()
    .optional()
    .describe("Filter incidents created before this date (ISO 8601 format)"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .describe("Maximum number of results to return (1-100, default: 10)"),
  offset: z
    .number()
    .min(0)
    .optional()
    .default(0)
    .describe("Number of records to skip for pagination (default: 0)"),
});

const CreateIncidentSchema = z.object({
  short_description: z
    .string()
    .min(1)
    .describe("Brief description of the incident (required)"),
  description: z
    .string()
    .optional()
    .describe("Detailed description of the incident"),
  caller_id: z
    .string()
    .describe("Caller user ID (sys_id or username) (required)"),
  urgency: z
    .string()
    .optional()
    .describe("Urgency: 1=High, 2=Medium, 3=Low (default: 3)"),
  impact: z
    .string()
    .optional()
    .describe("Impact: 1=High, 2=Medium, 3=Low (default: 3)"),
  priority: z
    .string()
    .optional()
    .describe("Priority: 1=Critical, 2=High, 3=Moderate, 4=Low, 5=Planning"),
  assignment_group: z
    .string()
    .optional()
    .describe("Assignment group (sys_id or group name)"),
  assigned_to: z
    .string()
    .optional()
    .describe("Assigned user (sys_id or username)"),
  category: z.string().optional().describe("Incident category"),
  subcategory: z.string().optional().describe("Incident subcategory"),
});

const UpdateIncidentSchema = z.object({
  incident_id: z
    .string()
    .describe("Incident number (e.g., INC0010001) or sys_id (required)"),
  state: z
    .string()
    .optional()
    .describe("State: 1=New, 2=In Progress, 3=On Hold, 6=Resolved, 7=Closed"),
  priority: z
    .string()
    .optional()
    .describe("Priority: 1=Critical, 2=High, 3=Moderate, 4=Low, 5=Planning"),
  assigned_to: z
    .string()
    .optional()
    .describe("Assigned user (sys_id or username)"),
  assignment_group: z
    .string()
    .optional()
    .describe("Assignment group (sys_id or group name)"),
  work_notes: z.string().optional().describe("Work notes to add"),
  close_notes: z
    .string()
    .optional()
    .describe("Close notes (required when closing incident)"),
  resolution_code: z
    .string()
    .optional()
    .describe("Resolution code (when resolving/closing)"),
  short_description: z
    .string()
    .optional()
    .describe("Update the short description"),
  description: z.string().optional().describe("Update the description"),
});

// Helper function to handle ServiceNow API errors
const handleServiceNowError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      const status = axiosError.response.status;
      const data = axiosError.response.data as any;

      if (status === 401) {
        return "Authentication failed. Please check your ServiceNow credentials.";
      } else if (status === 403) {
        return "Access forbidden. You don't have permission to perform this operation.";
      } else if (status === 404) {
        return "Resource not found. Please check the incident ID or other identifiers.";
      } else if (data?.error) {
        return `ServiceNow API error: ${data.error.message || JSON.stringify(data.error)}`;
      }
      return `ServiceNow API error (${status}): ${axiosError.message}`;
    } else if (axiosError.request) {
      return `Network error: Unable to reach ServiceNow instance at ${SERVICENOW_INSTANCE_URL}`;
    }
    return `Request error: ${axiosError.message}`;
  }
  return `Unexpected error: ${error}`;
};

// Helper function to build query string for ServiceNow API
const buildQuery = (params: Record<string, any>): string => {
  const queryParts: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      queryParts.push(`${key}=${encodeURIComponent(value)}`);
    }
  }

  return queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
};

// Create MCP server
const server = new Server(
  {
    name: "servicenow-server-sse",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const tools: Tool[] = [
  {
    name: "get_incident",
    description:
      "Retrieve detailed information about a specific ServiceNow incident by incident number or sys_id",
    inputSchema: {
      type: "object",
      properties: {
        incident_id: {
          type: "string",
          description: "Incident number (e.g., INC0010001) or sys_id",
        },
      },
      required: ["incident_id"],
    },
  },
  {
    name: "list_incidents",
    description:
      "Query and list ServiceNow incidents with optional filters for state, priority, assignment, dates, and pagination",
    inputSchema: {
      type: "object",
      properties: {
        state: {
          type: "string",
          description:
            "Filter by state: 1=New, 2=In Progress, 3=On Hold, 6=Resolved, 7=Closed",
        },
        priority: {
          type: "string",
          description:
            "Filter by priority: 1=Critical, 2=High, 3=Moderate, 4=Low, 5=Planning",
        },
        assigned_to: {
          type: "string",
          description: "Filter by assigned user (sys_id or username)",
        },
        assignment_group: {
          type: "string",
          description: "Filter by assignment group (sys_id or group name)",
        },
        caller_id: {
          type: "string",
          description: "Filter by caller (sys_id or username)",
        },
        created_after: {
          type: "string",
          description:
            "Filter incidents created after this date (ISO 8601 format)",
        },
        created_before: {
          type: "string",
          description:
            "Filter incidents created before this date (ISO 8601 format)",
        },
        limit: {
          type: "number",
          description:
            "Maximum number of results to return (1-100, default: 10)",
        },
        offset: {
          type: "number",
          description:
            "Number of records to skip for pagination (default: 0)",
        },
      },
    },
  },
  {
    name: "create_incident",
    description:
      "Create a new ServiceNow incident with required and optional fields",
    inputSchema: {
      type: "object",
      properties: {
        short_description: {
          type: "string",
          description: "Brief description of the incident (required)",
        },
        description: {
          type: "string",
          description: "Detailed description of the incident",
        },
        caller_id: {
          type: "string",
          description: "Caller user ID (sys_id or username) (required)",
        },
        urgency: {
          type: "string",
          description: "Urgency: 1=High, 2=Medium, 3=Low (default: 3)",
        },
        impact: {
          type: "string",
          description: "Impact: 1=High, 2=Medium, 3=Low (default: 3)",
        },
        priority: {
          type: "string",
          description:
            "Priority: 1=Critical, 2=High, 3=Moderate, 4=Low, 5=Planning",
        },
        assignment_group: {
          type: "string",
          description: "Assignment group (sys_id or group name)",
        },
        assigned_to: {
          type: "string",
          description: "Assigned user (sys_id or username)",
        },
        category: {
          type: "string",
          description: "Incident category",
        },
        subcategory: {
          type: "string",
          description: "Incident subcategory",
        },
      },
      required: ["short_description", "caller_id"],
    },
  },
  {
    name: "update_incident",
    description:
      "Update an existing ServiceNow incident with new values for state, priority, assignment, notes, or other fields",
    inputSchema: {
      type: "object",
      properties: {
        incident_id: {
          type: "string",
          description: "Incident number (e.g., INC0010001) or sys_id (required)",
        },
        state: {
          type: "string",
          description:
            "State: 1=New, 2=In Progress, 3=On Hold, 6=Resolved, 7=Closed",
        },
        priority: {
          type: "string",
          description:
            "Priority: 1=Critical, 2=High, 3=Moderate, 4=Low, 5=Planning",
        },
        assigned_to: {
          type: "string",
          description: "Assigned user (sys_id or username)",
        },
        assignment_group: {
          type: "string",
          description: "Assignment group (sys_id or group name)",
        },
        work_notes: {
          type: "string",
          description: "Work notes to add",
        },
        close_notes: {
          type: "string",
          description: "Close notes (required when closing incident)",
        },
        resolution_code: {
          type: "string",
          description: "Resolution code (when resolving/closing)",
        },
        short_description: {
          type: "string",
          description: "Update the short description",
        },
        description: {
          type: "string",
          description: "Update the description",
        },
      },
      required: ["incident_id"],
    },
  },
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Tool execution handler function
async function handleToolCall(request: any) {
  const { name, arguments: args } = request.params;

  try {
    if (name === "get_incident") {
      const { incident_id } = GetIncidentSchema.parse(args);

      const isNumber = incident_id.startsWith("INC");
      const endpoint = isNumber
        ? `/table/incident?sysparm_query=number=${incident_id}&sysparm_limit=1`
        : `/table/incident/${incident_id}`;

      const response = await serviceNowClient.get<
        ServiceNowResponse<ServiceNowIncident> | ServiceNowListResponse<ServiceNowIncident>
      >(endpoint);

      let incident: ServiceNowIncident;
      if (isNumber) {
        const listResponse = response.data as ServiceNowListResponse<ServiceNowIncident>;
        if (listResponse.result.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `Incident ${incident_id} not found.`,
              },
            ],
            isError: true,
          };
        }
        incident = listResponse.result[0];
      } else {
        incident = (response.data as ServiceNowResponse<ServiceNowIncident>).result;
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(incident, null, 2),
          },
        ],
      };
    } else if (name === "list_incidents") {
      const params = ListIncidentsSchema.parse(args);

      const queryParams: Record<string, any> = {
        sysparm_limit: params.limit,
        sysparm_offset: params.offset,
      };

      const filters: string[] = [];
      if (params.state) filters.push(`state=${params.state}`);
      if (params.priority) filters.push(`priority=${params.priority}`);
      if (params.assigned_to) filters.push(`assigned_to=${params.assigned_to}`);
      if (params.assignment_group) filters.push(`assignment_group=${params.assignment_group}`);
      if (params.caller_id) filters.push(`caller_id=${params.caller_id}`);
      if (params.created_after) filters.push(`sys_created_on>=${params.created_after}`);
      if (params.created_before) filters.push(`sys_created_on<=${params.created_before}`);

      if (filters.length > 0) {
        queryParams.sysparm_query = filters.join("^");
      }

      const queryString = buildQuery(queryParams);
      const response = await serviceNowClient.get<ServiceNowListResponse<ServiceNowIncident>>(
        `/table/incident${queryString}`
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                count: response.data.result.length,
                incidents: response.data.result,
              },
              null,
              2
            ),
          },
        ],
      };
    } else if (name === "create_incident") {
      const params = CreateIncidentSchema.parse(args);

      const incidentData: Record<string, any> = {
        short_description: params.short_description,
        caller_id: params.caller_id,
      };

      if (params.description) incidentData.description = params.description;
      if (params.urgency) incidentData.urgency = params.urgency;
      if (params.impact) incidentData.impact = params.impact;
      if (params.priority) incidentData.priority = params.priority;
      if (params.assignment_group) incidentData.assignment_group = params.assignment_group;
      if (params.assigned_to) incidentData.assigned_to = params.assigned_to;
      if (params.category) incidentData.category = params.category;
      if (params.subcategory) incidentData.subcategory = params.subcategory;

      const response = await serviceNowClient.post<ServiceNowResponse<ServiceNowIncident>>(
        "/table/incident",
        incidentData
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: "Incident created successfully",
                incident: response.data.result,
              },
              null,
              2
            ),
          },
        ],
      };
    } else if (name === "update_incident") {
      const params = UpdateIncidentSchema.parse(args);
      const { incident_id, ...updateData } = params;

      const cleanedData = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined)
      );

      const isNumber = incident_id.startsWith("INC");
      let sysId = incident_id;

      if (isNumber) {
        const getResponse = await serviceNowClient.get<ServiceNowListResponse<ServiceNowIncident>>(
          `/table/incident?sysparm_query=number=${incident_id}&sysparm_limit=1`
        );

        if (getResponse.data.result.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `Incident ${incident_id} not found.`,
              },
            ],
            isError: true,
          };
        }
        sysId = getResponse.data.result[0].sys_id;
      }

      const response = await serviceNowClient.patch<ServiceNowResponse<ServiceNowIncident>>(
        `/table/incident/${sysId}`,
        cleanedData
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: "Incident updated successfully",
                incident: response.data.result,
              },
              null,
              2
            ),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
    }
  } catch (error) {
    const errorMessage = handleServiceNowError(error);
    return {
      content: [
        {
          type: "text",
          text: errorMessage,
        },
      ],
      isError: true,
    };
  }
}

// Set up the original server handler
server.setRequestHandler(CallToolRequestSchema, handleToolCall);

// Create Express app for SSE transport
const app = express();

// Enable CORS for browser access
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    server: 'servicenow-server-sse',
    version: '0.1.0',
    servicenow_instance: SERVICENOW_INSTANCE_URL,
  });
});

// MCP SSE endpoint
app.get('/sse', async (req: Request, res: Response) => {
  console.log('New SSE connection established');
  
  // Create a new server instance for each connection
  const connectionServer = new Server(
    {
      name: 'servicenow-server-sse',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Set up request handlers for this connection
  connectionServer.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools,
  }));

  connectionServer.setRequestHandler(CallToolRequestSchema, async (request) =>
    handleToolCall(request)
  );
  
  const transport = new SSEServerTransport('/message', res);
  await connectionServer.connect(transport);
  
  // Handle client disconnect
  req.on('close', () => {
    console.log('SSE connection closed');
    connectionServer.close().catch(console.error);
  });
});

// MCP message endpoint
app.post('/message', async (req: Request, res: Response) => {
  // This endpoint is handled by the SSE transport
  res.status(200).send();
});

// Root endpoint with API information
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'ServiceNow MCP Server (SSE)',
    version: '0.1.0',
    description: 'Browser-accessible MCP server for ServiceNow incident management',
    endpoints: {
      health: '/health',
      sse: '/sse',
      message: '/message',
    },
    tools: tools.map(t => ({
      name: t.name,
      description: t.description,
    })),
    documentation: 'See README.md for usage instructions',
  });
});

// Start the server
const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`🚀 ServiceNow MCP Server (SSE) running on http://localhost:${PORT}`);
    console.log(`📡 SSE endpoint: http://localhost:${PORT}/sse`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
    console.log(`📖 API info: http://localhost:${PORT}/`);
    console.log(`🔗 ServiceNow instance: ${SERVICENOW_INSTANCE_URL}`);
  });
};

startServer().catch((error) => {
  console.error('Fatal error starting server:', error);
  process.exit(1);
});

// Made with Bob
