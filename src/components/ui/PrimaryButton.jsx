export default function PrimaryButton({
  children,
  onClick,
  disabled = false,
  type = "button",
  style = {},
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "14px 18px",
        border: 0,
        borderRadius: 13,
        fontSize: 16,
        fontWeight: 700,
        color: "white",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        background:
          "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
        boxShadow: disabled
          ? "none"
          : "0 8px 20px rgba(99, 102, 241, 0.32)",
        ...style,
      }}
    >
      {children}
    </button>
  );
}