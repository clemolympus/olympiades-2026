import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

import BottomNav from "../components/BottomNav";
import LivePodium from "../components/LivePodium";
import Card from "../components/ui/Card";
import PrimaryButton from "../components/ui/PrimaryButton";

export default function Dashboard() {
  const navigate = useNavigate();

  const [joueur, setJoueur] = useState(null);
  const [equipes, setEquipes] = useState([]);
  const [joueurs, setJoueurs] = useState([]);
  const [defis, setDefis] = useState([]);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [notification, setNotification] = useState(null);
  const [animationPoints, setAnimationPoints] = useState(false);
  const [animationVictoires, setAnimationVictoires] =
    useState(false);
  const [animationEquipe, setAnimationEquipe] =
    useState(false);

  const [sonsActifs, setSonsActifs] = useState(
    localStorage.getItem("olympiades_sons") !== "false"
  );

  const initialisationTerminee = useRef(false);
  const idsDefisValidesConnus = useRef(new Set());

  const anciensPointsJoueur = useRef(null);
  const anciennesVictoires = useRef(null);
  const anciensPointsEquipe = useRef(null);

  const minuterieNotification = useRef(null);

  useEffect(() => {
    chargerDonnees();

    const intervalle = window.setInterval(
      chargerDonnees,
      5000
    );

    return () => {
      window.clearInterval(intervalle);

      if (minuterieNotification.current) {
        window.clearTimeout(
          minuterieNotification.current
        );
      }
    };
  }, []);

  async function chargerDonnees() {
    const playerId = sessionStorage.getItem("player_id");

    if (!playerId) {
      navigate("/connexion");
      return;
    }

    const [profilResponse, etatResponse] =
      await Promise.all([
        supabase.rpc("get_player_profile", {
          p_player_id: Number(playerId),
        }),
        supabase.rpc("get_state"),
      ]);

    if (profilResponse.error) {
      console.error(profilResponse.error);
      setErreur(profilResponse.error.message);
      setChargement(false);
      return;
    }

    if (etatResponse.error) {
      console.error(etatResponse.error);
      setErreur(etatResponse.error.message);
      setChargement(false);
      return;
    }

    const profil = profilResponse.data?.[0];

    if (!profil) {
      setErreur("Profil joueur introuvable.");
      setChargement(false);
      return;
    }

    const nouveauxJoueurs =
      etatResponse.data?.players ?? [];

    const nouvellesEquipes =
      etatResponse.data?.teams ?? [];

    const nouveauxDefis =
      etatResponse.data?.challenges ?? [];

    detecterNouveauDefiValide(
      nouveauxDefis,
      nouveauxJoueurs,
      nouvellesEquipes,
      Number(playerId)
    );

    setJoueur(profil);
    setEquipes(nouvellesEquipes);
    setJoueurs(nouveauxJoueurs);
    setDefis(nouveauxDefis);
    setErreur("");
    setChargement(false);
  }

  function detecterNouveauDefiValide(
    nouveauxDefis,
    nouveauxJoueurs,
    nouvellesEquipes,
    playerId
  ) {
    const defisValides = nouveauxDefis.filter(
      (defi) =>
        defi.type === "individual" &&
        defi.status === "validated"
    );

    if (!initialisationTerminee.current) {
      idsDefisValidesConnus.current = new Set(
        defisValides.map((defi) =>
          Number(defi.id)
        )
      );

      initialisationTerminee.current = true;
      return;
    }

    const nouveauDefi = defisValides.find(
      (defi) =>
        !idsDefisValidesConnus.current.has(
          Number(defi.id)
        )
    );

    defisValides.forEach((defi) => {
      idsDefisValidesConnus.current.add(
        Number(defi.id)
      );
    });

    if (!nouveauDefi) {
      return;
    }

    const gagnant = nouveauxJoueurs.find(
      (element) =>
        Number(element.id) ===
        Number(nouveauDefi.winner_id)
    );

    const equipeGagnante = nouvellesEquipes.find(
      (equipe) =>
        Number(equipe.id) ===
        Number(
          nouveauDefi.winning_team_id ??
            gagnant?.team_id
        )
    );

    const concerneJoueur =
      Number(nouveauDefi.creator_id) === playerId ||
      Number(nouveauDefi.opponent_id) === playerId ||
      Number(nouveauDefi.witness_id) === playerId;

    const concerneEquipe =
      Boolean(equipeGagnante?.id) &&
      nouveauxJoueurs.some(
        (element) =>
          Number(element.id) === playerId &&
          Number(element.team_id) ===
            Number(equipeGagnante.id)
      );

    afficherNotification({
      titre: `🏆 ${
        gagnant?.first_name ?? "Un joueur"
      } remporte son défi !`,
      texte: equipeGagnante
        ? `${equipeGagnante.flag} ${equipeGagnante.name} gagne 1 point.`
        : "Le classement vient d’être mis à jour.",
    });

    if (
      sonsActifs &&
      (concerneJoueur || concerneEquipe)
    ) {
      jouerApplaudissements();
    }
  }

  function afficherNotification(nouvelleNotification) {
    setNotification(nouvelleNotification);

    if (minuterieNotification.current) {
      window.clearTimeout(
        minuterieNotification.current
      );
    }

    minuterieNotification.current =
      window.setTimeout(() => {
        setNotification(null);
      }, 5000);
  }

  function jouerApplaudissements() {
    try {
      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContext) {
        return;
      }

      const contexte = new AudioContext();

      if (contexte.state === "suspended") {
        contexte.resume();
      }

      const duree = 1.25;
      const nombreImpulsions = 24;

      for (
        let index = 0;
        index < nombreImpulsions;
        index += 1
      ) {
        const debut =
          contexte.currentTime +
          Math.random() * duree;

        const buffer = contexte.createBuffer(
          1,
          contexte.sampleRate * 0.08,
          contexte.sampleRate
        );

        const donnees = buffer.getChannelData(0);

        for (
          let echantillon = 0;
          echantillon < donnees.length;
          echantillon += 1
        ) {
          donnees[echantillon] =
            (Math.random() * 2 - 1) *
            Math.pow(
              1 - echantillon / donnees.length,
              2
            );
        }

        const source =
          contexte.createBufferSource();

        const filtre =
          contexte.createBiquadFilter();

        const gain =
          contexte.createGain();

        source.buffer = buffer;

        filtre.type = "bandpass";
        filtre.frequency.value =
          900 + Math.random() * 1700;

        gain.gain.setValueAtTime(
          0.05 + Math.random() * 0.05,
          debut
        );

        gain.gain.exponentialRampToValueAtTime(
          0.001,
          debut + 0.08
        );

        source.connect(filtre);
        filtre.connect(gain);
        gain.connect(contexte.destination);

        source.start(debut);
        source.stop(debut + 0.09);
      }

      window.setTimeout(() => {
        contexte.close();
      }, 1800);
    } catch (audioError) {
      console.warn(
        "Le son n’a pas pu être joué.",
        audioError
      );
    }
  }

  function basculerSons() {
    const nouvelleValeur = !sonsActifs;

    setSonsActifs(nouvelleValeur);

    localStorage.setItem(
      "olympiades_sons",
      String(nouvelleValeur)
    );

    if (nouvelleValeur) {
      jouerApplaudissements();
    }
  }

  const classement = useMemo(() => {
    return equipes
      .map((equipe) => ({
        ...equipe,
        membres: joueurs.filter(
          (membre) =>
            Number(membre.team_id) ===
            Number(equipe.id)
        ),
        scoreTotal: Number(equipe.score ?? 0),
      }))
      .sort((a, b) => {
        const difference =
          b.scoreTotal - a.scoreTotal;

        if (difference !== 0) {
          return difference;
        }

        return (
          Number(a.sort_order ?? 0) -
          Number(b.sort_order ?? 0)
        );
      });
  }, [equipes, joueurs]);

  const monEquipe = classement.find(
    (equipe) =>
      Number(equipe.id) ===
      Number(joueur?.team_id)
  );

  const positionEquipe =
    classement.findIndex(
      (equipe) =>
        Number(equipe.id) ===
        Number(joueur?.team_id)
    ) + 1;

  const monProfilComplet =
    joueurs.find(
      (membre) =>
        Number(membre.id) ===
        Number(joueur?.id)
    ) ?? joueur;

  const pointsJoueur = Number(
    monProfilComplet?.points ?? 0
  );

  const victoires = Number(
    monProfilComplet?.wins ?? 0
  );

  useEffect(() => {
    if (anciensPointsJoueur.current === null) {
      anciensPointsJoueur.current = pointsJoueur;
      return;
    }

    if (
      anciensPointsJoueur.current !== pointsJoueur
    ) {
      setAnimationPoints(true);

      const minuterie = window.setTimeout(() => {
        setAnimationPoints(false);
      }, 650);

      anciensPointsJoueur.current = pointsJoueur;

      return () =>
        window.clearTimeout(minuterie);
    }
  }, [pointsJoueur]);

  useEffect(() => {
    if (anciennesVictoires.current === null) {
      anciennesVictoires.current = victoires;
      return;
    }

    if (
      anciennesVictoires.current !== victoires
    ) {
      setAnimationVictoires(true);

      const minuterie = window.setTimeout(() => {
        setAnimationVictoires(false);
      }, 650);

      anciennesVictoires.current = victoires;

      return () =>
        window.clearTimeout(minuterie);
    }
  }, [victoires]);

  useEffect(() => {
    const scoreEquipe =
      monEquipe?.scoreTotal ?? null;

    if (scoreEquipe === null) {
      return;
    }

    if (anciensPointsEquipe.current === null) {
      anciensPointsEquipe.current = scoreEquipe;
      return;
    }

    if (
      anciensPointsEquipe.current !== scoreEquipe
    ) {
      setAnimationEquipe(true);

      const minuterie = window.setTimeout(() => {
        setAnimationEquipe(false);
      }, 650);

      anciensPointsEquipe.current = scoreEquipe;

      return () =>
        window.clearTimeout(minuterie);
    }
  }, [monEquipe?.scoreTotal]);

  const mesDefis = useMemo(() => {
    if (!joueur) {
      return [];
    }

    return defis
      .filter(
        (defi) =>
          Number(defi.creator_id) ===
            Number(joueur.id) ||
          Number(defi.opponent_id) ===
            Number(joueur.id) ||
          Number(defi.witness_id) ===
            Number(joueur.id)
      )
      .sort(
        (a, b) =>
          new Date(b.created_at ?? 0) -
          new Date(a.created_at ?? 0)
      );
  }, [defis, joueur]);

  const defiEnAttente = mesDefis.find(
    (defi) => defi.status === "pending"
  );

  const dernierDefi =
    defiEnAttente ?? mesDefis[0];

  function trouverJoueur(id) {
    return joueurs.find(
      (element) =>
        Number(element.id) === Number(id)
    );
  }

  function nomJoueur(id) {
    const joueurTrouve = trouverJoueur(id);

    if (!joueurTrouve) {
      return "Joueur inconnu";
    }

    return joueurTrouve.nickname
      ? `${joueurTrouve.first_name} — ${joueurTrouve.nickname}`
      : joueurTrouve.first_name;
  }

  function adversaireDuDefi(defi) {
    if (!defi) {
      return "";
    }

    if (
      Number(defi.creator_id) ===
      Number(joueur.id)
    ) {
      return nomJoueur(defi.opponent_id);
    }

    if (
      Number(defi.opponent_id) ===
      Number(joueur.id)
    ) {
      return nomJoueur(defi.creator_id);
    }

    return `${nomJoueur(
      defi.creator_id
    )} contre ${nomJoueur(defi.opponent_id)}`;
  }

  function statutDuDefi(defi) {
    if (!defi) {
      return {
        texte: "Aucun défi",
        couleur: "#cbd5e1",
        fond: "rgba(148, 163, 184, 0.12)",
      };
    }

    if (defi.status === "pending") {
      return {
        texte: "En attente",
        couleur: "#fde047",
        fond: "rgba(250, 204, 21, 0.14)",
      };
    }

    if (
      Number(defi.winner_id) ===
      Number(joueur.id)
    ) {
      return {
        texte: "Gagné",
        couleur: "#4ade80",
        fond: "rgba(34, 197, 94, 0.14)",
      };
    }

    return {
      texte: "Terminé",
      couleur: "#cbd5e1",
      fond: "rgba(148, 163, 184, 0.12)",
    };
  }

  function medaillePosition(position) {
    if (position === 1) return "🥇";
    if (position === 2) return "🥈";
    if (position === 3) return "🥉";

    return "🏅";
  }

  function seDeconnecter() {
    sessionStorage.removeItem("player_id");
    sessionStorage.removeItem("player_token");
    navigate("/");
  }

  const styleAnimation = {
    transition:
      "transform 0.25s ease, box-shadow 0.25s ease",
  };

  const styleRebond = {
    transform: "scale(1.045)",
    boxShadow:
      "0 0 0 2px rgba(167, 139, 250, 0.38), 0 18px 40px rgba(76, 29, 149, 0.32)",
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
        Chargement...
      </main>
    );
  }

  if (erreur) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: 30,
          color: "#f8fafc",
          background: "#020617",
        }}
      >
        <h1>Une erreur est survenue</h1>
        <p>{erreur}</p>

        <PrimaryButton
          onClick={() =>
            navigate("/connexion")
          }
        >
          Retour à la connexion
        </PrimaryButton>
      </main>
    );
  }

  const statut = statutDuDefi(dernierDefi);

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
      {notification && (
        <div
          style={{
            position: "fixed",
            top: 18,
            left: "50%",
            zIndex: 2000,
            width: "calc(100% - 36px)",
            maxWidth: 560,
            padding: "16px 18px",
            border:
              "1px solid rgba(34, 197, 94, 0.4)",
            borderRadius: 16,
            color: "#f0fdf4",
            background:
              "linear-gradient(135deg, rgba(20, 83, 45, 0.98), rgba(21, 128, 61, 0.96))",
            boxShadow:
              "0 18px 50px rgba(0, 0, 0, 0.38)",
            transform:
              "translateX(-50%)",
            animation:
              "olympiadesNotification 0.35s ease",
          }}
        >
          <strong
            style={{
              display: "block",
              fontSize: 17,
            }}
          >
            {notification.titre}
          </strong>

          <div
            style={{
              marginTop: 5,
              color: "#bbf7d0",
            }}
          >
            {notification.texte}
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes olympiadesNotification {
            from {
              opacity: 0;
              transform: translate(-50%, -18px) scale(0.97);
            }

            to {
              opacity: 1;
              transform: translate(-50%, 0) scale(1);
            }
          }
        `}
      </style>

      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <LivePodium />

        <header
          style={{
            margin: "26px 0 22px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 14,
            }}
          >
            <div>
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
                  margin: "8px 0 4px",
                  fontSize:
                    "clamp(32px, 7vw, 48px)",
                  lineHeight: 1.05,
                }}
              >
                Bonjour {joueur.first_name} 👋
              </h1>

              <p
                style={{
                  margin: 0,
                  color: "#aeb8cb",
                }}
              >
                Prêt à faire gagner ton équipe ?
              </p>
            </div>

            <button
              type="button"
              onClick={basculerSons}
              title={
                sonsActifs
                  ? "Désactiver les sons"
                  : "Activer les sons"
              }
              style={{
                flexShrink: 0,
                padding: "9px 12px",
                border:
                  "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: 999,
                color: sonsActifs
                  ? "#c4b5fd"
                  : "#94a3b8",
                background:
                  "rgba(15, 23, 42, 0.72)",
                cursor: "pointer",
              }}
            >
              {sonsActifs
                ? "🔊 Sons"
                : "🔇 Sons"}
            </button>
          </div>
        </header>

        {monEquipe ? (
          <Card
            style={{
              padding: 24,
              background:
                "linear-gradient(120deg, #4f2bd7 0%, #3121a4 62%, #181767 100%)",
              border:
                "1px solid rgba(139, 92, 246, 0.5)",
              ...styleAnimation,
              ...(animationEquipe
                ? styleRebond
                : {}),
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(0, 1.5fr) minmax(110px, 0.75fr) minmax(110px, 0.75fr)",
                alignItems: "center",
                gap: 18,
              }}
            >
              <div>
                <div style={{ fontSize: 48 }}>
                  {monEquipe.flag}
                </div>

                <div
                  style={{
                    marginTop: 10,
                    fontSize:
                      "clamp(23px, 5vw, 34px)",
                    fontWeight: 900,
                    textTransform: "uppercase",
                  }}
                >
                  {monEquipe.name}
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 34 }}>
                  {medaillePosition(
                    positionEquipe
                  )}
                </div>

                <strong
                  style={{
                    display: "block",
                    marginTop: 4,
                    fontSize: 28,
                  }}
                >
                  {positionEquipe}e
                </strong>

                <span
                  style={{
                    display: "block",
                    marginTop: 4,
                    color: "#d8d6ff",
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Équipe
                </span>
              </div>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 34 }}>
                  ⭐
                </div>

                <strong
                  style={{
                    display: "block",
                    marginTop: 4,
                    fontSize: 28,
                  }}
                >
                  {monEquipe.scoreTotal}
                </strong>

                <span
                  style={{
                    display: "block",
                    marginTop: 4,
                    color: "#d8d6ff",
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Points équipe
                </span>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <h2 style={{ marginTop: 0 }}>
              Répartition à venir
            </h2>

            <p
              style={{
                marginBottom: 0,
                color: "#cbd5e1",
              }}
            >
              Les équipes ne sont pas encore
              constituées.
            </p>
          </Card>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: 14,
            marginTop: 14,
          }}
        >
          <Card
            style={{
              minHeight: 110,
              display: "flex",
              alignItems: "center",
              gap: 18,
              ...styleAnimation,
              ...(animationPoints
                ? styleRebond
                : {}),
            }}
          >
            <div
              style={{
                display: "grid",
                placeItems: "center",
                width: 58,
                height: 58,
                flexShrink: 0,
                borderRadius: 16,
                background:
                  "rgba(250, 204, 21, 0.1)",
                fontSize: 32,
              }}
            >
              ⭐
            </div>

            <div>
              <strong style={{ fontSize: 34 }}>
                {pointsJoueur}
              </strong>

              <div
                style={{
                  marginTop: 3,
                  fontSize: 14,
                  fontWeight: 900,
                  textTransform: "uppercase",
                }}
              >
                Points
              </div>

              <div
                style={{
                  marginTop: 3,
                  color: "#94a3b8",
                  fontSize: 13,
                }}
              >
                Points personnels
              </div>
            </div>
          </Card>

          <Card
            style={{
              minHeight: 110,
              display: "flex",
              alignItems: "center",
              gap: 18,
              ...styleAnimation,
              ...(animationVictoires
                ? styleRebond
                : {}),
            }}
          >
            <div
              style={{
                display: "grid",
                placeItems: "center",
                width: 58,
                height: 58,
                flexShrink: 0,
                borderRadius: 16,
                background:
                  "rgba(124, 58, 237, 0.18)",
                fontSize: 32,
              }}
            >
              💪
            </div>

            <div>
              <strong style={{ fontSize: 34 }}>
                {victoires}
                <span style={{ fontSize: 20 }}>
                  /10
                </span>
              </strong>

              <div
                style={{
                  marginTop: 3,
                  fontSize: 14,
                  fontWeight: 900,
                  textTransform: "uppercase",
                }}
              >
                Victoires
              </div>

              <div
                style={{
                  marginTop: 3,
                  color: "#94a3b8",
                  fontSize: 13,
                }}
              >
                Défis gagnés
              </div>
            </div>
          </Card>
        </div>

        <Card style={{ marginTop: 14 }}>
          <div
            style={{
              color: "#a78bfa",
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            ⚔️ Mon défi
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 18,
              marginTop: 15,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <h2
                style={{
                  margin: 0,
                  overflow: "hidden",
                  fontSize: 23,
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {dernierDefi?.name ??
                  "Aucun défi actif"}
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "#b4bfd2",
                }}
              >
                {dernierDefi
                  ? `VS ${adversaireDuDefi(
                      dernierDefi
                    )}`
                  : "Lance ton prochain défi."}
              </p>
            </div>

            <span
              style={{
                flexShrink: 0,
                padding: "9px 15px",
                borderRadius: 999,
                color: statut.couleur,
                background: statut.fond,
                fontSize: 14,
                fontWeight: 900,
              }}
            >
              {statut.texte}
            </span>
          </div>

          <PrimaryButton
            onClick={() => navigate("/defis")}
            style={{ marginTop: 20 }}
          >
            Voir mes défis →
          </PrimaryButton>
        </Card>

        {monEquipe && (
          <Card style={{ marginTop: 14 }}>
            <div
              style={{
                marginBottom: 14,
                color: "#cbd5e1",
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              👥 Mon équipe
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 10,
              }}
            >
              {monEquipe.membres.map(
                (membre) => (
                  <div
                    key={membre.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "space-between",
                      gap: 10,
                      padding: "13px 14px",
                      border:
                        "1px solid rgba(148, 163, 184, 0.12)",
                      borderRadius: 14,
                      background:
                        "rgba(255, 255, 255, 0.04)",
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
                      {membre.first_name}
                      {membre.nickname
                        ? ` — ${membre.nickname}`
                        : ""}
                    </div>

                    {membre.is_captain && (
                      <span title="Chef d’équipe">
                        👑
                      </span>
                    )}
                  </div>
                )
              )}
            </div>
          </Card>
        )}

        <button
          type="button"
          onClick={seDeconnecter}
          style={{
            width: "100%",
            marginTop: 20,
            padding: 13,
            border:
              "1px solid rgba(148, 163, 184, 0.22)",
            borderRadius: 12,
            color: "#aeb8cb",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          Se déconnecter
        </button>
      </div>

      <BottomNav />
    </main>
  );
}