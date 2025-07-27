import React from "react";
import { FacetPanelProps } from "./types";

export const FacetPanel: React.FC<FacetPanelProps> = ({
  header,
  children,
}) => (
  <div className="mb-4 text-left">
    <h3 className="text-base font-medium text-gray-900 mb-2 text-left">
      {header}
    </h3>
    {children}
  </div>
);