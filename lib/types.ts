"use strict";

/**
 * @interface N8nWorkflow
 * @description Interface for n8n workflow data.
 */
export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  nodes: any[];
  connections: any;
  createdAt: string;
  updatedAt: string;
  settings: any;
  tags: any[];
}

/**
 * @interface N8nWebhookInfo
 * @description Interface for n8n webhook information.
 */
export interface N8nWebhookInfo {
  workflowId: string;
  workflowName: string;
  webhookTestUrl: string;
  webhookProdUrl: string;
  nodeName: string;
  webhookPath: string;
}

/**
 * @interface N8nWorkflowAutocomplete
 * @description Interface for n8n workflow autocomplete data.
 */
export interface N8nWorkflowAutocomplete {
  id: string;
  name: string;
  webhookProdUrl: string;
}
