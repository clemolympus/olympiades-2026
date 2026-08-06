import Card from "./Card";

export default function StatCard({
  icon,
  value,
  label,
  description,
}) {
  return (
    <Card
      style={{
        minHeight: 120,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 32 }}>{icon}</span>

        <strong
          style={{
            fontSize: 34,
            lineHeight: 1,
          }}
        >
          {value}
        </strong>
      </div>

      <div
        style={{
          marginTop: 12,
          fontSize: 14,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "#cbd5e1",
        }}
      >
        {label}
      </div>

      {description && (
        <div
          style={{
            marginTop: 5,
            fontSize: 13,
            color: "#94a3b8",
          }}
        >
          {description}
        </div>
      )}
    </Card>
  );
}