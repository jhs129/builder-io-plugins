import React, { useState, useEffect } from 'react';
import { builder } from '@builder.io/react';

interface HitProps {
  hit: {
    id: string;
    name?: string;
    data?: {
      url?: string;
      title?: string;
      slug?: string;
    };
  };
  onSelect: (hit: HitProps['hit']) => void;
  isSelected: boolean;
}

interface ContentSelectorProps {
  models: {
    name: string;
    displayName: string;
  }[];
  apiKey: string;
  onContentSelect: (content: {
    id: string;
    name: string;
    type: string;
    href: string;
  }) => void;
  onClose: () => void;
}

const Hit = ({ hit, onSelect, isSelected }: HitProps) => (
  <div
    className={`py-2 px-4 border-b border-gray-200 odd:bg-neutral-100 even:bg-gray-50 hover:bg-blue-50 ${
      isSelected ? 'bg-blue-50' : ''
    }`}
  >
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <h3 className="font-medium text-blue-600 truncate">
          {hit.name || hit.data?.title || hit.id}
        </h3>
        {hit.data?.url && (
          <span className="text-gray-500 text-sm truncate">{hit.data.url}</span>
        )}
      </div>
      <button
        onClick={() => onSelect(hit)}
        className={`shrink-0 px-3 py-1 text-sm font-medium rounded-md ml-auto ${
          isSelected
            ? 'bg-blue-600 text-neutral-100 hover:bg-blue-700'
            : 'bg-blue-600 text-neutral-100 hover:bg-blue-700'
        }`}
        aria-label={isSelected ? 'Selected' : 'Select'}
      >
        {isSelected ? 'Selected' : 'Select'}
      </button>
    </div>
  </div>
);

const NoResults = ({
  query,
  hasResults,
}: {
  query: string;
  hasResults: boolean;
}) => {
  if (query && !hasResults) {
    return (
      <div className="p-4 text-center text-gray-500">
        No results found for "{query}"
      </div>
    );
  }

  if (!query && !hasResults) {
    return (
      <div className="p-4 text-center text-gray-500">No content found</div>
    );
  }

  return null;
};

export const ContentSelector: React.FC<ContentSelectorProps> = ({
  onContentSelect,
  models,
  apiKey,
  onClose,
}) => {
  const [selectedHit, setSelectedHit] = useState<HitProps['hit'] | null>(null);
  const [searchResults, setSearchResults] = useState<HitProps['hit'][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  // Initialize builder when component mounts
  useEffect(() => {
    if (apiKey && !builder.apiKey) {
      builder.init(apiKey);
      builder.apiVersion = 'v3';
    }
  }, [apiKey]);

  // Fetch results for the selected model
  useEffect(() => {
    if (selectedModel && apiKey) {
      setIsLoading(true);
      builder
        .getAll(selectedModel, {
          fields: 'id,name,data.title,data.url,data.slug',
          options: {
            noTargeting: true,
            includeRefs: true,
          },
        })
        .then((results) => {
          setSearchResults(
            results
              .filter((r) => typeof r.id === 'string')
              .map((r) => ({
                id: r.id as string,
                name: r.name,
                data: r.data as HitProps['hit']['data'],
              }))
          );
        })
        .catch((error) => {
          setSearchResults([]);
          console.error('Error loading initial content:', error);
        })
        .finally(() => setIsLoading(false));
    } else {
      setSearchResults([]);
    }
    setSelectedHit(null);
    setSearchQuery('');
  }, [selectedModel, apiKey]);

  // Filter results based on search query
  const filteredResults = searchResults.filter((hit) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const name = hit.name?.toLowerCase() || '';
    const title = hit.data?.title?.toLowerCase() || '';
    const url = hit.data?.url?.toLowerCase() || '';
    return (
      name.includes(searchLower) ||
      title.includes(searchLower) ||
      url.includes(searchLower)
    );
  });

  const handleSelect = (hit: HitProps['hit']) => {
    setSelectedHit(hit);

    // Generate href from the content data
    let href = hit.data?.url || hit.data?.slug || '';
    if (href && !href.startsWith('/')) {
      href = '/' + href;
    }

    onContentSelect({
      id: hit.id,
      name: hit.name || hit.data?.title || '',
      type: selectedModel,
      href: href,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center sm:p-0">
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
                  className="flex-1 p-2 pr-8 rounded border border-gray-300 appearance-none bg-neutral-100"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  <option value="">Select a content type...</option>
                  {models.map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={onClose}
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

            {selectedModel && (
              <>
                {/* Search input */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200 max-h-96 overflow-y-auto">
                    {isLoading ? (
                      <div className="p-4 text-center text-gray-500">
                        Loading...
                      </div>
                    ) : (
                      <>
                        <div className="divide-y divide-gray-200">
                          {filteredResults.map((hit) => (
                            <Hit
                              key={hit.id}
                              hit={hit}
                              onSelect={handleSelect}
                              isSelected={selectedHit?.id === hit.id}
                            />
                          ))}
                        </div>
                        {filteredResults.length === 0 && (
                          <NoResults
                            query={searchQuery}
                            hasResults={searchResults.length > 0}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentSelector;
