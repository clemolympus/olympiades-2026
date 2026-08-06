import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";

import BottomNav from "../components/BottomNav";
import LivePodium from "../components/LivePodium";
import Card from "../components/ui/Card";
import PrimaryButton from "../components/ui/PrimaryButton";

export default function Challenges() {
  const [joueurs, setJoueurs] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [defis, setDefis] = useState([]);

  const [adversaireId, setAdversaireId] = useState("");
  const [temoinId, setTemoinId] = useState("");
  const [nomDefi, setNomDefi] = useState("");

  const [chargement, setChargement] = useState(true);
  const [creationEnCours, setCreationEnCours] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const playerId = Number(sessionStorage.getItem("player_id"));

  useEffect(() => {
    chargerDonnees();

    const intervalle = window.setInterval(chargerDonnees, 5000);

    return () => {
      window.clearInterval(intervalle);
    };
  }, []);

  async function chargerDonnees() {
    const { data, error } = await supabase.rpc("get_state");

    if (error) {
      console.error(error);
      setErreur("Impossible de charger les défis.");
      setChargement(false);
      return;
    }

    setJoueurs(data?.players ?? []);
    setEquipes(data?.teams ?? []);
    setDefis(data?.challenges ?? []);
    setErreur("");
    setChargement(false);
  }

  const joueurConnecte = joueurs.find(
    (joueur) => Number(joueur.id) === playerId
  );

  const defisEnAttente = useMemo(
    () => defis.filter((defi) => defi.status === "pending"),
    [defis]
  );

  const joueursOccupes = useMemo(() => {
    return new Set(
      defisEnAttente.flatMap((defi) => [
        Number(defi.creator_id),
        Number(defi.opponent_id),
        Number(defi.witness_id),
      ])
    );
  }, [defisEnAttente]);

  const joueurConnecteOccupe = joueursOccupes.has(playerId);

  const adversaires = useMemo(() => {
    if (!joueurConnecte?.team_id || joueurConnecteOccupe) {
      return [];
    }

    return joueurs.filter(
      (joueur) =>
        Number(joueur.id) !== playerId &&
        Boolean(joueur.team_id) &&
        Number(joueur.team_id) !== Number(joueurConnecte.team_id) &&
        !joueursOccupes.has(Number(joueur.id))
    );
  }, [
    joueurs,
    joueurConnecte,
    joueurConnecteOccupe,
    joueursOccupes,
    playerId,
  ]);

  const adversaireChoisi = joueurs.find(
    (joueur) => Number(joueur.id) === Number(adversaireId)
  );

  const temoins = useMemo(() => {
    if (
      !joueurConnecte?.team_id ||
      !adversaireChoisi?.team_id ||
      joueurConnecteOccupe
    ) {
      return [];
    }

    return joueurs.filter(
      (joueur) =>
        Number(joueur.id) !== playerId &&
        Number(joueur.id) !== Number(adversaireId) &&
        Boolean(joueur.team_id) &&
        Number(joueur.team_id) !== Number(joueurConnecte.team_id) &&
        Number(joueur.team_id) !== Number(adversaireChoisi.team_id) &&
        !joueursOccupes.has(Number(joueur.id))
    );
  }, [
    joueurs,
    joueurConnecte,
    adversaireChoisi,
    adversaireId,
    joueurConnecteOccupe,
    joueursOccupes,
    playerId,
  ]);

  const mesDefis = useMemo(() => {
    return defis
      .filter(
        (defi) =>
          Number(defi.creator_id) === playerId ||
          Number(defi.opponent_id) === playerId ||
          Number(defi.witness_id) === playerId
      )
      .sort(
        (a, b) =>
          new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0)
      );
  }, [defis, playerId]);

  async function creerDefi() {
    setMessage("");
    setErreur("");

    if (!joueurConnecte?.team_id) {
      setErreur("Tu dois être affecté à une équipe avant de créer un défi.");
      return;
    }

    if (joueurConnecteOccupe) {
      setErreur(
        "Tu participes déjà à un défi en attente. Il doit être validé ou supprimé avant d’en créer un autre."
      );
      return;
    }

    if (!adversaireId) {
      setErreur("Choisis un adversaire.");
      return;
    }

    if (!temoinId) {
      setErreur("Choisis un témoin.");
      return;
    }

    if (!nomDefi.trim()) {
      setErreur("Écris le nom du défi.");
      return;
    }

    setCreationEnCours(true);

    const { error } = await supabase.rpc("create_challenge", {
      p_creator_id: playerId,
      p_opponent_id: Number(adversaireId),
      p_witness_id: Number(temoinId),
      p_name: nomDefi.trim(),
      p_type: "individual",
    });

    setCreationEnCours(false);

    if (error) {
      console.error(error);
      setErreur(error.message);
      await chargerDonnees();
      return;
    }

    setMessage("Défi créé avec succès.");
    setAdversaireId("");
    setTemoinId("");
    setNomDefi("");

    await chargerDonnees();
  }

  function trouverJoueur(id) {
    return joueurs.find(
      (element) => Number(element.id) === Number(id)
    );
  }

  function nomJoueur(id) {
    const joueur = trouverJoueur(id);

    if (!joueur) {
      return "Joueur inconnu";
    }

    return joueur.nickname
      ? `${joueur.first_name} — ${joueur.nickname}`
      : joueur.first_name;
  }

  function nomEquipe(teamId) {
    const equipe = equipes.find(
      (element) => Number(element.id) === Number(teamId)
    );

    return equipe ? `${equipe.flag} ${equipe.name}` : "Sans équipe";
  }

  function equipeDuJoueur(joueurId) {
    return nomEquipe(trouverJoueur(joueurId)?.team_id);
  }

  function informationsStatut(defi) {
    if (defi.status === "pending") {
      return {
        texte: "En attente",
        couleur: "#fde047",
        fond: "rgba(250, 204, 21, 0.13)",
        bordure: "rgba(250, 204, 21, 0.25)",
      };
    }

    if (defi.status === "validated") {
      return {
        texte: "Terminé",
        couleur: "#86efac",
        fond: "rgba(34, 197, 94, 0.12)",
        bordure: "rgba(34, 197, 94, 0.24)",
      };
    }

    return {
      texte: defi.status,
      couleur: "#cbd5e1",
      fond: "rgba(148, 163, 184, 0.12)",
      bordure: "rgba(148, 163, 184, 0.2)",
    };
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
        Chargement des défis...
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
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
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
            Défis ⚔️
          </h1>

          <p style={{ margin: 0, color: "#aeb8cb" }}>
            Défie un joueur d’une autre équipe et choisis un témoin impartial.
          </p>
        </header>

        {message && (
          <div
            style={{
              padding: 14,
              marginBottom: 16,
              border: "1px solid rgba(34, 197, 94, 0.32)",
              borderRadius: 14,
              color: "#86efac",
              background: "rgba(20, 83, 45, 0.24)",
            }}
          >
            ✅ {message}
          </div>
        )}

        {erreur && (
          <div
            style={{
              padding: 14,
              marginBottom: 16,
              border: "1px solid rgba(248, 113, 113, 0.34)",
              borderRadius: 14,
              color: "#fca5a5",
              background: "rgba(127, 29, 29, 0.2)",
            }}
          >
            {erreur}
          </div>
        )}

        <Card>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  color: "#a78bfa",
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                }}
              >
                Nouveau défi
              </div>

              <h2 style={{ margin: "8px 0 4px" }}>
                Créer un défi individuel
              </h2>

              <p style={{ margin: 0, color: "#94a3b8" }}>
                Un créateur, un adversaire et un témoin de trois équipes différentes.
              </p>
            </div>

            {joueurConnecte?.team_id && (
              <span
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  color: "#ddd6fe",
                  background: "rgba(139, 92, 246, 0.14)",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                {nomEquipe(joueurConnecte.team_id)}
              </span>
            )}
          </div>

          {!joueurConnecte ? (
            <p style={{ color: "#fca5a5" }}>
              Profil joueur introuvable. Reconnecte-toi.
            </p>
          ) : !joueurConnecte.team_id ? (
            <div
              style={{
                padding: 14,
                marginTop: 18,
                border: "1px solid rgba(250, 204, 21, 0.28)",
                borderRadius: 13,
                color: "#fde68a",
                background: "rgba(120, 53, 15, 0.2)",
              }}
            >
              La répartition des équipes doit être effectuée avant de créer un défi.
            </div>
          ) : (
            <>
              {joueurConnecteOccupe && (
                <div
                  style={{
                    padding: 14,
                    marginTop: 18,
                    border: "1px solid rgba(250, 204, 21, 0.28)",
                    borderRadius: 13,
                    color: "#fde68a",
                    background: "rgba(120, 53, 15, 0.2)",
                  }}
                >
                  Tu participes déjà à un défi en attente. Il doit être validé ou supprimé avant que tu puisses en créer un nouveau.
                </div>
              )}

              {!joueurConnecteOccupe && adversaires.length === 0 && (
                <div
                  style={{
                    padding: 14,
                    marginTop: 18,
                    border: "1px solid rgba(251, 146, 60, 0.28)",
                    borderRadius: 13,
                    color: "#fdba74",
                    background: "rgba(124, 45, 18, 0.18)",
                  }}
                >
                  Aucun adversaire n’est disponible pour le moment.
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 14,
                  marginTop: 20,
                }}
              >
                <label style={{ fontWeight: 800 }}>
                  Adversaire
                  <select
                    value={adversaireId}
                    onChange={(event) => {
                      setAdversaireId(event.target.value);
                      setTemoinId("");
                      setErreur("");
                    }}
                    disabled={joueurConnecteOccupe}
                    style={{
                      boxSizing: "border-box",
                      display: "block",
                      width: "100%",
                      padding: 13,
                      marginTop: 8,
                      border: "1px solid rgba(148, 163, 184, 0.24)",
                      borderRadius: 12,
                      color: "#f8fafc",
                      background: "#0f172a",
                    }}
                  >
                    <option value="">Choisir un adversaire</option>

                    {adversaires.map((joueur) => (
                      <option key={joueur.id} value={joueur.id}>
                        {nomJoueur(joueur.id)} — {nomEquipe(joueur.team_id)}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ fontWeight: 800 }}>
                  Témoin
                  <select
                    value={temoinId}
                    onChange={(event) => {
                      setTemoinId(event.target.value);
                      setErreur("");
                    }}
                    disabled={!adversaireId || joueurConnecteOccupe}
                    style={{
                      boxSizing: "border-box",
                      display: "block",
                      width: "100%",
                      padding: 13,
                      marginTop: 8,
                      border: "1px solid rgba(148, 163, 184, 0.24)",
                      borderRadius: 12,
                      color: "#f8fafc",
                      background: "#0f172a",
                    }}
                  >
                    <option value="">
                      {adversaireId
                        ? "Choisir un témoin"
                        : "Choisis d’abord un adversaire"}
                    </option>

                    {temoins.map((joueur) => (
                      <option key={joueur.id} value={joueur.id}>
                        {nomJoueur(joueur.id)} — {nomEquipe(joueur.team_id)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {adversaireId && temoins.length === 0 && (
                <p style={{ color: "#fdba74" }}>
                  Aucun témoin d’une troisième équipe n’est disponible.
                </p>
              )}

              <label
                style={{
                  display: "block",
                  marginTop: 14,
                  fontWeight: 800,
                }}
              >
                Nom du défi
                <input
                  type="text"
                  value={nomDefi}
                  onChange={(event) => {
                    setNomDefi(event.target.value);
                    setErreur("");
                  }}
                  placeholder="Exemple : concours de pompes"
                  disabled={joueurConnecteOccupe}
                  style={{
                    boxSizing: "border-box",
                    display: "block",
                    width: "100%",
                    padding: 13,
                    marginTop: 8,
                    border: "1px solid rgba(148, 163, 184, 0.24)",
                    borderRadius: 12,
                    outline: "none",
                    color: "#f8fafc",
                    background: "rgba(2, 6, 23, 0.52)",
                  }}
                />
              </label>

              <PrimaryButton
                onClick={creerDefi}
                disabled={
                  creationEnCours ||
                  joueurConnecteOccupe ||
                  adversaires.length === 0
                }
                style={{ marginTop: 18 }}
              >
                {creationEnCours ? "Création..." : "Créer le défi"}
              </PrimaryButton>
            </>
          )}
        </Card>

        <section style={{ marginTop: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "end",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <div
                style={{
                  color: "#a78bfa",
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                }}
              >
                Historique personnel
              </div>

              <h2 style={{ margin: "7px 0 0" }}>Mes défis</h2>
            </div>

            <span style={{ color: "#94a3b8", fontSize: 13 }}>
              {mesDefis.length} défi{mesDefis.length > 1 ? "s" : ""}
            </span>
          </div>

          {mesDefis.length === 0 ? (
            <Card>
              <p style={{ margin: 0, color: "#94a3b8" }}>
                Aucun défi pour le moment.
              </p>
            </Card>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {mesDefis.map((defi) => {
                const statut = informationsStatut(defi);
                const estCreateur =
                  Number(defi.creator_id) === playerId;
                const estAdversaire =
                  Number(defi.opponent_id) === playerId;
                const estTemoin =
                  Number(defi.witness_id) === playerId;

                return (
                  <Card key={defi.id}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 14,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: 22,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {defi.name}
                        </h3>

                        <div
                          style={{
                            marginTop: 6,
                            color: "#94a3b8",
                            fontSize: 13,
                          }}
                        >
                          {estCreateur
                            ? "Tu as lancé ce défi"
                            : estAdversaire
                            ? "Tu as été défié"
                            : estTemoin
                            ? "Tu es témoin"
                            : ""}
                        </div>
                      </div>

                      <span
                        style={{
                          flexShrink: 0,
                          padding: "7px 11px",
                          border: `1px solid ${statut.bordure}`,
                          borderRadius: 999,
                          color: statut.couleur,
                          background: statut.fond,
                          fontSize: 13,
                          fontWeight: 900,
                        }}
                      >
                        {statut.texte}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(190px, 1fr))",
                        gap: 10,
                        marginTop: 18,
                      }}
                    >
                      <div
                        style={{
                          padding: 13,
                          borderRadius: 12,
                          background: "rgba(255, 255, 255, 0.04)",
                        }}
                      >
                        <div
                          style={{
                            color: "#94a3b8",
                            fontSize: 11,
                            fontWeight: 900,
                            textTransform: "uppercase",
                          }}
                        >
                          Créateur
                        </div>

                        <strong style={{ display: "block", marginTop: 5 }}>
                          {nomJoueur(defi.creator_id)}
                        </strong>

                        <span style={{ color: "#94a3b8", fontSize: 13 }}>
                          {equipeDuJoueur(defi.creator_id)}
                        </span>
                      </div>

                      <div
                        style={{
                          padding: 13,
                          borderRadius: 12,
                          background: "rgba(255, 255, 255, 0.04)",
                        }}
                      >
                        <div
                          style={{
                            color: "#94a3b8",
                            fontSize: 11,
                            fontWeight: 900,
                            textTransform: "uppercase",
                          }}
                        >
                          Adversaire
                        </div>

                        <strong style={{ display: "block", marginTop: 5 }}>
                          {nomJoueur(defi.opponent_id)}
                        </strong>

                        <span style={{ color: "#94a3b8", fontSize: 13 }}>
                          {equipeDuJoueur(defi.opponent_id)}
                        </span>
                      </div>

                      <div
                        style={{
                          padding: 13,
                          borderRadius: 12,
                          background: "rgba(255, 255, 255, 0.04)",
                        }}
                      >
                        <div
                          style={{
                            color: "#94a3b8",
                            fontSize: 11,
                            fontWeight: 900,
                            textTransform: "uppercase",
                          }}
                        >
                          Témoin
                        </div>

                        <strong style={{ display: "block", marginTop: 5 }}>
                          {nomJoueur(defi.witness_id)}
                        </strong>

                        <span style={{ color: "#94a3b8", fontSize: 13 }}>
                          {equipeDuJoueur(defi.witness_id)}
                        </span>
                      </div>
                    </div>

                    {defi.winner_id && (
                      <div
                        style={{
                          marginTop: 14,
                          padding: 13,
                          border: "1px solid rgba(34, 197, 94, 0.22)",
                          borderRadius: 12,
                          color: "#bbf7d0",
                          background: "rgba(20, 83, 45, 0.18)",
                        }}
                      >
                        🏆 Gagnant :{" "}
                        <strong>{nomJoueur(defi.winner_id)}</strong>
                        {" — "}
                        {nomEquipe(defi.winning_team_id)}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </main>
  );
}