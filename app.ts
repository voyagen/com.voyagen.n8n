"use strict";

import Homey from "homey";
import { N8nApi } from "./lib/n8n";
import { N8nWebhookInfo, N8nWorkflowAutocomplete } from "./lib/types";

/**
 * @class MyApp
 * @description The main application class.
 * @extends Homey.App
 */
module.exports = class MyApp extends Homey.App {
  private n8nApi!: N8nApi;

  /**
   * @method onInit
   * @description The onInit method is called when the app is initialized.
   */
  async onInit() {
    this.n8nApi = new N8nApi(this);

    this.homey.flow
      .getActionCard("n8n")
      .registerRunListener(
        async ({ flow }: { flow: N8nWorkflowAutocomplete }) => {
          if (!flow || !flow.webhookProdUrl) {
            throw new Error("Webhook URL not provided or invalid.");
          }
          return this.n8nApi.triggerN8nFlow(flow.webhookProdUrl);
        }
      )
      .registerArgumentAutocompleteListener(
        "flow",
        async (query: string): Promise<N8nWorkflowAutocomplete[]> => {
          const flows = await this.n8nApi.getN8nWorkflowsWithWebhooks();
          return flows
            .filter((flow: N8nWebhookInfo) => {
              return flow.workflowName
                .toLowerCase()
                .includes(query.toLowerCase());
            })
            .map((flow: N8nWebhookInfo): N8nWorkflowAutocomplete => {
              return {
                id: flow.workflowId,
                name: flow.workflowName,
                webhookProdUrl: flow.webhookProdUrl,
              };
            });
        }
      );
  }
};
