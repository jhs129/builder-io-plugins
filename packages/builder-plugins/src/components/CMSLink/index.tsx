import React, { useState, ChangeEvent, useEffect } from "react";
import { SearchModelSelector } from "../SearchModelSelector";
import type { RegionalCareSiteId } from "../SearchModelSelector/types";

export interface CMSLinkProps {
  value: {
    get(key: "type" | "href" | "model" | "referenceId"): string | undefined;
    type: "url" | "model" | "reference";
    href: string;
    model?: string;
    referenceId?: string;
  };
  onChange: (value: {
    type: "url" | "model" | "reference";
    href: string;
    model?: string;
    referenceId?: string;
  }) => void;
  defaultType?: "url" | "model";
  apiKey: string;
  appId: string;
  regionalCareSite?: RegionalCareSiteId;
  locale: string;
  indexes: {
    name: string;
    model: string;
  }[];
}

export const CMSLink: React.FC<CMSLinkProps> = ({
  value,
  onChange,
  defaultType = "url",
  apiKey,
  appId,
  indexes,
  regionalCareSite,
  locale = "en",
}) => {
  const [type, setType] = useState<"url" | "model">(defaultType);
  const [href, setHref] = useState("");
  const [model, setModel] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [error, setError] = useState<{
    message: string;
    stack?: string;
  } | null>(null);

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
    }
  }, [value, defaultType]);

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
    updateValue({ type: newType });
  };

  const handleLinkChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newHref = e.target.value;
    setHref(newHref);
    updateValue({ href: newHref });
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
              <div className="flex-1">
                <div className="ml-0">
                  <SearchModelSelector
                    href={href}
                    referenceId={referenceId}
                    apiKey={apiKey}
                    appId={appId}
                    indexes={indexes}
                    regionalCareSite={regionalCareSite}
                    locale={locale}
                    onModelSelect={(instance) => {
                      setHref(instance.href);
                      setReferenceId(instance.id);
                      setModel(instance.type);
                      setType("model");

                      updateValue({
                        type: "model",
                        href: instance.href,
                        referenceId: instance.id,
                        model: instance.type,
                      });
                    }}
                  />
                </div>
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
        <pre>
          <h3>Component State</h3>
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
    </div>
  );
};

export default CMSLink;
