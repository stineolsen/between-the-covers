import { Link } from "react-router-dom";

const EmptyState = ({
  icon = "📚",
  title = "Nothing here yet",
  message = "Check back later!",
  actionText = null,
  actionLink = null,
  onAction = null,
}) => {
  return (
    <div
      className="text-center py-20 px-4 rounded-3xl animate-fadeIn"
      style={{ background: "var(--gradient-secondary)" }}
    >
      <div className="text-8xl mb-6 animate-bounce">{icon}</div>
      <h2 className="text-4xl font-bold gradient-text mb-4">{title}</h2>
      <p className="text-xl mb-6 max-w-md mx-auto leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
        {message}
      </p>

      {actionText &&
        (actionLink || onAction) &&
        (actionLink ? (
          <Link to={actionLink} className="btn-primary inline-block px-8 py-4 shadow-lg transform hover:scale-105">
            {actionText}
          </Link>
        ) : (
          <button onClick={onAction} className="btn-primary inline-block px-8 py-4 shadow-lg transform hover:scale-105">
            {actionText}
          </button>
        ))}
    </div>
  );
};

export default EmptyState;
