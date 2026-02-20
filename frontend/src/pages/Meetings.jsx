import { useState, useEffect } from 'react';
import { meetingsApi } from '../api/meetingsApi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import MeetingCard from '../components/meetings/MeetingCard';
import MeetingForm from '../components/meetings/MeetingForm';

const Meetings = () => {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);

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

  const handleCreateMeeting = () => {
    setEditingMeeting(null);
    setShowForm(true);
  };

  const handleEditMeeting = (meeting) => {
    setEditingMeeting(meeting);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    toast.success(`Møte ${editingMeeting ? 'oppdatert' : 'opprettet'}!`);
    setShowForm(false);
    setEditingMeeting(null);
    fetchMeetings();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingMeeting(null);
  };

  const handleRSVP = async (meetingId) => {
    try {
      const data = await meetingsApi.rsvpMeeting(meetingId);
      // Update the meeting in the list
      setMeetings(meetings.map(m => m._id === meetingId ? data.meeting : m));

      // Show success message
      if (data.isAttending) {
        toast.success('Du er nå registrert for møtet!');
      } else {
        toast.success('Din RSVP har blitt fjernet');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Greide ikke RSVP til møtet');
    }
  };

  const handleDelete = async (meetingId) => {
    if (!window.confirm('Er du sikker på at du vil slette dette møtet? Dette kan ikke angres.')) {
      return;
    }

    try {
      await meetingsApi.deleteMeeting(meetingId);
      setMeetings(meetings.filter(m => m._id !== meetingId));
      toast.success('Møtet slettet');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Greide ikke slette møte');
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Show form or main content */}
        {showForm ? (
          <MeetingForm
            meeting={editingMeeting}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-8 animate-fadeIn">
              <h1 className="text-5xl font-bold gradient-text mb-3">📅 Hva skjer framover?</h1>

              {/* Admin: Create Meeting Button */}
              {isAdmin && (
                <button
                  onClick={handleCreateMeeting}
                  className="btn-primary text-lg px-8 py-4"
                >
                  ✨ Opprett nytt møte
                </button>
              )}
            </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8 animate-fadeIn">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
              activeTab === 'upcoming'
                ? 'text-white shadow-md'
                : 'bg-white text-gray-700 hover:shadow-md border border-gray-200'
            }`}
            style={activeTab === 'upcoming' ? { background: 'var(--color-primary)' } : {}}
          >
            🗓️ Kommende
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
              activeTab === 'past'
                ? 'text-white shadow-md'
                : 'bg-white text-gray-700 hover:shadow-md border border-gray-200'
            }`}
            style={activeTab === 'past' ? { background: 'var(--color-secondary)' } : {}}
          >
            🗂️ Arkiverte møter
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20 animate-fadeIn">
            <div className="animate-spin rounded-full h-20 w-20 mx-auto mb-4" style={{ border: '4px solid rgba(107, 91, 149, 0.3)', borderTopColor: 'var(--color-primary)' }}></div>
            <p className="text-gray-700 text-xl font-bold">✨ Laster møter...</p>
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
                    onEdit={handleEditMeeting}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {/* Info Section */}
            <div
              className="mt-12 p-8 rounded-2xl text-center animate-fadeIn"
              style={{ background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.1), rgba(245, 87, 108, 0.1))' }}
            >
              <h3 className="text-2xl font-bold gradient-text mb-3">💡 Om våre møter</h3>
              <p className="text-gray-700 max-w-3xl mx-auto leading-relaxed text-lg">
                Bokklubben vår er en fantastisk plass for alle oss bokelskere til å diskutere både månedens bok og alle andre bøker vi kunne ønske å diskutere! 
                Her er det mulighet for å snakke om bøker du elsker, bøker du hater og alle andre følelser du har rundt bøkene du har eller vil lese. 
                Skal vi se på historikken, er dette også en fantastisk arena for å bli oppdatret på gjenens gossip og bare kose deg med litt yapping. 
              </p>
            </div>
          </>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default Meetings;
