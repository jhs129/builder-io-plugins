import { Builder } from "@builder.io/react";
import { pluginId } from "./utils";
import ClinicalTrialAdminPlugin from "./components/ClinicalTrialPlugin";

Builder.register("appTab", {
  name: "ClinicalTrials",
  path: "clinical-trials",
  priority: 1000,
  icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB4PSIzIiB5PSI3IiB3aWR0aD0iMTgiIGhlaWdodD0iMTMiIHJ4PSIyIiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8cmVjdCB4PSI4IiB5PSIzIiB3aWR0aD0iOCIgaGVpZ2h0PSI0IiByeD0iMSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPHJlY3QgeD0iMTEiIHk9IjEyIiB3aWR0aD0iMiIgaGVpZ2h0PSI1IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8cmVjdCB4PSI5IiB5PSIxNCIgd2lkdGg9IjYiIGhlaWdodD0iMiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPgo=",
  component: ClinicalTrialAdminPlugin,
});

//  Register the plugin itself with Builder, to define plugin options that the input type will reference
Builder.register("plugin", {
  // id should match the name in package.json, which is why we grab it directly from the package.json
  id: pluginId,
  // will be used to prefix generated types
  name: "ClinicalTrials",
  //  a list of input definition that you might need to communicate with custom backend API
  settings: [
    {
      name: "model",
      type: "string",
      friendlyName: "Name of the Model to import Clinical Trials into",
      defaultValue: "clinical-trial",
    },
    {
      name: "apiKey",
      type: "string",
      friendlyName: "Private API Key",
      defaultValue: "867e6d31eba6448cb9b6f6f115720fcf",
    },
    {
      name: "publishItems",
      type: "boolean",
      friendlyName: "Publish Items",
      helperText: "If true, the items will be published upon upload.  If false, items will be in draft status.",
      defaultValue: true,
    }
  ],
  
  //Modify the save button text
  ctaText: "Save Changes",
  // If we need to make a request to validate anything:
  // async onSave(actions) {
  //   appState.dialogs.alert("Plugin settings saved.");
  // },
});