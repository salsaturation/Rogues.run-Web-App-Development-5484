import React, {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {useAuth} from '../contexts/AuthContext';
import {useSettings} from '../contexts/SettingsContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import {formatPaceWithUnit, formatDistanceWithUnit, convertPace, convertDistance, DISTANCE_UNITS} from '../utils/unitConversion';
import {paceGroupService} from '../services/paceGroupService';
import PaceGroupManager from './PaceGroupManager';
import SessionTemplateModal from './SessionTemplateModal';
import SessionAttendanceManager from './SessionAttendanceManager';
import SessionCompletionModal from './SessionCompletionModal';

const {FiCalendar, FiClock, FiMapPin, FiUsers, FiActivity, FiTarget, FiInfo, FiEdit, FiTrash2, FiThumbsUp, FiMessageSquare, FiSend, FiSave, FiCheckCircle, FiUserCheck} = FiIcons;

function SessionDetailView({session, onJoin, onEdit, onDelete, canEdit, userAttending, userInterested, onToggleInterest}) {
  const {user} = useAuth();
  const {distanceUnit} = useSettings();
  const [paceGroups, setPaceGroups] = useState([]);
  const [loadingPaceGroups, setLoadingPaceGroups] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAttendanceManager, setShowAttendanceManager] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    if (session?.id) {
      loadPaceGroups();
      // Load comments would go here
    }
  }, [session?.id]);

  const loadPaceGroups = async () => {
    try {
      setLoadingPaceGroups(true);
      const groups = await paceGroupService.getPaceGroupsBySessionId(session.id);
      setPaceGroups(groups);
    } catch (error) {
      console.error('Failed to load pace groups:', error);
    } finally {
      setLoadingPaceGroups(false);
    }
  };

  // Format pace based on the selected unit
  const formatPace = (pace) => {
    if (!pace || isNaN(pace)) return 'N/A';
    const convertedPace = convertPace(pace, DISTANCE_UNITS.KILOMETERS, distanceUnit);
    return formatPaceWithUnit(convertedPace, distanceUnit);
  };

  // Format distance based on the selected unit
  const formatDistance = (distance) => {
    if (!distance || isNaN(distance)) return 'N/A';
    const convertedDistance = convertDistance(distance, DISTANCE_UNITS.KILOMETERS, distanceUnit);
    return formatDistanceWithUnit(convertedDistance, distanceUnit);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  const handleSaveTemplate = (templateData) => {
    console.log('Template saved:', templateData);
    setShowTemplateModal(false);
  };

  const handleSessionCompleted = () => {
    // Refresh the session data
    window.location.reload(); // Simple refresh for now
  };

  const prepareSessionForTemplate = () => {
    // Prepare the session data for the template modal
    const sessionTemplate = {
      title: session.title,
      description: session.description,
      time: session.time,
      endTime: session.endTime,
      maxAttendees: session.maxAttendees,
      startLocationName: session.startLocationName,
      startLocationAddress: session.startLocationAddress,
      routeType: session.routeType,
      totalDistance: session.totalDistance,
      runType: session.runType,
      paceMin: session.paceMin,
      paceMax: session.paceMax,
      difficulty: session.difficulty,
      waitlistEnabled: session.waitlistEnabled,
      specialInstructions: session.specialInstructions,
      requiredGear: session.requiredGear || [],
      // Include pace groups if they exist
      paceGroups: paceGroups.map(group => ({
        name: group.name,
        minPace: group.minPace,
        maxPace: group.maxPace,
        description: group.description,
        requiredPacers: group.requiredPacers,
        shadowSlots: group.shadowSlots
      }))
    };

    console.log('Prepared session template data:', sessionTemplate);
    return sessionTemplate;
  };

  // Check if session is past or completed
  const isSessionPast = () => {
    const sessionDateTime = new Date(`${session.date}T${session.time}`);
    return sessionDateTime < new Date() || session.status === 'completed';
  };

  const isSessionCompleted = session.status === 'completed';
  const isPastOrCompleted = isSessionPast();
  const canManageAttendance = canEdit && (isSessionCompleted || isPastOrCompleted);
  const canCompleteSession = canEdit && isPastOrCompleted && session.status !== 'completed';

  if (!session) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        className="bg-white rounded-xl p-8 shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
          <div className="flex-1 mb-4 md:mb-0">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-3 mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 md:mb-0">{session.title}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium self-start md:self-auto ${getStatusColor(session.status || 'confirmed')}`}>
                {session.status === 'completed' ? (
                  <div className="flex items-center space-x-1">
                    <SafeIcon icon={FiCheckCircle} className="w-4 h-4" />
                    <span>Completed</span>
                  </div>
                ) : (
                  session.status || 'confirmed'
                )}
              </span>
            </div>

            <p className="text-lg text-gray-600 mb-6">{session.description}</p>

            {/* Session Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiCalendar} className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">{new Date(session.date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiClock} className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium text-gray-900">
                    {session.time} {session.endTime && ` - ${session.endTime}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiMapPin} className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium text-gray-900">{session.startLocationName || session.location}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiUsers} className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Attendees</p>
                  <p className="font-medium text-gray-900">{session.attendeeCount} / {session.maxAttendees}</p>
                </div>
              </div>

              {session.totalDistance && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <SafeIcon icon={FiActivity} className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Distance</p>
                    <p className="font-medium text-gray-900">{formatDistance(session.totalDistance)}</p>
                  </div>
                </div>
              )}

              {(session.paceMin || session.paceMax) && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <SafeIcon icon={FiTarget} className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pace Range</p>
                    <p className="font-medium text-gray-900">
                      {session.paceMin && session.paceMax
                        ? `${formatPace(session.paceMin)} - ${formatPace(session.paceMax)}`
                        : session.paceMin
                        ? `From ${formatPace(session.paceMin)}`
                        : session.paceMax
                        ? `Up to ${formatPace(session.paceMax)}`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - Stacked on mobile, side by side on desktop */}
          <div className="flex flex-col space-y-3 md:w-auto md:ml-4">
            {!isPastOrCompleted && (
              <button
                onClick={() => onJoin(session.id)}
                disabled={session.attendeeCount >= session.maxAttendees && !userAttending}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  userAttending
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : session.attendeeCount >= session.maxAttendees
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {userAttending
                  ? 'Leave Session'
                  : session.attendeeCount >= session.maxAttendees
                  ? 'Session Full'
                  : 'Join Session'}
              </button>
            )}

            {!isPastOrCompleted && (
              <button
                onClick={() => onToggleInterest(session.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                  userInterested
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <SafeIcon icon={FiThumbsUp} className="w-4 h-4" />
                <span>{userInterested ? 'Interested' : 'Mark Interest'}</span>
              </button>
            )}

            {/* Attendance Management - Always show for completed sessions if user has permission */}
            {canManageAttendance && (
              <button
                onClick={() => setShowAttendanceManager(!showAttendanceManager)}
                className="px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 bg-green-100 text-green-700 hover:bg-green-200"
              >
                <SafeIcon icon={FiUserCheck} className="w-4 h-4" />
                <span>Manage Attendance</span>
              </button>
            )}

            {/* Complete Session */}
            {canCompleteSession && (
              <button
                onClick={() => setShowCompletionModal(true)}
                className="px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                <SafeIcon icon={FiCheckCircle} className="w-4 h-4" />
                <span>Mark Complete</span>
              </button>
            )}

            {/* Save as Template button */}
            {(user?.canPublish || user?.isAdmin) && (
              <button
                onClick={() => setShowTemplateModal(true)}
                className="px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 bg-purple-100 text-purple-700 hover:bg-purple-200"
              >
                <SafeIcon icon={FiSave} className="w-4 h-4" />
                <span>Save as Template</span>
              </button>
            )}

            {canEdit && (
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(session)}
                  className="p-3 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors flex-1"
                  title="Edit session"
                >
                  <SafeIcon icon={FiEdit} className="w-4 h-4 mx-auto" />
                </button>
                <button
                  onClick={() => onDelete(session.id)}
                  className="p-3 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors flex-1"
                  title="Delete session"
                >
                  <SafeIcon icon={FiTrash2} className="w-4 h-4 mx-auto" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {session.runType && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRunTypeColor(session.runType)}`}>
              {session.runType}
            </span>
          )}
          {session.difficulty && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(session.difficulty)}`}>
              {session.difficulty}
            </span>
          )}
          {session.routeType && (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              {session.routeType} route
            </span>
          )}
        </div>

        {/* Completion Info */}
        {isSessionCompleted && session.completedAt && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Session completed</strong> on {new Date(session.completedAt).toLocaleDateString()}
            </p>
            {session.completionNotes && (
              <p className="text-sm text-blue-700 mt-1">{session.completionNotes}</p>
            )}
          </div>
        )}

        {/* Past session notice */}
        {isPastOrCompleted && !isSessionCompleted && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>This session has ended.</strong> Registration and interest are no longer available.
            </p>
          </div>
        )}
      </motion.div>

      {/* Attendance Management - Always show for completed sessions, regardless of showAttendanceManager toggle */}
      {(showAttendanceManager || isSessionCompleted) && (
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance Management</h2>
          <SessionAttendanceManager
            session={session}
            onUpdate={() => {
              // Refresh session data
              window.location.reload();
            }}
            canManage={canEdit}
          />
        </motion.div>
      )}

      {/* Additional Information */}
      {(session.specialInstructions || session.requiredGear) && (
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 0.1}}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center space-x-2 mb-4">
            <SafeIcon icon={FiInfo} className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Additional Information</h2>
          </div>

          {session.specialInstructions && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Special Instructions</h3>
              <p className="text-gray-600">{session.specialInstructions}</p>
            </div>
          )}

          {session.requiredGear && session.requiredGear.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Required Gear</h3>
              <div className="flex flex-wrap gap-2">
                {session.requiredGear.map((item, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Pace Groups */}
      {paceGroups.length > 0 && (
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 0.2}}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pace Groups</h2>
          <PaceGroupManager
            sessionId={session.id}
            paceGroups={paceGroups}
            onUpdate={loadPaceGroups}
            readOnly={true}
          />
        </motion.div>
      )}

      {/* Attendees - Only show if not showing attendance manager */}
      {session.attendees && session.attendees.length > 0 && !showAttendanceManager && !isSessionCompleted && (
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 0.3}}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendees ({session.attendees.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {session.attendees.map((attendee, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  {attendee.user?.picture ? (
                    <img
                      src={attendee.user.picture}
                      alt={attendee.user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-blue-600">
                      {(attendee.user?.name || attendee).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {attendee.user?.name || attendee}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Interested Users - Only show if not completed */}
      {!isSessionCompleted && session.interestedUsers && session.interestedUsers.length > 0 && (
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 0.4}}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Interested ({session.interestedUsers.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {session.interestedUsers.map((interested, index) => (
              <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                {interested.user?.name || interested}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Modals */}
      {showTemplateModal && (
        <SessionTemplateModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          onSelectTemplate={handleSaveTemplate}
          mode="save"
          initialTemplate={prepareSessionForTemplate()}
        />
      )}

      {showCompletionModal && (
        <SessionCompletionModal
          session={session}
          isOpen={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          onComplete={handleSessionCompleted}
        />
      )}
    </div>
  );
}

export default SessionDetailView;