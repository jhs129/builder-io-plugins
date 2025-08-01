import React from "react";

interface ConfigurationStatusProps {
  status: string;
}

export const ConfigurationStatus: React.FC<ConfigurationStatusProps> = ({ status }) => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Builder.io Admin Tools</h2>
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <h3 className="font-medium mb-2">Configuration Required</h3>
        <p className="mb-2">
          {status || "Please configure the plugin settings to get started."}
        </p>
        <p className="text-sm">
          Go to the plugin settings and add your Builder.io spaces.
        </p>
      </div>
    </div>
  );
};