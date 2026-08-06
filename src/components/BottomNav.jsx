import { NavLink } from "react-router-dom";
import {
  House,
  Medal,
  Users,
  Swords,
  LockKeyhole,
} from "lucide-react";

const liens = [
  {
    chemin: "/tableau-de-bord",
    icone: House,
    texte: "Accueil",
  },
  {
    chemin: "/classement",
    icone: Medal,
    texte: "Classement",
  },
  {
    chemin: "/equipes",
    icone: Users,
    texte: "Équipes",
  },
  {
    chemin: "/defis",
    icone: Swords,
    texte: "Défis",
  },
  {
    chemin: "/admin",
    icone: LockKeyhole,
    texte: "Admin",
  },
];

export default function BottomNav() {
  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        paddingBottom: "env(safe-area-inset-bottom)",
        borderTop: "1px solid rgba(148, 163, 184, 0.18)",
        background: "rgba(248, 250, 252, 0.98)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 -8px 30px rgba(2, 6, 23, 0.12)",
      }}
    >
      {liens.map((lien) => {
        const Icone = lien.icone;

        return (
          <NavLink
            key={lien.chemin}
            to={lien.chemin}
            style={({ isActive }) => ({
              position: "relative",
              display: "flex",
              minWidth: 0,
              minHeight: 72,
              padding: "9px 2px 8px",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              overflow: "hidden",
              color: isActive ? "#4f46e5" : "#64748b",
              background: isActive
                ? "linear-gradient(180deg, rgba(99, 102, 241, 0.12), rgba(238, 242, 255, 0.7))"
                : "transparent",
              textDecoration: "none",
              fontSize: 11,
              fontWeight: isActive ? 800 : 600,
              transition:
                "color 0.2s ease, background 0.2s ease, transform 0.2s ease",
            })}
          >
            {({ isActive }) => (
              <>
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    width: isActive ? 34 : 0,
                    height: 3,
                    borderRadius: "0 0 999px 999px",
                    background: "#6366f1",
                    transform: "translateX(-50%)",
                    transition: "width 0.2s ease",
                  }}
                />

                <span
                  style={{
                    display: "grid",
                    width: 31,
                    height: 31,
                    placeItems: "center",
                    borderRadius: 10,
                    background: isActive
                      ? "rgba(99, 102, 241, 0.12)"
                      : "transparent",
                    transform: isActive ? "translateY(-1px)" : "none",
                    transition:
                      "background 0.2s ease, transform 0.2s ease",
                  }}
                >
                  <Icone
                    size={22}
                    strokeWidth={isActive ? 2.4 : 2}
                  />
                </span>

                <span
                  style={{
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {lien.texte}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}