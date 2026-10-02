const STEPS = [
  { n: 1, label: "Bekreft liste", key: "confirmList" },
  { n: 2, label: "Ranger bokklubb", key: "ranking" },
  { n: 3, label: "Book Awards", key: "awards" },
];

const Stepper = ({ current, completed, onStepClick }) => {
  const maxReached = completed.ranking ? 3 : completed.confirmList ? 2 : 1;

  return (
    <div className="flex items-center gap-2 mb-5 flex-wrap">
      {STEPS.map((step, idx) => {
        const isDone = completed[step.key];
        const isCurrent = step.n === current;
        const canClick = step.n <= maxReached || isCurrent;

        return (
          <div key={step.n} className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canClick}
              onClick={() => canClick && onStepClick?.(step.n)}
              className="flex items-center gap-2 text-xs font-bold"
              style={{
                color: isCurrent ? "var(--color-text)" : "var(--color-text-faint)",
                cursor: canClick ? "pointer" : "default",
              }}
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-[0.7rem]"
                style={{
                  background: isDone
                    ? "var(--color-sage)"
                    : isCurrent
                      ? "var(--color-primary-solid)"
                      : "var(--color-sunken)",
                  color: isDone || isCurrent ? "#fff" : "var(--color-text-faint)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {isDone ? "✓" : step.n}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {idx < STEPS.length - 1 && (
              <div className="w-5 h-px" style={{ background: "var(--color-border)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Stepper;
