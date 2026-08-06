import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Medal,
  Star,
  Swords,
  Trophy,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import { supabase } from "../services/supabase";

import BottomNav from "../components/BottomNav";
import LivePodium from "../components/LivePodium";
import PrimaryButton from "../components/ui/PrimaryButton";

const couleurs = {
  fond: "#020617",
  carte: "rgba(15, 23, 42, 0.84)",
  carteClaire: "rgba(30, 41, 59, 0.66)",
  bordure: "rgba(148, 163, 184, 0.15)",
  texte: "#f8fafc",
  secondaire: "#94a3b8",
  violet: "#8b5cf6",
  violetClair: "#c4b5fd",
};

const styleCarte = {
  border: `1px solid ${couleurs.bordure}`,
  borderRadius: 14,
  background: couleurs.carte,
};

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
  const [animationEquipe, setAnimationEquipe] = useState(false);
  const [deconnexionEnCours, setDeconnexionEnCours] =
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
    const playerId =
      sessionStorage.getItem("player_id");

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

    const joueurActuel = nouveauxJoueurs.find(
      (element) =>
        Number(element.id) === playerId
    );

    const concerneEquipe =
      Boolean(equipeGagnante?.id) &&
      Number(joueurActuel?.team_id) ===
        Number(equipeGagnante.id);

    afficherNotification({
      titre: `${
        gagnant?.first_name ?? "Un joueur"
      } remporte son défi`,
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

  function afficherNotification(
    nouvelleNotification
  ) {
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

        const donnees =
          buffer.getChannelData(0);

        for (
          let echantillon = 0;
          echantillon < donnees.length;
          echantillon += 1
        ) {
          donnees[echantillon] =
            (Math.random() * 2 - 1) *
            Math.pow(
              1 -
                echantillon /
                  donnees.length,
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
        scoreTotal: Number(
          equipe.score ?? 0
        ),
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
    if (
      anciensPointsJoueur.current === null
    ) {
      anciensPointsJoueur.current =
        pointsJoueur;
      return;
    }

    if (
      anciensPointsJoueur.current !==
      pointsJoueur
    ) {
      setAnimationPoints(true);

      const minuterie =
        window.setTimeout(() => {
          setAnimationPoints(false);
        }, 650);

      anciensPointsJoueur.current =
        pointsJoueur;

      return () =>
        window.clearTimeout(minuterie);
    }
  }, [pointsJoueur]);

  useEffect(() => {
    if (
      anciennesVictoires.current === null
    ) {
      anciennesVictoires.current =
        victoires;
      return;
    }

    if (
      anciennesVictoires.current !==
      victoires
    ) {
      setAnimationVictoires(true);

      const minuterie =
        window.setTimeout(() => {
          setAnimationVictoires(false);
        }, 650);

      anciennesVictoires.current =
        victoires;

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

    if (
      anciensPointsEquipe.current === null
    ) {
      anciensPointsEquipe.current =
        scoreEquipe;
      return;
    }

    if (
      anciensPointsEquipe.current !==
      scoreEquipe
    ) {
      setAnimationEquipe(true);

      const minuterie =
        window.setTimeout(() => {
          setAnimationEquipe(false);
        }, 650);

      anciensPointsEquipe.current =
        scoreEquipe;

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
          new Date(
            b.created_at ?? 0
          ) -
          new Date(
            a.created_at ?? 0
          )
      );
  }, [defis, joueur]);

  const defiEnAttente = mesDefis.find(
    (defi) =>
      defi.status === "pending"
  );

  const dernierDefi =
    defiEnAttente ?? mesDefis[0];

  function trouverJoueur(id) {
    return joueurs.find(
      (element) =>
        Number(element.id) ===
        Number(id)
    );
  }

  function nomJoueur(id) {
    const joueurTrouve =
      trouverJoueur(id);

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
      return nomJoueur(
        defi.opponent_id
      );
    }

    if (
      Number(defi.opponent_id) ===
      Number(joueur.id)
    ) {
      return nomJoueur(
        defi.creator_id
      );
    }

    return `${nomJoueur(
      defi.creator_id
    )} contre ${nomJoueur(
      defi.opponent_id
    )}`;
  }

  function statutDuDefi(defi) {
    if (!defi) {
      return {
        texte: "Aucun défi",
        couleur: "#94a3b8",
        fond: "rgba(148, 163, 184, 0.1)",
      };
    }

    if (defi.status === "pending") {
      return {
        texte: "En attente",
        couleur: "#fde047",
        fond: "rgba(250, 204, 21, 0.11)",
      };
    }

    if (
      Number(defi.winner_id) ===
      Number(joueur.id)
    ) {
      return {
        texte: "Gagné",
        couleur: "#4ade80",
        fond: "rgba(34, 197, 94, 0.11)",
      };
    }

    return {
      texte: "Terminé",
      couleur: "#cbd5e1",
      fond: "rgba(148, 163, 184, 0.1)",
    };
  }

  function textePosition(position) {
    if (position === 1) {
      return "1re";
    }

    return `${position}e`;
  }

async function seDeconnecter() {
  if (deconnexionEnCours) {
    return;
  }

  setDeconnexionEnCours(true);

  const playerId =
    sessionStorage.getItem("player_id");

  const playerToken =
    sessionStorage.getItem("player_token");

  if (!playerId || !playerToken) {
    sessionStorage.removeItem("player_id");
    sessionStorage.removeItem("player_token");

    navigate("/");
    return;
  }

  const { data, error } = await supabase.rpc(
    "logout_player",
    {
      p_player_id: Number(playerId),
      p_token: playerToken,
    }
  );

  if (error) {
    console.error(
      "Erreur pendant la déconnexion :",
      error
    );

    setDeconnexionEnCours(false);

    alert(
      `La déconnexion n’a pas fonctionné : ${error.message}`
    );

    return;
  }

  if (data !== true) {
    console.error(
      "Aucune session correspondant au token :",
      data
    );

    setDeconnexionEnCours(false);

    alert(
      "La session de ce téléphone n’a pas été retrouvée."
    );

    return;
  }

  sessionStorage.removeItem("player_id");
  sessionStorage.removeItem("player_token");

  navigate("/");
}

  const styleAnimation = {
    transition:
      "transform 0.25s ease, box-shadow 0.25s ease",
  };

  const styleRebond = {
    transform: "scale(1.02)",
    boxShadow:
      "0 0 0 2px rgba(167, 139, 250, 0.25)",
  };

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
          color: couleurs.texte,
          background: couleurs.fond,
        }}
      >
        <h1>
          Une erreur est survenue
        </h1>

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

  const statut =
    statutDuDefi(dernierDefi);

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
      {notification && (
        <div
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            zIndex: 2000,
            width:
              "calc(100% - 28px)",
            maxWidth: 520,
            padding: "13px 15px",
            border:
              "1px solid rgba(34, 197, 94, 0.35)",
            borderRadius: 13,
            color: "#f0fdf4",
            background:
              "rgba(20, 83, 45, 0.98)",
            boxShadow:
              "0 12px 35px rgba(0, 0, 0, 0.3)",
            transform:
              "translateX(-50%)",
            animation:
              "olympiadesNotification 0.3s ease",
          }}
        >
          <strong
            style={{
              display: "block",
            }}
          >
            {notification.titre}
          </strong>

          <div
            style={{
              marginTop: 3,
              color: "#bbf7d0",
              fontSize: 13,
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
              transform: translate(-50%, -12px);
            }

            to {
              opacity: 1;
              transform: translate(-50%, 0);
            }
          }
        `}
      </style>

      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
        }}
      >
        <LivePodium />

        <header
          style={{
            margin: "20px 0 16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent:
                "space-between",
              gap: 12,
            }}
          >
            <div
              style={{
                minWidth: 0,
              }}
            >
              <p
                style={{
                  margin: 0,
                  color:
                    couleurs.violet,
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing:
                    "0.08em",
                  textTransform:
                    "uppercase",
                }}
              >
                Olympiades 2026
              </p>

              <h1
                style={{
                  margin: "5px 0 0",
                  fontSize:
                    "clamp(27px, 7vw, 40px)",
                  lineHeight: 1.08,
                }}
              >
                Bonjour{" "}
                {joueur.first_name}
              </h1>
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
                display: "grid",
                width: 40,
                height: 40,
                flexShrink: 0,
                placeItems: "center",
                padding: 0,
                border:
                  "1px solid rgba(148, 163, 184, 0.18)",
                borderRadius: 11,
                color: sonsActifs
                  ? couleurs.violetClair
                  : couleurs.secondaire,
                background:
                  couleurs.carte,
                cursor: "pointer",
              }}
            >
              {sonsActifs ? (
                <Volume2 size={19} />
              ) : (
                <VolumeX size={19} />
              )}
            </button>
          </div>
        </header>

        {monEquipe ? (
          <section
            style={{
              ...styleCarte,
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1fr) auto",
              alignItems: "center",
              gap: 14,
              padding: "14px 16px",
              ...styleAnimation,
              ...(animationEquipe
                ? styleRebond
                : {}),
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  fontSize: 29,
                  lineHeight: 1,
                }}
              >
                {monEquipe.flag}
              </span>

              <div
                style={{
                  minWidth: 0,
                }}
              >
                <strong
                  style={{
                    display: "block",
                    overflow: "hidden",
                    fontSize: 18,
                    textOverflow:
                      "ellipsis",
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {monEquipe.name}
                </strong>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 3,
                    color:
                      couleurs.secondaire,
                    fontSize: 12,
                  }}
                >
                  <Medal size={14} />

                  {textePosition(
                    positionEquipe
                  )}{" "}
                  au classement
                </div>
              </div>
            </div>

            <div
              style={{
                textAlign: "right",
                ...styleAnimation,
              }}
            >
              <strong
                style={{
                  display: "block",
                  fontSize: 23,
                  lineHeight: 1,
                }}
              >
                {monEquipe.scoreTotal}
              </strong>

              <span
                style={{
                  color:
                    couleurs.secondaire,
                  fontSize: 10,
                  textTransform:
                    "uppercase",
                }}
              >
                points
              </span>
            </div>
          </section>
        ) : (
          <section
            style={{
              ...styleCarte,
              padding: 16,
            }}
          >
            <strong>
              Répartition à venir
            </strong>

            <p
              style={{
                margin: "4px 0 0",
                color:
                  couleurs.secondaire,
                fontSize: 13,
              }}
            >
              Les équipes ne sont pas
              encore constituées.
            </p>
          </section>
        )}

        <section
          style={{
            ...styleCarte,
            marginTop: 9,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "13px 14px",
                borderRight: `1px solid ${couleurs.bordure}`,
                ...styleAnimation,
                ...(animationPoints
                  ? styleRebond
                  : {}),
              }}
            >
              <Star
                size={20}
                color="#fde047"
                fill="rgba(250, 204, 21, 0.18)"
              />

              <div>
                <strong
                  style={{
                    display: "block",
                    fontSize: 20,
                    lineHeight: 1,
                  }}
                >
                  {pointsJoueur}
                </strong>

                <span
                  style={{
                    color:
                      couleurs.secondaire,
                    fontSize: 11,
                  }}
                >
                  Points personnels
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "13px 14px",
                ...styleAnimation,
                ...(animationVictoires
                  ? styleRebond
                  : {}),
              }}
            >
              <Trophy
                size={20}
                color={
                  couleurs.violetClair
                }
              />

              <div>
                <strong
                  style={{
                    display: "block",
                    fontSize: 20,
                    lineHeight: 1,
                  }}
                >
                  {victoires}

                  <span
                    style={{
                      color:
                        couleurs.secondaire,
                      fontSize: 12,
                    }}
                  >
                    /10
                  </span>
                </strong>

                <span
                  style={{
                    color:
                      couleurs.secondaire,
                    fontSize: 11,
                  }}
                >
                  Défis gagnés
                </span>
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            ...styleCarte,
            marginTop: 9,
            padding: "14px 15px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              color:
                couleurs.violetClair,
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.06em",
              textTransform:
                "uppercase",
            }}
          >
            <Swords size={15} />
            Mon défi
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1fr) auto",
              alignItems: "center",
              gap: 12,
              marginTop: 10,
            }}
          >
            <div
              style={{
                minWidth: 0,
              }}
            >
              <strong
                style={{
                  display: "block",
                  overflow: "hidden",
                  fontSize: 16,
                  textOverflow:
                    "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {dernierDefi?.name ??
                  "Aucun défi actif"}
              </strong>

              <div
                style={{
                  marginTop: 3,
                  overflow: "hidden",
                  color:
                    couleurs.secondaire,
                  fontSize: 12,
                  textOverflow:
                    "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {dernierDefi
                  ? `Contre ${adversaireDuDefi(
                      dernierDefi
                    )}`
                  : "Lance ton prochain défi."}
              </div>
            </div>

            <span
              style={{
                padding: "6px 9px",
                borderRadius: 999,
                color: statut.couleur,
                background: statut.fond,
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              {statut.texte}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/defis")
            }
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent:
                "space-between",
              marginTop: 12,
              padding: "10px 0 0",
              border: 0,
              borderTop: `1px solid ${couleurs.bordure}`,
              color:
                couleurs.violetClair,
              background:
                "transparent",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Voir mes défis
            <ChevronRight size={18} />
          </button>
        </section>

        {monEquipe && (
          <section
            style={{
              ...styleCarte,
              marginTop: 9,
              padding: "14px 15px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: 9,
                color:
                  couleurs.secondaire,
                fontSize: 11,
                fontWeight: 900,
                letterSpacing:
                  "0.06em",
                textTransform:
                  "uppercase",
              }}
            >
              <Users size={15} />
              Mon équipe
            </div>

            <div>
              {monEquipe.membres.map(
                (membre, index) => (
                  <div
                    key={membre.id}
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "space-between",
                      gap: 10,
                      minHeight: 38,
                      padding: "7px 0",
                      borderTop:
                        index === 0
                          ? "none"
                          : `1px solid ${couleurs.bordure}`,
                    }}
                  >
                    <span
                      style={{
                        minWidth: 0,
                        overflow:
                          "hidden",
                        fontSize: 14,
                        fontWeight: 700,
                        textOverflow:
                          "ellipsis",
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {
                        membre.first_name
                      }

                      {membre.nickname
                        ? ` — ${membre.nickname}`
                        : ""}
                    </span>

                    {membre.is_captain && (
                      <span
                        style={{
                          flexShrink: 0,
                          color:
                            "#fde68a",
                          fontSize: 11,
                        }}
                      >
                        Capitaine
                      </span>
                    )}
                  </div>
                )
              )}
            </div>
          </section>
        )}

        <button
          type="button"
          onClick={seDeconnecter}
          disabled={deconnexionEnCours}
          style={{
            width: "100%",
            marginTop: 13,
            padding: 11,
            border:
              "1px solid rgba(148, 163, 184, 0.16)",
            borderRadius: 11,
            color:
              couleurs.secondaire,
            background: "transparent",
            cursor: deconnexionEnCours
              ? "not-allowed"
              : "pointer",
            opacity: deconnexionEnCours
              ? 0.55
              : 1,
          }}
        >
          {deconnexionEnCours
            ? "Déconnexion..."
            : "Se déconnecter"}
        </button>
      </div>

      <BottomNav />
    </main>
  );
}