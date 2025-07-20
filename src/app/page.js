"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, ThermometerIcon, Waves } from "lucide-react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [marineData, setMarineData] = useState(null);

  // Search for locations using Open Meteo Geocoding API
  const searchLocations = async (query) => {
    if (!query.trim()) {
      setLocations([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`
      );
      const data = await response.json();
      setLocations(data.results || []);
    } catch (error) {
      console.error("Error searching locations:", error);
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get weather data for selected location
  const getWeatherData = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
      );
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      console.error("Error fetching weather data:", error);
      setWeatherData(null);
    }
  };

  // Get marine weather data for selected location
  const getMarineData = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&current=wave_height,sea_surface_temperature`
      );
      const data = await response.json();
      
      // Check if marine data is available
      if (data.current && (data.current.wave_height !== null || data.current.sea_surface_temperature !== null)) {
        setMarineData(data);
      } else {
        setMarineData({ noData: true });
      }
    } catch (error) {
      console.error("Error fetching marine data:", error);
      setMarineData({ noData: true });
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchLocations(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    getWeatherData(location.latitude, location.longitude);
    getMarineData(location.latitude, location.longitude);
    setLocations([]);
    setSearchQuery(location.name);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">SurfApp</h1>
        <p className="text-muted-foreground mb-4">
          Search for locations and get weather & marine conditions
        </p>
      </div>

      {/* Search Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Location Search
          </CardTitle>
          <CardDescription>
            Search for any city or location worldwide
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Input
              type="text"
              placeholder="Enter city name (e.g., New York, London, Tokyo)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            
            {/* Search Results Dropdown */}
            {(isLoading || locations.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  locations.map((location) => (
                    <div
                      key={`${location.latitude}-${location.longitude}`}
                      className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                      onClick={() => handleLocationSelect(location)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{location.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {location.admin1 && `${location.admin1}, `}
                            {location.country}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {location.feature_code && (
                            <Badge variant="secondary" className="text-xs">
                              {location.feature_code}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Location and Weather */}
      {selectedLocation && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Location Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{selectedLocation.name}</h3>
                <p className="text-muted-foreground">
                  {selectedLocation.admin1 && `${selectedLocation.admin1}, `}
                  {selectedLocation.country}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm font-medium">Latitude</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedLocation.latitude.toFixed(4)}°
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Longitude</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedLocation.longitude.toFixed(4)}°
                  </p>
                </div>
                {selectedLocation.elevation && (
                  <>
                    <div>
                      <p className="text-sm font-medium">Elevation</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedLocation.elevation}m
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Timezone</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedLocation.timezone || "UTC"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Weather Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ThermometerIcon className="h-5 w-5" />
                Current Weather
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weatherData ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {Math.round(weatherData.current.temperature_2m)}°C
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Wind: {weatherData.current.wind_speed_10m} km/h
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center">
                      <p className="text-sm font-medium">Today&apos;s High</p>
                      <p className="text-lg font-semibold">
                        {Math.round(weatherData.daily.temperature_2m_max[0])}&deg;C
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Today&apos;s Low</p>
                      <p className="text-lg font-semibold">
                        {Math.round(weatherData.daily.temperature_2m_min[0])}°C
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-20 mx-auto" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Marine Weather Info */}
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Waves className="h-5 w-5" />
                Marine Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {marineData ? (
                marineData.noData ? (
                  <div className="py-8 text-center">
                    <div className="text-muted-foreground mb-2">
                      <Waves className="h-12 w-12 mx-auto opacity-30 mb-3" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Marine data not available for this location.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This location may be inland or marine conditions are not monitored here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {marineData.current.wave_height !== null ? `${marineData.current.wave_height}m` : 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Wave Height
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {marineData.current.sea_surface_temperature !== null ? `${Math.round(marineData.current.sea_surface_temperature)}°C` : 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Sea Temperature
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground text-center">
                        Updated: {new Date(marineData.current.time).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center space-y-2">
                      <Skeleton className="h-8 w-12 mx-auto" />
                      <Skeleton className="h-4 w-16 mx-auto" />
                    </div>
                    <div className="text-center space-y-2">
                      <Skeleton className="h-8 w-12 mx-auto" />
                      <Skeleton className="h-4 w-20 mx-auto" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-32 mx-auto" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* No results message */}
      {searchQuery && !isLoading && locations.length === 0 && !selectedLocation && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No locations found for "{searchQuery}". Try a different search term.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
