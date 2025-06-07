"use strict";

import { N8nWorkflow, N8nWebhookInfo, N8nWorkflowAutocomplete } from "./types";

/**
 * Class for interacting with the n8n API.
 */
export class N8nApi {
  private homey: any;

  /**
   * Creates an instance of N8nApi.
   * @param {any} homey - The Homey instance.
   */
  constructor(homey: any) {
    this.homey = homey;
  }

  /**
   * Retrieves the base URL for the n8n instance.
   * @returns {string} The base URL for n8n.
   * @private
   */
  _getN8nBaseUrl(): string {
    const customUrl = this.homey.settings.get("n8nBaseUrl");
    return customUrl || "http://localhost:5678"; // Default if not set
  }

  /**
   * Retrieves the API key for the n8n instance.
   * @returns {string | undefined} The API key for n8n, or undefined if not set.
   * @private
   */
  _getN8nApiKey(): string | undefined {
    return this.homey.settings.get("N8N_API_KEY"); // Ensure consistent key
  }

  /**
   * Fetches a specific n8n workflow by its ID.
   * @param {string} workflowId - The ID of the workflow to fetch.
   * @returns {Promise<N8nWorkflow | null>} A promise that resolves to the workflow object or null if an error occurs.
   */
  async getN8nWorkflow(workflowId: string): Promise<N8nWorkflow | null> {
    const baseUrl = this._getN8nBaseUrl();
    const apiKey = this._getN8nApiKey();
    const n8nUrl = `${baseUrl}/api/v1/workflows/${workflowId}`;

    const headers: { [key: string]: string } = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["X-N8N-API-KEY"] = apiKey;
    }

    try {
      const response = await fetch(n8nUrl, {
        method: "GET",
        headers: headers,
      });
      if (!response.ok) {
        const errorBody = await response.text();
        this.homey.error(
          `HTTP error fetching workflow ${workflowId}! Status: ${response.status}, Body: ${errorBody}`
        );
        return null;
      }
      const data = (await response.json()) as N8nWorkflow;
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.homey.error(
          `Error retrieving workflow ${workflowId}:`,
          error.message
        );
      } else {
        this.homey.error(
          `Error retrieving workflow ${workflowId}: An unknown error occurred`
        );
      }
      return null;
    }
  }

  /**
   * Fetches all active n8n workflows.
   * @returns {Promise<N8nWorkflow[]>} A promise that resolves to an array of workflow objects.
   */
  async getN8nWorkflows(): Promise<N8nWorkflow[]> {
    const baseUrl = this._getN8nBaseUrl();
    const apiKey = this._getN8nApiKey();
    const n8nUrl = `${baseUrl}/api/v1/workflows?active=true`;

    const headers: { [key: string]: string } = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["X-N8N-API-KEY"] = apiKey;
    }

    try {
      const response = await fetch(n8nUrl, {
        method: "GET",
        headers: headers,
      });
      if (!response.ok) {
        const errorBody = await response.text();
        this.homey.error(
          `HTTP error! Status: ${response.status}, Body: ${errorBody}`
        );
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = (await response.json()) as { data: N8nWorkflow[] };
      return data.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.homey.error("Error retrieving workflows:", error.message);
      } else {
        this.homey.error(
          "Error retrieving workflows: An unknown error occurred"
        );
      }
      return [];
    }
  }

  /**
   * Fetches all active n8n workflows and extracts webhook information from them.
   * @returns {Promise<N8nWebhookInfo[]>} A promise that resolves to an array of webhook information objects.
   */
  async getN8nWorkflowsWithWebhooks(): Promise<N8nWebhookInfo[]> {
    const workflows = await this.getN8nWorkflows();
    const webhooks: N8nWebhookInfo[] = [];
    const baseUrl = this._getN8nBaseUrl();

    workflows.forEach((workflow) => {
      if (!workflow.active) return;

      workflow.nodes.forEach((node: any) => {
        if (node.type === "n8n-nodes-base.webhook" && node.parameters) {
          const webhookPath = node.parameters.path || "default-webhook";
          webhooks.push({
            workflowId: workflow.id,
            workflowName: workflow.name,
            webhookTestUrl: `${baseUrl}/webhook-test/${webhookPath}`,
            webhookProdUrl: `${baseUrl}/webhook/${webhookPath}`,
            nodeName: node.name || "Unnamed Webhook Node",
            webhookPath: webhookPath,
          });
        }
      });
    });

    return webhooks;
  }

  /**
   * Triggers an n8n workflow via its webhook URL.
   * @param {string} webhookUrl - The URL of the webhook to trigger.
   * @returns {Promise<boolean>} A promise that resolves to true if the webhook was triggered successfully, false otherwise.
   * @throws {Error} If an error occurs while triggering the webhook.
   */
  async triggerN8nFlow(webhookUrl: string): Promise<boolean> {
    const webhookAuthType =
      this.homey.settings.get("webhookAuthType") || "none";
    const requestHeaders: { [key: string]: string } = {};

    if (webhookAuthType === "basic") {
      const user = this.homey.settings.get("webhookAuthBasicUser") || "";
      const pass = this.homey.settings.get("webhookAuthBasicPass") || "";
      if (user || pass) {
        requestHeaders["Authorization"] = `Basic ${Buffer.from(
          `${user}:${pass}`
        ).toString("base64")}`;
      }
    } else if (webhookAuthType === "jwt") {
      const token = this.homey.settings.get("webhookAuthJwtToken");
      if (token) {
        requestHeaders["Authorization"] = `Bearer ${token}`;
      }
    } else if (webhookAuthType === "header") {
      const headerName = this.homey.settings.get("webhookAuthHeaderName");
      const headerValue = this.homey.settings.get("webhookAuthHeaderValue");
      if (headerName && headerValue) {
        requestHeaders[headerName] = headerValue;
      }
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "GET",
        headers: requestHeaders,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.homey.error(
          `Error triggering webhook. Status: ${response.status}, Body: ${errorBody}`
        );
        throw new Error(
          `Error triggering n8n webhook. Status: ${response.status}`
        );
      }

      return true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.homey.error("Error triggering webhook:", error.message);
        if (error.message.startsWith("Error triggering n8n webhook.")) {
          throw error;
        }
        throw new Error(`Error triggering n8n webhook: ${error.message}`);
      }
      this.homey.error("Error triggering webhook: An unknown error occurred");
      throw new Error("An unknown error occurred while triggering n8n webhook");
    }
  }
}
