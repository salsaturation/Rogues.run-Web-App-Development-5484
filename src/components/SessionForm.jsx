import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import SessionTemplateModal from './SessionTemplateModal';
import { templateService } from '../services/templateService';
import { paceGroupService } from '../services/paceGroupService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const {
  FiMapPin, FiClock, FiCalendar, FiUsers, FiCheckCircle, 
  FiAlertCircle, FiThermometer, FiActivity, FiArrowUp, 
  FiArrowDown, FiShield, FiList, FiInfo, FiSave, FiTemplate,
  FiCopy, FiPlus, FiTrash2, FiRefreshCw
} = FiIcons;

function LocationPicker({ onLocationSelect, initialLocation }) {
  const [position, setPosition] = useState(initialLocation || [40.7128, -74.0060]); // Default to NYC

  function MapClickHandler() {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          name: 'Selected Location'
        });
      },
    });
    return null;
  }

  return (
    <div className="h-64 rounded-lg overflow-hidden">
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={position}>
          <Popup>Starting location</Popup>
        </Marker>
        <MapClickHandler />
      </MapContainer>
    </div>
  );
}

function SessionForm({ initialData, onSubmit, isEdit }) {
  const { user } = useAuth();
  const [sessionData, setSessionData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '07:00',
    endTime: '08:00',
    location: '',
    maxAttendees: 20,
    startLocationName: '',
    startLocationLat: null,
    startLocationLng: null,
    startLocationAddress: '',
    routeType: 'flexible',
    totalDistance: 5,
    runType: 'easy',
    paceMin: 6,
    paceMax: 7,
    difficulty: 'beginner',
    waitlistEnabled: false,
    specialInstructions: '',
    requiredGear: [],
    ...initialData,
  });

  const [currentGear, setCurrentGear] = useState('');
  const [activeSection, setActiveSection] = useState('basic');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateModalMode, setTemplateModalMode] = useState('select');
  const [paceGroups, setPaceGroups] = useState([]);
  const [showPaceGroupForm, setShowPaceGroupForm] = useState(false);
  const [editingPaceGroup, setEditingPaceGroup] = useState(null);
  const [paceGroupForm, setPaceGroupForm] = useState({
    name: '',
    minPace: 6.0,
    maxPace: 6.5,
    description: '',
    requiredPacers: 1,
    shadowSlots: 1
  });
  const [standardPaceGroups, setStandardPaceGroups] = useState([]);
  const [loadingStandardGroups, setLoadingStandardGroups] = useState(false);

  useEffect(() => {
    if (initialData) {
      setSessionData({
        ...sessionData,
        ...initialData,
      });
      
      // Load existing pace groups if editing
      if (isEdit && initialData.id) {
        loadPaceGroups(initialData.id);
      }
    }
    
    // Load standard pace groups
    loadStandardPaceGroups();
  }, [initialData]);

  const loadPaceGroups = async (sessionId) => {
    try {
      const groups = await paceGroupService.getPaceGroupsBySessionId(sessionId);
      setPaceGroups(groups);
    } catch (error) {
      console.error('Failed to load pace groups:', error);
    }
  };

  const loadStandardPaceGroups = async () => {
    try {
      setLoadingStandardGroups(true);
      const groups = await paceGroupService.getStandardPaceGroups();
      setStandardPaceGroups(groups.filter(g => g.isActive));
    } catch (error) {
      console.error('Failed to load standard pace groups:', error);
    } finally {
      setLoadingStandardGroups(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSessionData({
      ...sessionData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleLocationSelect = (location) => {
    setSessionData({
      ...sessionData,
      startLocationLat: location.latitude,
      startLocationLng: location.longitude,
      startLocationName: location.name || 'Selected Location'
    });
  };

  const handleAddGear = () => {
    if (currentGear.trim()) {
      setSessionData({
        ...sessionData,
        requiredGear: [...(sessionData.requiredGear || []), currentGear.trim()],
      });
      setCurrentGear('');
    }
  };

  const handleRemoveGear = (index) => {
    const updatedGear = [...sessionData.requiredGear];
    updatedGear.splice(index, 1);
    setSessionData({
      ...sessionData,
      requiredGear: updatedGear,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Include pace groups in session data
    const finalSessionData = {
      ...sessionData,
      paceGroups: paceGroups
    };
    
    onSubmit(finalSessionData);
  };

  const handleLoadFromTemplate = (template) => {
    const templateData = template.templateData;
    
    // Load session data from template
    setSessionData({
      ...sessionData,
      title: templateData.title,
      description: templateData.description,
      time: templateData.time,
      endTime: templateData.endTime,
      maxAttendees: templateData.maxAttendees,
      startLocationName: templateData.startLocationName,
      startLocationAddress: templateData.startLocationAddress,
      routeType: templateData.routeType,
      totalDistance: templateData.totalDistance,
      runType: templateData.runType,
      paceMin: templateData.paceMin,
      paceMax: templateData.paceMax,
      difficulty: templateData.difficulty,
      waitlistEnabled: templateData.waitlistEnabled,
      specialInstructions: templateData.specialInstructions,
      requiredGear: templateData.requiredGear || []
    });

    // Load pace groups from template
    if (templateData.paceGroups) {
      setPaceGroups(templateData.paceGroups.map(group => ({
        ...group,
        id: Date.now() + Math.random() // Temporary ID for new groups
      })));
    }

    setShowTemplateModal(false);
    toast.success(`Loaded template: ${template.name}`);
  };

  const handleSaveAsTemplate = async (templateInfo) => {
    try {
      await templateService.saveSessionAsTemplate(
        { ...sessionData, paceGroups },
        templateInfo.name,
        templateInfo.description,
        templateInfo.isPublic,
        user?.id,
        templateInfo.tags
      );
      setShowTemplateModal(false);
      toast.success('Session saved as template successfully');
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleAddPaceGroup = () => {
    if (editingPaceGroup !== null) {
      // Update existing pace group
      const updatedGroups = [...paceGroups];
      updatedGroups[editingPaceGroup] = {
        ...paceGroupForm,
        id: paceGroups[editingPaceGroup].id
      };
      setPaceGroups(updatedGroups);
      setEditingPaceGroup(null);
    } else {
      // Add new pace group
      const newGroup = {
        ...paceGroupForm,
        id: Date.now() + Math.random()
      };
      setPaceGroups([...paceGroups, newGroup]);
    }
    
    // Reset form
    setPaceGroupForm({
      name: '',
      minPace: 6.0,
      maxPace: 6.5,
      description: '',
      requiredPacers: 1,
      shadowSlots: 1
    });
    setShowPaceGroupForm(false);
  };

  const handleEditPaceGroup = (index) => {
    setPaceGroupForm(paceGroups[index]);
    setEditingPaceGroup(index);
    setShowPaceGroupForm(true);
  };

  const handleDeletePaceGroup = (index) => {
    const updatedGroups = paceGroups.filter((_, i) => i !== index);
    setPaceGroups(updatedGroups);
  };

  const handleLoadStandardPaceGroups = async () => {
    try {
      if (sessionData.paceMin && sessionData.paceMax) {
        const suggestedGroups = await paceGroupService.getSuggestedPaceGroups(
          sessionData.paceMin, 
          sessionData.paceMax
        );
        
        if (suggestedGroups.length > 0) {
          // Add IDs to the groups
          const groupsWithIds = suggestedGroups.map(group => ({
            ...group,
            id: Date.now() + Math.random() * 1000
          }));
          
          // Confirm before replacing
          if (paceGroups.length > 0) {
            if (window.confirm('This will replace your existing pace groups. Continue?')) {
              setPaceGroups(groupsWithIds);
            }
          } else {
            setPaceGroups(groupsWithIds);
          }
          
          toast.success(`Added ${suggestedGroups.length} standard pace groups`);
        } else {
          toast.error('No matching standard pace groups found for this pace range');
        }
      } else {
        toast.error('Please set min and max pace values first');
      }
    } catch (error) {
      console.error('Failed to load standard pace groups:', error);
      toast.error('Failed to load standard pace groups');
    }
  };

  const formatPace = (pace) => {
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const difficultyOptions = [
    { value: 'beginner', label: 'Beginner', description: 'Suitable for all levels' },
    { value: 'intermediate', label: 'Intermediate', description: 'Some experience recommended' },
    { value: 'advanced', label: 'Advanced', description: 'Experienced runners only' },
  ];

  const runTypeOptions = [
    { value: 'easy', label: 'Easy', icon: FiActivity, color: 'bg-green-100 text-green-800' },
    { value: 'tempo', label: 'Tempo', icon: FiActivity, color: 'bg-blue-100 text-blue-800' },
    { value: 'interval', label: 'Interval', icon: FiActivity, color: 'bg-purple-100 text-purple-800' },
    { value: 'long-slow', label: 'Long Slow', icon: FiActivity, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'trail', label: 'Trail', icon: FiActivity, color: 'bg-orange-100 text-orange-800' },
  ];

  const sections = [
    { id: 'basic', label: 'Basic Details', icon: FiInfo },
    { id: 'location', label: 'Location', icon: FiMapPin },
    { id: 'route', label: 'Route', icon: FiActivity },
    { id: 'pace-groups', label: 'Pace Groups', icon: FiUsers },
    { id: 'advanced', label: 'Advanced', icon: FiShield },
  ];

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Template Actions */}
        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
          <div>
            <h3 className="font-medium text-blue-900">Session Templates</h3>
            <p className="text-sm text-blue-700">Save time by using or creating templates</p>
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => {
                setTemplateModalMode('select');
                setShowTemplateModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <SafeIcon icon={FiTemplate} className="w-4 h-4" />
              <span>Load Template</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTemplateModalMode('save');
                setShowTemplateModal(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <SafeIcon icon={FiSave} className="w-4 h-4" />
              <span>Save as Template</span>
            </button>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="flex overflow-x-auto pb-2 mb-4 space-x-2">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 whitespace-nowrap transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <SafeIcon icon={section.icon} className="w-4 h-4" />
              <span>{section.label}</span>
            </button>
          ))}
        </div>

        {/* Basic Details Section */}
        {activeSection === 'basic' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Title</label>
              <input
                type="text"
                name="title"
                value={sessionData.title}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Morning Run, Hill Training, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={sessionData.description}
                onChange={handleChange}
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the session, goals, and what participants should expect"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiCalendar} className="w-4 h-4" />
                    <span>Date</span>
                  </div>
                </label>
                <input
                  type="date"
                  name="date"
                  value={sessionData.date}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiClock} className="w-4 h-4" />
                    <span>Start Time</span>
                  </div>
                </label>
                <input
                  type="time"
                  name="time"
                  value={sessionData.time}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiClock} className="w-4 h-4" />
                    <span>End Time</span>
                  </div>
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={sessionData.endTime}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiUsers} className="w-4 h-4" />
                    <span>Maximum Attendees</span>
                  </div>
                </label>
                <input
                  type="number"
                  name="maxAttendees"
                  value={sessionData.maxAttendees}
                  onChange={handleChange}
                  min="1"
                  max="100"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Location Section */}
        {activeSection === 'location' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiMapPin} className="w-4 h-4" />
                  <span>Location Name</span>
                </div>
              </label>
              <input
                type="text"
                name="startLocationName"
                value={sessionData.startLocationName}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Central Park, Riverside Trail, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiMapPin} className="w-4 h-4" />
                  <span>Address Details</span>
                </div>
              </label>
              <input
                type="text"
                name="startLocationAddress"
                value={sessionData.startLocationAddress}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="E.g., 'Main entrance, near the fountain'"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiMapPin} className="w-4 h-4" />
                  <span>Select Start Location (Click on map)</span>
                </div>
              </label>
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                initialLocation={
                  sessionData.startLocationLat && sessionData.startLocationLng
                    ? [sessionData.startLocationLat, sessionData.startLocationLng]
                    : null
                }
              />
              {sessionData.startLocationLat && sessionData.startLocationLng && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected location: {sessionData.startLocationLat.toFixed(6)}, {sessionData.startLocationLng.toFixed(6)}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Route Section */}
        {activeSection === 'route' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route Type</label>
              <div className="grid grid-cols-3 gap-3">
                {['predefined', 'flexible', 'free-form'].map((type) => (
                  <label key={type} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="routeType"
                      value={type}
                      checked={sessionData.routeType === type}
                      onChange={handleChange}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiActivity} className="w-4 h-4" />
                  <span>Total Distance (km)</span>
                </div>
              </label>
              <input
                type="number"
                name="totalDistance"
                value={sessionData.totalDistance}
                onChange={handleChange}
                min="0"
                step="0.1"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Run Type</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {runTypeOptions.map((type) => (
                  <label
                    key={type.value}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      sessionData.runType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="runType"
                      value={type.value}
                      checked={sessionData.runType === type.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${type.color}`}>
                      <SafeIcon icon={type.icon} className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiArrowDown} className="w-4 h-4" />
                    <span>Minimum Pace (min/km)</span>
                  </div>
                </label>
                <input
                  type="number"
                  name="paceMin"
                  value={sessionData.paceMin}
                  onChange={handleChange}
                  min="3"
                  max="15"
                  step="0.1"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiArrowUp} className="w-4 h-4" />
                    <span>Maximum Pace (min/km)</span>
                  </div>
                </label>
                <input
                  type="number"
                  name="paceMax"
                  value={sessionData.paceMax}
                  onChange={handleChange}
                  min="3"
                  max="15"
                  step="0.1"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
              <div className="grid grid-cols-3 gap-3">
                {difficultyOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`relative p-3 rounded-lg border-2 transition-all ${
                      sessionData.difficulty === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="difficulty"
                      value={option.value}
                      checked={sessionData.difficulty === option.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex flex-col items-center">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-gray-500">{option.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Pace Groups Section */}
        {activeSection === 'pace-groups' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Pace Groups</h3>
                <p className="text-sm text-gray-600">Organize participants by running pace</p>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleLoadStandardPaceGroups}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  disabled={loadingStandardGroups}
                >
                  <SafeIcon icon={loadingStandardGroups ? FiRefreshCw : FiActivity} 
                    className={`w-4 h-4 ${loadingStandardGroups ? 'animate-spin' : ''}`} />
                  <span>Use Standard Groups</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPaceGroup(null);
                    setPaceGroupForm({
                      name: '',
                      minPace: 6.0,
                      maxPace: 6.5,
                      description: '',
                      requiredPacers: 1,
                      shadowSlots: 1
                    });
                    setShowPaceGroupForm(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <SafeIcon icon={FiPlus} className="w-4 h-4" />
                  <span>Add Pace Group</span>
                </button>
              </div>
            </div>

            {/* Standard Pace Groups Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Standard Pace Groups</h4>
              <p className="text-blue-700 text-sm mb-2">
                The "Use Standard Groups" button will automatically create pace groups based on your session's pace range.
                These groups are defined by administrators and ensure consistency across all sessions.
              </p>
              <p className="text-blue-700 text-sm">
                You can modify these groups after adding them, or create custom groups using the "Add Pace Group" button.
              </p>
            </div>

            {/* Existing Pace Groups */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paceGroups.map((group, index) => (
                <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{group.name}</h4>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEditPaceGroup(index)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <SafeIcon icon={FiCopy} className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePaceGroup(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Pace: {formatPace(group.minPace)} - {formatPace(group.maxPace)} min/km</p>
                    <p>Pacers: {group.requiredPacers}, Shadow slots: {group.shadowSlots}</p>
                    {group.description && <p className="italic">{group.description}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Add/Edit Pace Group Form */}
            {showPaceGroupForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <h4 className="font-medium text-gray-900 mb-4">
                  {editingPaceGroup !== null ? 'Edit Pace Group' : 'Add Pace Group'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                    <input
                      type="text"
                      value={paceGroupForm.name}
                      onChange={(e) => setPaceGroupForm({ ...paceGroupForm, name: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Fast Group (5:30-6:00)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Pace (min/km)</label>
                    <input
                      type="number"
                      value={paceGroupForm.minPace}
                      onChange={(e) => setPaceGroupForm({ ...paceGroupForm, minPace: parseFloat(e.target.value) })}
                      step="0.1"
                      min="3"
                      max="15"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Pace (min/km)</label>
                    <input
                      type="number"
                      value={paceGroupForm.maxPace}
                      onChange={(e) => setPaceGroupForm({ ...paceGroupForm, maxPace: parseFloat(e.target.value) })}
                      step="0.1"
                      min="3"
                      max="15"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Required Pacers</label>
                    <input
                      type="number"
                      value={paceGroupForm.requiredPacers}
                      onChange={(e) => setPaceGroupForm({ ...paceGroupForm, requiredPacers: parseInt(e.target.value) })}
                      min="0"
                      max="10"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shadow Slots</label>
                    <input
                      type="number"
                      value={paceGroupForm.shadowSlots}
                      onChange={(e) => setPaceGroupForm({ ...paceGroupForm, shadowSlots: parseInt(e.target.value) })}
                      min="0"
                      max="10"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={paceGroupForm.description}
                      onChange={(e) => setPaceGroupForm({ ...paceGroupForm, description: e.target.value })}
                      rows="2"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Description of this pace group"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowPaceGroupForm(false)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddPaceGroup}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingPaceGroup !== null ? 'Update' : 'Add'} Group
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Advanced Section */}
        {activeSection === 'advanced' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <SafeIcon icon={FiUsers} className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Enable Waitlist</p>
                  <p className="text-sm text-gray-600">Allow users to join waitlist when session is full</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="waitlistEnabled"
                  checked={sessionData.waitlistEnabled}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiAlertCircle} className="w-4 h-4" />
                  <span>Special Instructions</span>
                </div>
              </label>
              <textarea
                name="specialInstructions"
                value={sessionData.specialInstructions}
                onChange={handleChange}
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any special instructions or requirements for participants"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiList} className="w-4 h-4" />
                  <span>Required Gear</span>
                </div>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentGear}
                  onChange={(e) => setCurrentGear(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add required gear item"
                />
                <button
                  type="button"
                  onClick={handleAddGear}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              {sessionData.requiredGear && sessionData.requiredGear.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {sessionData.requiredGear.map((gear, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      <span>{gear}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGear(index)}
                        className="w-4 h-4 flex items-center justify-center text-blue-700 hover:text-blue-900"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Form Actions */}
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <div className="flex space-x-3">
            {activeSection !== sections[0].id && (
              <button
                type="button"
                onClick={() => {
                  const currentIndex = sections.findIndex(s => s.id === activeSection);
                  if (currentIndex > 0) {
                    setActiveSection(sections[currentIndex - 1].id);
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
            )}
            {activeSection !== sections[sections.length - 1].id && (
              <button
                type="button"
                onClick={() => {
                  const currentIndex = sections.findIndex(s => s.id === activeSection);
                  if (currentIndex < sections.length - 1) {
                    setActiveSection(sections[currentIndex + 1].id);
                  }
                }}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Next
              </button>
            )}
          </div>

          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <SafeIcon icon={FiCheckCircle} className="w-5 h-5" />
            <span>{isEdit ? 'Update Session' : 'Create Session'}</span>
          </button>
        </div>
      </form>

      {/* Template Modal */}
      <SessionTemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelectTemplate={templateModalMode === 'select' ? handleLoadFromTemplate : handleSaveAsTemplate}
        mode={templateModalMode}
      />
    </>
  );
}

export default SessionForm;