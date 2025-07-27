import React, { useState, useEffect } from "react";
import { IconCloudUpload } from "@tabler/icons-react";
import { ClinicalTrial } from "../../types";
import { 
  logger,
  insertModelContent,
  updateModelContent,
  enrichTrialWithClinicalTrialsGovData,
} from "../../utils";
import { createBaseTrial } from "./coroMapping";
import mapping from "./coro-mapping.json";
import * as XLSX from "xlsx";
import { builder } from "@builder.io/react";

export interface ClinicalTrialImporterProps {
  apiKey: string;
  model: string;
  publishItems?: boolean;
}

// Utility to format model name for display
function formatModelName(model: string): string {
  // Replace dashes/underscores with spaces
  let name = model.replace(/[-_]/g, " ");
  // Convert camelCase to spaces
  name = name.replace(/([a-z])([A-Z])/g, "$1 $2");
  // Capitalize first letter of each word
  name = name.replace(/\b\w/g, (char) => char.toUpperCase());
  return name.trim();
}

// Add PublishItemsSwitch component
interface PublishItemsSwitchProps {
  publishItems: boolean;
  onChange: (value: boolean) => void;
}

const PublishItemsSwitch: React.FC<PublishItemsSwitchProps> = ({
  publishItems,
  onChange,
}) => {
  return (
    <div className="flex gap-2 items-center">
      <span className="font-medium text-sm text-gray-500">Publish Items</span>
      <button
        type="button"
        style={{
          height: 32,
          width: 64,
          background: publishItems ? "#3b82f6" : "#e5e7eb",
          borderRadius: 9999,
          position: "relative",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
        onClick={() => onChange(!publishItems)}
        aria-pressed={publishItems}
        tabIndex={0}
        aria-label="Publish Items"
      >
        <span
          style={{
            height: 28,
            width: 28,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
            position: "absolute",
            top: 2,
            left: publishItems ? 34 : 2,
            transition: "left 0.2s",
            border: "1px solid #d1d5db",
            display: "block",
          }}
        />
      </button>
    </div>
  );
};

// Centralized BuilderButton for consistent styling and hover effect
interface BuilderButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}
const BuilderButton: React.FC<BuilderButtonProps> = ({
  children,
  style,
  className = "",
  ...props
}) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      {...props}
      onMouseEnter={(e) => {
        setHovered(true);
        props.onMouseEnter && props.onMouseEnter(e);
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        props.onMouseLeave && props.onMouseLeave(e);
      }}
      style={{
        backgroundColor: hovered ? "#1e293b" : "#2563eb",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
      className={`px-3 py-1 rounded font-medium shadow transition border border-blue-600 min-w-[120px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${className}`}
      aria-label={props["aria-label"]}
    >
      {children}
    </button>
  );
};

export const ClinicalTrialImporter: React.FC<ClinicalTrialImporterProps> = ({
  apiKey,
  model,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ClinicalTrial[] | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    total: number;
    completed: number;
  }>({ total: 0, completed: 0 });
  const [publishedItems, setPublishedItems] = useState<
    Array<{ name: string; id: string }>
  >([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [firstRow, setFirstRow] = useState<any>(null);
  const [showMapping, setShowMapping] = useState(false);
  const [mappingErrors, setMappingErrors] = useState<string[]>([]);
  const [sheetRows, setSheetRows] = useState<any[]>([]);
  const [rowSelectionMode, setRowSelectionMode] = useState<
    "all" | "specific" | null
  >(null);
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([]);
  const [mappingPreview, setMappingPreview] = useState<any[]>([]);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [showImportDataPreview, setShowImportDataPreview] = useState(false);
  const [pendingFieldMapping, setPendingFieldMapping] = useState<any[] | null>(
    null
  );
  const [publishItems, setPublishItems] = useState(true);
  const [isPreviewHovered, setIsPreviewHovered] = useState(false);
  const [isMappingHovered, setIsMappingHovered] = useState(false);

  // Keep mappingPreview in sync with mapping and selected rows
  useEffect(() => {
    if (selectedRowIndices.length > 0) {
      const previewRows = selectedRowIndices.map((i) => sheetRows[i]);
      Promise.all(previewRows.map((row) => createBaseTrial(row)))
        .then((preview) => {
          setMappingPreview(preview);
        })
        .catch((error) => {
          console.error("Error creating preview:", error);
          setMappingPreview([]);
        });
    } else {
      setMappingPreview([]);
    }
  }, [selectedRowIndices, sheetRows]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
      setSelectedFile(file);
      setError(null);
      setParsedData(null);
      setSuccessMessage(null);
      setUploadProgress({ total: 0, completed: 0 });
      // Parse headers and first row for mapping UI
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonDataRaw = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        // Only keep rows that are arrays
        const jsonData: any[][] = Array.isArray(jsonDataRaw)
          ? ((jsonDataRaw as unknown[]).filter(Array.isArray) as any[][])
          : [];
        // Ensure headers and first row are arrays
        const headers = Array.isArray(jsonData[0]) ? jsonData[0] : [];
        setExcelHeaders(headers as string[]);
        const firstRowArr = Array.isArray(jsonData[1]) ? jsonData[1] : [];
        const firstRowObj = headers.reduce(
          (acc: any, header: string, idx: number) => {
            acc[header] = firstRowArr[idx];
            return acc;
          },
          {}
        );
        setFirstRow(firstRowObj);
        // Store all sheet rows (excluding header)
        const rows = jsonData.slice(1).map((rowArr: any[]) => {
          return headers.reduce((acc: any, header: string, idx: number) => {
            acc[header] = rowArr[idx];
            return acc;
          }, {});
        });
        setSheetRows(rows);
        setRowSelectionMode(null);
        setSelectedRowIndices([]);
        setMappingPreview([]);
      };
      reader.readAsBinaryString(file);
    } else {
      alert("Please select a valid Excel file (.xlsx or .xls)");
    }
  };

  const handleImportClick = () => {
    setShowImportPreview(true);
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }
    setIsLoading(true);
    setError(null);
    setParsedData(null);
    setSuccessMessage(null);
    setPublishedItems([]);
    try {
      // Always use only the selected rows
      const selectedRows = selectedRowIndices.map((i) => sheetRows[i]);
      const clinicalTrialsPromises = selectedRows.map((row) =>
        createBaseTrial(row)
      );
      const clinicalTrials = await Promise.all(clinicalTrialsPromises);
      setParsedData(clinicalTrials);
      setUploadProgress({ total: clinicalTrials.length, completed: 0 });
      const results = [];
      for (let i = 0; i < clinicalTrials.length; i++) {
        try {
          // Check if trial already exists
          const orgStudyId =
            clinicalTrials[i].data.identification?.orgStudyId || "";
          let result;

          if (orgStudyId.length > 0) {
            const trialResponse = await builder.get(model, {
              apiKey,
              locale: "en",
              cachebust: true,
              options: {
                noTargeting: true,
              },
              fields: "id",
              query: {
                "data.slug": {
                  $eq: clinicalTrials[i].data.slug,
                },
                "data.identification.orgStudyId": {
                  $eq: orgStudyId,
                },
              },
            });

            if (trialResponse && trialResponse.id) {
              result = await updateModelContent(
                clinicalTrials[i],
                model,
                trialResponse.id,
                apiKey
              );
            } else {
              result = await insertModelContent(
                clinicalTrials[i],
                model,
                apiKey
              );
            }
          } else {
            result = await insertModelContent(clinicalTrials[i], model, apiKey);
          }

          results.push(result);
          setUploadProgress((prev) => ({ ...prev, completed: i + 1 }));
          setPublishedItems((prev) => [
            ...prev,
            {
              name:
                typeof clinicalTrials[i].data.title === "string"
                  ? clinicalTrials[i].data.title
                  : (clinicalTrials[i].data.title as { Default: string })
                      .Default,
              id: result.id as string,
            } as { name: string; id: string },
          ]);
        } catch (err) {
          throw new Error(
            `Failed to upload trial ${i + 1}: ${
              err instanceof Error ? err.message : "Unknown error"
            }`
          );
        }
      }
      setSuccessMessage(
        `Successfully uploaded ${results.length} clinical trials to Builder.io!`
      );
      setShowImportPreview(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process Excel file"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
      setSelectedFile(file);
      setError(null);
      setParsedData(null);
      setSuccessMessage(null);
      setUploadProgress({ total: 0, completed: 0 });
    } else {
      alert("Please select a valid Excel file (.xlsx or .xls)");
    }
  };

  // Mapping UI handlers
  const handleMappingChange = (idx: number, newSource: string) => {
    if (!pendingFieldMapping) return;
    const updated = [...pendingFieldMapping];
    updated[idx].source = newSource;
    setPendingFieldMapping(updated);
    validateMapping(updated);
  };

  const validateMapping = (currentMapping: any[]) => {
    const errors: string[] = [];
    // Track source-target pairs to catch only true duplicates
    const usedPairs = new Set();
    currentMapping.forEach((m, idx) => {
      if (!m.source) {
        errors.push(`Row ${idx + 1}: Field mapping is required.`);
      } else {
        // Allow same source for different targets, but not same source-target pair
        const targets: string[] = Array.isArray(m.target)
          ? m.target
          : [m.target];
        targets.forEach((target: string) => {
          const pairKey = `${m.source}=>${target}`;
          if (usedPairs.has(pairKey)) {
            errors.push(
              `Row ${idx + 1}: Duplicate mapping for column '${
                m.source
              }' to target '${target}'.`
            );
          } else {
            usedPairs.add(pairKey);
          }
        });
      }
    });
    setMappingErrors(errors);
    return errors.length === 0;
  };

  // Row selection handlers
  const handleSelectAllRows = () => {
    setSelectedRowIndices(sheetRows.map((_, idx) => idx));
    updateMappingPreview(sheetRows.map((_, idx) => idx));
  };
  const handleDeselectAllRows = () => {
    setSelectedRowIndices([]);
    setMappingPreview([]);
  };
  const handleRowCheckboxChange = (idx: number) => {
    let newSelected: number[];
    if (selectedRowIndices.includes(idx)) {
      newSelected = selectedRowIndices.filter((i) => i !== idx);
    } else {
      newSelected = [...selectedRowIndices, idx];
    }
    setSelectedRowIndices(newSelected);
    updateMappingPreview(newSelected);
  };
  const updateMappingPreview = (indices: number[]) => {
    // Map selected rows using current mapping
    const preview = indices.map((i) => {
      const row = sheetRows[i];
      const mapped: any = {};
      mapping.forEach(({ source, target, split, asArrayOfObjects, append }) => {
        const value = row[source];
        if (value) {
          if (Array.isArray(target)) {
            target.forEach((t) => setDeep(mapped, t, value));
          } else if (split) {
            const values = value.split(split).map((v: string) => v.trim());
            if (asArrayOfObjects) {
              const key = Object.keys(asArrayOfObjects)[0];
              setDeep(
                mapped,
                target,
                values.map((v: string) => ({ [key]: v }))
              );
            } else if (append) {
              const existing = mapped.data?.interventions || [];
              setDeep(mapped, target, [...existing, ...values]);
            } else {
              setDeep(mapped, target, values);
            }
          } else {
            setDeep(mapped, target, value);
          }
        }
      });
      return mapped;
    });
    setMappingPreview(preview);
  };

  // Add a function to reset to initial state
  const handleCancelImport = () => {
    setShowImportPreview(false);
    setSelectedFile(null);
    setExcelHeaders([]);
    setFirstRow(null);
    setSheetRows([]);
    setRowSelectionMode(null);
    setSelectedRowIndices([]);
    setMappingPreview([]);
    setError(null);
    setParsedData(null);
    setSuccessMessage(null);
    setUploadProgress({ total: 0, completed: 0 });
    setPublishedItems([]);
    setIsLoading(false);
  };

  // Helper to get the display name for a row (use mapped title field or fallback)
  const getRowDisplayName = (row: any) => {
    // Try to use the mapped title field from mapping
    const titleMapping = mapping.find((m) =>
      Array.isArray(m.target)
        ? m.target.includes("data.title")
        : m.target === "data.title"
    );
    if (titleMapping && row[titleMapping.source]) {
      return row[titleMapping.source];
    }
    // Fallback to first non-empty field
    for (const key of excelHeaders) {
      if (row[key]) return row[key];
    }
    return "Untitled";
  };

  const toggleRowExpanded = (idx: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return newSet;
    });
  };

  // When opening advanced mapping, copy current mapping to pendingFieldMapping
  const handleShowMapping = () => {
    setPendingFieldMapping(mapping.map((m) => ({ ...m })));
    setShowMapping(true);
  };

  // Save mapping: update fieldMapping, hide advanced UI
  const handleSaveMapping = () => {
    if (pendingFieldMapping) {
      // No need to update fieldMapping state since we're using the imported mapping
      setShowMapping(false);
      setPendingFieldMapping(null);
    }
  };

  // Cancel mapping: discard changes, hide advanced UI
  const handleCancelMapping = () => {
    setShowMapping(false);
    setPendingFieldMapping(null);
    setMappingErrors([]);
  };

  // Modal backdrop and modal container styles
  const modalBackdrop =
    "fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center";
  const modalContainer =
    "bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative";

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">
        {formatModelName(model)} Upload
      </h1>
      <p className="mb-6 text-gray-700 text-base max-w-2xl">
        Please upload an Excel file (.xlsx or .xls) containing your clinical
        trial data. You can either click the button below to select a file, or
        drag and drop your file into the upload area.
      </p>

      {/* Hide file upload and import button when preview is shown */}
      {!showImportPreview && (
        <div className="mb-4 flex flex-col items-start max-w-md">
          <div
            className={`bg-gray-100 rounded-lg p-8 flex flex-col items-center w-full max-w-md transition-colors duration-200 border-2 ${
              isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-200"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="excel-file-upload"
            />
            <label
              htmlFor="excel-file-upload"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mb-4 cursor-pointer"
            >
              <IconCloudUpload className="h-5 w-5 mr-2" />
              Select Excel File
            </label>
            <p className="text-sm text-gray-500 mb-2">or drag and drop here</p>
            {selectedFile && (
              <p className="text-sm text-gray-500">
                Selected file: {selectedFile.name}
              </p>
            )}
          </div>
          <div className="flex flex-row gap-2 mt-4">
            {selectedFile && (
              <>
                <BuilderButton
                  onClick={handleImportClick}
                  disabled={isLoading || !!successMessage}
                  className={
                    isLoading || !!successMessage
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }
                >
                  {isLoading ? "Processing..." : "Next"}
                </BuilderButton>
                {/* <BuilderButton
                
                  onClick={handleShowMapping}
                  disabled={showMapping}
                  className={showMapping ? "opacity-50 cursor-not-allowed" : ""}
                >
                  Show Mapping
                </BuilderButton> */}
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}

      {uploadProgress.total > 0 && (
        <p className="text-sm text-gray-600 mb-4">
          Uploading: {uploadProgress.completed} of {uploadProgress.total} trials
        </p>
      )}

      {/* Advanced Mapping UI */}
      {selectedFile && excelHeaders.length > 0 && (
        <div className="mb-4 w-full max-w-2xl mx-auto flex flex-wrap items-center gap-4">
          {showMapping && pendingFieldMapping && (
            <div className={modalBackdrop}>
              <div
                className={modalContainer + " max-w-4xl w-full p-6 relative"}
                style={{ maxHeight: "80vh", overflowY: "auto" }}
                role="dialog"
                aria-modal="true"
              >
                {/* Close button */}
                <button
                  type="button"
                  aria-label="Close"
                  onClick={handleCancelMapping}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none z-10"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
                <h2 className="text-lg font-semibold mb-4">
                  Advanced Field Mapping
                </h2>
                <table className="w-full text-sm mb-2">
                  <thead>
                    <tr>
                      <th className="text-left py-1 px-2">Target Field</th>
                      <th className="text-left py-1 px-2">Excel Column</th>
                      <th className="text-left py-1 px-2">Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingFieldMapping.map((m, idx) => (
                      <tr key={idx}>
                        <td className="py-1 px-2">
                          {Array.isArray(m.target)
                            ? m.target.join(", ")
                            : m.target}
                        </td>
                        <td className="py-1 px-2">
                          <select
                            className="border rounded px-2 py-1"
                            value={m.source || ""}
                            onChange={(e) =>
                              handleMappingChange(idx, e.target.value)
                            }
                          >
                            <option value="">-- Select column --</option>
                            {excelHeaders.map((header, hidx) => (
                              <option key={hidx} value={header}>
                                {header}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1 px-2 text-gray-600">
                          {(() => {
                            if (
                              firstRow &&
                              m.source &&
                              firstRow[m.source] !== undefined
                            ) {
                              return String(firstRow[m.source]);
                            }
                            return (
                              <span className="text-gray-400">
                                (no preview)
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {mappingErrors.length > 0 && (
                  <div className="text-red-600 text-sm mb-2">
                    {mappingErrors.map((err, i) => (
                      <div key={i}>{err}</div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <BuilderButton type="button" onClick={handleSaveMapping}>
                    Save Mapping
                  </BuilderButton>
                  <BuilderButton
                    type="button"
                    onClick={handleCancelMapping}
                    style={{
                      backgroundColor: "#e5e7eb",
                      color: "#374151",
                      border: "1px solid #d1d5db",
                    }}
                  >
                    Cancel
                  </BuilderButton>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Mapping changes only apply to this import and will reset when
                  you select a new file.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Row selection and import preview, only show after Import is clicked */}
      {showImportPreview && selectedFile && sheetRows.length > 0 && (
        <div className="mb-6 w-full">
          <div className="border rounded bg-white p-4 mb-4">
            <div className="flex justify-between items-center mb-2 gap-2 flex-wrap">
              <span className="font-medium">Select rows to import:</span>
              <div className="flex gap-2 flex-1">
                <BuilderButton
                  type="button"
                  onClick={handleSelectAllRows}
                  disabled={false}
                  className=""
                >
                  Select All
                </BuilderButton>
                <BuilderButton
                  type="button"
                  onClick={handleDeselectAllRows}
                  disabled={selectedRowIndices.length === 0}
                  className={
                    selectedRowIndices.length === 0
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }
                >
                  Deselect All
                </BuilderButton>
              </div>
              <div className="flex gap-2 items-center">
                <PublishItemsSwitch
                  publishItems={publishItems}
                  onChange={setPublishItems}
                />
                <BuilderButton
                  type="button"
                  onClick={() => setShowImportDataPreview((v) => !v)}
                  disabled={selectedRowIndices.length === 0}
                  className={
                    selectedRowIndices.length === 0
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }
                >
                  {showImportDataPreview ? "Hide Data Preview" : "Preview Data"}
                </BuilderButton>
                <BuilderButton
                  onClick={handleConfirmImport}
                  disabled={
                    isLoading ||
                    !!successMessage ||
                    selectedRowIndices.length === 0
                  }
                >
                  {isLoading ? "Processing..." : "Import"}
                </BuilderButton>
                <BuilderButton
                  type="button"
                  onClick={handleCancelImport}
                  style={{
                    backgroundColor: "#e5e7eb",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                  }}
                >
                  Cancel
                </BuilderButton>
              </div>
            </div>
            <div className="overflow-x-auto max-h-64 overflow-y-auto border rounded">
              {/* Header row removed for cleaner collapsible UI */}
              {sheetRows.map((row, idx) => {
                const expanded = expandedRows.has(idx);
                return (
                  <div
                    key={idx}
                    className={`flex flex-col min-w-full text-xs border-b last:border-b-0 ${
                      selectedRowIndices.includes(idx) ? "bg-blue-50" : ""
                    }`}
                  >
                    {/* Row header */}
                    <div className="flex items-center min-w-full px-2 py-1">
                      <div className="w-6 flex-shrink-0 flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedRowIndices.includes(idx)}
                          onChange={() => handleRowCheckboxChange(idx)}
                        />
                      </div>
                      <button
                        type="button"
                        className="mr-2 text-gray-500 hover:text-blue-600 focus:outline-none"
                        onClick={() => toggleRowExpanded(idx)}
                        aria-label={expanded ? "Collapse row" : "Expand row"}
                      >
                        {expanded ? "▼" : "▶"}
                      </button>
                      <span className="font-medium text-gray-900 truncate">
                        {getRowDisplayName(row)}
                      </span>
                    </div>
                    {/* Expanded content */}
                    {expanded && (
                      <div className="bg-white border rounded-md shadow-sm p-6 mb-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                          {excelHeaders.map((header, hidx) => (
                            <div key={hidx}>
                              <div className="text-xs font-semibold text-gray-600">
                                {header}
                              </div>
                              <div className="text-sm text-gray-900 break-words whitespace-pre-wrap">
                                {row[header]}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600">
                {selectedRowIndices.length} row(s) selected
              </span>
              <div className="flex gap-2 mt-4 items-center">
                <PublishItemsSwitch
                  publishItems={publishItems}
                  onChange={setPublishItems}
                />
                <BuilderButton
                  onClick={handleConfirmImport}
                  disabled={
                    isLoading ||
                    !!successMessage ||
                    selectedRowIndices.length === 0
                  }
                >
                  {isLoading ? "Processing..." : "Import"}
                </BuilderButton>
                <BuilderButton
                  type="button"
                  onClick={handleCancelImport}
                  style={{
                    backgroundColor: "#e5e7eb",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                  }}
                >
                  Cancel
                </BuilderButton>
              </div>
            </div>
          </div>
          {/* Mapping preview for selected rows */}
          {mappingPreview.length > 0 && (
            <div className="hidden border rounded bg-gray-50 p-4 mb-4">
              <div className="font-medium mb-2">
                Preview of mapped data for selected rows:
              </div>
              <pre className="text-xs bg-white p-2 rounded overflow-x-auto max-h-48">
                {JSON.stringify(mappingPreview, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Import Data Preview area, always rendered below the preview table, toggled by link */}
      {showImportDataPreview && mappingPreview.length > 0 && (
        <div className="border rounded bg-gray-50 p-4 mt-4 w-full">
          <div className="font-medium mb-2">
            Preview of mapped data for selected rows:
          </div>
          <pre className="text-xs bg-white p-2 rounded overflow-x-auto max-h-48">
            {JSON.stringify(mappingPreview, null, 2)}
          </pre>
        </div>
      )}

      {publishedItems.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Imported Items:</h3>
          <ul className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
            {publishedItems.map((item, index) => (
              <li key={item.id} className="p-4">
                <div className="flex flex-col">
                  <a
                    href={`https://builder.io/content/${item.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    {item.name}
                  </a>
                  <span className="text-sm text-gray-500">ID: {item.id}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Helper for mapping preview
function setDeep(obj: any, path: string | string[], value: any) {
  if (typeof path === "string") {
    path = path.split(".");
  }
  if (path.length === 1) {
    obj[path[0]] = value;
  } else {
    if (!obj[path[0]]) {
      obj[path[0]] = {};
    }
    setDeep(obj[path[0]], path.slice(1), value);
  }
}

export default ClinicalTrialImporter;
