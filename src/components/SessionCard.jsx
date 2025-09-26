import React from 'react';
import {motion} from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import {useSettings} from '../contexts/SettingsContext';
import {formatDistanceWithUnit, convertDistance, DISTANCE_UNITS} from '../utils/unitConversion';

const {FiCalendar, FiClock, FiMapPin, FiUsers, FiEdit, FiTrash2, FiCheckCircle} = FiIcons;

function SessionCard({session, onJoin, onEdit, onDelete, canEdit, userAttending}) {
  const {distanceUnit} = useSettings();

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if session is in the past or completed
  const isSessionPast = () => {
    const sessionDateTime = new Date(`${session.date}T${session.time}`);
    return sessionDateTime < new Date() || session.status === 'completed';
  };

  const isPastOrCompleted = isSessionPast();

  // Convert distance if needed
  const displayDistance = session.totalDistance ? 
    formatDistanceWithUnit(
      convertDistance(session.totalDistance, DISTANCE_UNITS.KILOMETERS, distanceUnit),
      distanceUnit
    ) : null;

  return (
    <motion.div
      initial={{opacity: 0, y: 20}}
      animate={{opacity: 1, y: 0}}
      className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{session.title}</h3>
          <p className="text-gray-600 text-sm mb-3">{session.description}</p>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <SafeIcon icon={FiCalendar} className="w-4 h-4" />
              <span>{session.date}</span>
              <SafeIcon icon={FiClock} className="w-4 h-4 ml-2" />
              <span>{session.time}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <SafeIcon icon={FiMapPin} className="w-4 h-4" />
              <span>{session.location}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <SafeIcon icon={FiUsers} className="w-4 h-4" />
                <span>{session.attendees?.length || 0} / {session.maxAttendees} attendees</span>
              </div>
              {displayDistance && (
                <span className="text-sm text-gray-500">{displayDistance}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
            {session.status === 'completed' ? (
              <div className="flex items-center space-x-1">
                <SafeIcon icon={FiCheckCircle} className="w-3 h-3" />
                <span>Completed</span>
              </div>
            ) : (
              session.status
            )}
          </span>
        </div>
      </div>

      {/* Attendees */}
      {session.attendees && session.attendees.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Attendees:</p>
          <div className="flex flex-wrap gap-2">
            {session.attendees.slice(0, 5).map((attendee, i) => (
              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {attendee}
              </span>
            ))}
            {session.attendees.length > 5 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                +{session.attendees.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        {!isPastOrCompleted ? (
          <button
            onClick={() => onJoin(session.id)}
            disabled={session.attendees?.length >= session.maxAttendees && !userAttending}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              userAttending
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : session.attendees?.length >= session.maxAttendees
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {userAttending ? 'Leave' : session.attendees?.length >= session.maxAttendees ? 'Full' : 'Join'}
          </button>
        ) : (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <SafeIcon icon={FiCheckCircle} className="w-4 h-4" />
            <span>{session.status === 'completed' ? 'Session Completed' : 'Session Ended'}</span>
          </div>
        )}

        {canEdit && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(session)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit session"
            >
              <SafeIcon icon={FiEdit} className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(session.id)}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete session"
            >
              <SafeIcon icon={FiTrash2} className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default SessionCard;