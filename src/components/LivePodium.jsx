import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";

export default function LivePodium() {
  const [equipes, setEquipes] = useState([]);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    chargerClassement();

    const intervalle = window.setInterval(chargerClassement, 5000);

    return () => {
      window.clearInterval(intervalle);
    };
  }, []);

  async function chargerClassement() {
    const { data, error } = await supabase.rpc("get_state");

    if (error) {
      console.error("Erreur classement :", error);
      setErreur("Classement indisponible");
      return;
    }

    setErreur("");
    setEquipes(data?.teams ?? []);
  }

  const podium = useMemo(() => {
    return [...equipes]
      .sort((a, b) => {
        const difference =
          Number(b.score ?? 0) - Number(a.score ?? 0);

        if (difference !== 0) {
          return difference;
        }

        return (
          Number(a.sort_order ?? 0) -
          Number(b.sort_order ?? 0)
        );
      })
      .slice(0, 3);
  }, [equipes]);

  const medailles = ["🥇", "🥈", "🥉"];

  return (
    <section
      style={{
        position: "sticky",
        top: 12,
        zIndex: 500,
        marginBottom: 24,
        padding: 16,
        border: "1px solid rgba(148, 163, 184, 0.18)",
        borderRadius: 18,
        background:
          "linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(9, 16, 35, 0.98))",
        boxShadow: "0 14px 34px rgba(0, 0, 0, 0.26)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 18 }}>🏆</span>

          <strong
            style={{
              color: "#e2e8f0",
              fontSize: 14,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Podium en direct
          </strong>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 9px",
              borderRadius: 999,
              background: "rgba(34, 197, 94, 0.12)",
              color: "#86efac",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#22c55e",
              }}
            />
            LIVE
          </span>

          <Link
            to="/classement"
            style={{
              color: "#a78bfa",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Voir tout →
          </Link>
        </div>
      </div>

      {erreur ? (
        <p style={{ margin: 0, color: "#fca5a5" }}>{erreur}</p>
      ) : podium.length === 0 ? (
        <p style={{ margin: 0, color: "#cbd5e1" }}>
          Classement en cours de préparation…
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          {podium.map((equipe, index) => {
            const score = Number(equipe.score ?? 0);

            return (
              <article
                key={equipe.id}
                style={{
                  minWidth: 0,
                  padding: "12px 14px",
                  border:
                    index === 0
                      ? "1px solid rgba(250, 204, 21, 0.5)"
                      : "1px solid rgba(148, 163, 184, 0.14)",
                  borderRadius: 14,
                  background:
                    index === 0
                      ? "linear-gradient(135deg, rgba(120, 53, 15, 0.24), rgba(30, 41, 59, 0.82))"
                      : "linear-gradient(135deg, rgba(30, 41, 59, 0.88), rgba(15, 23, 42, 0.94))",
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
                  <div
                    style={{
                      flexShrink: 0,
                      fontSize: 24,
                    }}
                  >
                    {medailles[index]}
                  </div>

                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        minWidth: 0,
                      }}
                    >
                      <span style={{ fontSize: 24 }}>
                        {equipe.flag}
                      </span>

                      <strong
                        style={{
                          overflow: "hidden",
                          color: "#f8fafc",
                          fontSize: 15,
                          textOverflow: "ellipsis",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {equipe.name}
                      </strong>
                    </div>

                    <div
                      style={{
                        marginTop: 4,
                        color:
                          index === 0 ? "#fde047" : "#cbd5e1",
                        fontSize: 14,
                        fontWeight: 800,
                      }}
                    >
                      {score} point{score > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}