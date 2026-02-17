import { useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const Admin = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const data = await authApi.getPendingUsers();
      setPendingUsers(data.users);
      setError('');
    } catch (err) {
      setError('Failed to load pending users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId, status) => {
    try {
      await authApi.approveUser(userId, status);
      setSuccessMessage(`User ${status} successfully!`);
      // Remove user from pending list
      setPendingUsers(pendingUsers.filter(user => user._id !== userId));

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(`Failed to ${status} user`);
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage pending user registrations</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}

        {loading ? (
          <div className="card text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading pending users...</p>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 text-lg">No pending users at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {pendingUsers.map((user) => (
              <div key={user._id} className="card hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      {user.displayName || user.username}
                    </h3>
                    <p className="text-gray-600 mb-1">@{user.username}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    {user.bio && (
                      <p className="mt-2 text-gray-700 italic">{user.bio}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      Registered: {new Date(user.joinedDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-3 ml-6">
                    <button
                      onClick={() => handleApproveUser(user._id, 'approved')}
                      className="btn-accent px-6"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleApproveUser(user._id, 'rejected')}
                      className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
