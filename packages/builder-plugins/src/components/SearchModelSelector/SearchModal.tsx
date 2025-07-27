import React, { useState, ChangeEvent } from "react";
import {
  InstantSearch,
  SearchBox,
  Hits,
  Configure,
  Pagination,
} from "react-instantsearch";
import { history } from "instantsearch.js/es/lib/routers";
import { SearchModalProps, HitProps } from "./types";
import { FacetPanel } from "./FacetPanel";
import { LocaleRefinementList } from "./LocaleRefinementList";
import { Hit } from "./Hit";
import { NoResults } from "./NoResults";

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  indexes,
  searchClient,
  locale,
  regionalCareSite,
  onModelSelect,
}) => {
  const [selectedHit, setSelectedHit] = useState<HitProps["hit"] | null>(null);
  const [selectedModelType, setSelectedModelType] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState<string>("");
  const [debugPreview, setDebugPreview] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  const regionalCareSiteFilter = regionalCareSite
    ? `regionalCareSites:"${regionalCareSite}"`
    : undefined;

  const handleModelTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const modelType = e.target.value;
    setSelectedModelType(modelType);

    const selectedIndex = indexes.find((index) => index.model === modelType);
    const indexName = selectedIndex?.name || "";

    setCurrentIndex(indexName);
    setSelectedHit(null);
    setDebugPreview(null);
    setShowDebug(false);
  };

  const handleSelect = (hit: HitProps["hit"]) => {
    setSelectedHit(hit);
    const href = hit.url || "";
    onModelSelect({
      id: hit.id,
      name: hit.title || hit.name || "",
      href,
      type: selectedModelType,
    });
    onClose();
  };

  const handleConfirmSelection = () => {
    if (debugPreview) {
      onModelSelect(debugPreview);
      onClose();
      setDebugPreview(null);
      setShowDebug(false);
    }
  };

  const handleClose = () => {
    onClose();
    setDebugPreview(null);
    setShowDebug(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-start justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        <div className="bg-neutral-100 rounded-lg shadow-xl transform transition-all w-4/5 max-w-4xl relative">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4 flex-1">
                <label
                  htmlFor="modelType"
                  className="text-xl font-medium whitespace-nowrap"
                >
                  Type:
                </label>
                <select
                  id="modelType"
                  className="flex-1 p-2 pr-8 rounded border border-gray-300 appearance-none bg-neutral-100 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5em_1.5em] bg-no-repeat bg-[right_0.5rem_center]"
                  value={selectedModelType}
                  onChange={handleModelTypeChange}
                >
                  <option value="">Select a content type...</option>
                  {indexes.map((index) => (
                    <option key={index.model} value={index.model}>
                      {index.model.charAt(0).toUpperCase() +
                        index.model.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleClose}
                className="ml-4 text-gray-400 hover:text-gray-500"
                aria-label="Close"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {selectedModelType && currentIndex && !showDebug && (
              <InstantSearch
                searchClient={searchClient}
                indexName={currentIndex}
                routing={{
                  router: history({
                    cleanUrlOnDispose: false,
                  }),
                }}
                future={{ preserveSharedStateOnUnmount: false }}
                initialUiState={{
                  [currentIndex]: {
                    refinementList: {
                      locale: [locale],
                    },
                  },
                }}
              >
                <Configure
                  hitsPerPage={10}
                  facets={["locale"]}
                  maxValuesPerFacet={10}
                  filters={regionalCareSiteFilter}
                />
                <div className="mb-6">
                  <SearchBox
                    placeholder="Search..."
                    classNames={{
                      root: "relative w-full",
                      form: "relative",
                      input:
                        "w-full pl-4 pr-12 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      submit:
                        "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6",
                      submitIcon: "w-5 h-5",
                      reset: "hidden",
                      loadingIndicator:
                        "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400",
                    }}
                  />
                </div>
                <div className="flex gap-6">
                  <div className="w-1/4">
                    <FacetPanel header="Locale">
                      <LocaleRefinementList locale={locale} />
                    </FacetPanel>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                      <Hits
                        classNames={{
                          list: "divide-y divide-gray-200",
                          item: "",
                        }}
                        hitComponent={({ hit }) => (
                          <Hit
                            hit={hit}
                            onSelect={handleSelect}
                            isSelected={
                              selectedHit?.objectID === hit.objectID
                            }
                          />
                        )}
                      />
                      <NoResults />
                      <div className="py-2 px-4 border-t border-gray-200 bg-neutral-100">
                        <Pagination
                          classNames={{
                            root: "flex justify-center",
                            list: "inline-flex gap-1 rounded-md",
                            item: "relative inline-flex items-center",
                            link: "px-3 py-1 text-sm text-gray-500 bg-neutral-100 hover:bg-gray-50 border border-gray-300 rounded-md",
                            selectedItem:
                              "relative inline-flex items-center [&>a]:bg-blue-600 [&>a]:text-neutral-100 [&>a]:border-blue-600 [&>a]:hover:bg-blue-700",
                            disabledItem:
                              "relative inline-flex items-center opacity-50 cursor-not-allowed",
                          }}
                          padding={1}
                          showFirst={false}
                          showLast={false}
                          showNext={true}
                          showPrevious={true}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </InstantSearch>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};