const LoadingSpinner = ({
  size = "md",
  message = "Loading...",
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-16 w-16",
    lg: "h-24 w-24",
    xl: "h-32 w-32",
  };

  const spinner = (
    <div className="text-center animate-fadeIn">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} mx-auto mb-4`}
        style={{
          border: "4px solid rgba(255,255,255,0.3)",
          borderTopColor: "white",
          borderRightColor: "#667eea",
          borderBottomColor: "#764ba2",
        }}
      ></div>
      {message && (
        <p className="text-white text-xl font-bold drop-shadow-lg animate-pulse">
          ✨ {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">{spinner}</div>
  );
};

export default LoadingSpinner;
