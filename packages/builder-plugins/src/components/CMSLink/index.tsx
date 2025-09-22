import React, { useState, ChangeEvent, useEffect } from "react";
import { builder } from "@builder.io/react";
import { ContentSelector } from "../ContentSelector";

export interface CMSLinkProps {
  value: {
    get(key: "type" | "href" | "model" | "referenceId"): string | undefined;
    type: "url" | "model";
    href: string;
    model?: string;
    referenceId?: string;
  };
  onChange: (value: {
    type: "url" | "model";
    href: string;
    model?: string;
    referenceId?: string;
  }) => void;
  defaultType?: "url" | "model";
  apiKey: string;
  models: {
    name: string;
    displayName: string;
  }[];
}

export const CMSLink: React.FC<CMSLinkProps> = ({
  value,
  onChange,
  defaultType = "url",
  apiKey,
  models,
}) => {
  const [type, setType] = useState<"url" | "model">(defaultType);
  const [href, setHref] = useState("");
  const [model, setModel] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [isContentSelectorOpen, setIsContentSelectorOpen] = useState(false);
  const [selectedContentName, setSelectedContentName] = useState("");
  const [error, setError] = useState<{
    message: string;
    stack?: string;
  } | null>(null);

  // Function to fetch content name from Builder.io
  const fetchContentName = async (modelName: string, contentId: string) => {
    try {
      // Initialize builder if not already done
      if (!builder.apiKey && apiKey) {
        builder.init(apiKey);
        builder.apiVersion = "v3";
      }

      const content = await builder.get(modelName, {
        query: {
          id: contentId
        },
        fields: "id,name,data.title",
        options: {
          noTargeting: true,
          includeRefs: true,
        },
      });

      if (content) {
        const contentName = content.name || content.data?.title || contentId;
        setSelectedContentName(contentName);
      } else {
        setSelectedContentName("Content not found");
      }
    } catch (error) {
      console.error("Error fetching content name:", error);
      setSelectedContentName("Error loading content");
    }
  };

  // Initialize state from value when component mounts
  useEffect(() => {
    if (value?.get) {
      const savedType = value.get("type") as "url" | "model";
      const savedHref = value.get("href");
      const savedModel = value.get("model");
      const savedRefId = value.get("referenceId");

      setType(savedType || defaultType);
      setHref(savedHref || "");
      setModel(savedModel || "");
      setReferenceId(savedRefId || "");
      setSelectedModel(savedModel || "");

      // If we have a model and referenceId, fetch the content name
      if (savedModel && savedRefId) {
        fetchContentName(savedModel, savedRefId);
      } else {
        setSelectedContentName("");
      }
    }
  }, [value, defaultType, apiKey]);

  // Add debug logging to updateValue
  const updateValue = (newValues: Record<string, string>) => {
    try {
      const updatedValue = {
        type,
        href: href || "",
        model: model || "",
        referenceId: referenceId || "",
        ...newValues,
      };
      onChange(updatedValue);
      setError(null);
    } catch (error) {
      const contextualError =
        error instanceof Error ? error : new Error("An error occurred");
      setError({
        message: contextualError.message,
        stack: contextualError.stack,
      });
    }
  };

  // Add debug logging to handlers
  const handleTypeChange = (newType: "url" | "model") => {
    setType(newType);

    if (newType === "url") {
      // Clear model-related fields when switching to URL type
      setModel("");
      setReferenceId("");
      setSelectedModel("");
      setSelectedContentName("");
      updateValue({
        type: newType,
        model: "",
        referenceId: ""
      });
    } else {
      // Just update the type for model
      updateValue({ type: newType });
    }
  };

  const handleLinkChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newHref = e.target.value;
    setHref(newHref);
    updateValue({ href: newHref });
  };

  const handleContentSelect = (content: any) => {
    setHref(content.href);
    setReferenceId(content.id);
    setModel(content.type);
    setSelectedContentName(content.name);
    setType("model");

    updateValue({
      type: "model",
      href: content.href,
      referenceId: content.id,
      model: content.type,
    });
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <label className="whitespace-nowrap flex items-center min-w-[40px]">
              Type:
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="linkType"
                  value="url"
                  checked={type === "url"}
                  onChange={() => handleTypeChange("url")}
                  className="cursor-pointer"
                />
                URL
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="linkType"
                  value="model"
                  checked={type === "model"}
                  onChange={() => handleTypeChange("model")}
                  className="cursor-pointer"
                />
                Reference
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {type === "url" ? (
              <input
                id="link"
                type="text"
                value={href}
                onChange={handleLinkChange}
                className="flex-1 h-8 px-2 py-1 rounded border border-gray-300 text-sm"
                placeholder="Enter URL..."
              />
            ) : (
              <div className="flex items-center gap-2 w-full">
                <label className="whitespace-nowrap">Href:</label>
                <input
                  type="text"
                  value={selectedContentName || "No model selected..."}
                  readOnly
                  className="flex-1 h-8 px-2 py-1 rounded border border-gray-300 text-sm bg-neutral-100 text-gray-500 cursor-not-allowed"
                  placeholder="No model selected..."
                />
                <button
                  onClick={() => setIsContentSelectorOpen(true)}
                  className="h-8 px-6 py-1 rounded text-sm font-medium whitespace-nowrap transition-colors bg-blue-500 text-neutral-100 hover:bg-blue-600 active:bg-blue-700"
                  aria-label="Select Content"
                >
                  Select
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
          <div>{error.message}</div>
          {error.stack && <div className="mt-2 text-sm">{error.stack}</div>}
        </div>
      )}
      <div className="hidden">
      <h3 className="text-red-500">Component State</h3>
        <pre>
          {JSON.stringify(
            {
              incomingValue: value,
              currentState: {
                type,
                href,
                model,
                referenceId,
              },
              error,
            },
            null,
            2
          )}
        </pre>
      </div>

      {isContentSelectorOpen && (
        <ContentSelector
          models={models}
          apiKey={apiKey}
          onContentSelect={handleContentSelect}
          onClose={() => setIsContentSelectorOpen(false)}
        />
      )}
    </div>
  );
};

export default CMSLink;
