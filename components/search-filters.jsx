"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function SearchFilters({ onSearch, onReset }) {
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("ALL");
  const [propertyType, setPropertyType] = useState("ALL");

  const handleApply = () => {
    onSearch({
      location,
      availability,
      propertyType,
    });
  };

  const handleReset = () => {
    setLocation("");
    setAvailability("ALL");
    setPropertyType("ALL");
    onReset();
  };

  return (
    <div className="bg-white p-4 border rounded-lg shadow-sm mb-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Location Search */}
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Location
          </label>
          <div className="relative">
            <input
              id="location"
              type="text"
              placeholder="City, Address, or More"
              className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            {location && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setLocation("")}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Property Type Filter */}
        <div>
          <label
            htmlFor="propertyType"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Property Type
          </label>
          <select
            id="propertyType"
            className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
          >
            <option value="ALL">All Property Types</option>
            <option value="OFFICE">Office</option>
            <option value="INDUSTRIAL">Industrial</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="RETAIL">Retail</option>
            <option value="MIXED USE">Mixed Use</option>
          </select>
        </div>

        {/* Availability Filter */}
        <div>
          <label
            htmlFor="availability"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Availability
          </label>
          <select
            id="availability"
            className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          >
            <option value="ALL">Sale & Lease</option>
            <option value="FOR SALE">For Sale</option>
            <option value="FOR LEASE">For Lease</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            className="flex-1 bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            onClick={handleReset}
          >
            Reset Search
          </button>
          <button
            className="flex-1 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-800 transition-colors"
            onClick={handleApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
