import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-primary mb-8">My Profile</h1>
        <div className="card">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <p className="text-lg text-gray-900">{user?.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <p className="text-lg text-gray-900">{user?.displayName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-lg text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <p className="text-lg text-gray-900 capitalize">{user?.role}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <p className="text-lg text-gray-900 capitalize">{user?.status}</p>
            </div>
            {user?.bio && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <p className="text-lg text-gray-900">{user.bio}</p>
              </div>
            )}
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Profile editing coming soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
