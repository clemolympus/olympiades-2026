import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";

import LivePodium from "../components/LivePodium";
import BottomNav from "../components/BottomNav";
import Card from "../components/ui/Card";

export default function Teams() {
  const [equipes, setEquipes] = useState([]);
  const [joueurs, setJoueurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    chargerDonnees();

    const intervalle = window.setInterval(chargerDonnees, 5000);

    return () => window.clearInterval(intervalle);
  }, []);

  async function chargerDonnees() {
    const { data, error } = await supabase.rpc("get_state");

    if (error) {
      console.error(error);
      setErreur("Impossible de charger les équipes.");
      setChargement(false);
      return;
    }

    setEquipes(data?.teams ?? []);
    setJoueurs(data?.players ?? []);
    setErreur("");
    setChargement(false);
  }

  const equipesCompletes = useMemo(() => {
    return equipes
      .map((equipe) => {
        const membres = joueurs
          .filter(
            (joueur) =>
              Number(joueur.team_id) === Number(equipe.id)
          )
          .sort((a, b) => {
            if (a.is_captain && !b.is_captain) return -1;
            if (!a.is_captain && b.is_captain) return 1;

            return String(a.first_name).localeCompare(
              String(b.first_name),
              "fr"
            );
          });

        const capitaine = membres.find(
          (membre) => membre.is_captain
        );

        const niveauTotal = membres.reduce(
          (total, membre) =>
            total + Number(membre.sport_level ?? 0),
          0
        );

        return {
          ...equipe,
          membres,
          capitaine,
          niveauTotal,
          scoreTotal: Number(equipe.score ?? 0),
        };
      })
      .sort((a, b) => {
        const difference = b.scoreTotal - a.scoreTotal;

        if (difference !== 0) {
          return difference;
        }

        return (
          Number(a.sort_order ?? 0) -
          Number(b.sort_order ?? 0)
        );
      });
  }, [equipes, joueurs]);

  function nomJoueur(joueur) {
    return joueur.nickname
      ? `${joueur.first_name} — ${joueur.nickname}`
      : joueur.first_name;
  }

  if (chargement) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: 40,
          color: "#f8fafc",
          background: "#020617",
        }}
      >
        Chargement des équipes...
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "18px 18px 105px",
        color: "#f8fafc",
        background:
          "radial-gradient(circle at top, #17164f 0%, #080d20 40%, #020617 100%)",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <LivePodium />

        <header style={{ margin: "26px 0 22px" }}>
          <p
            style={{
              margin: 0,
              color: "#8b5cf6",
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Olympiades 2026
          </p>

          <h1
            style={{
              margin: "8px 0 5px",
              fontSize: "clamp(32px, 7vw, 48px)",
            }}
          >
            Équipes 🌍
          </h1>

          <p style={{ margin: 0, color: "#aeb8cb" }}>
            Découvre la composition des six nations.
          </p>
        </header>

        {erreur && (
          <div
            style={{
              padding: 15,
              marginBottom: 18,
              border: "1px solid rgba(248, 113, 113, 0.35)",
              borderRadius: 14,
              color: "#fca5a5",
              background: "rgba(127, 29, 29, 0.18)",
            }}
          >
            {erreur}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {equipesCompletes.map((equipe, index) => (
            <Card
              key={equipe.id}
              style={{
                padding: 0,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: 20,
                  background:
                    index === 0
                      ? "linear-gradient(135deg, rgba(79, 70, 229, 0.92), rgba(49, 46, 129, 0.94))"
                      : "linear-gradient(135deg, rgba(51, 65, 85, 0.94), rgba(15, 23, 42, 0.97))",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 13,
                      minWidth: 0,
                    }}
                  >
                    <span style={{ fontSize: 40 }}>
                      {equipe.flag}
                    </span>

                    <div style={{ minWidth: 0 }}>
                      <h2
                        style={{
                          margin: 0,
                          overflow: "hidden",
                          fontSize: 23,
                          textOverflow: "ellipsis",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {equipe.name}
                      </h2>

                      <div
                        style={{
                          marginTop: 5,
                          color: "#cbd5e1",
                          fontSize: 13,
                        }}
                      >
                        {equipe.membres.length} joueur
                        {equipe.membres.length > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <strong
                      style={{
                        display: "block",
                        fontSize: 27,
                      }}
                    >
                      {equipe.scoreTotal}
                    </strong>

                    <span
                      style={{
                        color: "#cbd5e1",
                        fontSize: 12,
                        fontWeight: 800,
                        textTransform: "uppercase",
                      }}
                    >
                      Point{equipe.scoreTotal > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ padding: 18 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginBottom: 18,
                  }}
                >
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 13,
                      background: "rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <div
                      style={{
                        color: "#94a3b8",
                        fontSize: 11,
                        fontWeight: 900,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      Chef d’équipe
                    </div>

                    <strong
                      style={{
                        display: "block",
                        marginTop: 6,
                      }}
                    >
                      {equipe.capitaine
                        ? `👑 ${nomJoueur(equipe.capitaine)}`
                        : "Non désigné"}
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: 12,
                      borderRadius: 13,
                      background: "rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <div
                      style={{
                        color: "#94a3b8",
                        fontSize: 11,
                        fontWeight: 900,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      Niveau total
                    </div>

                    <strong
                      style={{
                        display: "block",
                        marginTop: 6,
                      }}
                    >
                      💪 {equipe.niveauTotal}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    marginBottom: 10,
                    color: "#a78bfa",
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                  }}
                >
                  Membres
                </div>

                {equipe.membres.length === 0 ? (
                  <p
                    style={{
                      margin: 0,
                      color: "#94a3b8",
                    }}
                  >
                    Aucun joueur dans cette équipe.
                  </p>
                ) : (
                  <div style={{ display: "grid", gap: 9 }}>
                    {equipe.membres.map((membre) => (
                      <div
                        key={membre.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          padding: "11px 12px",
                          border: "1px solid rgba(148, 163, 184, 0.11)",
                          borderRadius: 12,
                          background: "rgba(255, 255, 255, 0.035)",
                        }}
                      >
                        <div
                          style={{
                            minWidth: 0,
                            overflow: "hidden",
                            fontWeight: 800,
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {nomJoueur(membre)}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              padding: "4px 7px",
                              borderRadius: 999,
                              color: "#cbd5e1",
                              background: "rgba(148, 163, 184, 0.12)",
                              fontSize: 11,
                              fontWeight: 800,
                            }}
                          >
                            Niv. {membre.sport_level}
                          </span>

                          {membre.is_captain && (
                            <span title="Chef d’équipe">👑</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}