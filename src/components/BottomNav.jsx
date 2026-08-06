import { NavLink } from "react-router-dom";

const liens = [
  { chemin: "/tableau-de-bord", icone: "🏠", texte: "Accueil" },
  { chemin: "/classement", icone: "🥇", texte: "Classement" },
  { chemin: "/equipes", icone: "🌍", texte: "Équipes" },
  { chemin: "/defis", icone: "⚔️", texte: "Défis" },
  { chemin: "/admin", icone: "🔐", texte: "Admin" },
];

export default function BottomNav() {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        background: "white",
        borderTop: "1px solid #d1d5db",
        zIndex: 1000,
      }}
    >
      {liens.map((lien) => (
        <NavLink
          key={lien.chemin}
          to={lien.chemin}
          style={({ isActive }) => ({
            padding: "10px 4px",
            textAlign: "center",
            textDecoration: "none",
            fontSize: 12,
            color: isActive ? "#1d4ed8" : "#4b5563",
            fontWeight: isActive ? "700" : "400",
            background: isActive ? "#eff6ff" : "white",
          })}
        >
          <div style={{ fontSize: 22 }}>{lien.icone}</div>
          <div>{lien.texte}</div>
        </NavLink>
      ))}
    </nav>
  );
}