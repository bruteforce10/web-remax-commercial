"use client";

import { List, Map } from "lucide-react";

export default function MobileViewToggle({ currentView, onChange }) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white rounded-full shadow-lg lg:hidden">
      <div className="flex items-center p-1">
        <button
          className={`flex items-center justify-center p-3 rounded-full ${
            currentView === "list"
              ? "bg-primary text-white"
              : "bg-white text-gray-700"
          }`}
          onClick={() => onChange("list")}
          aria-label="Show property list"
        >
          <List size={20} />
        </button>
        <button
          className={`flex items-center justify-center p-3 rounded-full ${
            currentView === "map"
              ? "bg-primary text-white"
              : "bg-white text-gray-700"
          }`}
          onClick={() => onChange("map")}
          aria-label="Show map"
        >
          <Map size={20} />
        </button>
      </div>
    </div>
  );
}
