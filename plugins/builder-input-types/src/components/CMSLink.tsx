import React, { useState, useEffect, useCallback, useMemo } from "react";
import { builder } from "@builder.io/react";
import appState from "@builder.io/app-context";

// Initialize builder
const apiKey = appState.user.organization.value.settings.publicKey || "";
if (apiKey) {
  builder.init(apiKey);
  builder.apiVersion = "v3";
}

export interface CMSLinkValue {
  id?: string;
  name?: string;
  model?: string;
  url?: string;
}

export interface CMSLinkProps {
  value?: CMSLinkValue;
  onChange?: (value: CMSLinkValue | null) => void;
  defaultType?: string;
  models?: string[];
}

interface ContentItem {
  id?: string;
  name?: string;
  data?: any;
}

const CMSLink: React.FC<CMSLinkProps> = ({
  value,
  onChange,
  defaultType = "page",
  models = ["page", "data"]
}) => {
  const [selectedModel, setSelectedModel] = useState<string>(value?.model || defaultType);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CMSLinkValue | null>(value || null);

  // Debounced search function
  const debouncedSearch = useCallback(
    useMemo(() => {
      let timeoutId: NodeJS.Timeout;
      return (query: string, model: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (!query.trim()) {
            setSearchResults([]);
            return;
          }
          
          setIsLoading(true);
          try {
            const results = await builder.getAll(model, {
              fields: "id,name,data",
              options: {
                noTargeting: true,
                includeRefs: false,
              },
              limit: 50,
            });

            // Filter results by query and map to ContentItem
            const filteredResults = results
              .filter((item) => {
                const name = item.name || item.data?.title || item.data?.name || "";
                return name.toLowerCase().includes(query.toLowerCase());
              })
              .map((item) => ({
                id: item.id,
                name: item.name,
                data: item.data
              }));

            setSearchResults(filteredResults);
          } catch (error) {
            console.error("Error searching Builder.io content:", error);
            setSearchResults([]);
          } finally {
            setIsLoading(false);
          }
        }, 300);
      };
    }, []),
    []
  );

  // Effect to trigger search when query or model changes
  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery, selectedModel);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, selectedModel, debouncedSearch]);

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleItemSelect = (item: ContentItem) => {
    const linkValue: CMSLinkValue = {
      id: item.id || "",
      name: item.name || item.data?.title || item.data?.name || "",
      model: selectedModel,
      url: item.data?.url || item.data?.slug || ""
    };
    
    setSelectedItem(linkValue);
    setSearchQuery("");
    setIsDropdownOpen(false);
    
    if (onChange) {
      onChange(linkValue);
    }
  };

  const handleClear = () => {
    setSelectedItem(null);
    setSearchQuery("");
    setIsDropdownOpen(false);
    if (onChange) {
      onChange(null);
    }
  };

  const displayName = selectedItem?.name || "";
  const displayUrl = selectedItem?.url || "";

  return (
    <div style={{ width: "100%", position: "relative" }}>
      {/* Model Selector */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ 
          display: "block", 
          fontSize: "14px", 
          fontWeight: 500, 
          marginBottom: "4px",
          color: "#374151"
        }}>
          Content Type
        </label>
        <select
          value={selectedModel}
          onChange={(e) => handleModelChange(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "14px",
            backgroundColor: "#ffffff",
            outline: "none"
          }}
        >
          {models.map((model) => (
            <option key={model} value={model}>
              {model.charAt(0).toUpperCase() + model.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ 
          display: "block", 
          fontSize: "14px", 
          fontWeight: 500, 
          marginBottom: "4px",
          color: "#374151"
        }}>
          Search Content
        </label>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder={`Search ${selectedModel} content...`}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              outline: "none"
            }}
          />
          
          {/* Search Results Dropdown */}
          {isDropdownOpen && (searchResults.length > 0 || isLoading || searchQuery) && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              backgroundColor: "#ffffff",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              zIndex: 1000,
              maxHeight: "200px",
              overflowY: "auto"
            }}>
              {isLoading ? (
                <div style={{ padding: "12px", textAlign: "center", color: "#6b7280" }}>
                  Loading...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((item) => {
                  const name = item.name || item.data?.title || item.data?.name || "Untitled";
                  const url = item.data?.url || item.data?.slug || "";
                  
                  return (
                    <div
                      key={item.id || Math.random()}
                      onClick={() => handleItemSelect(item)}
                      style={{
                        padding: "12px",
                        borderBottom: "1px solid #e5e7eb",
                        cursor: "pointer",
                        backgroundColor: "#ffffff"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f9fafb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#ffffff";
                      }}
                    >
                      <div style={{ fontWeight: 500, color: "#374151" }}>
                        {name}
                      </div>
                      {url && (
                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                          {url}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : searchQuery ? (
                <div style={{ padding: "12px", textAlign: "center", color: "#6b7280" }}>
                  No results found for "{searchQuery}"
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Selected Item Display */}
      {selectedItem && (
        <div style={{ 
          padding: "12px", 
          backgroundColor: "#f3f4f6", 
          borderRadius: "6px",
          border: "1px solid #d1d5db"
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "flex-start" 
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: "14px", 
                fontWeight: 500, 
                color: "#374151",
                marginBottom: "4px"
              }}>
                Selected: {displayName}
              </div>
              {displayUrl && (
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  URL: {displayUrl}
                </div>
              )}
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                Model: {selectedItem.model} | ID: {selectedItem.id}
              </div>
            </div>
            <button
              onClick={handleClear}
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                backgroundColor: "#ef4444",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default CMSLink;