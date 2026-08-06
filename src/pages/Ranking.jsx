import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";

import LivePodium from "../components/LivePodium";
import BottomNav from "../components/BottomNav";
import Card from "../components/ui/Card";

export default function Ranking() {
  const [equipes, setEquipes] = useState([]);
  const [joueurs, setJoueurs] = useState([]);
  const [onglet, setOnglet] = useState("equipes");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    chargerClassements();

    const intervalle = window.setInterval(chargerClassements, 5000);

    return () => window.clearInterval(intervalle);
  }, []);

  async function chargerClassements() {
    const { data, error } = await supabase.rpc("get_state");

    if (error) {
      console.error(error);
      setErreur("Impossible de charger le classement.");
      setChargement(false);
      return;
    }

    setEquipes(data?.teams ?? []);
    setJoueurs(data?.players ?? []);
    setErreur("");
    setChargement(false);
  }

  const classementEquipes = useMemo(() => {
    return [...equipes]
      .map((equipe) => ({
        ...equipe,
        score: Number(equipe.score ?? 0),
        membres: joueurs
          .filter(
            (joueur) =>
              Number(joueur.team_id) === Number(equipe.id)
          )
          .sort((a, b) => {
            const differencePoints =
              Number(b.points ?? 0) - Number(a.points ?? 0);

            if (differencePoints !== 0) {
              return differencePoints;
            }

            if (a.is_captain && !b.is_captain) return -1;
            if (!a.is_captain && b.is_captain) return 1;

            return String(a.first_name).localeCompare(
              String(b.first_name),
              "fr"
            );
          }),
      }))
      .sort((a, b) => {
        const ecart = b.score - a.score;

        if (ecart !== 0) return ecart;

        return (
          Number(a.sort_order ?? 0) -
          Number(b.sort_order ?? 0)
        );
      });
  }, [equipes, joueurs]);

  const classementJoueurs = useMemo(() => {
    return [...joueurs].sort((a, b) => {
      const ecartPoints =
        Number(b.points ?? 0) - Number(a.points ?? 0);

      if (ecartPoints !== 0) return ecartPoints;

      const ecartVictoires =
        Number(b.wins ?? 0) - Number(a.wins ?? 0);

      if (ecartVictoires !== 0) return ecartVictoires;

      return String(a.first_name).localeCompare(
        String(b.first_name),
        "fr"
      );
    });
  }, [joueurs]);

  const meilleurScoreEquipe = Math.max(
    ...classementEquipes.map((equipe) => equipe.score),
    1
  );

  const meilleurScoreJoueur = Math.max(
    ...classementJoueurs.map((joueur) =>
      Number(joueur.points ?? 0)
    ),
    1
  );

  function nomDuJoueur(joueur) {
    return joueur.nickname
      ? `${joueur.first_name} — ${joueur.nickname}`
      : joueur.first_name;
  }

  function medaille(index) {
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
          color: "#f8fafc",
          background: "#020617",
        }}
      >
        Chargement du classement...
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
            Classement 🏆
          </h1>

          <p style={{ margin: 0, color: "#aeb8cb" }}>
            Suis les scores des équipes et des joueurs en direct.
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
            gridTemplateColumns: "1fr 1fr",
            gap: 7,
            padding: 6,
            border: "1px solid rgba(148, 163, 184, 0.14)",
            borderRadius: 15,
            background: "rgba(15, 23, 42, 0.82)",
          }}
        >
          <button
            type="button"
            onClick={() => setOnglet("equipes")}
            style={{
              padding: 13,
              border:
                onglet === "equipes"
                  ? "1px solid rgba(139, 92, 246, 0.5)"
                  : "1px solid transparent",
              borderRadius: 11,
              color:
                onglet === "equipes" ? "#f8fafc" : "#94a3b8",
              fontSize: 15,
              fontWeight: 900,
              cursor: "pointer",
              background:
                onglet === "equipes"
                  ? "linear-gradient(135deg, #6d28d9, #4f46e5)"
                  : "transparent",
            }}
          >
            🏆 Équipes
          </button>

          <button
            type="button"
            onClick={() => setOnglet("joueurs")}
            style={{
              padding: 13,
              border:
                onglet === "joueurs"
                  ? "1px solid rgba(139, 92, 246, 0.5)"
                  : "1px solid transparent",
              borderRadius: 11,
              color:
                onglet === "joueurs" ? "#f8fafc" : "#94a3b8",
              fontSize: 15,
              fontWeight: 900,
              cursor: "pointer",
              background:
                onglet === "joueurs"
                  ? "linear-gradient(135deg, #6d28d9, #4f46e5)"
                  : "transparent",
            }}
          >
            👤 Joueurs
          </button>
        </div>

        {onglet === "equipes" && (
          <section style={{ marginTop: 20 }}>
            <div style={{ display: "grid", gap: 15 }}>
              {classementEquipes.map((equipe, index) => {
                const largeur =
                  meilleurScoreEquipe === 0
                    ? 0
                    : (equipe.score / meilleurScoreEquipe) * 100;

                return (
                  <Card
                    key={equipe.id}
                    style={{
                      padding: 0,
                      overflow: "hidden",
                      border:
                        index === 0
                          ? "1px solid rgba(250, 204, 21, 0.45)"
                          : "1px solid rgba(148, 163, 184, 0.16)",
                      background:
                        index === 0
                          ? "linear-gradient(145deg, rgba(120, 53, 15, 0.23), rgba(15, 23, 42, 0.98))"
                          : "linear-gradient(145deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.98))",
                    }}
                  >
                    <div style={{ padding: 20 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 16,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            minWidth: 0,
                          }}
                        >
                          <strong
                            style={{
                              flexShrink: 0,
                              fontSize: 27,
                            }}
                          >
                            {medaille(index)}
                          </strong>

                          <span
                            style={{
                              flexShrink: 0,
                              fontSize: 38,
                            }}
                          >
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
                                marginTop: 4,
                                color: "#94a3b8",
                                fontSize: 13,
                              }}
                            >
                              {equipe.membres.length} joueur
                              {equipe.membres.length > 1 ? "s" : ""}
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
                                index === 0 ? "#fde047" : "#f8fafc",
                              fontSize: 29,
                            }}
                          >
                            {equipe.score}
                          </strong>

                          <span
                            style={{
                              color: "#94a3b8",
                              fontSize: 12,
                              fontWeight: 800,
                              textTransform: "uppercase",
                            }}
                          >
                            Point{equipe.score > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          height: 8,
                          marginTop: 17,
                          overflow: "hidden",
                          borderRadius: 999,
                          background: "rgba(148, 163, 184, 0.13)",
                        }}
                      >
                        <div
                          style={{
                            width: `${largeur}%`,
                            height: "100%",
                            borderRadius: 999,
                            background:
                              index === 0
                                ? "linear-gradient(90deg, #facc15, #f97316)"
                                : "linear-gradient(90deg, #7c3aed, #3b82f6)",
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gap: 8,
                          marginTop: 17,
                        }}
                      >
                        {equipe.membres.map((joueur) => (
                          <div
                            key={joueur.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 12,
                              padding: "10px 12px",
                              borderRadius: 11,
                              background: "rgba(255, 255, 255, 0.04)",
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
                              {joueur.is_captain && "👑 "}
                              {nomDuJoueur(joueur)}
                            </div>

                            <strong
                              style={{
                                flexShrink: 0,
                                color: "#c4b5fd",
                              }}
                            >
                              ⭐ {Number(joueur.points ?? 0)}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {onglet === "joueurs" && (
          <section style={{ marginTop: 20 }}>
            <div style={{ display: "grid", gap: 12 }}>
              {classementJoueurs.map((joueur, index) => {
                const points = Number(joueur.points ?? 0);
                const largeur =
                  meilleurScoreJoueur === 0
                    ? 0
                    : (points / meilleurScoreJoueur) * 100;

                return (
                  <Card
                    key={joueur.id}
                    style={{
                      padding: 18,
                      border:
                        index === 0
                          ? "1px solid rgba(250, 204, 21, 0.45)"
                          : "1px solid rgba(148, 163, 184, 0.16)",
                      background:
                        index === 0
                          ? "linear-gradient(145deg, rgba(120, 53, 15, 0.23), rgba(15, 23, 42, 0.98))"
                          : undefined,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 16,
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
                        <strong
                          style={{
                            flexShrink: 0,
                            fontSize: 25,
                          }}
                        >
                          {medaille(index)}
                        </strong>

                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              overflow: "hidden",
                              fontSize: 18,
                              fontWeight: 900,
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {joueur.is_captain && "👑 "}
                            {nomDuJoueur(joueur)}
                          </div>

                          <div
                            style={{
                              marginTop: 5,
                              color: "#94a3b8",
                              fontSize: 13,
                            }}
                          >
                            {joueur.flag}{" "}
                            {joueur.team || "Sans équipe"}
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
                              index === 0 ? "#fde047" : "#f8fafc",
                            fontSize: 25,
                          }}
                        >
                          {points}
                        </strong>

                        <div
                          style={{
                            color: "#94a3b8",
                            fontSize: 12,
                          }}
                        >
                          {Number(joueur.wins ?? 0)}/10 victoire
                          {Number(joueur.wins ?? 0) > 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        height: 6,
                        marginTop: 15,
                        overflow: "hidden",
                        borderRadius: 999,
                        background: "rgba(148, 163, 184, 0.13)",
                      }}
                    >
                      <div
                        style={{
                          width: `${largeur}%`,
                          height: "100%",
                          borderRadius: 999,
                          background:
                            index === 0
                              ? "linear-gradient(90deg, #facc15, #f97316)"
                              : "linear-gradient(90deg, #7c3aed, #3b82f6)",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <BottomNav />
    </main>
  );
}