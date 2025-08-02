import { Builder } from "@builder.io/react";
import { pluginId } from "./utils";
import AdminToolsPlugin from "./components/AdminTools";
import "./index.css";

Builder.register("appTab", {
  name: "Admin Tools",
  path: "admin-tools",
  priority: 1000,
  icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB4PSIzIiB5PSI3IiB3aWR0aD0iMTgiIGhlaWdodD0iMTMiIHJ4PSIyIiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8cmVjdCB4PSI4IiB5PSIzIiB3aWR0aD0iOCIgaGVpZ2h0PSI0IiByeD0iMSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPHJlY3QgeD0iMTEiIHk9IjEyIiB3aWR0aD0iMiIgaGVpZ2h0PSI1IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8cmVjdCB4PSI5IiB5PSIxNCIgd2lkdGg9IjYiIGhlaWdodD0iMiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPgo=",
  component: AdminToolsPlugin,
});

//  Register the plugin itself with Builder, to define plugin options that the input type will reference
Builder.register("plugin", {
  // id should match the name in package.json, which is why we grab it directly from the package.json
  id: pluginId,
  // will be used to prefix generated types
  name: "Admin Tools",
  //  a list of input definition that you might need to communicate with custom backend API
  settings: [
    {
      name: "spaces",
      type: "object",
      friendlyName: "Builder.io Spaces Configuration",
      subFields: [
        {
          name: "space",
          type: "list",
          friendlyName: "Spaces",
          subFields: [
            {
              name: "name",
              type: "string",
              friendlyName: "Space Name",
            },
            {
              name: "publicKey",
              type: "string",
              friendlyName: "Public API Key",
            },
            {
              name: "privateKey",
              type: "string",
              friendlyName: "Private API Key",
            },
          ],
        },
      ],
    },
  ],
  
  //Modify the save button text
  ctaText: "Save Configuration",
});