{/* Add this import to SessionForm.jsx */}
import { useSettings } from '../contexts/SettingsContext';
import { convertDistance, convertPace, DISTANCE_UNITS } from '../utils/unitConversion';

{/* Add this line inside the SessionForm function component */}
const { distanceUnit } = useSettings();

{/* Update the formatting function to use the user's unit preference */}
const formatPace = (pace) => {
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);
  const paceStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  return `${paceStr} min/${distanceUnit}`;
};

{/* Add this helper function to SessionForm */}
// Convert distance input to km for storage
const convertDistanceToKm = (distance) => {
  if (!distance || isNaN(distance)) return distance;
  return distanceUnit === DISTANCE_UNITS.MILES ? 
    convertDistance(distance, DISTANCE_UNITS.MILES, DISTANCE_UNITS.KILOMETERS) : 
    distance;
};

{/* Update the handleSubmit function to convert units */}
const handleSubmit = (e) => {
  e.preventDefault();
  
  // Convert pace and distance values to km for storage
  const totalDistanceInKm = convertDistanceToKm(sessionData.totalDistance);
  
  // Include pace groups in session data
  const finalSessionData = {
    ...sessionData,
    totalDistance: totalDistanceInKm,
    paceGroups: paceGroups
  };
  
  onSubmit(finalSessionData);
};