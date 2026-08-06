import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

import Card from "../components/ui/Card";
import PrimaryButton from "../components/ui/PrimaryButton";

export default function Login() {
  const navigate = useNavigate();

  const [joueurs, setJoueurs] = useState([]);
  const [joueurChoisi, setJoueurChoisi] = useState(null);
  const [motDePasse, setMotDePasse] = useState("");
  const [chargement, setChargement] = useState(true);
  const [connexionEnCours, setConnexionEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    chargerJoueurs();
  }, []);

  async function chargerJoueurs() {
    setChargement(true);
    setErreur("");

    const { data, error } = await supabase.rpc("list_profiles");

    if (error) {
      console.error(error);
      setErreur("Impossible de charger les joueurs.");
      setChargement(false);
      return;
    }

    setJoueurs(data ?? []);
    setChargement(false);
  }

  async function connecter() {
    if (!joueurChoisi) {
      setErreur("Choisis ton profil.");
      return;
    }

    if (!motDePasse) {
      setErreur("Entre ton mot de passe.");
      return;
    }

    setConnexionEnCours(true);
    setErreur("");

    const { data, error } = await supabase.rpc("login_player", {
      p_player_id: joueurChoisi.id,
      p_password: motDePasse,
    });

    setConnexionEnCours(false);

    if (error) {
      console.error(error);
      setErreur(error.message);
      return;
    }

    if (!data?.token) {
      setErreur("Mot de passe incorrect.");
      return;
    }

    sessionStorage.setItem(
      "player_id",
      String(data.player_id ?? joueurChoisi.id)
    );
    sessionStorage.setItem("player_token", data.token);

    navigate("/tableau-de-bord");
  }

  if (chargement) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          color: "#f8fafc",
          background:
            "radial-gradient(circle at top, #17164f 0%, #080d20 42%, #020617 100%)",
        }}
      >
        Chargement des joueurs...
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "28px 18px",
        color: "#f8fafc",
        background:
          "radial-gradient(circle at top, #17164f 0%, #080d20 42%, #020617 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 880,
          margin: "0 auto",
        }}
      >
        <header
          style={{
            paddingTop: 18,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 48,
            }}
          >
            🏆
          </div>

          <p
            style={{
              margin: "12px 0 0",
              color: "#8b5cf6",
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Olympiades 2026
          </p>

          <h1
            style={{
              margin: "8px 0 7px",
              fontSize: "clamp(34px, 8vw, 52px)",
              lineHeight: 1,
            }}
          >
            Accès joueur
          </h1>

          <p
            style={{
              margin: 0,
              color: "#aeb8cb",
            }}
          >
            Choisis ton profil puis entre ton mot de passe.
          </p>
        </header>

        {erreur && (
          <div
            style={{
              padding: 14,
              marginTop: 22,
              border: "1px solid rgba(248, 113, 113, 0.35)",
              borderRadius: 14,
              color: "#fca5a5",
              background: "rgba(127, 29, 29, 0.2)",
              textAlign: "center",
            }}
          >
            {erreur}
          </div>
        )}

        <section style={{ marginTop: 28 }}>
          <div
            style={{
              marginBottom: 12,
              color: "#cbd5e1",
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
            }}
          >
            1. Choisis ton profil
          </div>

          {joueurs.length === 0 ? (
            <Card>
              <p style={{ margin: 0, color: "#cbd5e1" }}>
                Aucun joueur inscrit pour le moment.
              </p>
            </Card>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              {joueurs.map((joueur) => {
                const selectionne =
                  Number(joueurChoisi?.id) === Number(joueur.id);

                return (
                  <button
                    key={joueur.id}
                    type="button"
                    onClick={() => {
                      setJoueurChoisi(joueur);
                      setMotDePasse("");
                      setErreur("");
                    }}
                    style={{
                      minHeight: 120,
                      padding: 0,
                      border: 0,
                      borderRadius: 18,
                      color: "#f8fafc",
                      cursor: "pointer",
                      textAlign: "left",
                      background: "transparent",
                    }}
                  >
                    <Card
                      style={{
                        height: "100%",
                        boxSizing: "border-box",
                        border: selectionne
                          ? "2px solid #8b5cf6"
                          : "1px solid rgba(148, 163, 184, 0.16)",
                        background: selectionne
                          ? "linear-gradient(135deg, rgba(109, 40, 217, 0.9), rgba(67, 56, 202, 0.9))"
                          : undefined,
                        boxShadow: selectionne
                          ? "0 12px 30px rgba(109, 40, 217, 0.3)"
                          : undefined,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            placeItems: "center",
                            width: 46,
                            height: 46,
                            flexShrink: 0,
                            borderRadius: 14,
                            background: selectionne
                              ? "rgba(255, 255, 255, 0.16)"
                              : "rgba(139, 92, 246, 0.14)",
                            fontSize: 24,
                          }}
                        >
                          👤
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <strong
                            style={{
                              display: "block",
                              overflow: "hidden",
                              fontSize: 18,
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {joueur.first_name}
                          </strong>

                          {joueur.nickname && (
                            <div
                              style={{
                                marginTop: 3,
                                overflow: "hidden",
                                color: selectionne
                                  ? "#ede9fe"
                                  : "#aeb8cb",
                                fontSize: 13,
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              “{joueur.nickname}”
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 16,
                          color: selectionne
                            ? "#ede9fe"
                            : "#94a3b8",
                          fontSize: 13,
                        }}
                      >
                        Niveau sportif :{" "}
                        <strong>{joueur.sport_level}/4</strong>
                      </div>
                    </Card>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {joueurChoisi && (
          <Card
            style={{
              maxWidth: 560,
              margin: "24px auto 0",
            }}
          >
            <div
              style={{
                color: "#a78bfa",
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
              }}
            >
              2. Connexion
            </div>

            <h2
              style={{
                margin: "10px 0 4px",
                fontSize: 25,
              }}
            >
              Bonjour {joueurChoisi.first_name} 👋
            </h2>

            <p
              style={{
                margin: "0 0 18px",
                color: "#aeb8cb",
              }}
            >
              Entre ton mot de passe pour accéder à ton espace.
            </p>

            <input
              type="password"
              placeholder="Mot de passe"
              value={motDePasse}
              onChange={(event) => {
                setMotDePasse(event.target.value);
                setErreur("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  connecter();
                }
              }}
              autoFocus
              style={{
                boxSizing: "border-box",
                display: "block",
                width: "100%",
                padding: "14px 15px",
                border: "1px solid rgba(148, 163, 184, 0.24)",
                borderRadius: 13,
                outline: "none",
                color: "#f8fafc",
                fontSize: 16,
                background: "rgba(2, 6, 23, 0.52)",
              }}
            />

            <PrimaryButton
              onClick={connecter}
              disabled={connexionEnCours}
              style={{ marginTop: 16 }}
            >
              {connexionEnCours
                ? "Connexion..."
                : "Se connecter"}
            </PrimaryButton>
          </Card>
        )}

        <button
          type="button"
          onClick={() => navigate("/")}
          style={{
            display: "block",
            margin: "24px auto 0",
            padding: 10,
            border: 0,
            color: "#94a3b8",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          ← Retour à l’accueil
        </button>
      </div>
    </main>
  );
}