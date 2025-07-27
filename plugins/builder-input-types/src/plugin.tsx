import { Builder } from "@builder.io/react";
import pkg from "../package.json";
import appState from "@builder.io/app-context";
import { ApiTags } from "./components/ApiTags";

const pluginId = pkg.name;

/**
 * Interface for actions available in the Builder app context.
 */
interface AppActions {
  /**
   * Triggers the settings dialog for the plugin.
   * @param pluginId - The ID of the plugin to open settings for.
   */
  triggerSettingsDialog(pluginId: string): Promise<void>;
}

let types = [];
const pluginSettings =
  appState.user.organization.value.settings.plugins?.get(pluginId);

try {
  types =
    appState.user?.organization?.value?.settings?.plugins
      ?.get(pluginId)
      ?.get("types")
      ?.get("inputTypes") || [];
  console.log("Input Types Count: ", types.length);
} catch (e) {
  console.log("Unable to load appState settings", e);
}

//  Register the plugin itself with Builder, to define plugin options that the input type will reference
Builder.register("plugin", {
  // id should match the name in package.json, which is why we grab it directly from the package.json
  id: pluginId,
  // will be used to prefix generated types
  name: "ApiTags",
  //  a list of input definition that you might need to communicate with custom backend API
  settings: [
    {
      name: "types",
      type: "object",
      friendlyName: "Input Types",
      subFields: [
        {
          name: "inputTypes",
          type: "list",
          friendlyName: "Input Type",
          subFields: [
            {
              name: "name",
              type: "string",
              friendlyName: "Type Name",
            },
            {
              name: "icon",
              type: "string",
              friendlyName: "Icon",
            },
            {
              name: "endPoint",
              type: "string",
              friendlyName: "End Point Url",
            },
            {
              name: "headers",
              type: "list",
              friendlyName: "Api Headers",
              subFields: [
                {
                  name: "name",
                  type: "string",
                  friendlyName: "Header Name",
                },
                {
                  name: "value",
                  type: "string",
                  friendlyName: "Header Value",
                },
              ],
            },
            {
              name: "labelField",
              type: "string",
              friendlyName: "Label Field",
            },
            {
              name: "valueField",
              type: "string",
              friendlyName: "Value Field",
            },
            {
              name: "dataPath",
              type: "string",
              friendlyName: "Data Path",
              helperText:
                "Dot-separated path to the array in the response (e.g. 'results' or 'data.items')",
            },
          ],
        },
      ],
    },
  ],
  //Modify the save button text
  ctaText: "Save Changes",
  // If we need to make a request to validate anything:
  // async onSave(actions) {
  //   appState.dialogs.alert("Plugin settings saved.");
  // },
});

Builder.register(
  "app.onLoad",
  async ({ triggerSettingsDialog }: AppActions) => {
    const pluginSettings =
      appState.user.organization.value.settings.plugins.get(pluginId);
    const hasConnected = types.length > 0;
    if (!hasConnected) {
      await triggerSettingsDialog(pluginId);
    } else {
      const types = pluginSettings?.get("types")?.get("inputTypes") || [];
      types.forEach((type: any) => {
        const headersData = type.get("headers") || [];
        
        // Convert headers from Builder.io format to plain objects
        const headers = headersData.map((header: any) => ({
          name: header.get("name"),
          value: header.get("value"),
        }));

        // Log headers configuration for debugging (TODO: comment out later)
        if (headers.length > 0) {
          console.log(`ApiTags Plugin: Registering headers for ${type.get("name")}:`, headers);
        }

        Builder.registerEditor({
          name: type.get("name"),
          component: ApiTags,
          icon: type.get("icon") || "",
          endPoint: type.get("endPoint"),
          headers: headers,
          dataPath: type.get("dataPath"),
          labelField: type.get("labelField"),
          valueField: type.get("valueField"),
        });
      });
    }
  }
);
