# n8n Integration for Homey

This app integrates n8n with Homey, allowing you to trigger n8n workflows from your Homey flows.

## Features

- Trigger n8n workflows from Homey flows.
- Autocomplete for n8n workflows in the Homey flow editor.
- Support for various webhook authentication methods (Basic, JWT, Header).

## Installation

1. Clone this repository to your local machine.
2. Run `npm install` to install the dependencies.
3. Run `homey app run` to install the app on your Homey.

## Configuration

1. Open the app settings in the Homey app.
2. Enter the base URL for your n8n instance (e.g., `http://localhost:5678`).
3. Enter your n8n API key.
4. Configure the webhook authentication settings if required.

## Usage

**Important:** For an n8n workflow to be triggerable by this Homey app, it must have a Webhook trigger node. The app identifies workflows by looking for these webhook nodes.

1. Create a new flow in the Homey app.
2. Add the "n8n" action card.
3. Select the n8n workflow (which must have a Webhook trigger) you want to trigger from the autocomplete list.
4. Save and run the flow.

## API Reference

### Classes

- `MyApp`: The main application class.
- `N8nApi`: A class for interacting with the n8n API.

### Interfaces

- `N8nWorkflow`: Interface for n8n workflow data.
- `N8nWebhookInfo`: Interface for n8n webhook information.
- `N8nWorkflowAutocomplete`: Interface for n8n workflow autocomplete data.
