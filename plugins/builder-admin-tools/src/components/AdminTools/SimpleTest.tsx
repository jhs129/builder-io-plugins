import React from "react";

const SimpleTestComponent = () => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Admin Tools - Basic Test</h2>
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
        <p>Component is rendering successfully!</p>
        <p>This is a simple test to verify the component loads without errors.</p>
      </div>
    </div>
  );
};

export default SimpleTestComponent;