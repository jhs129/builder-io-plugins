import React, { useState, useEffect, ChangeEvent } from "react";
import { ApiTagsProps } from "../types/ApiTagsTypes";

const extractDataByPath = (obj: any, path: string): any[] => {
  if (!path) return Array.isArray(obj) ? obj : [obj];
  const cleanPath = path.replace(/\[(\d+)\]/g, "$1");
  const parts = cleanPath.split(".");
  let current = obj;
  for (const part of parts) {
    if (!current) return [];
    current = current[part];
  }
  return Array.isArray(current) ? current : current ? [current] : [];
};

// SVG icons for folders
const FolderClosedIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    style={{ display: "inline", verticalAlign: "middle" }}
  >
    <path
      d="M2.5 5.5A1.5 1.5 0 014 4h3.17a1.5 1.5 0 011.06.44l1.83 1.82H16a1.5 1.5 0 011.5 1.5v6.25A1.75 1.75 0 0115.75 15H4.25A1.75 1.75 0 012.5 13.25V5.5z"
      fill="#64748b"
    />
  </svg>
);

const FolderOpenIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    style={{ display: "inline", verticalAlign: "middle" }}
  >
    <path
      d="M2.5 5.5A1.5 1.5 0 014 4h3.17a1.5 1.5 0 011.06.44l1.83 1.82H16a1.5 1.5 0 011.5 1.5v1.25H4.25A1.75 1.75 0 002.5 9.75V5.5z"
      fill="#64748b"
    />
    <path
      d="M4.25 9.75h13.5c.97 0 1.7.92 1.47 1.86l-1.13 4.25A1.75 1.75 0 0116.4 17H4.25A1.75 1.75 0 012.5 15.25v-5.5c0-.41.34-.75.75-.75z"
      fill="#a3bffa"
    />
  </svg>
);

const FileIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    style={{ display: "inline", verticalAlign: "middle" }}
  >
    <rect x="4" y="3" width="12" height="14" rx="2" fill="#cbd5e1" />
    <rect x="6" y="6" width="8" height="1.5" rx="0.75" fill="#64748b" />
    <rect x="6" y="9" width="8" height="1.5" rx="0.75" fill="#64748b" />
    <rect x="6" y="12" width="5" height="1.5" rx="0.75" fill="#64748b" />
  </svg>
);

// Organize options by first letter
const organizeByFirstLetter = (
  options: Array<{ label: string; value: any }>
) => {
  const organized = new Map<string, Array<{ label: string; value: any }>>();

  options.forEach((option) => {
    const firstLetter = option.label.charAt(0).toUpperCase();
    if (!organized.has(firstLetter)) {
      organized.set(firstLetter, []);
    }
    organized.get(firstLetter)!.push(option);
  });

  // Convert to array and sort
  return Array.from(organized.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, items]) => ({
      name: letter,
      items: items.sort((a, b) => a.label.localeCompare(b.label)),
    }));
};

// OptionsTree component
const OptionsTree: React.FC<{
  organizedOptions: Array<{
    name: string;
    items: Array<{ label: string; value: any }>;
  }>;
  onSelect: (option: { label: string; value: any }) => void;
  selectedValues: any[];
  searchQuery: string;
}> = ({ organizedOptions, onSelect, selectedValues, searchQuery }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (letter: string) => {
    setExpanded((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(letter)) {
        newSet.delete(letter);
      } else {
        newSet.add(letter);
      }
      return newSet;
    });
  };

  const isSelected = (value: any) => selectedValues.includes(value);

  const matchesSearch = (label: string) =>
    label.toLowerCase().includes(searchQuery.toLowerCase());

  return (
    <ul className="list-none p-0 m-0">
      {organizedOptions.map(({ name: letter, items }) => {
        const filteredItems = items.filter((item) => matchesSearch(item.label));
        if (filteredItems.length === 0) return null;

        const isOpen = expanded.has(letter);
        return (
          <li key={letter} className="mb-1">
            <div
              className="flex items-center cursor-pointer p-1 hover:bg-gray-50 rounded transition-colors"
              onClick={() => toggle(letter)}
            >
              <span className="mr-2">
                {isOpen ? FolderOpenIcon : FolderClosedIcon}
              </span>
              <span className="font-semibold text-gray-700">{letter}</span>
              <span className="ml-2 text-sm text-gray-500">
                ({filteredItems.length})
              </span>
            </div>
            {isOpen && (
              <ul className="list-none pl-6 mt-1">
                {filteredItems.map((item) => (
                  <li key={item.value}>
                    <div
                      className={`flex items-center p-1 cursor-pointer rounded transition-colors ${
                        isSelected(item.value)
                          ? "bg-blue-50 text-blue-600"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                      onClick={() => onSelect(item)}
                    >
                      <span className="mr-2">{FileIcon}</span>
                      <span className="truncate">{item.label}</span>
                      {isSelected(item.value) && (
                        <span className="ml-2 text-xs text-blue-600">
                          Selected
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
};

// Simple list component for when we have 10 or fewer options
const SimpleList: React.FC<{
  options: Array<{ label: string; value: any }>;
  onSelect: (option: { label: string; value: any }) => void;
  selectedValues: any[];
  searchQuery: string;
}> = ({ options, onSelect, selectedValues, searchQuery }) => {
  const isSelected = (value: any) => selectedValues.includes(value);
  const matchesSearch = (label: string) =>
    label.toLowerCase().includes(searchQuery.toLowerCase());

  const filteredOptions = options.filter((item) => matchesSearch(item.label));

  return (
    <ul className="list-none p-0 m-0">
      {filteredOptions.map((item) => (
        <li key={item.value}>
          <div
            className={`flex items-center p-2 cursor-pointer rounded transition-colors ${
              isSelected(item.value)
                ? "bg-blue-50 text-blue-600"
                : "hover:bg-gray-50 text-gray-700"
            }`}
            onClick={() => onSelect(item)}
          >
            <span className="mr-2">{FileIcon}</span>
            <span className="truncate">{item.label}</span>
            {isSelected(item.value) && (
              <span className="ml-2 text-xs text-blue-600">Selected</span>
            )}
          </div>
        </li>
      ))}
      {filteredOptions.length === 0 && (
        <li className="p-2 text-gray-500 text-sm italic">
          No matching options found
        </li>
      )}
    </ul>
  );
};

export const ApiTags: React.FC<ApiTagsProps> = ({
  customEditor,
  value,
  onChange,
}) => {
  const { endPoint, dataPath, labelField, valueField, headers } = customEditor;
  // Store just the values in state
  const [selectedValues, setSelectedValues] = useState<any[]>([]);
  const [options, setOptions] = useState<Array<{ label: string; value: any }>>(
    []
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize state from value
  useEffect(() => {
    if (value) {
      // Handle both array and Builder.io value object cases
      const valueArray = Array.isArray(value)
        ? value
        : (value as { get?: () => any[] }).get?.() || [];
      setSelectedValues(valueArray);
    }
  }, [value]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build headers object from the headers array
        const requestHeaders: Record<string, string> = {};
        if (headers && headers.length > 0) {
          headers.forEach((header) => {
            if (header.name && header.value) {
              requestHeaders[header.name] = header.value;
            }
          });
          // Log headers for verification (TODO: comment out later)
          console.log("ApiTags: Adding headers to request:", requestHeaders);
        }

        const response = await fetch(endPoint, {
          headers: requestHeaders,
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        const extractedData = extractDataByPath(result, dataPath);

        const formattedOptions = extractedData.map((item) => ({
          label: item[labelField],
          value: item[valueField],
        }));

        setOptions(formattedOptions);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (endPoint) {
      fetchData();
    }
  }, [endPoint, dataPath, labelField, valueField, headers]);

  const updateValue = (newValues: any[]) => {
    setSelectedValues(newValues);
    if (onChange) {
      onChange(newValues);
    }
  };

  const handleSelect = (option: { label: string; value: any }) => {
    if (!selectedValues.includes(option.value)) {
      const newValues = [...selectedValues, option.value].sort((a, b) => {
        // Sort based on labels
        const labelA = options.find((opt) => opt.value === a)?.label || "";
        const labelB = options.find((opt) => opt.value === b)?.label || "";
        return labelA.localeCompare(labelB);
      });
      updateValue(newValues);
    }
  };

  const handleRemoveTag = (valueToRemove: any) => {
    const newValues = selectedValues
      .filter((value) => value !== valueToRemove)
      .sort((a, b) => {
        // Sort based on labels
        const labelA = options.find((opt) => opt.value === a)?.label || "";
        const labelB = options.find((opt) => opt.value === b)?.label || "";
        return labelA.localeCompare(labelB);
      });
    updateValue(newValues);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const organizedOptions =
    options.length > 10 ? organizeByFirstLetter(options) : null;

  // Get selected tags with labels for display
  const selectedTagsWithLabels = selectedValues.map((value) => ({
    value,
    label: options.find((opt) => opt.value === value)?.label || String(value),
  }));

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-4" style={{ minHeight: 200 }}>
            {/* Options list/tree on the left */}
            <div className="flex flex-col min-w-[260px]">
              <span className="font-medium mb-1">Available Options</span>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div
                  className="border border-gray-300 rounded-md bg-white shadow-sm p-2"
                  style={{
                    height: "320px",
                    overflowY: "auto",
                    position: "relative",
                    WebkitOverflowScrolling: "touch",
                    scrollbarWidth: "thin",
                    scrollbarColor: "#9CA3AF #F3F4F6",
                  }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    </div>
                  ) : error ? (
                    <div className="text-red-600 bg-red-50 p-3 rounded-md">
                      Error: {error}
                    </div>
                  ) : organizedOptions ? (
                    <OptionsTree
                      organizedOptions={organizedOptions}
                      onSelect={handleSelect}
                      selectedValues={selectedValues}
                      searchQuery={searchQuery}
                    />
                  ) : (
                    <SimpleList
                      options={options}
                      onSelect={handleSelect}
                      selectedValues={selectedValues}
                      searchQuery={searchQuery}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Selected tags on the right */}
            <div className="flex flex-col flex-1 min-w-[120px]">
              <span className="font-medium mb-1">Selected Tags</span>
              {selectedTagsWithLabels.length === 0 ? (
                <div className="text-gray-500 italic py-2 text-sm">
                  No tags selected
                </div>
              ) : (
                <ul className="space-y-2">
                  {selectedTagsWithLabels.map((tag) => (
                    <li
                      key={tag.value}
                      className="flex items-center justify-between bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-sm"
                    >
                      <span className="truncate">{tag.label}</span>
                      <button
                        onClick={() => handleRemoveTag(tag.value)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                        aria-label={`Remove ${tag.label}`}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <label className="text-gray-500 text-sm font-medium">
            Select an option from the tree on the left
          </label>
        </div>
      </div>

      <div id="debug" className="hidden">
        <div>Input Type: {customEditor.name}</div>
        <div>Endpoint: {endPoint}</div>
        <div>Data Path: {dataPath}</div>
        <div>Label Field: {labelField}</div>
        <div>Value Field: {valueField}</div>
        <div>Headers: {headers ? JSON.stringify(headers) : 'None'}</div>
      </div>
    </div>
  );
};

export default ApiTags;
