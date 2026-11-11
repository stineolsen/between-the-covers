export const MONTHS = [
  "januar", "februar", "mars", "april", "mai", "juni",
  "juli", "august", "september", "oktober", "november", "desember",
];

// A month column - a button when the chart is used as a filter
const Bar = ({ onClick, selected, dimmed, title, children }) => {
  const className = "flex-1 flex flex-col items-center justify-end h-full transition-opacity";
  const style = { opacity: dimmed ? 0.35 : 1, outline: selected ? "2px solid currentColor" : undefined, outlineOffset: 2, borderRadius: 4 };
  return onClick ? (
    <button type="button" onClick={onClick} className={className} style={style} title={title} aria-pressed={selected} aria-label={title}>
      {children}
    </button>
  ) : (
    <div className={className} title={title}>
      {children}
    </div>
  );
};

// Books finished per month - a single-series column chart. Only the best
// month gets a value on its cap; every bar has a hover title, and the
// numbers are also in a visually hidden table for screen readers.
// `barColor`/`textColor` let the story slides draw it on a coloured
// background; the defaults follow the site theme.
const MonthChart = ({
  months,
  bestMonthIndex,
  height = 140,
  barColor = "var(--color-primary)",
  trackColor = "var(--color-border)",
  textColor = "var(--color-text-muted)",
  animate = false,
  // Optional: makes each month a button (e.g. to filter a list by month)
  onSelectMonth,
  selectedMonth = null,
}) => {
  const max = Math.max(1, ...months.map((m) => m.books));

  return (
    <figure className="w-full">
      <div className="flex items-end gap-[2px]" style={{ height }} aria-hidden={onSelectMonth ? undefined : "true"}>
        {months.map((m, i) => {
          const barHeight = m.books ? Math.max(6, (m.books / max) * (height - 22)) : 0;
          return (
            <Bar
              key={i}
              onClick={onSelectMonth ? () => onSelectMonth(selectedMonth === i ? null : i) : undefined}
              selected={selectedMonth === i}
              dimmed={selectedMonth !== null && selectedMonth !== i}
              title={`${MONTHS[i]}: ${m.books} ${m.books === 1 ? "bok" : "bøker"}${m.pages ? `, ${m.pages.toLocaleString("nb-NO")} sider` : ""}`}
            >
              {(i === bestMonthIndex || (onSelectMonth && m.books > 0)) && m.books > 0 && (
                <span className="text-xs font-semibold mb-1" style={{ color: textColor }}>
                  {m.books}
                </span>
              )}
              <div
                className={`w-full max-w-[24px]${animate ? " wrapped-motion" : ""}`}
                style={{
                  height: barHeight,
                  background: m.books ? barColor : "transparent",
                  borderRadius: "4px 4px 0 0",
                  transformOrigin: "bottom",
                  animation: animate ? `wrappedGrow 0.7s cubic-bezier(.2,.8,.2,1) ${i * 0.05}s both` : undefined,
                }}
              />
            </Bar>
          );
        })}
      </div>
      <div className="h-px w-full" style={{ background: trackColor }} aria-hidden="true" />
      <div className="flex gap-[2px] mt-1" aria-hidden="true">
        {MONTHS.map((name, i) => (
          <span key={name} className="flex-1 text-center text-[10px] uppercase" style={{ color: textColor }}>
            {name[0]}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Bøker lest per måned</caption>
        <tbody>
          {months.map((m, i) => (
            <tr key={i}>
              <th scope="row">{MONTHS[i]}</th>
              <td>{m.books} bøker</td>
              <td>{m.pages} sider</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};

export default MonthChart;
