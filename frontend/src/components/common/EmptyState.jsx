import { Link } from 'react-router-dom';

const EmptyState = ({
  icon = '📚',
  title = 'Nothing here yet',
  message = 'Check back later!',
  actionText = null,
  actionLink = null,
  onAction = null
}) => {
  return (
    <div
      className="text-center py-20 px-4 rounded-3xl animate-fadeIn"
      style={{
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))'
      }}
    >
      <div className="text-8xl mb-6 animate-bounce">{icon}</div>
      <h2 className="text-4xl font-bold gradient-text mb-4">{title}</h2>
      <p className="text-gray-600 text-xl mb-6 max-w-md mx-auto leading-relaxed">
        {message}
      </p>

      {(actionText && (actionLink || onAction)) && (
        actionLink ? (
          <Link
            to={actionLink}
            className="inline-block px-8 py-4 rounded-full font-bold text-white shadow-lg transition-all transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
          >
            {actionText}
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="inline-block px-8 py-4 rounded-full font-bold text-white shadow-lg transition-all transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
          >
            {actionText}
          </button>
        )
      )}
    </div>
  );
};

export default EmptyState;
