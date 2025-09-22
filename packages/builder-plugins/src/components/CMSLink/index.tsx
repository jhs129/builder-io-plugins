import React, { useState, ChangeEvent, useEffect } from "react";
import { builder } from "@builder.io/react";
import { ContentSelector } from "../ContentSelector";
import styles from "./CMSLink.module.css";

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
    <div className={styles.container}>
      <p className={styles.testText}>CSS Modules test</p>
      <div className={styles.formGroup}>
        <div className={styles.fieldRow}>
          <div className={styles.typeSelector}>
            <label className={styles.typeLabel}>
              Type:
            </label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="linkType"
                  value="url"
                  checked={type === "url"}
                  onChange={() => handleTypeChange("url")}
                  className={styles.radioInput}
                />
                URL
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="linkType"
                  value="model"
                  checked={type === "model"}
                  onChange={() => handleTypeChange("model")}
                  className={styles.radioInput}
                />
                Reference
              </label>
            </div>
          </div>

          <div className={styles.inputRow}>
            {type === "url" ? (
              <input
                id="link"
                type="text"
                value={href}
                onChange={handleLinkChange}
                className={styles.textInput}
                placeholder="Enter URL..."
              />
            ) : (
              <div className={styles.inputGroup}>
                <label className={styles.hrefLabel}>Href:</label>
                <input
                  type="text"
                  value={selectedContentName || "No model selected..."}
                  readOnly
                  className={styles.readOnlyInput}
                  placeholder="No model selected..."
                />
                <button
                  onClick={() => setIsContentSelectorOpen(true)}
                  className={styles.selectButton}
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
        <div className={styles.errorContainer}>
          <div className={styles.errorMessage}>{error.message}</div>
          {error.stack && <div className={styles.errorStack}>{error.stack}</div>}
        </div>
      )}

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
