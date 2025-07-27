import { ClinicalTrialImporter } from "builder-plugins";
import appState from "@builder.io/app-context";
import { pluginId } from "../../utils";

const pluginSettings =
appState.user.organization.value.settings.plugins?.get(pluginId);
const apiKey = pluginSettings?.get("apiKey") || "867e6d31eba6448cb9b6f6f115720fcf";
const model = pluginSettings?.get("model") || "clinical-trial";

const ClinicalTrialAdminPlugin = () => {
  return (
    <ClinicalTrialImporter
      apiKey={apiKey}
      model={model}
    />
  );
};

export default ClinicalTrialAdminPlugin;