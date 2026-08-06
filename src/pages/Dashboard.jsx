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

const couleursConfettis = [
  "#facc15",
  "#f97316",
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f8fafc",
];

export default function Dashboard() {
  const navigate = useNavigate();

  const [joueur, setJoueur] = useState(null);
  const [equipes, setEquipes] = useState([]);
  const [joueurs, setJoueurs] = useState([]);
  const [defis, setDefis] = useState([]);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [notification, setNotification] = useState(null);
  const [equipeRevelee, setEquipeRevelee] = useState(null);

  const [animationPoints, setAnimationPoints] = useState(false);
  const [animationVictoires, setAnimationVictoires] =
    useState(false);
  const [animationEquipe, setAnimationEquipe] =
    useState(false);

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
  const minuterieRevelation = useRef(null);

  const ecranRevelationRef = useRef(null);
  const badgeRevelationRef = useRef(null);
  const texteRevelationRef = useRef(null);
  const drapeauRevelationRef = useRef(null);
  const nomRevelationRef = useRef(null);
  const ligneRevelationRef = useRef(null);
  const descriptionRevelationRef = useRef(null);
  const boutonRevelationRef = useRef(null);
  const confettisRevelationRef = useRef(null);
  const animationsRevelation = useRef([]);

  const confettis = useMemo(() => {
    return Array.from({ length: 90 }, (_, index) => ({
      id: index,
      gauche: Math.random() * 100,
      delai: Math.random() * 1.8,
      duree: 3.2 + Math.random() * 3,
      largeur: 5 + Math.random() * 7,
      hauteur: 9 + Math.random() * 12,
      rotation: Math.random() * 360,
      derive: -70 + Math.random() * 140,
      couleur:
        couleursConfettis[
          Math.floor(
            Math.random() * couleursConfettis.length
          )
        ],
      forme: Math.random() > 0.72 ? "50%" : "2px",
    }));
  }, []);

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

      if (minuterieRevelation.current) {
        window.clearTimeout(
          minuterieRevelation.current
        );
      }
    };
  }, []);

  function demarrerAnimationsRevelation() {
    animationsRevelation.current.forEach((animation) => {
      try {
        animation.cancel();
      } catch {
        // Animation déjà terminée.
      }
    });

    animationsRevelation.current = [];

    function animer(element, images, options) {
      if (!element || typeof element.animate !== "function") {
        return;
      }

      const animation = element.animate(images, {
        fill: "both",
        ...options,
      });

      animationsRevelation.current.push(animation);
    }

    animer(
      ecranRevelationRef.current,
      [
        { opacity: 0, transform: "scale(1.08)" },
        { opacity: 1, transform: "scale(1)" },
      ],
      { duration: 650, easing: "ease-out" }
    );

    animer(
      badgeRevelationRef.current,
      [
        { opacity: 0, transform: "translateY(-22px) scale(0.82)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      { duration: 650, delay: 180, easing: "cubic-bezier(.2,.9,.25,1.15)" }
    );

    animer(
      texteRevelationRef.current,
      [
        { opacity: 0, transform: "translateY(24px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 700, delay: 480, easing: "ease-out" }
    );

    animer(
      drapeauRevelationRef.current,
      [
        { opacity: 0, transform: "scale(0.05) rotate(-24deg)" },
        { opacity: 1, transform: "scale(1.28) rotate(7deg)", offset: 0.52 },
        { opacity: 1, transform: "scale(0.88) rotate(-4deg)", offset: 0.72 },
        { opacity: 1, transform: "scale(1.09) rotate(2deg)", offset: 0.88 },
        { opacity: 1, transform: "scale(1) rotate(0deg)" },
      ],
      {
        duration: 1350,
        delay: 850,
        easing: "cubic-bezier(.16,1.15,.35,1)",
      }
    );

    animer(
      nomRevelationRef.current,
      [
        {
          opacity: 0,
          transform: "translateY(35px) scale(0.68)",
          letterSpacing: "0.22em",
        },
        {
          opacity: 1,
          transform: "translateY(0) scale(1)",
          letterSpacing: "0.025em",
        },
      ],
      {
        duration: 800,
        delay: 1450,
        easing: "cubic-bezier(.2,.9,.3,1.18)",
      }
    );

    animer(
      ligneRevelationRef.current,
      [
        { opacity: 0, transform: "scaleX(0)" },
        { opacity: 1, transform: "scaleX(1)" },
      ],
      { duration: 650, delay: 1750, easing: "ease-out" }
    );

    animer(
      descriptionRevelationRef.current,
      [
        { opacity: 0, transform: "translateY(20px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 700, delay: 1900, easing: "ease-out" }
    );

    animer(
      boutonRevelationRef.current,
      [
        { opacity: 0, transform: "translateY(28px) scale(0.9)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      {
        duration: 700,
        delay: 2200,
        easing: "cubic-bezier(.2,.9,.3,1.12)",
      }
    );

    const confettisElements =
      confettisRevelationRef.current?.querySelectorAll(
        "[data-confetti-revelation]"
      ) ?? [];

    confettisElements.forEach((element, index) => {
      const derive = Number(element.dataset.derive || 0);
      const rotation = Number(element.dataset.rotation || 0);
      const duree = Number(element.dataset.duree || 4200);
      const delai = Number(element.dataset.delai || 0);

      animer(
        element,
        [
          {
            opacity: 0,
            transform: `translate3d(0, -50px, 0) rotate(${rotation}deg)`,
          },
          { opacity: 1, offset: 0.08 },
          {
            opacity: 0.95,
            transform: `translate3d(${derive}px, 115vh, 0) rotate(${
              rotation + 900 + index * 4
            }deg)`,
          },
        ],
        {
          duration: duree,
          delay: delai,
          easing: "cubic-bezier(.2,.65,.35,1)",
          iterations: Infinity,
        }
      );
    });

    if (navigator.vibrate) {
      navigator.vibrate([90, 55, 140]);
    }
  }

  useEffect(() => {
    if (!equipeRevelee) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    const lancerAnimation = window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          demarrerAnimationsRevelation();
        });
      });
    }, 80);

    if (sonsActifs) {
      jouerApplaudissements();
    }

    if (minuterieRevelation.current) {
      window.clearTimeout(
        minuterieRevelation.current
      );
    }

    minuterieRevelation.current =
  window.setTimeout(() => {
    fermerRevelationEquipe();
  }, 10000);

    return () => {
      document.body.style.overflow = "";
      window.clearTimeout(lancerAnimation);

      animationsRevelation.current.forEach((animation) => {
        try {
          animation.cancel();
        } catch {
          // Animation déjà terminée.
        }
      });

      animationsRevelation.current = [];

      if (minuterieRevelation.current) {
        window.clearTimeout(
          minuterieRevelation.current
        );
      }
    };
  }, [equipeRevelee]);

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

    detecterAttributionEquipe(
      Number(playerId),
      profil,
      nouveauxJoueurs,
      nouvellesEquipes
    );

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

  function detecterAttributionEquipe(
    playerId,
    profil,
    nouveauxJoueurs,
    nouvellesEquipes
  ) {
    const joueurActuel =
      nouveauxJoueurs.find(
        (element) =>
          Number(element.id) === Number(playerId)
      ) ?? profil;

    const equipeId = joueurActuel?.team_id
      ? Number(joueurActuel.team_id)
      : null;

    const cleMemoire =
      `olympiades_equipe_revelee_${playerId}`;

    if (!equipeId) {
      sessionStorage.removeItem(cleMemoire);
      return;
    }

    const equipeDejaVue = Number(
      sessionStorage.getItem(cleMemoire) || 0
    );

    if (equipeDejaVue === equipeId) {
      return;
    }

    const equipeAttribuee =
      nouvellesEquipes.find(
        (equipe) =>
          Number(equipe.id) === equipeId
      );

    if (!equipeAttribuee) {
      return;
    }

setEquipeRevelee({
  ...equipeAttribuee,
  cleMemoire,
});
  }

function fermerRevelationEquipe() {
  if (minuterieRevelation.current) {
    window.clearTimeout(minuterieRevelation.current);
  }

  if (equipeRevelee?.cleMemoire && equipeRevelee?.id) {
    sessionStorage.setItem(
      equipeRevelee.cleMemoire,
      String(equipeRevelee.id)
    );
  }

  setEquipeRevelee(null);
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
      idsDefisValidesConnus.current =
        new Set(
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

    const equipeGagnante =
      nouvellesEquipes.find(
        (equipe) =>
          Number(equipe.id) ===
          Number(
            nouveauDefi.winning_team_id ??
              gagnant?.team_id
          )
      );

    const concerneJoueur =
      Number(nouveauDefi.creator_id) ===
        playerId ||
      Number(nouveauDefi.opponent_id) ===
        playerId ||
      Number(nouveauDefi.witness_id) ===
        playerId;

    const joueurActuel =
      nouveauxJoueurs.find(
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
    setNotification(
      nouvelleNotification
    );

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

      const duree = 1.5;
      const nombreImpulsions = 32;

      for (
        let index = 0;
        index < nombreImpulsions;
        index += 1
      ) {
        const debut =
          contexte.currentTime +
          Math.random() * duree;

        const buffer =
          contexte.createBuffer(
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
          0.04 + Math.random() * 0.055,
          debut
        );

        gain.gain.exponentialRampToValueAtTime(
          0.001,
          debut + 0.08
        );

        source.connect(filtre);
        filtre.connect(gain);
        gain.connect(
          contexte.destination
        );

        source.start(debut);
        source.stop(debut + 0.09);
      }

      window.setTimeout(() => {
        contexte.close();
      }, 2200);
    } catch (audioError) {
      console.warn(
        "Le son n’a pas pu être joué.",
        audioError
      );
    }
  }

  function basculerSons() {
    const nouvelleValeur =
      !sonsActifs;

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
          b.scoreTotal -
          a.scoreTotal;

        if (difference !== 0) {
          return difference;
        }

        return (
          Number(a.sort_order ?? 0) -
          Number(b.sort_order ?? 0)
        );
      });
  }, [equipes, joueurs]);

  const monEquipe =
    classement.find(
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
      anciensPointsJoueur.current ===
      null
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
        window.clearTimeout(
          minuterie
        );
    }
  }, [pointsJoueur]);

  useEffect(() => {
    if (
      anciennesVictoires.current ===
      null
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
        window.clearTimeout(
          minuterie
        );
    }
  }, [victoires]);

  useEffect(() => {
    const scoreEquipe =
      monEquipe?.scoreTotal ?? null;

    if (scoreEquipe === null) {
      return;
    }

    if (
      anciensPointsEquipe.current ===
      null
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
        window.clearTimeout(
          minuterie
        );
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

  const defiEnAttente =
    mesDefis.find(
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
        fond:
          "rgba(148, 163, 184, 0.1)",
      };
    }

    if (defi.status === "pending") {
      return {
        texte: "En attente",
        couleur: "#fde047",
        fond:
          "rgba(250, 204, 21, 0.11)",
      };
    }

    if (
      Number(defi.winner_id) ===
      Number(joueur.id)
    ) {
      return {
        texte: "Gagné",
        couleur: "#4ade80",
        fond:
          "rgba(34, 197, 94, 0.11)",
      };
    }

    return {
      texte: "Terminé",
      couleur: "#cbd5e1",
      fond:
        "rgba(148, 163, 184, 0.1)",
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
      sessionStorage.getItem(
        "player_id"
      );

    const playerToken =
      sessionStorage.getItem(
        "player_token"
      );

    try {
      if (playerId && playerToken) {
        const { data, error } =
          await supabase.rpc(
            "logout_player",
            {
              p_player_id:
                Number(playerId),

              p_token: playerToken,
            }
          );

        if (error) {
          console.warn(
            "La session distante n’a pas pu être supprimée :",
            error
          );
        } else if (data !== true) {
          console.warn(
            "La session de ce téléphone avait déjà été supprimée ou remplacée."
          );
        }
      }
    } catch (erreurDeconnexion) {
      console.warn(
        "Erreur non bloquante pendant la déconnexion :",
        erreurDeconnexion
      );
    } finally {
      sessionStorage.removeItem(
        "player_id"
      );

      sessionStorage.removeItem(
        "player_token"
      );

      navigate("/", {
        replace: true,
      });
    }
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
        padding:
          "16px 14px 105px",
        color: couleurs.texte,

        background:
          "radial-gradient(circle at top, #17164f 0%, #080d20 38%, #020617 100%)",
      }}
    >
      {equipeRevelee && (
  <div
    className="revelation-ecran"
    role="dialog"
    aria-modal="true"
    aria-label="Révélation de ton équipe"
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 5000,
      display: "grid",
      placeItems: "center",
      padding: 24,
      overflow: "hidden",
      color: "#f8fafc",
      textAlign: "center",
      background:
        "radial-gradient(circle at center, #312e81 0%, #111047 40%, #020617 82%)",
    }}
  >
    {Array.from({ length: 40 }).map((_, index) => (
      <span
        key={index}
        className="revelation-confetti"
        style={{
          position: "absolute",
          top: -30,
          left: `${Math.random() * 100}%`,
          width: 8,
          height: 14,
          borderRadius: 2,
          background: [
            "#facc15",
            "#f97316",
            "#22c55e",
            "#3b82f6",
            "#a855f7",
            "#ec4899",
          ][index % 6],
          animationDuration: `${2.2 + Math.random() * 2}s`,
          animationDelay: `${Math.random() * 1.5}s`,
          "--derive-confetti": `${-120 + Math.random() * 240}px`,
        }}
      />
    ))}

    <section
      style={{
        position: "relative",
        zIndex: 2,
        width: "100%",
        maxWidth: 520,
      }}
    >
      <div
        className="revelation-badge"
        style={{
          display: "inline-block",
          padding: "7px 12px",
          borderRadius: 999,
          color: "#ddd6fe",
          background: "rgba(139, 92, 246, 0.18)",
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        Attribution terminée
      </div>

      <p
        className="revelation-texte"
        style={{
          margin: "20px 0 0",
          color: "#c4b5fd",
          fontSize: 15,
          fontWeight: 900,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        Vous faites partie de
      </p>

      <div
        className="revelation-drapeau"
        style={{
          marginTop: 18,
          fontSize: "clamp(120px, 35vw, 210px)",
          lineHeight: 1,
          filter:
            "drop-shadow(0 18px 35px rgba(0, 0, 0, 0.45))",
        }}
      >
        {equipeRevelee.flag}
      </div>

      <h1
        className="revelation-nom"
        style={{
          margin: "24px 0 0",
          fontSize: "clamp(36px, 10vw, 62px)",
          lineHeight: 1,
          textTransform: "uppercase",
          textShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
        }}
      >
        {equipeRevelee.name}
      </h1>

      <p
        className="revelation-description"
        style={{
          margin: "15px 0 0",
          color: "#cbd5e1",
          fontSize: 17,
        }}
      >
        Bienvenue dans ton équipe. Fais-la gagner !
      </p>

      <button
        type="button"
        className="revelation-bouton"
        onClick={fermerRevelationEquipe}
        style={{
          width: "100%",
          maxWidth: 360,
          marginTop: 30,
          padding: "15px 18px",
          border: "1px solid rgba(196, 181, 253, 0.45)",
          borderRadius: 14,
          color: "white",
          background:
            "linear-gradient(135deg, #7c3aed, #4f46e5)",
          boxShadow: "0 16px 40px rgba(76, 29, 149, 0.38)",
          fontSize: 16,
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        Découvrir mon équipe
      </button>
    </section>
  </div>
)}

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

          @keyframes ouvertureRevelation {
            0% {
              opacity: 0;
              transform: scale(1.08);
            }

            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes rotationRayons {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          @keyframes pulsationCercle {
            0%,
            100% {
              opacity: 0.3;
              transform: translate(-50%, -50%) scale(0.94);
            }

            50% {
              opacity: 0.65;
              transform: translate(-50%, -50%) scale(1.04);
            }
          }

          @keyframes pulsationCercleDeux {
            0%,
            100% {
              opacity: 0.25;
              transform: translate(-50%, -50%) scale(1.04);
            }

            50% {
              opacity: 0.7;
              transform: translate(-50%, -50%) scale(0.94);
            }
          }

          @keyframes chuteConfetti {
            0% {
              opacity: 0;
              transform: translate3d(0, -40px, 0) rotate(0deg);
            }

            8% {
              opacity: 1;
            }

            100% {
              opacity: 0.9;
              transform:
                translate3d(
                  var(--derive-confetti),
                  112vh,
                  0
                )
                rotate(900deg);
            }
          }

          @keyframes arriveeBadge {
            0% {
              opacity: 0;
              transform: translateY(-18px) scale(0.9);
            }

            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes arriveeTexte {
            0% {
              opacity: 0;
              transform: translateY(18px);
            }

            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes revelationDrapeau {
            0% {
              opacity: 0;
              transform: scale(0.05) rotate(-22deg);
            }

            52% {
              opacity: 1;
              transform: scale(1.18) rotate(5deg);
            }

            72% {
              transform: scale(0.93) rotate(-2deg);
            }

            88% {
              transform: scale(1.05) rotate(1deg);
            }

            100% {
              opacity: 1;
              transform: scale(1) rotate(0deg);
            }
          }

          @keyframes haloDrapeau {
            0%,
            100% {
              opacity: 0.45;
              transform: scale(0.88);
            }

            50% {
              opacity: 1;
              transform: scale(1.12);
            }
          }

          @keyframes revelationNom {
            0% {
              opacity: 0;
              transform: translateY(28px) scale(0.75);
              letter-spacing: 0.22em;
            }

            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
              letter-spacing: 0.025em;
            }
          }

          @keyframes agrandissementLigne {
            0% {
              opacity: 0;
              transform: scaleX(0);
            }

            100% {
              opacity: 1;
              transform: scaleX(1);
            }
          }

          @keyframes arriveeBouton {
            0% {
              opacity: 0;
              transform: translateY(25px) scale(0.94);
            }

            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes etoileBrillante {
            0%,
            100% {
              opacity: 0.25;
              transform: scale(0.55);
            }

            50% {
              opacity: 1;
              transform: scale(1.35);
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
                  color: couleurs.violet,
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

                    whiteSpace: "nowrap",
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

              letterSpacing:
                "0.06em",

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
          disabled={
            deconnexionEnCours
          }

          style={{
            width: "100%",
            marginTop: 13,
            padding: 11,

            border:
              "1px solid rgba(148, 163, 184, 0.16)",

            borderRadius: 11,

            color:
              couleurs.secondaire,

            background:
              "transparent",

            cursor:
              deconnexionEnCours
                ? "not-allowed"
                : "pointer",

            opacity:
              deconnexionEnCours
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