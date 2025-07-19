import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { analyticsService } from '../services/analyticsService';
import ReactECharts from 'echarts-for-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';

const { 
  FiBarChart2, FiActivity, FiUsers, FiCalendar, 
  FiTrendingUp, FiArrowUp, FiArrowDown, 
  FiDownload, FiRefreshCw
} = FiIcons;

function Analytics() {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [timeframe, setTimeframe] = useState('week'); // 'week', 'month', 'year'
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'sessions', 'users'
  const [mockData, setMockData] = useState(null);

  useEffect(() => {
    loadAnalytics();
    generateMockData();
    
    // Track page view
    analyticsService.trackPageView('analytics', user?.id);
  }, [timeframe]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getAnalyticsSummary();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock data for demo purposes
  const generateMockData = () => {
    // Generate dates for the selected timeframe
    const today = new Date();
    let startDate;
    
    switch (timeframe) {
      case 'week':
        startDate = subDays(today, 7);
        break;
      case 'month':
        startDate = subDays(today, 30);
        break;
      case 'year':
        startDate = subDays(today, 365);
        break;
      default:
        startDate = subDays(today, 7);
    }
    
    const dateRange = eachDayOfInterval({ start: startDate, end: today });
    
    // Generate session attendance data
    const sessionData = dateRange.map(date => ({
      date: format(date, 'yyyy-MM-dd'),
      attendees: Math.floor(Math.random() * 20) + 5,
      sessions: Math.floor(Math.random() * 3) + 1
    }));
    
    // Generate user growth data
    let userCount = 20;
    const userGrowth = dateRange.map(date => {
      const newUsers = Math.floor(Math.random() * 3);
      userCount += newUsers;
      return {
        date: format(date, 'yyyy-MM-dd'),
        totalUsers: userCount,
        newUsers
      };
    });
    
    // Generate pace group distribution
    const paceGroups = [
      { name: '5:00-5:30 min/km', value: Math.floor(Math.random() * 20) + 10 },
      { name: '5:30-6:00 min/km', value: Math.floor(Math.random() * 30) + 15 },
      { name: '6:00-6:30 min/km', value: Math.floor(Math.random() * 25) + 20 },
      { name: '6:30-7:00 min/km', value: Math.floor(Math.random() * 15) + 10 },
      { name: '7:00-7:30 min/km', value: Math.floor(Math.random() * 10) + 5 }
    ];
    
    // Generate session type distribution
    const sessionTypes = [
      { name: 'Easy', value: Math.floor(Math.random() * 30) + 20 },
      { name: 'Tempo', value: Math.floor(Math.random() * 20) + 10 },
      { name: 'Interval', value: Math.floor(Math.random() * 15) + 5 },
      { name: 'Long Run', value: Math.floor(Math.random() * 10) + 5 },
      { name: 'Trail', value: Math.floor(Math.random() * 5) + 3 }
    ];
    
    // Generate popular locations
    const locations = [
      { name: 'Central Park', value: Math.floor(Math.random() * 40) + 20 },
      { name: 'Riverside Trail', value: Math.floor(Math.random() * 30) + 15 },
      { name: 'Hill Park', value: Math.floor(Math.random() * 20) + 10 },
      { name: 'Track & Field', value: Math.floor(Math.random() * 15) + 5 },
      { name: 'City Marathon Route', value: Math.floor(Math.random() * 10) + 3 }
    ];
    
    setMockData({
      sessionData,
      userGrowth,
      paceGroups,
      sessionTypes,
      locations,
      totalSessions: sessionData.reduce((sum, day) => sum + day.sessions, 0),
      totalAttendees: sessionData.reduce((sum, day) => sum + day.attendees, 0),
      averageAttendance: Math.round(sessionData.reduce((sum, day) => sum + day.attendees, 0) / sessionData.reduce((sum, day) => sum + day.sessions, 0))
    });
  };

  const getSessionAttendanceOptions = () => {
    if (!mockData?.sessionData) return {};
    
    const dates = mockData.sessionData.map(item => item.date);
    const attendees = mockData.sessionData.map(item => item.attendees);
    const sessions = mockData.sessionData.map(item => item.sessions);
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['Attendees', 'Sessions'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          interval: dates.length > 14 ? 'auto' : 0,
          rotate: dates.length > 7 ? 45 : 0
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Attendees',
          position: 'left'
        },
        {
          type: 'value',
          name: 'Sessions',
          position: 'right',
          min: 0,
          max: 5,
          interval: 1
        }
      ],
      series: [
        {
          name: 'Attendees',
          type: 'bar',
          data: attendees,
          itemStyle: {
            color: '#60a5fa'
          }
        },
        {
          name: 'Sessions',
          type: 'line',
          yAxisIndex: 1,
          data: sessions,
          itemStyle: {
            color: '#10b981'
          },
          symbolSize: 8
        }
      ]
    };
  };

  const getUserGrowthOptions = () => {
    if (!mockData?.userGrowth) return {};
    
    const dates = mockData.userGrowth.map(item => item.date);
    const totalUsers = mockData.userGrowth.map(item => item.totalUsers);
    
    return {
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          interval: dates.length > 14 ? 'auto' : 0,
          rotate: dates.length > 7 ? 45 : 0
        }
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: 'Total Users',
          type: 'line',
          smooth: true,
          data: totalUsers,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: 'rgba(129, 140, 248, 0.6)'
                },
                {
                  offset: 1,
                  color: 'rgba(129, 140, 248, 0.1)'
                }
              ]
            }
          },
          itemStyle: {
            color: '#818cf8'
          },
          symbolSize: 8
        }
      ]
    };
  };

  const getPaceGroupOptions = () => {
    if (!mockData?.paceGroups) return {};
    
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        data: mockData.paceGroups.map(item => item.name)
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '14',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: mockData.paceGroups
        }
      ]
    };
  };

  const getSessionTypeOptions = () => {
    if (!mockData?.sessionTypes) return {};
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: mockData.sessionTypes.map(item => item.name)
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          data: mockData.sessionTypes.map(item => ({
            value: item.value,
            itemStyle: {
              color: item.name === 'Easy' ? '#10b981' : 
                     item.name === 'Tempo' ? '#3b82f6' : 
                     item.name === 'Interval' ? '#8b5cf6' : 
                     item.name === 'Long Run' ? '#f59e0b' : 
                     '#ef4444'
            }
          })),
          type: 'bar'
        }
      ]
    };
  };

  const getPopularLocationsOptions = () => {
    if (!mockData?.locations) return {};
    
    return {
      tooltip: {
        trigger: 'item'
      },
      series: [
        {
          type: 'pie',
          radius: '70%',
          data: mockData.locations.map(item => ({
            name: item.name,
            value: item.value
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
  };

  if (!user?.isAdmin) {
    return (
      <div className="text-center py-12">
        <SafeIcon icon={FiBarChart2} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">You need admin privileges to view analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-blue-100 text-lg">Track your running community metrics</p>
          </div>
          <div className="hidden md:flex space-x-4">
            <button
              onClick={() => loadAnalytics()}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <SafeIcon icon={FiRefreshCw} className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <SafeIcon icon={FiDownload} className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2 bg-white rounded-lg shadow-sm p-1">
          <button
            onClick={() => setTimeframe('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeframe === 'week'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeframe === 'month'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeframe('year')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeframe === 'year'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Year
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'sessions'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Sessions
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Users
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Key Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Sessions</p>
                      <p className="text-3xl font-bold text-gray-900">{mockData?.totalSessions || 0}</p>
                      <p className="text-sm font-medium mt-1 text-green-600">
                        <span className="flex items-center">
                          <SafeIcon icon={FiArrowUp} className="w-4 h-4 mr-1" />
                          12% vs previous {timeframe}
                        </span>
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center">
                      <SafeIcon icon={FiActivity} className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Attendees</p>
                      <p className="text-3xl font-bold text-gray-900">{mockData?.totalAttendees || 0}</p>
                      <p className="text-sm font-medium mt-1 text-green-600">
                        <span className="flex items-center">
                          <SafeIcon icon={FiArrowUp} className="w-4 h-4 mr-1" />
                          8% vs previous {timeframe}
                        </span>
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center">
                      <SafeIcon icon={FiUsers} className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg. Attendance</p>
                      <p className="text-3xl font-bold text-gray-900">{mockData?.averageAttendance || 0}</p>
                      <p className="text-sm font-medium mt-1 text-red-600">
                        <span className="flex items-center">
                          <SafeIcon icon={FiArrowDown} className="w-4 h-4 mr-1" />
                          3% vs previous {timeframe}
                        </span>
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center">
                      <SafeIcon icon={FiTrendingUp} className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Main Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Session Attendance</h2>
                  <div className="h-80">
                    <ReactECharts 
                      option={getSessionAttendanceOptions()} 
                      style={{ height: '100%', width: '100%' }}
                    />
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <h2 className="text-lg font-bold text-gray-900 mb-4">User Growth</h2>
                  <div className="h-80">
                    <ReactECharts 
                      option={getUserGrowthOptions()} 
                      style={{ height: '100%', width: '100%' }}
                    />
                  </div>
                </motion.div>
              </div>
            </>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-4">Session Types</h2>
                <div className="h-80">
                  <ReactECharts 
                    option={getSessionTypeOptions()} 
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-4">Popular Locations</h2>
                <div className="h-80">
                  <ReactECharts 
                    option={getPopularLocationsOptions()} 
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-sm col-span-1 md:col-span-2"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-4">Session Trends</h2>
                <div className="h-80">
                  <ReactECharts 
                    option={getSessionAttendanceOptions()} 
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
              </motion.div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-4">User Growth</h2>
                <div className="h-80">
                  <ReactECharts 
                    option={getUserGrowthOptions()} 
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-4">Pace Group Distribution</h2>
                <div className="h-80">
                  <ReactECharts 
                    option={getPaceGroupOptions()} 
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-sm col-span-1 md:col-span-2"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-4">Member Activity</h2>
                <p className="text-gray-500 mb-4">Recent member activity statistics</p>
              </motion.div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Analytics;