import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {useAuth} from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import {sessionService} from '../services/sessionService';
import toast from 'react-hot-toast';

const {FiUsers, FiCheck, FiX, FiClock, FiUserCheck, FiUserX, FiAlertCircle, FiCheckCircle, FiXCircle, FiEye, FiEdit} = FiIcons;

function SessionAttendanceManager({session, onUpdate, canManage}) {
  const {user} = useAuth();
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bulkAction, setBulkAction] = useState('');
  const [showSelfReport, setShowSelfReport] = useState(false);
  const [userSelfReported, setUserSelfReported] = useState(false);
  const [userCanSelfReport, setUserCanSelfReport] = useState(false);

  useEffect(() => {
    if (session?.id) {
      loadAttendanceData();
    }
  }, [session?.id]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const data = await sessionService.getSessionAttendance(session.id);
      
      // Ensure we have a valid attendees array
      const validAttendees = Array.isArray(data.attendees) ? data.attendees : [];
      setAttendees(validAttendees);

      // Check if current user can self-report
      if (user?.id) {
        // Check if user is in attendees list (by UUID or email)
        const userAttendee = validAttendees.find(a => 
          a.userId === user.id || 
          (a.user && (a.user.id === user.id || a.user.email === user.email))
        );

        // Check if user was interested in the session
        const userWasInterested = session.interestedUsers?.some(interested => 
          interested.user_id === user.id || 
          (interested.user && (interested.user.id === user.id || interested.user.email === user.email))
        );

        console.log('User eligibility debug:', {
          userId: user.id,
          userEmail: user.email,
          userAttendee: !!userAttendee,
          userWasInterested,
          attendeesList: validAttendees.map(a => ({id: a.userId, email: a.user?.email})),
          interestedList: session.interestedUsers?.map(i => ({id: i.user_id, email: i.user?.email}))
        });

        // Get current self-report status
        setUserSelfReported(userAttendee?.selfReported || false);

        // Show self-report prompt if:
        // 1. Session is completed
        // 2. User was either an attendee OR showed interest  
        // 3. User hasn't already self-reported
        // 4. Admin hasn't processed their attendance yet
        const sessionDate = new Date(session.date);
        const now = new Date();
        const isSessionCompleted = sessionDate < now && session.status === 'completed';
        
        const userParticipated = userAttendee || userWasInterested;
        const hasNotSelfReported = !userAttendee?.selfReported;
        const adminNotProcessed = !userAttendee?.adminProcessed;

        const canSelfReport = isSessionCompleted && userParticipated && hasNotSelfReported && adminNotProcessed;
        
        setUserCanSelfReport(canSelfReport);
        setShowSelfReport(canSelfReport);

        console.log('Self-report eligibility check:', {
          isSessionCompleted,
          userParticipated,
          userAttendee: !!userAttendee,
          userWasInterested,
          hasNotSelfReported,
          adminNotProcessed,
          canSelfReport,
          sessionStatus: session.status,
          sessionDate: session.date
        });
      }
    } catch (error) {
      console.error('Failed to load attendance data:', error);
      setAttendees([]); // Set to empty array on error
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelfReport = async (attended) => {
    try {
      await sessionService.selfReportAttendance(session.id, user.id, attended);
      setUserSelfReported(true);
      setShowSelfReport(false);
      loadAttendanceData();
      toast.success(attended ? 'Attendance reported successfully' : 'Non-attendance reported successfully');
    } catch (error) {
      console.error('Failed to self-report attendance:', error);
      toast.error('Failed to report attendance');
    }
  };

  const handleIndividualAttendance = async (userId, attended) => {
    try {
      await sessionService.confirmAttendance(session.id, userId, attended, user.id);
      loadAttendanceData();
      toast.success('Attendance updated successfully');
    } catch (error) {
      console.error('Failed to update attendance:', error);
      toast.error('Failed to update attendance');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction) return;

    try {
      const attendeeIds = attendees
        .filter(a => a.status === 'registered' && !a.adminProcessed)
        .map(a => a.userId);

      if (attendeeIds.length === 0) {
        toast.error('No attendees to process');
        return;
      }

      await sessionService.bulkConfirmAttendance(
        session.id,
        attendeeIds,
        bulkAction === 'approve-all',
        user.id
      );

      loadAttendanceData();
      setBulkAction('');
      toast.success(`${attendeeIds.length} attendees processed successfully`);
    } catch (error) {
      console.error('Failed to process bulk attendance:', error);
      toast.error('Failed to process bulk attendance');
    }
  };

  const getAttendanceStatusIcon = (attendee) => {
    if (!attendee.adminProcessed) {
      if (attendee.selfReported) {
        return attendee.selfReportedAttended ? 
          <SafeIcon icon={FiClock} className="w-4 h-4 text-yellow-600" /> : 
          <SafeIcon icon={FiXCircle} className="w-4 h-4 text-red-600" />;
      }
      return <SafeIcon icon={FiClock} className="w-4 h-4 text-gray-400" />;
    }
    return attendee.attended ? 
      <SafeIcon icon={FiCheckCircle} className="w-4 h-4 text-green-600" /> : 
      <SafeIcon icon={FiXCircle} className="w-4 h-4 text-red-600" />;
  };

  const getAttendanceStatusText = (attendee) => {
    if (!attendee.adminProcessed) {
      if (attendee.selfReported) {
        return attendee.selfReportedAttended ? 'Self-reported: Attended' : 'Self-reported: Did not attend';
      }
      return 'Pending confirmation';
    }
    return attendee.attended ? 'Confirmed: Attended' : 'Confirmed: Did not attend';
  };

  const getAttendanceStatusColor = (attendee) => {
    if (!attendee.adminProcessed) {
      if (attendee.selfReported) {
        return attendee.selfReportedAttended ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';
      }
      return 'bg-gray-50 border-gray-200';
    }
    return attendee.attended ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isSessionCompleted = session.status === 'completed';
  const pendingCount = attendees.filter(a => a.status === 'registered' && !a.adminProcessed).length;
  const attendedCount = attendees.filter(a => a.attended).length;
  const totalRegistered = attendees.filter(a => a.status === 'registered' || a.status === 'interested').length;

  return (
    <div className="space-y-6">
      {/* Self-Report Prompt */}
      <AnimatePresence>
        {showSelfReport && (
          <motion.div
            initial={{opacity: 0, y: -20}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -20}}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-start space-x-3">
              <SafeIcon icon={FiAlertCircle} className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">Did you attend this session?</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Please confirm your attendance for "{session.title}" on {new Date(session.date).toLocaleDateString()}.
                  {!attendees.find(a => a.userId === user.id) && (
                    <span className="block text-xs mt-1 text-blue-600">
                      (You showed interest in this session, so you can still report your attendance)
                    </span>
                  )}
                </p>
                <div className="flex space-x-3 mt-3">
                  <button
                    onClick={() => handleSelfReport(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Yes, I attended
                  </button>
                  <button
                    onClick={() => handleSelfReport(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    No, I didn't attend
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && user && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">Debug Info:</h4>
          <div className="text-sm text-yellow-700 space-y-1">
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>User Email:</strong> {user.email}</p>
            <p><strong>Session Status:</strong> {session.status}</p>
            <p><strong>Session Date:</strong> {session.date}</p>
            <p><strong>Is Past:</strong> {new Date(session.date) < new Date() ? 'Yes' : 'No'}</p>
            <p><strong>Show Self Report:</strong> {showSelfReport ? 'Yes' : 'No'}</p>
            <p><strong>User in Attendees:</strong> {attendees.find(a => a.userId === user.id || (a.user && a.user.email === user.email)) ? 'Yes' : 'No'}</p>
            <p><strong>User in Interested:</strong> {session.interestedUsers?.some(i => i.user_id === user.id || (i.user && i.user.email === user.email)) ? 'Yes' : 'No'}</p>
            <p><strong>Total Attendees:</strong> {attendees.length}</p>
            <p><strong>Total Interested:</strong> {session.interestedUsers?.length || 0}</p>
          </div>
        </div>
      )}

      {/* Attendance Summary */}
      {isSessionCompleted && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Attendance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{attendedCount}</p>
              <p className="text-sm text-gray-600">Attended</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">{totalRegistered}</p>
              <p className="text-sm text-gray-600">Registered</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              <p className="text-sm text-gray-600">Pending Confirmation</p>
            </div>
          </div>
        </div>
      )}

      {/* Admin Controls */}
      {canManage && isSessionCompleted && pendingCount > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Bulk Actions</h3>
          <div className="flex items-center space-x-3">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select action...</option>
              <option value="approve-all">Mark all as attended</option>
              <option value="reject-all">Mark all as not attended</option>
            </select>
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Apply to {pendingCount} attendees
            </button>
          </div>
        </div>
      )}

      {/* Attendees List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">
            Registered Attendees ({totalRegistered})
          </h3>
        </div>

        {attendees.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {attendees
              .filter(attendee => attendee.status === 'registered' || attendee.status === 'interested')
              .map((attendee, index) => (
                <motion.div
                  key={attendee.userId || index}
                  initial={{opacity: 0, y: 10}}
                  animate={{opacity: 1, y: 0}}
                  transition={{delay: index * 0.05}}
                  className={`p-4 ${getAttendanceStatusColor(attendee)} border-l-4`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                        {attendee.user?.picture ? (
                          <img
                            src={attendee.user.picture}
                            alt={attendee.user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <SafeIcon icon={FiUsers} className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{attendee.user?.name || 'Unknown User'}</p>
                        <div className="flex items-center space-x-2 text-sm">
                          {getAttendanceStatusIcon(attendee)}
                          <span className={`${
                            attendee.adminProcessed 
                              ? attendee.attended ? 'text-green-700' : 'text-red-700'
                              : attendee.selfReported
                                ? attendee.selfReportedAttended ? 'text-yellow-700' : 'text-red-700'
                                : 'text-gray-500'
                          }`}>
                            {getAttendanceStatusText(attendee)}
                          </span>
                        </div>
                        {attendee.selfReported && !attendee.adminProcessed && (
                          <p className="text-xs text-gray-500 mt-1">
                            Self-reported on {new Date(attendee.selfReportedAt).toLocaleDateString()}
                          </p>
                        )}
                        {/* Show status for interested users */}
                        {attendee.status === 'interested' && (
                          <p className="text-xs text-blue-600 mt-1">
                            Originally showed interest, now self-reported attendance
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Individual Controls */}
                    {canManage && isSessionCompleted && !attendee.adminProcessed && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleIndividualAttendance(attendee.userId, true)}
                          className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                          title="Mark as attended"
                        >
                          <SafeIcon icon={FiCheck} className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleIndividualAttendance(attendee.userId, false)}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          title="Mark as not attended"
                        >
                          <SafeIcon icon={FiX} className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* View Only for Processed */}
                    {attendee.adminProcessed && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <SafeIcon icon={FiEye} className="w-4 h-4" />
                        <span>
                          Confirmed by {attendee.confirmedBy?.name || 'Admin'} on{' '}
                          {attendee.confirmedAt ? new Date(attendee.confirmedAt).toLocaleDateString() : 'Unknown date'}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <SafeIcon icon={FiUsers} className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No attendees registered for this session</p>
          </div>
        )}
      </div>

      {/* Interested Users Who Haven't Self-Reported */}
      {isSessionCompleted && session.interestedUsers && session.interestedUsers.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">
              Interested Users ({session.interestedUsers.length})
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Users who showed interest but haven't self-reported yet
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {session.interestedUsers.map((interested, index) => {
              // Check if this interested user has already self-reported (would be in attendees with status 'interested')
              const hasAlreadySelfReported = attendees.some(a => 
                (a.userId === interested.user_id || (a.user && interested.user && a.user.email === interested.user.email)) &&
                a.selfReported
              );

              // Only show if they haven't self-reported yet
              if (hasAlreadySelfReported) return null;

              return (
                <div key={interested.user_id || index} className="p-4 bg-blue-50 border-l-4 border-l-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                        {interested.user?.picture ? (
                          <img
                            src={interested.user.picture}
                            alt={interested.user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <SafeIcon icon={FiUsers} className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{interested.user?.name || 'Unknown User'}</p>
                        <div className="flex items-center space-x-2 text-sm">
                          <SafeIcon icon={FiClock} className="w-4 h-4 text-blue-500" />
                          <span className="text-blue-700">Showed interest - can self-report attendance</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Status Legend</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiClock} className="w-4 h-4 text-gray-400" />
            <span>Pending confirmation</span>
          </div>
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiClock} className="w-4 h-4 text-yellow-600" />
            <span>Self-reported attendance</span>
          </div>
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiCheckCircle} className="w-4 h-4 text-green-600" />
            <span>Confirmed attended</span>
          </div>
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiXCircle} className="w-4 h-4 text-red-600" />
            <span>Confirmed not attended</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            <strong>Note:</strong> Both registered attendees and users who showed interest can self-report their attendance for completed sessions.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SessionAttendanceManager;