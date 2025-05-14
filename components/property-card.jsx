"use client";

import Image from "next/image";
import Link from "next/link";
import { forwardRef } from "react";

const PropertyCard = forwardRef(({ property, isActive, onClick }, ref) => {
  return (
    <div
      ref={ref}
      className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
        isActive ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
      }`}
      onClick={onClick}
    >
      <div className="relative">
        <div className="absolute top-2 left-2 z-10 bg-primary text-white px-3 py-1 text-sm font-semibold rounded">
          {property.status}
        </div>
        <Image
          src={property.image || "/place-holder.webp"}
          alt={property.title}
          width={400}
          height={250}
          className="w-full h-48 object-cover"
        />
      </div>

      <div className="p-4">
        <div className="text-2xl font-bold text-primary">{property.price}</div>

        <Link href={`/property/${property.id}`} className="hover:underline">
          <h3 className="text-lg font-semibold mt-2">{property.title}</h3>
        </Link>

        <p className="text-gray-600 mt-1">{property.address}</p>

        {property.details && (
          <div className="mt-4 grid gap-2">
            {property.type && (
              <div className="inline-block bg-gray-100 px-2 py-1 text-sm font-medium text-gray-800">
                {property.type}
              </div>
            )}

            {property.details.map((detail, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">{detail.label}:</span>
                <span className="font-medium">{detail.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

PropertyCard.displayName = "PropertyCard";

export default PropertyCard;
