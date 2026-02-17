import { useState, useEffect } from 'react';
import { meetingsApi } from '../api/meetingsApi';
import { useAuth } from '../contexts/AuthContext';
import MeetingCard from '../components/meetings/MeetingCard';

const Meetings = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetings();
  }, [activeTab]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeTab === 'upcoming') params.upcoming = 'true';
      if (activeTab === 'past') params.past = 'true';

      const data = await meetingsApi.getMeetings(params);
      setMeetings(data.meetings || []);
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (meetingId) => {
    try {
      const data = await meetingsApi.rsvpMeeting(meetingId);
      // Update the meeting in the list
      setMeetings(meetings.map(m => m._id === meetingId ? data.meeting : m));

      // Show success message
      if (data.isAttending) {
        alert('✅ You\'re now registered for this meeting!');
      } else {
        alert('👋 Your RSVP has been removed');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to RSVP to meeting');
    }
  };

  const handleEdit = (meeting) => {
    // TODO: Implement edit functionality with modal/form
    alert('Edit meeting functionality coming soon!');
  };

  const handleDelete = async (meetingId) => {
    if (!window.confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) {
      return;
    }

    try {
      await meetingsApi.deleteMeeting(meetingId);
      setMeetings(meetings.filter(m => m._id !== meetingId));
      alert('✅ Meeting deleted successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete meeting');
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeIn">
          <h1 className="text-6xl font-bold gradient-text mb-4">📅 Bookclub Meetings</h1>
          <p className="text-xl text-white font-medium max-w-2xl mx-auto mb-6">
            Join us for lively discussions, great company, and a shared love of books!
          </p>

          {/* Admin: Create Meeting Button */}
          {isAdmin && (
            <button
              onClick={() => alert('Create meeting functionality coming soon!')}
              className="btn-primary text-lg px-8 py-4"
            >
              ✨ Create New Meeting
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8 animate-fadeIn">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg ${
              activeTab === 'upcoming'
                ? 'text-white'
                : 'bg-white text-gray-700 hover:shadow-xl'
            }`}
            style={activeTab === 'upcoming' ? { background: 'linear-gradient(135deg, #667eea, #764ba2)' } : {}}
          >
            📅 Upcoming
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg ${
              activeTab === 'past'
                ? 'text-white'
                : 'bg-white text-gray-700 hover:shadow-xl'
            }`}
            style={activeTab === 'past' ? { background: 'linear-gradient(135deg, #f093fb, #f5576c)' } : {}}
          >
            📚 Past Meetings
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20 animate-fadeIn">
            <div className="animate-spin rounded-full h-20 w-20 mx-auto mb-4" style={{ border: '4px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }}></div>
            <p className="text-white text-xl font-bold drop-shadow-lg">✨ Loading meetings...</p>
          </div>
        )}

        {/* Meetings Grid */}
        {!loading && (
          <>
            {meetings.length === 0 ? (
              <div
                className="container-gradient text-center py-20 animate-fadeIn"
                style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))' }}
              >
                <div className="text-6xl mb-4">
                  {activeTab === 'upcoming' ? '📅' : '📚'}
                </div>
                <h2 className="text-3xl font-bold gradient-text mb-3">
                  {activeTab === 'upcoming' ? 'No Upcoming Meetings' : 'No Past Meetings'}
                </h2>
                <p className="text-gray-600 text-lg">
                  {activeTab === 'upcoming'
                    ? 'Check back later for our next bookclub gathering!'
                    : 'No meeting history yet. Stay tuned!'}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {meetings.map((meeting) => (
                  <MeetingCard
                    key={meeting._id}
                    meeting={meeting}
                    onRSVP={handleRSVP}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Info Section */}
        <div
          className="mt-12 p-8 rounded-2xl text-center animate-fadeIn"
          style={{ background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.1), rgba(245, 87, 108, 0.1))' }}
        >
          <h3 className="text-2xl font-bold gradient-text mb-3">💡 About Our Meetings</h3>
          <p className="text-gray-700 max-w-3xl mx-auto leading-relaxed text-lg">
            Our bookclub meetings are a wonderful opportunity to connect with fellow readers, share insights,
            and explore new perspectives. Whether you've finished the book or you're still reading,
            all are welcome to join the conversation. RSVP to let us know you're coming, and we'll see you there!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Meetings;
