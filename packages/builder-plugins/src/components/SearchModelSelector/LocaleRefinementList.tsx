import React, { useEffect } from "react";
import { RefinementList, useRefinementList } from "react-instantsearch";
import { LocaleRefinementListProps } from "./types";

export const LocaleRefinementList: React.FC<LocaleRefinementListProps> = ({ locale }) => {
  const { refine } = useRefinementList({ attribute: "locale" });

  useEffect(() => {
    refine(locale);
  }, [refine]);

  return (
    <RefinementList
      attribute="locale"
      operator="or"
      limit={5}
      searchable={false}
      showMore={false}
      classNames={{
        root: "text-left",
        list: "space-y-1",
        item: "",
        label:
          "flex items-start gap-2 text-sm text-gray-700 hover:text-blue-600 cursor-pointer py-0.5",
        checkbox:
          "mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500",
        labelText: "flex-1 text-left",
        count: "text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full",
      }}
    />
  );
};