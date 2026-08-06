import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";

import LivePodium from "../components/LivePodium";
import BottomNav from "../components/BottomNav";
import Card from "../components/ui/Card";

const couleurs = {
  fond: "#020617",
  carte: "rgba(15, 23, 42, 0.86)",
  carteClaire: "rgba(255, 255, 255, 0.035)",
  bordure: "rgba(148, 163, 184, 0.14)",
  texte: "#f8fafc",
  secondaire: "#94a3b8",
  violet: "#8b5cf6",
  violetClair: "#c4b5fd",
  jaune: "#fde047",
  vert: "#4ade80",
};

export default function Teams() {
  const [equipes, setEquipes] = useState([]);
  const [joueurs, setJoueurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    chargerDonnees();

    const intervalle = window.setInterval(
      chargerDonnees,
      5000
    );

    return () => {
      window.clearInterval(intervalle);
    };
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
            const differencePoints =
              Number(b.points ?? 0) -
              Number(a.points ?? 0);

            if (differencePoints !== 0) {
              return differencePoints;
            }

            if (a.is_captain && !b.is_captain) {
              return -1;
            }

            if (!a.is_captain && b.is_captain) {
              return 1;
            }

            return String(a.first_name).localeCompare(
              String(b.first_name),
              "fr"
            );
          });

        const capitaine = membres.find(
          (membre) => membre.is_captain
        );

        const pointsJoueurs = membres.reduce(
          (total, membre) =>
            total + Number(membre.points ?? 0),
          0
        );

        const scoreTotal = Number(equipe.score ?? 0);

        /*
          Le score total de l’équipe comprend normalement :
          - les points rapportés par les joueurs ;
          - les points collectifs ajoutés directement à l’équipe.

          On obtient donc les points collectifs par différence.
        */
        const pointsCollectifs = scoreTotal - pointsJoueurs;

        return {
          ...equipe,
          membres,
          capitaine,
          pointsJoueurs,
          pointsCollectifs,
          scoreTotal,
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

  function textePoints(nombre) {
    return `${nombre} point${Math.abs(nombre) > 1 ? "s" : ""}`;
  }

  function rangEquipe(index) {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";

    return `${index + 1}.`;
  }

  if (chargement) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: 40,
          color: couleurs.texte,
          background: couleurs.fond,
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
        padding: "16px 14px 105px",
        color: couleurs.texte,
        background:
          "radial-gradient(circle at top, #17164f 0%, #080d20 38%, #020617 100%)",
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
        }}
      >
        <LivePodium />

        <header
          style={{
            margin: "20px 0 18px",
          }}
        >
          <p
            style={{
              margin: 0,
              color: couleurs.violet,
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Olympiades 2026
          </p>

          <h1
            style={{
              margin: "5px 0 3px",
              fontSize: "clamp(28px, 7vw, 42px)",
              lineHeight: 1.08,
            }}
          >
            Équipes 🌍
          </h1>

          <p
            style={{
              margin: 0,
              color: couleurs.secondaire,
              fontSize: 13,
            }}
          >
            Composition et détail des points de chaque nation.
          </p>
        </header>

        {erreur && (
          <div
            style={{
              padding: 13,
              marginBottom: 15,
              border:
                "1px solid rgba(248, 113, 113, 0.35)",
              borderRadius: 12,
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
              "repeat(auto-fit, minmax(285px, 1fr))",
            gap: 11,
          }}
        >
          {equipesCompletes.map((equipe, index) => (
            <Card
              key={equipe.id}
              style={{
                padding: 0,
                overflow: "hidden",
                border:
                  index === 0
                    ? "1px solid rgba(250, 204, 21, 0.32)"
                    : `1px solid ${couleurs.bordure}`,
                background: couleurs.carte,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(0, 1fr) auto",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderBottom: `1px solid ${couleurs.bordure}`,
                  background:
                    index === 0
                      ? "linear-gradient(135deg, rgba(120, 53, 15, 0.23), rgba(15, 23, 42, 0.92))"
                      : "rgba(30, 41, 59, 0.42)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    minWidth: 0,
                  }}
                >
                  <strong
                    style={{
                      width: 27,
                      flexShrink: 0,
                      fontSize: 18,
                      textAlign: "center",
                    }}
                  >
                    {rangEquipe(index)}
                  </strong>

                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: 29,
                      lineHeight: 1,
                    }}
                  >
                    {equipe.flag}
                  </span>

                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        overflow: "hidden",
                        fontSize: 17,
                        lineHeight: 1.1,
                        textOverflow: "ellipsis",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {equipe.name}
                    </h2>

                    <div
                      style={{
                        marginTop: 3,
                        overflow: "hidden",
                        color: couleurs.secondaire,
                        fontSize: 11,
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {equipe.capitaine
                        ? `Capitaine : ${nomJoueur(
                            equipe.capitaine
                          )}`
                        : `${equipe.membres.length} joueur${
                            equipe.membres.length > 1 ? "s" : ""
                          }`}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    flexShrink: 0,
                    textAlign: "right",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      color:
                        index === 0
                          ? couleurs.jaune
                          : couleurs.texte,
                      fontSize: 24,
                      lineHeight: 1,
                    }}
                  >
                    {equipe.scoreTotal}
                  </strong>

                  <span
                    style={{
                      color: couleurs.secondaire,
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    Total
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  borderBottom: `1px solid ${couleurs.bordure}`,
                }}
              >
                <div
                  style={{
                    padding: "9px 12px",
                    borderRight: `1px solid ${couleurs.bordure}`,
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      color: couleurs.secondaire,
                      fontSize: 9,
                      fontWeight: 900,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    Points joueurs
                  </span>

                  <strong
                    style={{
                      display: "block",
                      marginTop: 2,
                      color: couleurs.violetClair,
                      fontSize: 15,
                    }}
                  >
                    {equipe.pointsJoueurs}
                  </strong>
                </div>

                <div
                  style={{
                    padding: "9px 12px",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      color: couleurs.secondaire,
                      fontSize: 9,
                      fontWeight: 900,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    Points collectifs
                  </span>

                  <strong
                    style={{
                      display: "block",
                      marginTop: 2,
                      color:
                        equipe.pointsCollectifs < 0
                          ? "#fca5a5"
                          : couleurs.vert,
                      fontSize: 15,
                    }}
                  >
                    {equipe.pointsCollectifs > 0 ? "+" : ""}
                    {equipe.pointsCollectifs}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  padding: "5px 13px 7px",
                }}
              >
                {equipe.membres.length === 0 ? (
                  <p
                    style={{
                      margin: "8px 0",
                      color: couleurs.secondaire,
                      fontSize: 12,
                    }}
                  >
                    Aucun joueur dans cette équipe.
                  </p>
                ) : (
                  equipe.membres.map((membre, membreIndex) => {
                    const points = Number(membre.points ?? 0);

                    return (
                      <div
                        key={membre.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          minHeight: 34,
                          padding: "6px 0",
                          borderTop:
                            membreIndex === 0
                              ? "none"
                              : `1px solid ${couleurs.bordure}`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            minWidth: 0,
                          }}
                        >
                          {membre.is_captain && (
                            <span
                              title="Capitaine"
                              style={{
                                flexShrink: 0,
                                fontSize: 12,
                              }}
                            >
                              👑
                            </span>
                          )}

                          <span
                            style={{
                              minWidth: 0,
                              overflow: "hidden",
                              fontSize: 13,
                              fontWeight: 700,
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {nomJoueur(membre)}
                          </span>
                        </div>

                        <strong
                          title={textePoints(points)}
                          style={{
                            flexShrink: 0,
                            color:
                              points > 0
                                ? couleurs.violetClair
                                : points < 0
                                  ? "#fca5a5"
                                  : couleurs.secondaire,
                            fontSize: 13,
                          }}
                        >
                          {points > 0 ? "+" : ""}
                          {points} pt{Math.abs(points) > 1 ? "s" : ""}
                        </strong>
                      </div>
                    );
                  })
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