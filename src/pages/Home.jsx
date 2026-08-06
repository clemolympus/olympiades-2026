import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";

const phrasesAccueil = [
  "🏆 Que les meilleurs gagnent.",
  "🔥 Prêt pour la compétition ?",
  "🥇 La victoire se mérite.",
  "🌍 Représente ton pays avec fierté.",
  "🚀 À toi d'écrire l'histoire.",
  "🎯 Chaque point peut faire la différence.",
  "🌟 Les légendes commencent ici.",
  "🏅 Fais honneur à tes couleurs.",
  "🎉 Que les Olympiades commencent !",
  "⚡ Tout commence maintenant.",
];

const optionsAccueil = [
  {
    titre: "Accès joueur",
    description: "Retrouve ton profil et rejoins la compétition.",
    icone: "👤",
    couleurIcone: "rgba(139, 92, 246, 0.16)",
    chemin: "/connexion",
  },
  {
    titre: "Administration",
    description: "Gère les équipes, les défis et les points.",
    icone: "🛠️",
    couleurIcone: "rgba(59, 130, 246, 0.15)",
    chemin: "/admin",
  },
  {
    titre: "Première inscription",
    description: "Crée ton profil avant la répartition des équipes.",
    icone: "➕",
    couleurIcone: "rgba(34, 197, 94, 0.14)",
    chemin: "/inscription",
  },
];

export default function Home() {
  const navigate = useNavigate();

  const phrase = useMemo(() => {
    const index = Math.floor(Math.random() * phrasesAccueil.length);
    return phrasesAccueil[index];
  }, []);

  function faireMonterCarte(event) {
    event.currentTarget.style.transform = "translateY(-3px)";
    event.currentTarget.style.boxShadow =
      "0 17px 36px rgba(0, 0, 0, 0.34)";
    event.currentTarget.style.borderColor =
      "rgba(139, 92, 246, 0.38)";
  }

  function remettreCarte(event) {
    event.currentTarget.style.transform = "translateY(0)";
    event.currentTarget.style.boxShadow =
      "0 10px 28px rgba(0, 0, 0, 0.22)";
    event.currentTarget.style.borderColor =
      "rgba(148, 163, 184, 0.18)";
  }

  function enfoncerCarte(event) {
    event.currentTarget.style.transform = "translateY(0) scale(0.99)";
  }

  function relacherCarte(event) {
    event.currentTarget.style.transform = "translateY(-3px) scale(1)";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        boxSizing: "border-box",
        padding: "30px 18px",
        color: "#f8fafc",
        background:
          "radial-gradient(circle at top, #2e1065 0%, #11133f 34%, #080d20 68%, #020617 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          margin: "0 auto",
        }}
      >
        <header
          style={{
            marginBottom: 30,
            textAlign: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              display: "grid",
              placeItems: "center",
              width: 112,
              height: 112,
              margin: "0 auto",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(139, 92, 246, 0.38) 0%, rgba(99, 102, 241, 0.14) 52%, rgba(99, 102, 241, 0) 73%)",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 70,
                height: 70,
                border: "1px solid rgba(167, 139, 250, 0.18)",
                borderRadius: "50%",
              }}
            />

            <span
              style={{
                position: "relative",
                zIndex: 1,
                fontSize: 58,
                filter: "drop-shadow(0 9px 20px rgba(0, 0, 0, 0.42))",
              }}
            >
              🏆
            </span>
          </div>

          <p
            style={{
              margin: "12px 0 0",
              color: "#a78bfa",
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Olympiades 2026
          </p>

          <h1
            style={{
              margin: "10px 0 9px",
              fontSize: "clamp(39px, 10vw, 61px)",
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}
          >
            C’est parti !
          </h1>

          <p
            style={{
              minHeight: 30,
              margin: 0,
              color: "#d8dee9",
              fontSize: "clamp(17px, 4vw, 21px)",
              fontWeight: 700,
              lineHeight: 1.45,
            }}
          >
            {phrase}
          </p>
        </header>

        <div
          style={{
            display: "grid",
            gap: 14,
          }}
        >
          {optionsAccueil.map((option) => (
            <Card
              key={option.chemin}
              onClick={() => navigate(option.chemin)}
              onMouseEnter={faireMonterCarte}
              onMouseLeave={remettreCarte}
              onMouseDown={enfoncerCarte}
              onMouseUp={relacherCarte}
              style={{
                padding: 22,
                cursor: "pointer",
                userSelect: "none",
                transition:
                  "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 17,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: 59,
                    height: 59,
                    flexShrink: 0,
                    borderRadius: 17,
                    background: option.couleurIcone,
                    fontSize: 30,
                  }}
                >
                  {option.icone}
                </div>

                <div
                  style={{
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 22,
                    }}
                  >
                    {option.titre}
                  </h2>

                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "#aeb8cb",
                      lineHeight: 1.45,
                    }}
                  >
                    {option.description}
                  </p>
                </div>

                <div
                  style={{
                    flexShrink: 0,
                    color: "#8b5cf6",
                    fontSize: 25,
                    fontWeight: 900,
                  }}
                >
                  ›
                </div>
              </div>
            </Card>
          ))}
        </div>

        <p
          style={{
            margin: "24px 0 0",
            color: "#64748b",
            fontSize: 12,
            textAlign: "center",
          }}
        >
          Olympiades 2026
        </p>
      </div>
    </main>
  );
}