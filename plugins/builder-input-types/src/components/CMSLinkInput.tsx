import React from "react";
import { CMSLink } from "builder-plugins";
import appState from "@builder.io/app-context";
import HelloWorld from "builder-plugins";

export interface CMSLinkInputProps {
  value?: {
    get(key: "type" | "href" | "model" | "referenceId"): string | undefined;
    type: "url" | "model";
    href: string;
    model?: string;
    referenceId?: string;
  };
  onChange?: (value: {
    type: "url" | "model";
    href: string;
    model?: string;
    referenceId?: string;
  }) => void;
  defaultType?: "url" | "model";
}

const CMSLinkInput: React.FC<CMSLinkInputProps> = ({ value, onChange, defaultType = "url" }) => {
  // Get plugin settings from appState
  const pluginSettings = (appState as any)?.user?.organization?.value?.settings?.plugins?.get?.("@jhsdc/builder-input-types");

  // Get API key from plugin settings or use default
  const apiKey = pluginSettings?.get?.("CMSLinkSettings")?.get?.("apiKey") || appState.user.currentOrganization || "";

  // Get models from plugin settings or use default
  const models = pluginSettings?.get?.("CMSLinkSettings")?.toJSON?.()?.models?.map?.((model: any) => ({
    name: model.name,
    displayName: model.displayName || model.name,
  })) || [
    { name: "page", displayName: "Page" },
    { name: "data", displayName: "Data" }
  ];

  // Create a default value if none provided
  const defaultValue = {
    get: (key: "type" | "href" | "model" | "referenceId") => {
      switch (key) {
        case "type": return defaultType;
        case "href": return "";
        case "model": return "";
        case "referenceId": return "";
        default: return "";
      }
    },
    type: defaultType,
    href: "",
    model: "",
    referenceId: ""
  };

  // Use provided value or default
  const currentValue = value || defaultValue;

  // Create onChange handler that calls the parent's onChange if provided
  const handleChange = (newValue: {
    type: "url" | "model";
    href: string;
    model?: string;
    referenceId?: string;
  }) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div>
      <p className="text-red-500">CMS Link Input</p>
    <CMSLink
      value={currentValue}
      onChange={handleChange}
      defaultType={defaultType}
        apiKey={apiKey}
        models={models}
      />
    </div>
  );
};

export default CMSLinkInput;