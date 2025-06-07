// This function will be called by homey.js when the Homey API is ready
function onHomeyReady(Homey) {
  // console.log("Settings page: onHomeyReady called.");

  // --- Internationalization ---
  initI18n(Homey);

  // --- Load initial values ---
  loadApiKey(Homey);
  loadN8nBaseUrl(Homey);
  loadWebhookAuthSettings(Homey); // New function to load all webhook auth settings

  // --- Register listeners for the save buttons ---
  const saveApiKeyButton = document.getElementById("saveApiKeyButton");
  if (saveApiKeyButton) {
    saveApiKeyButton.addEventListener("click", () => saveApiKey(Homey));
  } else {
    console.error("Save API Key button not found.");
  }

  const saveN8nBaseUrlButton = document.getElementById("saveN8nBaseUrlButton");
  if (saveN8nBaseUrlButton) {
    saveN8nBaseUrlButton.addEventListener("click", () => saveN8nBaseUrl(Homey));
  } else {
    console.error("Save N8N Base URL button not found.");
  }

  const saveWebhookAuthButton = document.getElementById(
    "saveWebhookAuthButton"
  );
  if (saveWebhookAuthButton) {
    saveWebhookAuthButton.addEventListener("click", () =>
      saveWebhookAuthSettings(Homey)
    );
  } else {
    console.error("Save Webhook Auth button not found.");
  }

  // --- Event listener for auth type change ---
  const webhookAuthTypeSelect = document.getElementById("webhook_auth_type");
  if (webhookAuthTypeSelect) {
    webhookAuthTypeSelect.addEventListener(
      "change",
      updateWebhookAuthDetailsVisibility
    );
  } else {
    console.error("Webhook Auth Type select element not found.");
  }

  // Signal that the settings page is ready and has initialized its UI
  Homey.ready();
  // console.log("Settings page: Homey.ready() called.");
}

// --- API Key Functions ---
function loadApiKey(Homey) {
  Homey.get("N8N_API_KEY", (err, apiKey) => {
    if (err) {
      console.error("Error loading N8N_API_KEY:", err);
      return Homey.error(err);
    }
    const apiKeyInput = document.getElementById("api_key");
    if (apiKeyInput) apiKeyInput.value = apiKey || "";
    // else console.error("API Key input field (id='api_key') not found.");
  });
}

function saveApiKey(Homey) {
  const apiKeyInput = document.getElementById("api_key");
  if (apiKeyInput) {
    Homey.set("N8N_API_KEY", apiKeyInput.value, (err) => {
      if (err) return Homey.error(err);
      Homey.toast("API Key saved", "success");
    });
  } // else console.error("API Key input field (id='api_key') not found for saving.");
}

// --- N8N Base URL Functions ---
function loadN8nBaseUrl(Homey) {
  Homey.get("n8nBaseUrl", (err, baseUrl) => {
    if (err) return Homey.error(err);
    const n8nBaseUrlInput = document.getElementById("n8n_base_url");
    if (n8nBaseUrlInput) n8nBaseUrlInput.value = baseUrl || "";
    // else console.error("N8N Base URL input field (id='n8n_base_url') not found.");
  });
}

function saveN8nBaseUrl(Homey) {
  const n8nBaseUrlInput = document.getElementById("n8n_base_url");
  if (n8nBaseUrlInput) {
    const baseUrl = n8nBaseUrlInput.value;
    if (
      baseUrl &&
      !baseUrl.startsWith("http://") &&
      !baseUrl.startsWith("https://")
    ) {
      Homey.alert(
        "Please enter a valid URL (starting with http:// or https://)"
      );
      return;
    }
    Homey.set("n8nBaseUrl", baseUrl, (err) => {
      if (err) return Homey.error(err);
      Homey.toast("N8N Base URL saved", "success");
    });
  } // else console.error("N8N Base URL input field (id='n8n_base_url') not found for saving.");
}

// --- Webhook Authentication Functions ---
function updateWebhookAuthDetailsVisibility() {
  const authType = document.getElementById("webhook_auth_type").value;
  document.getElementById("auth_details_basic").style.display =
    authType === "basic" ? "block" : "none";
  document.getElementById("auth_details_jwt").style.display =
    authType === "jwt" ? "block" : "none";
  document.getElementById("auth_details_header").style.display =
    authType === "header" ? "block" : "none";
}

function loadWebhookAuthSettings(Homey) {
  const settingsToLoad = [
    { key: "webhookAuthType", id: "webhook_auth_type", default: "none" },
    { key: "webhookAuthBasicUser", id: "webhook_auth_basic_user", default: "" },
    { key: "webhookAuthBasicPass", id: "webhook_auth_basic_pass", default: "" },
    { key: "webhookAuthJwtToken", id: "webhook_auth_jwt_token", default: "" },
    {
      key: "webhookAuthHeaderName",
      id: "webhook_auth_header_name",
      default: "",
    },
    {
      key: "webhookAuthHeaderValue",
      id: "webhook_auth_header_value",
      default: "",
    },
  ];

  settingsToLoad.forEach((setting) => {
    Homey.get(setting.key, (err, value) => {
      if (err) {
        console.error(`Error loading ${setting.key}:`, err);
        // Don't show Homey.error for each, could be overwhelming. Log it.
      }
      const inputElement = document.getElementById(setting.id);
      if (inputElement) {
        inputElement.value =
          value !== null && value !== undefined ? value : setting.default;
        // console.log(`${setting.key} loaded with value: ${inputElement.value}`);
        if (setting.key === "webhookAuthType") {
          updateWebhookAuthDetailsVisibility(); // Update visibility after loading auth type
        }
      } else {
        console.error(
          `Input element with id='${setting.id}' not found for ${setting.key}.`
        );
      }
    });
  });
}

function saveWebhookAuthSettings(Homey) {
  const authType = document.getElementById("webhook_auth_type").value;
  Homey.set("webhookAuthType", authType);

  if (authType === "basic") {
    Homey.set(
      "webhookAuthBasicUser",
      document.getElementById("webhook_auth_basic_user").value
    );
    Homey.set(
      "webhookAuthBasicPass",
      document.getElementById("webhook_auth_basic_pass").value
    );
  } else if (authType === "jwt") {
    Homey.set(
      "webhookAuthJwtToken",
      document.getElementById("webhook_auth_jwt_token").value
    );
  } else if (authType === "header") {
    Homey.set(
      "webhookAuthHeaderName",
      document.getElementById("webhook_auth_header_name").value
    );
    Homey.set(
      "webhookAuthHeaderValue",
      document.getElementById("webhook_auth_header_value").value
    );
  }
  // Clear other auth fields if needed, or just save what's relevant
  // For simplicity, we're only saving the relevant fields for the selected type.
  // Old values for other types will remain in storage unless explicitly cleared.

  Homey.toast("Webhook authentication settings saved", "success");
  // console.log("Webhook authentication settings saved for type:", authType);
}

// --- Internationalization Functions ---
async function initI18n(Homey) {
  const language = Homey.env.language || "en";
  const translations = await fetch(`../locales/${language}.json`).then((res) =>
    res.json()
  );

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    const translation = getTranslation(translations, key);
    if (translation) {
      element.innerHTML = translation;
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.getAttribute("data-i18n-placeholder");
    const translation = getTranslation(translations, key);
    if (translation) {
      element.placeholder = translation;
    }
  });
}

function getTranslation(translations, key) {
  return key.split(".").reduce((obj, i) => (obj ? obj[i] : null), translations);
}

// console.log("settings.js: Script loaded. Global onHomeyReady function defined.");
