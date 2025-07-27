import React from "react";
import { useInstantSearch } from "react-instantsearch";

export const NoResults: React.FC = () => {
  const { results } = useInstantSearch();
  return results?.query && results?.nbHits === 0 ? (
    <div className="p-4 text-center text-gray-500">
      No results found for "{results.query}"
    </div>
  ) : null;
};