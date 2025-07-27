import React, { useState } from "react";
import { liteClient as algoliasearch } from "algoliasearch/lite";
import { SearchModelSelectorProps } from "./types";
import { SearchModal } from "./SearchModal";
import "./index.css";


export const SearchModelSelector: React.FC<SearchModelSelectorProps> = ({
  href,
  onModelSelect,
  apiKey,
  appId,
  indexes,
  regionalCareSite,
  locale = "en",
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const searchClient = algoliasearch(appId, apiKey);

  return (
    <>
      <div className="flex items-start gap-2">
        <label htmlFor="modelSelector" className="whitespace-nowrap mt-1">
          Href:
        </label>
        <div className="flex flex-col gap-2 flex-1">
          <input
            id="modelSelector"
            type="text"
            value={href}
            readOnly
            className="w-full h-8 px-2 py-1 rounded border border-gray-300 text-sm bg-neutral-100 text-gray-500 cursor-not-allowed"
            placeholder="No model selected..."
          />
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-8 px-4 py-1 bg-blue-500 text-neutral-100 rounded text-sm font-medium whitespace-nowrap hover:bg-blue-600 active:bg-blue-700 transition-colors"
            aria-label="Select"
          >
            Select
          </button>
        </div>
      </div>

      <SearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        indexes={indexes}
        searchClient={searchClient}
        locale={locale}
        regionalCareSite={regionalCareSite}
        onModelSelect={onModelSelect}
      />
    </>
  );
};

export default SearchModelSelector;
