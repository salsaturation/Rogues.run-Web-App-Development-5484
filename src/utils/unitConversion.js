// Unit conversion utilities
export const DISTANCE_UNITS = {
  KILOMETERS: 'km',
  MILES: 'mi'
};

// Convert kilometers to miles
export const kmToMiles = (km) => {
  if (!km || isNaN(km)) return 0;
  return Number((km * 0.621371).toFixed(2));
};

// Convert miles to kilometers
export const milesToKm = (miles) => {
  if (!miles || isNaN(miles)) return 0;
  return Number((miles * 1.60934).toFixed(2));
};

// Convert pace from min/km to min/mile or vice versa
export const convertPace = (pace, fromUnit, toUnit) => {
  if (!pace || isNaN(pace)) return 0;
  
  if (fromUnit === DISTANCE_UNITS.KILOMETERS && toUnit === DISTANCE_UNITS.MILES) {
    // min/km to min/mile (multiply by 1.60934)
    return Number((pace * 1.60934).toFixed(2));
  } else if (fromUnit === DISTANCE_UNITS.MILES && toUnit === DISTANCE_UNITS.KILOMETERS) {
    // min/mile to min/km (divide by 1.60934)
    return Number((pace / 1.60934).toFixed(2));
  }
  
  return pace; // Same unit, no conversion needed
};

// Format pace display (e.g., "5:30 min/km")
export const formatPaceWithUnit = (pace, unit) => {
  if (!pace || isNaN(pace)) return 'N/A';
  
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')} min/${unit}`;
};

// Format distance with unit
export const formatDistanceWithUnit = (distance, unit) => {
  if (!distance || isNaN(distance)) return 'N/A';
  return `${Number(distance).toFixed(1)} ${unit}`;
};

// Convert distance based on preferred unit
export const convertDistance = (distance, fromUnit, toUnit) => {
  if (!distance || isNaN(distance)) return 0;
  
  if (fromUnit === toUnit) return Number(distance);
  
  if (fromUnit === DISTANCE_UNITS.KILOMETERS && toUnit === DISTANCE_UNITS.MILES) {
    return kmToMiles(distance);
  } else if (fromUnit === DISTANCE_UNITS.MILES && toUnit === DISTANCE_UNITS.KILOMETERS) {
    return milesToKm(distance);
  }
  
  return Number(distance);
};