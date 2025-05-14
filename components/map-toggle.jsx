"use client";

export default function MapToggle({ currentView, onChange }) {
  return (
    <div className="absolute top-4 left-4 z-10 bg-white rounded-md shadow-md flex overflow-hidden">
      <button
        className={`px-4 py-2 text-sm font-medium ${
          currentView === "map"
            ? "bg-primary text-white"
            : "bg-white text-gray-700 hover:bg-gray-100"
        }`}
        onClick={() => onChange("map")}
      >
        Map
      </button>
      <button
        className={`px-4 py-2 text-sm font-medium ${
          currentView === "satellite"
            ? "bg-primary text-white"
            : "bg-white text-gray-700 hover:bg-gray-100"
        }`}
        onClick={() => onChange("satellite")}
      >
        Satellite
      </button>
    </div>
  );
}
