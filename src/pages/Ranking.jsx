import { useEffect, useMemo, useState } from "react";
import { Trophy, Users } from "lucide-react";
import { supabase } from "../services/supabase";

import LivePodium from "../components/LivePodium";
import BottomNav from "../components/BottomNav";

export default function Ranking() {
  const [equipes, setEquipes] = useState([]);
  const [joueurs, setJoueurs] = useState([]);
  const [onglet, setOnglet] = useState("equipes");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    chargerClassements();

    const intervalle = window.setInterval(
      chargerClassements,
      5000
    );

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

    const nombreEquipes = Number(
      data?.settings?.team_count ?? 6
    );

    const equipesActives = (data?.teams ?? []).filter(
      (equipe) =>
        Number(equipe.sort_order ?? 999) <= nombreEquipes
    );

    setEquipes(equipesActives);
    setJoueurs(data?.players ?? []);
    setErreur("");
    setChargement(false);
  }

  const classementEquipes = useMemo(() => {
    return [...equipes]
      .map((equipe) => {
        const membres = joueurs.filter(
          (joueur) =>
            Number(joueur.team_id) === Number(equipe.id)
        );

        const capitaine = membres.find(
          (joueur) => joueur.is_captain
        );

        return {
          ...equipe,
          score: Number(equipe.score ?? 0),
          capitaine,
        };
      })
      .sort((a, b) => {
        const ecart = b.score - a.score;

        if (ecart !== 0) {
          return ecart;
        }

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

      if (ecartPoints !== 0) {
        return ecartPoints;
      }

      return String(a.first_name).localeCompare(
        String(b.first_name),
        "fr"
      );
    });
  }, [joueurs]);

  function nomDuJoueur(joueur) {
    if (!joueur) {
      return "";
    }

    return joueur.nickname
      ? `${joueur.first_name} — ${joueur.nickname}`
      : joueur.first_name;
  }

  function position(index) {
    return index + 1;
  }

  function couleurPosition(index) {
    if (index === 0) return "#facc15";
    if (index === 1) return "#d1d5db";
    if (index === 2) return "#fb923c";

    return "#94a3b8";
  }

  const styleLigne = {
    display: "grid",
    gridTemplateColumns: "38px minmax(0, 1fr) auto",
    alignItems: "center",
    gap: 10,
    minHeight: 56,
    padding: "9px 13px",
    border: "1px solid rgba(148, 163, 184, 0.14)",
    borderRadius: 12,
    background: "rgba(15, 23, 42, 0.82)",
  };

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
        padding: "18px 14px 105px",
        color: "#f8fafc",
        background:
          "radial-gradient(circle at top, #17164f 0%, #080d20 40%, #020617 100%)",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <LivePodium />

        <header style={{ margin: "22px 0 18px" }}>
          <p
            style={{
              margin: 0,
              color: "#8b5cf6",
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
              margin: "6px 0 4px",
              fontSize: "clamp(28px, 7vw, 42px)",
              lineHeight: 1.05,
            }}
          >
            Classement
          </h1>

          <p
            style={{
              margin: 0,
              color: "#94a3b8",
              fontSize: 14,
            }}
          >
            Scores mis à jour automatiquement.
          </p>
        </header>

        {erreur && (
          <div
            style={{
              padding: 13,
              marginBottom: 14,
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
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
            padding: 5,
            border:
              "1px solid rgba(148, 163, 184, 0.14)",
            borderRadius: 13,
            background: "rgba(15, 23, 42, 0.82)",
          }}
        >
          <button
            type="button"
            onClick={() => setOnglet("equipes")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              minHeight: 42,
              padding: "9px 8px",
              border:
                onglet === "equipes"
                  ? "1px solid rgba(139, 92, 246, 0.5)"
                  : "1px solid transparent",
              borderRadius: 9,
              color:
                onglet === "equipes"
                  ? "#ffffff"
                  : "#94a3b8",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              background:
                onglet === "equipes"
                  ? "linear-gradient(135deg, #6d28d9, #4f46e5)"
                  : "transparent",
            }}
          >
            <Trophy size={18} />
            Équipes
          </button>

          <button
            type="button"
            onClick={() => setOnglet("joueurs")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              minHeight: 42,
              padding: "9px 8px",
              border:
                onglet === "joueurs"
                  ? "1px solid rgba(139, 92, 246, 0.5)"
                  : "1px solid transparent",
              borderRadius: 9,
              color:
                onglet === "joueurs"
                  ? "#ffffff"
                  : "#94a3b8",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              background:
                onglet === "joueurs"
                  ? "linear-gradient(135deg, #6d28d9, #4f46e5)"
                  : "transparent",
            }}
          >
            <Users size={18} />
            Joueurs
          </button>
        </div>

        {onglet === "equipes" && (
          <section style={{ marginTop: 14 }}>
            <div style={{ display: "grid", gap: 7 }}>
              {classementEquipes.map((equipe, index) => (
                <article
                  key={equipe.id}
                  style={{
                    ...styleLigne,
                    border:
                      index === 0
                        ? "1px solid rgba(250, 204, 21, 0.35)"
                        : styleLigne.border,
                    background:
                      index === 0
                        ? "linear-gradient(110deg, rgba(120, 53, 15, 0.2), rgba(15, 23, 42, 0.9))"
                        : styleLigne.background,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      width: 30,
                      height: 30,
                      placeItems: "center",
                      borderRadius: 9,
                      color: couleurPosition(index),
                      background: "rgba(255, 255, 255, 0.05)",
                      fontSize: 15,
                      fontWeight: 900,
                    }}
                  >
                    {position(index)}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          flexShrink: 0,
                          fontSize: 23,
                          lineHeight: 1,
                        }}
                      >
                        {equipe.flag}
                      </span>

                      <strong
                        style={{
                          overflow: "hidden",
                          fontSize: 16,
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {equipe.name}
                      </strong>
                    </div>

                    {equipe.capitaine && (
                      <div
                        style={{
                          marginTop: 3,
                          overflow: "hidden",
                          color: "#94a3b8",
                          fontSize: 11,
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Capitaine :{" "}
                        {nomDuJoueur(equipe.capitaine)}
                      </div>
                    )}
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
                            ? "#fde047"
                            : "#f8fafc",
                        fontSize: 19,
                        lineHeight: 1,
                      }}
                    >
                      {equipe.score}
                    </strong>

                    <span
                      style={{
                        color: "#94a3b8",
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      point{equipe.score > 1 ? "s" : ""}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {onglet === "joueurs" && (
          <section style={{ marginTop: 14 }}>
            <div style={{ display: "grid", gap: 6 }}>
              {classementJoueurs.map((joueur, index) => {
                const points = Number(joueur.points ?? 0);

                return (
                  <article
                    key={joueur.id}
                    style={{
                      ...styleLigne,
                      minHeight: 49,
                      padding: "7px 13px",
                      border:
                        index === 0
                          ? "1px solid rgba(250, 204, 21, 0.35)"
                          : styleLigne.border,
                      background:
                        index === 0
                          ? "linear-gradient(110deg, rgba(120, 53, 15, 0.2), rgba(15, 23, 42, 0.9))"
                          : styleLigne.background,
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        width: 28,
                        height: 28,
                        placeItems: "center",
                        borderRadius: 8,
                        color: couleurPosition(index),
                        background: "rgba(255, 255, 255, 0.05)",
                        fontSize: 14,
                        fontWeight: 900,
                      }}
                    >
                      {position(index)}
                    </div>

                    <strong
                      style={{
                        minWidth: 0,
                        overflow: "hidden",
                        fontSize: 15,
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {nomDuJoueur(joueur)}
                    </strong>

                    <div
                      style={{
                        flexShrink: 0,
                        textAlign: "right",
                      }}
                    >
                      <strong
                        style={{
                          color:
                            index === 0
                              ? "#fde047"
                              : "#f8fafc",
                          fontSize: 18,
                        }}
                      >
                        {points}
                      </strong>

                      <span
                        style={{
                          marginLeft: 4,
                          color: "#94a3b8",
                          fontSize: 10,
                          textTransform: "uppercase",
                        }}
                      >
                        pt{Math.abs(points) > 1 ? "s" : ""}
                      </span>
                    </div>
                  </article>
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