export default function Card({
  children,
  style = {},
  onClick,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  className = "",
}) {
  return (
    <section
      className={className}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      style={{
        padding: 20,
        border: "1px solid rgba(148, 163, 184, 0.18)",
        borderRadius: 18,
        background:
          "linear-gradient(145deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.98))",
        boxShadow: "0 10px 28px rgba(0, 0, 0, 0.22)",
        color: "#f8fafc",
        ...style,
      }}
    >
      {children}
    </section>
  );
}