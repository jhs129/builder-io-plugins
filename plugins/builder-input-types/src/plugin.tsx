import { Builder } from "@builder.io/react";
import pkg from "../package.json";
const pluginId = pkg.name;
import CMSLink from "./components/CMSLink";
import "./styles.css";
import "../../../packages/builder-plugins/src/styles.css";



Builder.registerEditor({
  name: "CMSLink",
  component: CMSLink,
});

Builder.register("plugin", {
  // id should match the name in package.json, which is why we grab it directly from the package.json
  id: pluginId,
  // will be used to prefix generated types
  name: "CMS Link",
  //  a list of input definition that you might need to communicate with custom backend API
  settings: [
    {
      name: "CMSLinkSettings",
      type: "object",
      friendlyName: "CMS Link Settings",
      subFields: [
        {
          name: "models",
          type: "list",
          friendlyName: "Content Models to Search",
          subFields: [
            {
              name: "name",
              type: "string",
              friendlyName: "Model Name",
            },
            {
              name: "displayName",
              type: "string",
              friendlyName: "Display Name",
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


