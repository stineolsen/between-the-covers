import { useState, useEffect } from 'react';

const StatusSelector = ({ currentStatus, onStatusChange, loading = false }) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  // Sync local state with prop when it changes
  useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus]);

  const statuses = [
    {
      value: 'to-read',
      label: '📚 Ønsker å lese',
      icon: '📚',
      gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      description: 'Legg til på din leseliste'
    },
    {
      value: 'currently-reading',
      label: '📖 Leser nå',
      icon: '📖',
      gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
      description: 'Du leser denne nå'
    },
    {
      value: 'read',
      label: '✅ Lest',
      icon: '✅',
      gradient: 'linear-gradient(135deg, #10b981, #14b8a6)',
      description: 'Du har fullført denne boka'
    }
  ];

  const handleStatusClick = async (status) => {
    // Update UI immediately for better UX
    setSelectedStatus(status);

    // Call the parent's status change handler
    if (onStatusChange) {
      try {
        await onStatusChange(status);
      } catch (error) {
        // Revert to previous status if save failed
        setSelectedStatus(currentStatus);
        console.error('Greide ikke lagre status:', error);
      }
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">📚 Din lesestatus</h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {statuses.map((status) => {
          const isSelected = selectedStatus === status.value;

          return (
            <button
              key={status.value}
              onClick={() => handleStatusClick(status.value)}
              disabled={loading}
              className={`
                relative p-4 rounded-2xl font-bold text-center transition-all transform
                ${isSelected
                  ? 'scale-105 shadow-2xl text-white'
                  : 'bg-white text-gray-700 hover:shadow-lg hover:scale-102 shadow-md'
                }
                ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              style={isSelected ? { background: status.gradient } : {}}
            >
              {/* Icon */}
              <div className="text-3xl mb-2">
                {status.icon}
              </div>

              {/* Label */}
              <div className={`text-sm font-bold mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                {status.label.replace(status.icon + ' ', '')}
              </div>

              {/* Description */}
              <div className={`text-xs ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                {status.description}
              </div>

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <span className="text-sm">✓</span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Current Status Display */}
      {selectedStatus && (
        <div className="p-4 rounded-2xl text-center animate-fadeIn" style={{ background: 'rgba(102, 126, 234, 0.1)' }}>
          <p className="text-sm font-bold text-gray-700">
            {selectedStatus === 'to-read' && '📚 Lagt til på din TBR-liste'}
            {selectedStatus === 'currently-reading' && '📖 Du leser denne boken for øyeblikket'}
            {selectedStatus === 'read' && '✅ Markert som lest'}
          </p>
        </div>
      )}
    </div>
  );
};

export default StatusSelector;
