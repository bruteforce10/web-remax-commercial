"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import PropertyCard from "@/components/property-card";
import MapToggle from "@/components/map-toggle";
import MobileViewToggle from "@/components/mobile-view-toggle";
import { properties } from "@/constant/properties";
import SearchFilters from "@/components/search-filters";
import LoadingSpinner from "@/components/loading-spinner";

// Mengatur API key Mapbox
mapboxgl.accessToken =
  "pk.eyJ1IjoiYXNlcDEyIiwiYSI6ImNtOWhlczFscDA0M3kyb3E0c3B2M3JpczgifQ.sysimBWh0Tepfm3GFp1Nkg";

// Number of properties to load per batch
const PROPERTIES_PER_PAGE = 10;

export default function Home() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [activeProperty, setActiveProperty] = useState(null);
  const [mapView, setMapView] = useState("map");
  const [mobileView, setMobileView] = useState("list");
  const popupRef = useRef(null);
  const [searchFilters, setSearchFilters] = useState({
    location: "",
    availability: "ALL",
    propertyType: "ALL",
  });
  const [filteredProperties, setFilteredProperties] = useState(properties);
  const [visibleProperties, setVisibleProperties] =
    useState(filteredProperties);
  const [mapInitialized, setMapInitialized] = useState(false);
  const propertyCardRefs = useRef({});

  // Infinite loading states
  const [displayCount, setDisplayCount] = useState(PROPERTIES_PER_PAGE);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef(null);
  const loadingRef = useRef(null);

  // Fungsi untuk memfilter properti berdasarkan viewport peta
  const filterPropertiesByViewport = () => {
    if (!map.current || !mapInitialized) return;

    try {
      const bounds = map.current.getBounds();

      const visibleInMap = filteredProperties.filter((property) => {
        return bounds.contains([property.longitude, property.latitude]);
      });

      setVisibleProperties(visibleInMap);

      // Reset display count when viewport changes
      setDisplayCount(PROPERTIES_PER_PAGE);
      setHasMore(visibleInMap.length > PROPERTIES_PER_PAGE);
    } catch (error) {
      console.error("Error filtering properties:", error);
      // Fallback to showing all filtered properties if there's an error
      setVisibleProperties(filteredProperties);
      setDisplayCount(PROPERTIES_PER_PAGE);
      setHasMore(filteredProperties.length > PROPERTIES_PER_PAGE);
    }
  };

  // Fungsi untuk menginisialisasi peta
  const initializeMap = () => {
    if (!mapContainer.current || map.current) return;

    try {
      // Inisialisasi peta
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style:
          mapView === "map"
            ? "mapbox://styles/mapbox/streets-v12"
            : "mapbox://styles/mapbox/satellite-streets-v12",
        center: [-95.7129, 37.0902], // Pusat peta di AS
        zoom: 3,
      });

      // Tambahkan kontrol navigasi
      map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");

      // Tunggu hingga peta selesai dimuat
      map.current.on("load", () => {
        console.log("Map loaded");
        setupMapLayers();
        setMapInitialized(true);
        filterPropertiesByViewport();
      });

      // Event listener untuk memfilter properti saat peta bergerak
      map.current.on("moveend", filterPropertiesByViewport);
      map.current.on("zoomend", filterPropertiesByViewport);

      // Error handling
      map.current.on("error", (e) => {
        console.error("Mapbox error:", e.error);
      });
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  };

  // Fungsi untuk setup layer peta
  const setupMapLayers = () => {
    if (!map.current) return;

    try {
      // Tambahkan source dengan data properti
      map.current.addSource("properties", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: filteredProperties.map((property) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [property.longitude, property.latitude],
            },
            properties: {
              id: property.id,
              title: property.title,
              price: property.price,
              status: property.status,
              address: property.address,
              image: property.image,
              type: property.type || "UNKNOWN",
            },
          })),
        },
        cluster: true,
        clusterMaxZoom: 14, // Maksimum zoom level untuk menampilkan cluster
        clusterRadius: 50, // Radius untuk mengelompokkan point menjadi cluster
      });

      // Tambahkan layer untuk cluster
      map.current.addLayer({
        id: "clusters",
        type: "circle",
        source: "properties",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#0f172a", // Biru tua solid
          "circle-radius": 20,
          "circle-stroke-width": 3,
          "circle-stroke-color": "rgba(255, 255, 255, 0.5)",
          "circle-opacity": 1,
        },
      });

      // Tambahkan layer untuk menampilkan jumlah properti dalam cluster
      map.current.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "properties",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 14,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      // Tambahkan layer untuk marker properti FOR SALE
      map.current.addLayer({
        id: "unclustered-point-sale",
        type: "circle",
        source: "properties",
        filter: [
          "all",
          ["!", ["has", "point_count"]],
          ["==", ["get", "status"], "FOR SALE"],
        ],
        paint: {
          "circle-color": "#dc2626", // Merah solid
          "circle-radius": 15,
          "circle-stroke-width": 3,
          "circle-stroke-color": "rgba(220, 38, 38, 0.3)", // Merah transparan
        },
      });

      // Tambahkan layer untuk marker properti FOR LEASE
      map.current.addLayer({
        id: "unclustered-point-lease",
        type: "circle",
        source: "properties",
        filter: [
          "all",
          ["!", ["has", "point_count"]],
          ["==", ["get", "status"], "FOR LEASE"],
        ],
        paint: {
          "circle-color": "#2563eb", // Biru solid
          "circle-radius": 15,
          "circle-stroke-width": 3,
          "circle-stroke-color": "rgba(37, 99, 235, 0.3)", // Biru transparan
        },
      });

      // Tambahkan layer untuk teks "S" pada marker FOR SALE
      map.current.addLayer({
        id: "unclustered-label-sale",
        type: "symbol",
        source: "properties",
        filter: [
          "all",
          ["!", ["has", "point_count"]],
          ["==", ["get", "status"], "FOR SALE"],
        ],
        layout: {
          "text-field": "S",
          "text-font": ["DIN Offc Pro Bold", "Arial Unicode MS Bold"],
          "text-size": 14,
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      // Tambahkan layer untuk teks "L" pada marker FOR LEASE
      map.current.addLayer({
        id: "unclustered-label-lease",
        type: "symbol",
        source: "properties",
        filter: [
          "all",
          ["!", ["has", "point_count"]],
          ["==", ["get", "status"], "FOR LEASE"],
        ],
        layout: {
          "text-field": "L",
          "text-font": ["DIN Offc Pro Bold", "Arial Unicode MS Bold"],
          "text-size": 14,
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      // Tambahkan layer untuk ID properti di bawah marker
      map.current.addLayer({
        id: "unclustered-id",
        type: "symbol",
        source: "properties",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "text-field": "{id}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Regular"],
          "text-size": 10,
          "text-offset": [0, 1.5], // Offset ke bawah
        },
        paint: {
          "text-color": "#666666",
        },
      });

      // Setup event handlers
      setupEventHandlers();
    } catch (error) {
      console.error("Error setting up map layers:", error);
    }
  };

  // Fungsi untuk setup event handlers
  const setupEventHandlers = () => {
    if (!map.current) return;

    try {
      // Tambahkan event click untuk cluster
      map.current.on("click", "clusters", (e) => {
        try {
          const features = map.current.queryRenderedFeatures(e.point, {
            layers: ["clusters"],
          });

          if (!features.length || !features[0].properties) return;

          const clusterId = features[0].properties.cluster_id;
          const source = map.current.getSource("properties");

          source.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;

            const coordinates = features[0].geometry.coordinates;
            if (!coordinates) return;

            map.current.easeTo({
              center: coordinates,
              zoom: zoom,
            });
          });
        } catch (error) {
          console.error("Error handling cluster click:", error);
        }
      });

      // Tambahkan event click untuk marker properti
      const handleMarkerClick = (e) => {
        try {
          const features = map.current.queryRenderedFeatures(e.point, {
            layers: ["unclustered-point-sale", "unclustered-point-lease"],
          });

          if (!features.length || !features[0].properties) return;

          const feature = features[0];
          const props = feature.properties;

          // Cari properti yang sesuai dengan ID
          const property = properties.find((p) => p.id === Number(props.id));
          if (property) {
            setActiveProperty(property);

            // On mobile, switch to list view when a marker is clicked
            if (window.innerWidth < 1024) {
              setMobileView("list");
            }

            // Check if the property is in the currently displayed properties
            const propertyIndex = visibleProperties.findIndex(
              (p) => p.id === property.id
            );

            if (propertyIndex >= 0) {
              // Calculate how many items we need to load to make this property visible
              const requiredDisplayCount = propertyIndex + 1;

              // If the property is not yet loaded in the displayed list, load more properties
              if (requiredDisplayCount > displayCount) {
                // Set loading state
                setIsLoading(true);

                // Update display count to include the clicked property
                setDisplayCount(requiredDisplayCount);

                // Use setTimeout to allow the DOM to update before scrolling
                setTimeout(() => {
                  const propertyCardRef = propertyCardRefs.current[property.id];
                  if (propertyCardRef) {
                    propertyCardRef.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }
                  setIsLoading(false);

                  // Update hasMore state
                  setHasMore(requiredDisplayCount < visibleProperties.length);
                }, 100);
              } else {
                // Property is already loaded, just scroll to it
                const propertyCardRef = propertyCardRefs.current[property.id];
                if (propertyCardRef) {
                  propertyCardRef.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }
              }
            }

            // Buat popup
            if (popupRef.current) popupRef.current.remove();

            const coordinates = feature.geometry.coordinates;
            if (!coordinates) return;

            popupRef.current = new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(
                `
                <div class="popup">
                  <h3>${props.title}</h3>
                  <p>${props.price}</p>
                  <p>${props.address}</p>
                  ${
                    props.type
                      ? `<p class="text-xs mt-1">${props.type}</p>`
                      : ""
                  }
                </div>
              `
              )
              .addTo(map.current);
          }
        } catch (error) {
          console.error("Error handling marker click:", error);
        }
      };

      map.current.on("click", "unclustered-point-sale", handleMarkerClick);
      map.current.on("click", "unclustered-point-lease", handleMarkerClick);

      // Ubah cursor saat hover di atas marker
      map.current.on("mouseenter", "clusters", () => {
        if (map.current) map.current.getCanvas().style.cursor = "pointer";
      });

      map.current.on("mouseleave", "clusters", () => {
        if (map.current) map.current.getCanvas().style.cursor = "";
      });

      map.current.on("mouseenter", "unclustered-point-sale", () => {
        if (map.current) map.current.getCanvas().style.cursor = "pointer";
      });

      map.current.on("mouseleave", "unclustered-point-sale", () => {
        if (map.current) map.current.getCanvas().style.cursor = "";
      });

      map.current.on("mouseenter", "unclustered-point-lease", () => {
        if (map.current) map.current.getCanvas().style.cursor = "pointer";
      });

      map.current.on("mouseleave", "unclustered-point-lease", () => {
        if (map.current) map.current.getCanvas().style.cursor = "";
      });
    } catch (error) {
      console.error("Error setting up event handlers:", error);
    }
  };

  // Load more properties when user scrolls to bottom
  const loadMoreProperties = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    // Simulate loading delay
    setTimeout(() => {
      setDisplayCount((prevCount) => {
        const newCount = prevCount + PROPERTIES_PER_PAGE;
        setHasMore(newCount < visibleProperties.length);
        return newCount;
      });
      setIsLoading(false);
    }, 500);
  }, [isLoading, hasMore, visibleProperties.length]);

  // Setup intersection observer for infinite loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreProperties();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current = observer;

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMoreProperties, hasMore]);

  // Resize map when container size changes
  useEffect(() => {
    if (map.current && mapInitialized) {
      map.current.resize();
    }
  }, [mobileView, mapInitialized]);

  // Inisialisasi peta saat komponen dimount
  useEffect(() => {
    initializeMap();

    // Cleanup saat komponen unmount
    return () => {
      if (map.current) {
        map.current.off("moveend", filterPropertiesByViewport);
        map.current.off("zoomend", filterPropertiesByViewport);
        map.current.remove();
        map.current = null;
      }
      setMapInitialized(false);
    };
  }, []);

  // Update style peta ketika view berubah
  useEffect(() => {
    if (!map.current || !mapInitialized) return;

    try {
      // Hapus peta lama dan buat peta baru dengan style yang berbeda
      map.current.remove();
      map.current = null;
      setMapInitialized(false);
      initializeMap();
    } catch (error) {
      console.error("Error updating map style:", error);
    }
  }, [mapView]);

  // Filter properties based on search criteria
  useEffect(() => {
    const filtered = properties.filter((property) => {
      // Filter by location (case insensitive)
      const matchesLocation =
        !searchFilters.location ||
        property.address
          .toLowerCase()
          .includes(searchFilters.location.toLowerCase()) ||
        (property.fullAddress &&
          property.fullAddress
            .toLowerCase()
            .includes(searchFilters.location.toLowerCase())) ||
        property.title
          .toLowerCase()
          .includes(searchFilters.location.toLowerCase());

      // Filter by availability
      const matchesAvailability =
        searchFilters.availability === "ALL" ||
        property.status === searchFilters.availability;

      // Filter by property type
      const matchesPropertyType =
        searchFilters.propertyType === "ALL" ||
        (property.type && property.type === searchFilters.propertyType);

      return matchesLocation && matchesAvailability && matchesPropertyType;
    });

    setFilteredProperties(filtered);

    // Also update visible properties when filters change
    setVisibleProperties(filtered);

    // Reset display count when filters change
    setDisplayCount(PROPERTIES_PER_PAGE);
    setHasMore(filtered.length > PROPERTIES_PER_PAGE);

    // Update map data if map is initialized
    if (map.current && mapInitialized) {
      updateMapData(filtered);
    }
  }, [searchFilters, mapInitialized]);

  // Function to update map data based on filtered properties
  const updateMapData = (filteredProps) => {
    if (!map.current) return;

    try {
      // Update the GeoJSON source with filtered properties
      const source = map.current.getSource("properties");
      if (source) {
        source.setData({
          type: "FeatureCollection",
          features: filteredProps.map((property) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [property.longitude, property.latitude],
            },
            properties: {
              id: property.id,
              title: property.title,
              price: property.price,
              status: property.status,
              address: property.address,
              image: property.image,
              type: property.type || "UNKNOWN",
            },
          })),
        });
      }

      // If there are filtered properties, fit the map to show all of them
      if (
        filteredProps.length > 0 &&
        filteredProps.length < properties.length
      ) {
        const bounds = new mapboxgl.LngLatBounds();

        filteredProps.forEach((property) => {
          bounds.extend([property.longitude, property.latitude]);
        });

        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15,
        });
      }
    } catch (error) {
      console.error("Error updating map data:", error);
    }
  };

  // Get the properties to display with infinite loading
  const displayedProperties = visibleProperties.slice(0, displayCount);

  return (
    <main className="flex min-h-screen flex-col">
      <div className="p-4">
        <SearchFilters
          onSearch={(filters) => setSearchFilters(filters)}
          onReset={() => {
            setSearchFilters({
              location: "",
              availability: "ALL",
              propertyType: "ALL",
            });
            if (map.current && mapInitialized) {
              map.current.flyTo({
                center: [-95.7129, 37.0902],
                zoom: 3,
                essential: true,
              });
            }
          }}
        />
      </div>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px-80px)]">
        {/* Daftar Properti */}
        <div
          className={`w-full lg:w-1/3 overflow-y-auto p-4 border-r ${
            mobileView === "map" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Daftar Properti</h1>
            <div className="text-sm text-gray-500">
              Menampilkan {Math.min(displayCount, visibleProperties.length)}{" "}
              dari {visibleProperties.length} properti
              {filteredProperties.length < properties.length &&
                ` (${properties.length} total)`}
            </div>
          </div>

          {visibleProperties.length > 0 ? (
            <div className="grid gap-6">
              {displayedProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  isActive={activeProperty?.id === property.id}
                  ref={(el) => (propertyCardRefs.current[property.id] = el)}
                  onClick={() => {
                    setActiveProperty(property);
                    if (map.current && mapInitialized) {
                      map.current.flyTo({
                        center: [property.longitude, property.latitude],
                        zoom: 15,
                        essential: true,
                      });

                      // On mobile, switch to map view when a property card is clicked
                      if (window.innerWidth < 1024) {
                        setMobileView("map");
                      }
                    }
                  }}
                />
              ))}

              {/* Loading indicator and observer target */}
              {visibleProperties.length > 0 && (
                <div ref={loadingRef} className="w-full">
                  {isLoading && <LoadingSpinner />}
                  {!isLoading &&
                    !hasMore &&
                    visibleProperties.length > PROPERTIES_PER_PAGE && (
                      <p className="text-center text-gray-500 py-4">
                        Semua properti telah ditampilkan
                      </p>
                    )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-gray-500 mb-2">
                Tidak ada properti yang terlihat di area ini
              </p>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                onClick={() => {
                  setSearchFilters({
                    location: "",
                    availability: "ALL",
                    propertyType: "ALL",
                  });
                  if (map.current && mapInitialized) {
                    map.current.flyTo({
                      center: [-95.7129, 37.0902],
                      zoom: 3,
                      essential: true,
                    });
                  }
                }}
              >
                Tampilkan Semua Properti
              </button>
            </div>
          )}
        </div>

        {/* Peta */}
        <div
          className={`w-full lg:w-2/3 relative ${
            mobileView === "list" ? "hidden lg:block" : "block"
          }`}
          style={{
            height: mobileView === "map" ? "calc(100vh - 64px - 80px)" : "100%",
          }}
        >
          <MapToggle
            currentView={mapView}
            onChange={(view) => setMapView(view)}
          />
          <div ref={mapContainer} className="w-full h-full" />
        </div>
      </div>

      {/* Mobile View Toggle */}
      <MobileViewToggle currentView={mobileView} onChange={setMobileView} />
    </main>
  );
}
