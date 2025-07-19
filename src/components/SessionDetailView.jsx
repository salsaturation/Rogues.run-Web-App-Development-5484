import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { sessionService } from '../services/sessionService';
import PaceGroupManager from './PaceGroupManager';
import { 
  formatPaceWithUnit, 
  formatDistanceWithUnit,
  convertPace,
  convertDistance,
  DISTANCE_UNITS 
} from '../utils/unitConversion';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const {
  FiClock, FiCalendar, FiMapPin, FiUsers, FiMessageSquare, FiSend, FiThumbsUp,
  FiActivity, FiArrowUp, FiArrowDown, FiList, FiAlertCircle, FiEdit, FiTrash2,
  FiX, FiChevronDown, FiChevronUp, FiBell, FiShare2, FiUser, FiInfo
} = FiIcons;

function SessionDetailView({
  session,
  onJoin,
  onEdit,
  onDelete,
  canEdit,
  userAttending,
  userInterested,
  onToggleInterest
}) {
  const { user } = useAuth();
  const { distanceUnit } = useSettings();
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'paceGroups', 'discussion'

  useEffect(() => {
    if (session?.id) {
      loadComments();
    }
  }, [session?.id]);

  const loadComments = async () => {
    try {
      const sessionComments = await sessionService.getSessionComments(session.id);
      setComments(sessionComments);
    } catch (error) {
      console.error("Failed to load comments:", error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;

    try {
      await sessionService.addComment(session.id, user.id, comment);
      setComment('');
      loadComments();
      setShowCommentForm(false);
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  // Format pace based on the selected unit
  const formatPace = (pace) => {
    if (!pace) return 'N/A';
    const convertedPace = convertPace(pace, DISTANCE_UNITS.KILOMETERS, distanceUnit);
    return formatPaceWithUnit(convertedPace, distanceUnit);
  };

  // Format distance based on the selected unit
  const formatDistance = (distance) => {
    if (!distance) return 'N/A';
    const convertedDistance = convertDistance(distance, DISTANCE_UNITS.KILOMETERS, distanceUnit);
    return formatDistanceWithUnit(convertedDistance, distanceUnit);
  };

  const getRunTypeColor = (type) => {
    const colors = {
      'easy': 'bg-green-100 text-green-800',
      'tempo': 'bg-blue-100 text-blue-800',
      'interval': 'bg-purple-100 text-purple-800',
      'long-slow': 'bg-yellow-100 text-yellow-800',
      'trail': 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'beginner': 'bg-green-100 text-green-800',
      'intermediate': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-red-100 text-red-800',
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'confirmed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!session) return null;

  const hasLocation = session.startLocationLat && session.startLocationLng;
  const position = hasLocation ? [session.startLocationLat, session.startLocationLng] : [40.7128, -74.0060]; // Default: NYC

  const truncateDescription = (text, maxLength = 150) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Check if session is in the past
  const isPastSession = new Date(session.date) < new Date();

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Session Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status || 'confirmed')}`}>
                {session.status || 'confirmed'}
              </span>
            </div>
            <div className="flex flex-wrap items-center space-x-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center space-x-1">
                <SafeIcon icon={FiCalendar} className="w-4 h-4" />
                <span>{format(new Date(session.date), 'MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <SafeIcon icon={FiClock} className="w-4 h-4" />
                <span>{session.time} - {session.endTime || 'TBD'}</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onToggleInterest(session.id)}
              className={`p-2 rounded-full ${
                userInterested ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={userInterested ? 'Interested' : 'Mark as interested'}
            >
              <SafeIcon icon={FiThumbsUp} className="w-5 h-5" />
            </button>
            <button
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              title="Share session"
            >
              <SafeIcon icon={FiShare2} className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <p className="text-gray-700">
            {showFullDescription ? session.description : truncateDescription(session.description)}
            {session.description && session.description.length > 150 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="ml-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showFullDescription ? 'Show less' : 'Show more'}
              </button>
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <SafeIcon icon={FiInfo} className="w-4 h-4" />
            <span>Details</span>
          </button>
          <button
            onClick={() => setActiveTab('paceGroups')}
            className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'paceGroups'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <SafeIcon icon={FiActivity} className="w-4 h-4" />
            <span>Pace Groups</span>
          </button>
          <button
            onClick={() => setActiveTab('discussion')}
            className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'discussion'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <SafeIcon icon={FiMessageSquare} className="w-4 h-4" />
            <span>Discussion</span>
            {comments.length > 0 && (
              <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                {comments.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {/* Left Column: Location & Route Info */}
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Location & Route</h2>
              <div className="space-y-4">
                {/* Location */}
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    <SafeIcon icon={FiMapPin} className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {session.startLocationName || session.location || 'Location'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {session.startLocationAddress || 'No address details provided'}
                    </p>
                  </div>
                </div>

                {/* Map */}
                {hasLocation && (
                  <div className="h-48 rounded-lg overflow-hidden">
                    <MapContainer center={position} zoom={14} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <Marker position={position}>
                        <Popup>{session.startLocationName || session.location || 'Meeting point'}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                )}

                {/* Run Details */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                  <div className="flex flex-col items-start">
                    <span className="text-sm text-gray-500">Distance</span>
                    <span className="font-medium text-gray-900">
                      {session.totalDistance ? formatDistance(session.totalDistance) : '-'}
                    </span>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm text-gray-500">Route Type</span>
                    <span className="font-medium text-gray-900 capitalize">{session.routeType || 'Flexible'}</span>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm text-gray-500">Run Type</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRunTypeColor(session.runType || 'easy')}`}>
                      {session.runType || 'Easy'}
                    </span>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm text-gray-500">Difficulty</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(session.difficulty || 'beginner')}`}>
                      {session.difficulty || 'Beginner'}
                    </span>
                  </div>
                </div>

                {/* Pace Range */}
                {(session.paceMin || session.paceMax) && (
                  <div className="pt-3 border-t border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Target Pace</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <SafeIcon icon={FiArrowDown} className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-700">{formatPace(session.paceMin || 5)}</span>
                      </div>
                      <span className="text-gray-400">to</span>
                      <div className="flex items-center space-x-2">
                        <SafeIcon icon={FiArrowUp} className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-gray-700">{formatPace(session.paceMax || 6)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Middle Column: Attendance Info */}
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance</h2>
              <div className="space-y-4">
                {/* Attendance Stats */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-500">Spots</span>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-xl font-bold text-gray-900">{session.attendeeCount}</span>
                      <span className="text-gray-500">/ {session.maxAttendees}</span>
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={() => onJoin(session.id)}
                      disabled={session.attendeeCount >= session.maxAttendees && !userAttending}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        userAttending
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : session.attendeeCount >= session.maxAttendees
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {userAttending ? 'Leave Session' : session.attendeeCount >= session.maxAttendees ? 'Session Full' : 'Join Session'}
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${Math.min((session.attendeeCount / session.maxAttendees) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{Math.round((session.attendeeCount / session.maxAttendees) * 100)}% full</span>
                    {session.waitlistEnabled && <span>Waitlist enabled</span>}
                  </div>
                </div>

                {/* Attendees List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900">Attendees</h3>
                    <button
                      onClick={() => setShowAttendees(!showAttendees)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <span>{showAttendees ? 'Hide' : 'Show All'}</span>
                      <SafeIcon icon={showAttendees ? FiChevronUp : FiChevronDown} className="w-4 h-4" />
                    </button>
                  </div>

                  {session.attendees && session.attendees.length > 0 ? (
                    <div className="space-y-2">
                      {/* Always show first 3 */}
                      {session.attendees.slice(0, showAttendees ? session.attendees.length : 3).map((attendee, i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                            {attendee.user?.picture ? (
                              <img
                                src={attendee.user.picture}
                                alt={attendee.user?.name || 'User'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <SafeIcon icon={FiUsers} className="w-4 h-4 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {attendee.user?.name || 'Unknown User'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No attendees yet</p>
                  )}
                </div>

                {/* Interested Users */}
                {session.interestedUsers && session.interestedUsers.length > 0 && (
                  <div className="pt-3 border-t border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Interested</h3>
                    <div className="flex flex-wrap gap-2">
                      {session.interestedUsers.slice(0, 5).map((interestedUser, i) => (
                        <div
                          key={i}
                          className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                        >
                          <SafeIcon icon={FiThumbsUp} className="w-3 h-3" />
                          <span>{interestedUser.user?.name || 'User'}</span>
                        </div>
                      ))}
                      {session.interestedUsers.length > 5 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          +{session.interestedUsers.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              {canEdit && (
                <div className="flex space-x-2 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => onEdit(session)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <SafeIcon icon={FiEdit} className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => onDelete(session.id)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Additional Info */}
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Info</h2>
              <div className="space-y-4">
                {/* Special Instructions */}
                {session.specialInstructions && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <SafeIcon icon={FiAlertCircle} className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-yellow-800 mb-1">Special Instructions</h3>
                        <p className="text-sm text-yellow-700">{session.specialInstructions}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Required Gear */}
                {session.requiredGear && session.requiredGear.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                      <SafeIcon icon={FiList} className="w-4 h-4" />
                      <span>Required Gear</span>
                    </h3>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {session.requiredGear.map((gear, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                          <span>{gear}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'paceGroups' && (
          <div className="py-2">
            <PaceGroupManager
              sessionId={session.id}
              sessionDate={session.date}
              isPastSession={isPastSession}
              canManage={canEdit}
            />
          </div>
        )}

        {activeTab === 'discussion' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Discussion</h3>
              <button
                onClick={() => setShowCommentForm(!showCommentForm)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <SafeIcon icon={FiMessageSquare} className="w-4 h-4" />
                <span>Add Comment</span>
              </button>
            </div>

            {/* Comment Form */}
            {showCommentForm && (
              <form onSubmit={handleAddComment} className="mb-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <SafeIcon icon={FiUser} className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment or ask a question..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      required
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setShowCommentForm(false)}
                        className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                      >
                        <SafeIcon icon={FiSend} className="w-4 h-4" />
                        <span>Post</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length > 0 ? (
                comments.map((comment, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {comment.user?.picture ? (
                        <img
                          src={comment.user.picture}
                          alt={comment.user?.name || 'User'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <SafeIcon icon={FiUser} className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900">{comment.user?.name || 'User'}</p>
                          <span className="text-xs text-gray-500">
                            {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">No comments yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionDetailView;