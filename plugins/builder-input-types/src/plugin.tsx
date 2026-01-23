// Import Tailwind as TEXT, not as a stylesheet
import twCssText from "./tw.css";

/** Inject TW CSS into the same root (Shadow DOM or document) your UI renders in */
(function injectTailwindIntoRoot() {
  const style = document.createElement("style");
  style.textContent = twCssText;

  // Find the host area where the plugin UI appears (Builder options panel or body)
  const host =
    document.querySelector("[data-variation-panel]") ||
    document.querySelector("[data-styles-panel]") || // extra fallback
    document.body;

  // Use the correct root (ShadowRoot vs Document)
  const rootNode = host.getRootNode() as Document | ShadowRoot;
  const target =
    (rootNode as any).host?.shadowRoot || document.head;

  target.appendChild(style);
})();

import 'builder-plugins/dist/index.css';

import appState from "@builder.io/app-context";
import { Builder } from '@builder.io/react';

import pkg from '../package.json';
const pluginId = pkg.name;
import { HelloWorld } from '@builder-plugins';
import CMSLinkInput from './components/CMSLinkInput';


Builder.registerEditor({
  name: 'CMSLink',
  component: CMSLinkInput,
});

Builder.register('plugin', {
  // id should match the name in package.json, which is why we grab it directly from the package.json
  id: pluginId,
  // will be used to prefix generated types
  name: 'CMS Link',
  //  a list of input definition that you might need to communicate with custom backend API
  settings: [
    {
      name: 'CMSLinkSettings',
      type: 'object',
      friendlyName: 'CMS Link Settings',
      subFields: [
        {
          name: 'models',
          type: 'list',
          friendlyName: 'Content Models to Search',
          subFields: [
            {
              name: 'name',
              type: 'string',
              friendlyName: 'Model Name',
            },
            {
              name: 'displayName',
              type: 'string',
              friendlyName: 'Display Name',
            },
          ],
        },
      ],
    },
  ],
  //Modify the save button text
  ctaText: 'Save Changes',
  // If we need to make a request to validate anything:
  // async onSave(actions) {
  //   appState.dialogs.alert("Plugin settings saved.");
  // },
});
