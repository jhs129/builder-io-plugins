import React from "react";
import { HitProps } from "./types";

export const Hit: React.FC<HitProps> = ({ hit, onSelect, isSelected }) => (
  <div
    className={`py-2 px-4 border-b border-gray-200 odd:bg-neutral-100 even:bg-gray-50 hover:bg-blue-50 ${
      isSelected ? "bg-blue-50" : ""
    }`}
  >
    <div className="flex gap-3 items-start">
      <div className="flex gap-3 min-w-0 flex-col flex-1">
        <h3 className="font-medium text-blue-600 truncate text-left">
          {hit.title || hit.name}
        </h3>
        {hit.url && (
          <div className="flex gap-1 text-sm text-gray-500 truncate min-w-0 flex-1">
            <span className="shrink-0">Path:</span>
            <span className="truncate">
              {(() => {
                try {
                  return new URL(hit.url).pathname;
                } catch {
                  return hit.url;
                }
              })()}
            </span>
          </div>
        )}
      </div>
      <button
        onClick={() => onSelect(hit)}
        className={`shrink-0 px-3 py-1 text-sm font-medium rounded-md ml-auto ${
          isSelected
            ? "bg-blue-600 text-neutral-100 hover:bg-blue-700"
            : "bg-blue-600 text-neutral-100 hover:bg-blue-700"
        }`}
        aria-label={isSelected ? "Selected" : "Select"}
      >
        {isSelected ? "Selected" : "Select"}
      </button>
    </div>
  </div>
);