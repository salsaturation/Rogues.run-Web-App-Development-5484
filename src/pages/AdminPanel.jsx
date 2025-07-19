{/* Add this to the AdminPanel.jsx file - add it where the Distance Unit setting is located */}

<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    <div className="flex items-center space-x-2">
      <SafeIcon icon={FiMapPin} className="w-4 h-4" />
      <span>Default Distance Unit</span>
    </div>
  </label>
  <select 
    value={clubSettings.distanceUnit} 
    onChange={(e) => setClubSettings({...clubSettings, distanceUnit: e.target.value})}
    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  >
    <option value={DISTANCE_UNITS.KILOMETERS}>Kilometers (km)</option>
    <option value={DISTANCE_UNITS.MILES}>Miles (mi)</option>
  </select>
  <p className="text-xs text-gray-500 mt-1">
    This is the default unit for displaying distances and paces. Users can override this in their profile settings.
  </p>
</div>