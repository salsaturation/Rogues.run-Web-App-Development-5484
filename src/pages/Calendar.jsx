import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Calendar from 'react-calendar';
import { format, isSameDay } from 'date-fns';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { sessionService } from '../services/sessionService';
import 'react-calendar/dist/Calendar.css';

const { FiCalendar, FiClock, FiMapPin, FiUsers, FiFilter, FiChevronRight } = FiIcons;

function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('calendar'); // 'calendar' or 'list'
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await sessionService.getSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSessionsForDate = (date) => {
    if (!date) return [];
    return sessions.filter(session => {
      if (!session.date) return false;
      const sessionDate = new Date(session.date);
      return isSameDay(date, sessionDate);
    });
  };

  const getTypeColor = (type) => {
    const colors = {
      'easy': 'bg-green-100 text-green-800',
      'tempo': 'bg-blue-100 text-blue-800',
      'interval': 'bg-purple-100 text-purple-800',
      'long-slow': 'bg-yellow-100 text-yellow-800',
      'trail': 'bg-orange-100 text-orange-800',
      'regular': 'bg-blue-100 text-blue-800',
      'training': 'bg-orange-100 text-orange-800',
      'long': 'bg-purple-100 text-purple-800',
      'speed': 'bg-red-100 text-red-800',
      'recovery': 'bg-green-100 text-green-800',
      'event': 'bg-yellow-100 text-yellow-800',
      'social': 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const sessionsForDate = getSessionsForDate(date);
      if (sessionsForDate.length > 0) {
        return (
          <div className="flex flex-wrap gap-1 mt-1">
            {sessionsForDate.slice(0, 2).map((session, idx) => (
              <div key={idx} className="w-2 h-2 rounded-full bg-blue-500" />
            ))}
            {sessionsForDate.length > 2 && (
              <div className="w-2 h-2 rounded-full bg-gray-400" />
            )}
          </div>
        );
      }
    }
    return null;
  };

  const selectedDateSessions = getSessionsForDate(selectedDate);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">View and manage running sessions</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex bg-white rounded-lg shadow-sm">
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-l-lg font-medium transition-colors ${
                view === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-r-lg font-medium transition-colors ${
                view === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="calendar-container">
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                tileContent={tileContent}
                className="w-full border-none"
              />
            </div>
          </motion.div>

          {/* Selected Date Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {format(selectedDate, 'MMMM d, yyyy')}
            </h2>
            {selectedDateSessions.length > 0 ? (
              <div className="space-y-4">
                {selectedDateSessions.map((session) => (
                  <div key={session.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{session.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(session.runType || 'regular')}`}>
                        {session.runType || 'regular'}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <SafeIcon icon={FiClock} className="w-4 h-4" />
                        <span>{session.time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <SafeIcon icon={FiMapPin} className="w-4 h-4" />
                        <span>{session.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <SafeIcon icon={FiUsers} className="w-4 h-4" />
                        <span>{session.attendeeCount || 0} attendees</span>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button 
                        onClick={() => window.location.href = `#/sessions?id=${session.id}`}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <span>Details</span>
                        <SafeIcon icon={FiChevronRight} className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <SafeIcon icon={FiCalendar} className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No sessions scheduled for this date</p>
              </div>
            )}
          </motion.div>
        </div>
      ) : (
        /* List View */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Activities</h2>
              <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                <SafeIcon icon={FiFilter} className="w-4 h-4" />
                <span>Filter</span>
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {sessions
              .filter(session => new Date(session.date) >= new Date())
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{session.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(session.runType || 'regular')}`}>
                          {session.runType || 'regular'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <SafeIcon icon={FiCalendar} className="w-4 h-4" />
                          <span>{new Date(session.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <SafeIcon icon={FiClock} className="w-4 h-4" />
                          <span>{session.time}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <SafeIcon icon={FiMapPin} className="w-4 h-4" />
                          <span>{session.location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <SafeIcon icon={FiUsers} className="w-4 h-4" />
                          <span>{session.attendeeCount || 0} attending</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => window.location.href = `#/sessions?id=${session.id}`}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </motion.div>
              ))}
            
            {sessions.filter(session => new Date(session.date) >= new Date()).length === 0 && (
              <div className="text-center py-12">
                <SafeIcon icon={FiCalendar} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming sessions</h3>
                <p className="text-gray-500">Check back later or create a new session</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { type: 'regular', label: 'Regular Run' },
            { type: 'training', label: 'Training' },
            { type: 'long', label: 'Long Run' },
            { type: 'speed', label: 'Speed Work' },
            { type: 'recovery', label: 'Recovery' },
            { type: 'event', label: 'Event' },
            { type: 'social', label: 'Social' }
          ].map((item) => (
            <div key={item.type} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getTypeColor(item.type).replace('text-', 'bg-').split(' ')[0]}`} />
              <span className="text-sm text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default CalendarPage;