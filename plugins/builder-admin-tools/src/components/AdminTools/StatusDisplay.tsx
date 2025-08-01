import React from "react";

interface StatusDisplayProps {
  status: string;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ status }) => {
  if (!status) return null;

  const getStatusStyle = () => {
    if (status.startsWith("Error")) {
      return "bg-red-100 border border-red-400 text-red-700";
    } else if (status.includes("Completed")) {
      return "bg-green-100 border border-green-400 text-green-700";
    } else {
      return "bg-blue-100 border border-blue-400 text-blue-700";
    }
  };

  return (
    <div className={`p-4 rounded-md ${getStatusStyle()}`}>
      <p>{status}</p>
    </div>
  );
};