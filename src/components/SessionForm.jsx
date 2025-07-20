import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { paceGroupService } from '../services/paceGroupService';
import { convertPace, convertDistance, DISTANCE_UNITS } from '../utils/unitConversion';
import toast from 'react-hot-toast';

const { FiCalendar, FiClock, FiMapPin, FiUsers, FiActivity, FiPlus, FiTrash2, FiCheck, FiTarget, FiInfo, FiList, FiSliders, FiLayers } = FiIcons;

function SessionForm({ initialData, onSubmit, isEdit = false }) {
  const { user } = useAuth();
  const { distanceUnit } = useSettings();
  const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'route', 'paceGroups', 'additional'
  const [sessionData, setSessionData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    endTime: '',
    location: '',
    maxAttendees: 20,
    startLocationName: '',
    startLocationAddress: '',
    routeType: 'flexible',
    totalDistance: '',
    runType: 'easy',
    paceMin: '',
    paceMax: '',
    difficulty: 'beginner',
    waitlistEnabled: false,
    specialInstructions: '',
    requiredGear: []
  });

  const [paceGroups, setPaceGroups] = useState([]);
  const [standardPaceGroups, setStandardPaceGroups] = useState([]);
  const [selectedStandardGroups, setSelectedStandardGroups] = useState([]);
  const [newPaceGroup, setNewPaceGroup] = useState({
    name: '',
    minPace: '',
    maxPace: '',
    description: '',
    requiredPacers: 1,
    shadowSlots: 1
  });
  const [newGearItem, setNewGearItem] = useState('');
  const [loadingPaceGroups, setLoadingPaceGroups] = useState(false);

  useEffect(() => {
    loadStandardPaceGroups();
  }, []);

  useEffect(() => {
    if (initialData && isEdit) {
      // Convert pace values from storage unit (km) to display unit if needed
      let paceMinForDisplay = initialData.paceMin;
      let paceMaxForDisplay = initialData.paceMax;
      let totalDistanceForDisplay = initialData.totalDistance;

      if (distanceUnit === DISTANCE_UNITS.MILES) {
        if (paceMinForDisplay) {
          paceMinForDisplay = convertPace(initialData.paceMin, DISTANCE_UNITS.KILOMETERS, DISTANCE_UNITS.MILES);
        }
        if (paceMaxForDisplay) {
          paceMaxForDisplay = convertPace(initialData.paceMax, DISTANCE_UNITS.KILOMETERS, DISTANCE_UNITS.MILES);
        }
        if (totalDistanceForDisplay) {
          totalDistanceForDisplay = convertDistance(initialData.totalDistance, DISTANCE_UNITS.KILOMETERS, DISTANCE_UNITS.MILES);
        }
      }

      // Set the session data with converted values
      setSessionData({
        ...initialData,
        paceMin: paceMinForDisplay,
        paceMax: paceMaxForDisplay,
        totalDistance: totalDistanceForDisplay,
        requiredGear: initialData.requiredGear || []
      });

      // If there are pace groups, convert their pace values too
      if (initialData.paceGroups && initialData.paceGroups.length > 0) {
        const convertedPaceGroups = initialData.paceGroups.map(group => {
          if (distanceUnit === DISTANCE_UNITS.MILES) {
            return {
              ...group,
              minPace: convertPace(group.minPace, DISTANCE_UNITS.KILOMETERS, DISTANCE_UNITS.MILES),
              maxPace: convertPace(group.maxPace, DISTANCE_UNITS.KILOMETERS, DISTANCE_UNITS.MILES)
            };
          }
          return group;
        });
        setPaceGroups(convertedPaceGroups);
      }
    }
  }, [initialData, isEdit, distanceUnit]);

  const loadStandardPaceGroups = async () => {
    try {
      const groups = await paceGroupService.getStandardPaceGroups();
      setStandardPaceGroups(groups.filter(g => g.isActive));
    } catch (error) {
      console.error('Failed to load standard pace groups:', error);
    }
  };

  const formatPace = (pace) => {
    if (!pace) return 'N/A';
    
    // Convert from storage unit (km) to display unit if needed
    let displayPace = pace;
    if (distanceUnit === DISTANCE_UNITS.MILES) {
      displayPace = convertPace(pace, DISTANCE_UNITS.KILOMETERS, DISTANCE_UNITS.MILES);
    }
    
    const minutes = Math.floor(displayPace);
    const seconds = Math.round((displayPace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSelectStandardGroup = (groupId) => {
    const isSelected = selectedStandardGroups.includes(groupId);
    
    if (isSelected) {
      // Remove the group
      setSelectedStandardGroups(selectedStandardGroups.filter(id => id !== groupId));
      // Remove the pace group from sessionData
      setPaceGroups(paceGroups.filter(group => group.standardGroupId !== groupId));
    } else {
      // Add the group
      setSelectedStandardGroups([...selectedStandardGroups, groupId]);
      
      // Find the standard group
      const standardGroup = standardPaceGroups.find(g => g.id === groupId);
      if (standardGroup) {
        // Convert pace values to display unit if needed
        let minPaceDisplay = standardGroup.minPace;
        let maxPaceDisplay = standardGroup.maxPace;
        
        if (distanceUnit === DISTANCE_UNITS.MILES) {
          minPaceDisplay = convertPace(standardGroup.minPace, DISTANCE_UNITS.KILOMETERS, DISTANCE_UNITS.MILES);
          maxPaceDisplay = convertPace(standardGroup.maxPace, DISTANCE_UNITS.KILOMETERS, DISTANCE_UNITS.MILES);
        }
        
        // Add as a new pace group
        const newPaceGroup = {
          standardGroupId: standardGroup.id,
          name: standardGroup.name,
          minPace: minPaceDisplay,
          maxPace: maxPaceDisplay,
          description: standardGroup.description,
          requiredPacers: 1,
          shadowSlots: 1
        };
        setPaceGroups([...paceGroups, newPaceGroup]);
      }
    }
  };

  const suggestPaceGroups = async () => {
    if (!sessionData.paceMin || !sessionData.paceMax) {
      toast.error('Please set session pace range first');
      return;
    }
    
    try {
      setLoadingPaceGroups(true);
      
      // Fallback method - filter standard pace groups manually
      const allGroups = standardPaceGroups;
      const suggestedGroups = allGroups.filter(group => {
        // Convert to common unit (km) for comparison
        let groupMinKm = group.minPace;
        let groupMaxKm = group.maxPace;
        let sessionMinKm = sessionData.paceMin;
        let sessionMaxKm = sessionData.paceMax;
        
        if (distanceUnit === DISTANCE_UNITS.MILES) {
          sessionMinKm = convertPace(sessionData.paceMin, DISTANCE_UNITS.MILES, DISTANCE_UNITS.KILOMETERS);
          sessionMaxKm = convertPace(sessionData.paceMax, DISTANCE_UNITS.MILES, DISTANCE_UNITS.KILOMETERS);
        }
        
        // Check if there's any overlap between session pace and group pace
        return (groupMinKm <= sessionMaxKm && groupMaxKm >= sessionMinKm);
      });
      
      if (suggestedGroups && suggestedGroups.length > 0) {
        // Clear existing selections
        setSelectedStandardGroups([]);
        setPaceGroups([]);
        
        // Mark these groups as selected in the UI
        const groupIds = suggestedGroups.map(group => group.id);
        setSelectedStandardGroups(groupIds);
        
        // Add these groups to the session's pace groups
        setPaceGroups(suggestedGroups.map(group => {
          // Convert pace values to display unit if needed
          let minPaceDisplay = group.minPace;
          let maxPaceDisplay = group.maxPace;
          
          if (distanceUnit === DISTANCE_UNITS.MILES) {
            minPaceDisplay = convertPace(group.minPace, DISTANCE_UNITS.KILOMETERS, DISTANCE_UNITS.MILES);
            maxPaceDisplay = convertPace(group.maxPace, DISTANCE_UNITS.KILOMETERS, DISTANCE_UNITS.MILES);
          }
          
          return {
            standardGroupId: group.id,
            name: group.name,
            minPace: minPaceDisplay,
            maxPace: maxPaceDisplay,
            description: group.description || '',
            requiredPacers: 1,
            shadowSlots: 1
          };
        }));
        
        toast.success(`Added ${suggestedGroups.length} suggested pace groups`);
      } else {
        toast.info('No matching pace groups found');
      }
    } catch (error) {
      console.error('Failed to suggest pace groups:', error);
      toast.error('Failed to suggest pace groups');
    } finally {
      setLoadingPaceGroups(false);
    }
  };

  const handleAddPaceGroup = () => {
    if (!newPaceGroup.name || !newPaceGroup.minPace || !newPaceGroup.maxPace) {
      toast.error('Please fill in all required fields for the pace group');
      return;
    }

    // Convert pace values from display unit to storage unit (km) if user is using miles
    let minPaceForStorage = newPaceGroup.minPace;
    let maxPaceForStorage = newPaceGroup.maxPace;
    
    if (distanceUnit === DISTANCE_UNITS.MILES) {
      minPaceForStorage = convertPace(newPaceGroup.minPace, DISTANCE_UNITS.MILES, DISTANCE_UNITS.KILOMETERS);
      maxPaceForStorage = convertPace(newPaceGroup.maxPace, DISTANCE_UNITS.MILES, DISTANCE_UNITS.KILOMETERS);
    }

    // Add the new pace group (keep display values for UI)
    setPaceGroups([
      ...paceGroups,
      {
        ...newPaceGroup,
        minPace: newPaceGroup.minPace, // Keep display values for form
        maxPace: newPaceGroup.maxPace,
        minPaceStorage: minPaceForStorage, // Store converted values separately
        maxPaceStorage: maxPaceForStorage,
        id: Date.now().toString()
      }
    ]);

    // Reset the form
    setNewPaceGroup({
      name: '',
      minPace: '',
      maxPace: '',
      description: '',
      requiredPacers: 1,
      shadowSlots: 1
    });
    toast.success('Pace group added');
  };

  const handleRemovePaceGroup = (index) => {
    const group = paceGroups[index];
    if (group.standardGroupId) {
      setSelectedStandardGroups(selectedStandardGroups.filter(id => id !== group.standardGroupId));
    }
    setPaceGroups(paceGroups.filter((_, i) => i !== index));
  };

  const handleAddGear = () => {
    if (newGearItem.trim()) {
      setSessionData({
        ...sessionData,
        requiredGear: [...sessionData.requiredGear, newGearItem.trim()]
      });
      setNewGearItem('');
    }
  };

  const handleRemoveGear = (index) => {
    const updatedGear = sessionData.requiredGear.filter((_, i) => i !== index);
    setSessionData({
      ...sessionData,
      requiredGear: updatedGear
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert pace values from display unit to storage unit (km) if user is using miles
    let paceMinForStorage = sessionData.paceMin;
    let paceMaxForStorage = sessionData.paceMax;
    let totalDistanceInKm = sessionData.totalDistance;
    
    if (distanceUnit === DISTANCE_UNITS.MILES) {
      if (paceMinForStorage) {
        paceMinForStorage = convertPace(sessionData.paceMin, DISTANCE_UNITS.MILES, DISTANCE_UNITS.KILOMETERS);
      }
      if (paceMaxForStorage) {
        paceMaxForStorage = convertPace(sessionData.paceMax, DISTANCE_UNITS.MILES, DISTANCE_UNITS.KILOMETERS);
      }
      if (totalDistanceInKm) {
        totalDistanceInKm = convertDistance(sessionData.totalDistance, DISTANCE_UNITS.MILES, DISTANCE_UNITS.KILOMETERS);
      }
    }

    // Convert pace groups to storage units
    const paceGroupsForStorage = paceGroups.map(group => {
      let minPaceStorage = group.minPace;
      let maxPaceStorage = group.maxPace;
      
      // Use stored values if available, otherwise convert display values
      if (group.minPaceStorage && group.maxPaceStorage) {
        minPaceStorage = group.minPaceStorage;
        maxPaceStorage = group.maxPaceStorage;
      } else if (distanceUnit === DISTANCE_UNITS.MILES) {
        minPaceStorage = convertPace(group.minPace, DISTANCE_UNITS.MILES, DISTANCE_UNITS.KILOMETERS);
        maxPaceStorage = convertPace(group.maxPace, DISTANCE_UNITS.MILES, DISTANCE_UNITS.KILOMETERS);
      }
      
      return {
        ...group,
        minPace: minPaceStorage,
        maxPace: maxPaceStorage
      };
    });

    // Include pace groups in session data
    const finalSessionData = {
      ...sessionData,
      paceMin: paceMinForStorage,
      paceMax: paceMaxForStorage,
      totalDistance: totalDistanceInKm,
      paceGroups: paceGroupsForStorage,
      creatorEmail: user?.email
    };
    
    onSubmit(finalSessionData);
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: FiInfo },
    { id: 'route', label: 'Route & Pace', icon: FiActivity },
    { id: 'paceGroups', label: 'Pace Groups', icon: FiUsers },
    { id: 'additional', label: 'Additional', icon: FiSliders }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id 
                ? 'bg-white text-blue-600 shadow-sm font-medium' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <SafeIcon icon={tab.icon} className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Basic Information Tab */}
      {activeTab === 'basic' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Title *</label>
              <input
                type="text"
                value={sessionData.title}
                onChange={(e) => setSessionData({ ...sessionData, title: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Attendees *</label>
              <input
                type="number"
                value={sessionData.maxAttendees}
                onChange={(e) => setSessionData({ ...sessionData, maxAttendees: parseInt(e.target.value) })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={sessionData.description}
              onChange={(e) => setSessionData({ ...sessionData, description: e.target.value })}
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={sessionData.date}
                onChange={(e) => setSessionData({ ...sessionData, date: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
              <input
                type="time"
                value={sessionData.time}
                onChange={(e) => setSessionData({ ...sessionData, time: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={sessionData.endTime}
                onChange={(e) => setSessionData({ ...sessionData, endTime: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location Name *</label>
              <input
                type="text"
                value={sessionData.startLocationName || sessionData.location}
                onChange={(e) => setSessionData({
                  ...sessionData,
                  startLocationName: e.target.value,
                  location: e.target.value
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Central Park Main Entrance"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={sessionData.startLocationAddress}
                onChange={(e) => setSessionData({ ...sessionData, startLocationAddress: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Full address (optional)"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Route & Pace Tab */}
      {activeTab === 'route' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Run Type</label>
              <select
                value={sessionData.runType}
                onChange={(e) => setSessionData({ ...sessionData, runType: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="easy">Easy Run</option>
                <option value="tempo">Tempo Run</option>
                <option value="interval">Interval Training</option>
                <option value="long-slow">Long Slow Distance</option>
                <option value="trail">Trail Running</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={sessionData.difficulty}
                onChange={(e) => setSessionData({ ...sessionData, difficulty: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route Type</label>
              <select
                value={sessionData.routeType}
                onChange={(e) => setSessionData({ ...sessionData, routeType: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="flexible">Flexible</option>
                <option value="predefined">Predefined</option>
                <option value="structured">Structured</option>
                <option value="out-and-back">Out and Back</option>
                <option value="loop">Loop</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Distance ({distanceUnit})</label>
              <input
                type="number"
                value={sessionData.totalDistance || ''}
                onChange={(e) => setSessionData({ ...sessionData, totalDistance: e.target.value ? parseFloat(e.target.value) : '' })}
                step="0.1"
                min="0"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`e.g., ${distanceUnit === DISTANCE_UNITS.KILOMETERS ? '5.0' : '3.1'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Pace (min/{distanceUnit})
              </label>
              <input
                type="number"
                value={sessionData.paceMin || ''}
                onChange={(e) => setSessionData({ ...sessionData, paceMin: e.target.value ? parseFloat(e.target.value) : '' })}
                step="0.1"
                min={distanceUnit === DISTANCE_UNITS.KILOMETERS ? "3" : "5"}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={distanceUnit === DISTANCE_UNITS.KILOMETERS ? "e.g., 5.0" : "e.g., 8.0"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Pace (min/{distanceUnit})
              </label>
              <input
                type="number"
                value={sessionData.paceMax || ''}
                onChange={(e) => setSessionData({ ...sessionData, paceMax: e.target.value ? parseFloat(e.target.value) : '' })}
                step="0.1"
                min={distanceUnit === DISTANCE_UNITS.KILOMETERS ? "3" : "5"}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={distanceUnit === DISTANCE_UNITS.KILOMETERS ? "e.g., 5.5" : "e.g., 8.5"}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="waitlistEnabled"
              checked={sessionData.waitlistEnabled}
              onChange={(e) => setSessionData({ ...sessionData, waitlistEnabled: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="waitlistEnabled" className="text-sm text-gray-700">
              Enable waitlist when session is full
            </label>
          </div>
        </motion.div>
      )}

      {/* Pace Groups Tab */}
      {activeTab === 'paceGroups' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pace Groups</h3>
            <button
              type="button"
              onClick={suggestPaceGroups}
              disabled={!sessionData.paceMin || !sessionData.paceMax || loadingPaceGroups}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loadingPaceGroups ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Suggesting...</span>
                </>
              ) : (
                <>
                  <SafeIcon icon={FiTarget} className="w-4 h-4" />
                  <span>Suggest Pace Groups</span>
                </>
              )}
            </button>
          </div>

          {/* Standard Pace Groups Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select from Standard Pace Groups
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {standardPaceGroups.map(group => (
                <div
                  key={group.id}
                  onClick={() => handleSelectStandardGroup(group.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedStandardGroups.includes(group.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{group.name}</h4>
                      <p className="text-sm text-gray-600">
                        {formatPace(group.minPace)} - {formatPace(group.maxPace)} min/{distanceUnit}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border ${
                        selectedStandardGroups.includes(group.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-400'
                      }`}
                    >
                      {selectedStandardGroups.includes(group.id) && (
                        <SafeIcon icon={FiCheck} className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Pace Group Form */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-medium text-gray-900 mb-3">Add Custom Pace Group</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                <input
                  type="text"
                  value={newPaceGroup.name}
                  onChange={(e) => setNewPaceGroup({ ...newPaceGroup, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Fast Group"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newPaceGroup.description}
                  onChange={(e) => setNewPaceGroup({ ...newPaceGroup, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Optional description"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Pace (min/{distanceUnit})
                </label>
                <input
                  type="number"
                  value={newPaceGroup.minPace}
                  onChange={(e) => setNewPaceGroup({ ...newPaceGroup, minPace: parseFloat(e.target.value) || '' })}
                  step="0.1"
                  min={distanceUnit === DISTANCE_UNITS.KILOMETERS ? "3" : "5"}
                  max={distanceUnit === DISTANCE_UNITS.KILOMETERS ? "15" : "24"}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder={distanceUnit === DISTANCE_UNITS.KILOMETERS ? "e.g., 5.0" : "e.g., 8.0"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Pace (min/{distanceUnit})
                </label>
                <input
                  type="number"
                  value={newPaceGroup.maxPace}
                  onChange={(e) => setNewPaceGroup({ ...newPaceGroup, maxPace: parseFloat(e.target.value) || '' })}
                  step="0.1"
                  min={distanceUnit === DISTANCE_UNITS.KILOMETERS ? "3" : "5"}
                  max={distanceUnit === DISTANCE_UNITS.KILOMETERS ? "15" : "24"}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder={distanceUnit === DISTANCE_UNITS.KILOMETERS ? "e.g., 5.5" : "e.g., 8.5"}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Pacers</label>
                <input
                  type="number"
                  value={newPaceGroup.requiredPacers}
                  onChange={(e) => setNewPaceGroup({ ...newPaceGroup, requiredPacers: parseInt(e.target.value) || 1 })}
                  min="1"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shadow Slots</label>
                <input
                  type="number"
                  value={newPaceGroup.shadowSlots}
                  onChange={(e) => setNewPaceGroup({ ...newPaceGroup, shadowSlots: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddPaceGroup}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <SafeIcon icon={FiPlus} className="w-4 h-4" />
              <span>Add Pace Group</span>
            </button>
          </div>

          {/* Selected Pace Groups */}
          {paceGroups.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Selected Pace Groups:</h4>
              {paceGroups.map((group, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{group.name}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemovePaceGroup(index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                    >
                      <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {formatPace(group.minPace)} - {formatPace(group.maxPace)} min/{distanceUnit}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div>{group.requiredPacers} pacers required</div>
                    <div>{group.shadowSlots} shadow slots</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Additional Tab */}
      {activeTab === 'additional' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
            <textarea
              value={sessionData.specialInstructions}
              onChange={(e) => setSessionData({ ...sessionData, specialInstructions: e.target.value })}
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any special instructions for participants..."
            />
          </div>

          {/* Required Gear */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Required Gear</label>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={newGearItem}
                onChange={(e) => setNewGearItem(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddGear();
                  }
                }}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add required gear item..."
              />
              <button
                type="button"
                onClick={handleAddGear}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <SafeIcon icon={FiPlus} className="w-4 h-4" />
              </button>
            </div>
            {sessionData.requiredGear.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {sessionData.requiredGear.map((item, index) => (
                  <span key={index} className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGear(index)}
                      className="w-4 h-4 flex items-center justify-center text-blue-700 hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {isEdit ? 'Update Session' : 'Create Session'}
        </button>
      </div>
    </form>
  );
}

export default SessionForm;