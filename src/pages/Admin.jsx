import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import BottomNav from "../components/BottomNav";

const couleurs = {
  fond: "#020617",
  fondCarte: "rgba(15, 23, 42, 0.9)",
  fondSecondaire: "rgba(30, 41, 59, 0.75)",
  bordure: "rgba(148, 163, 184, 0.2)",
  texte: "#f8fafc",
  texteSecondaire: "#aeb8cb",
  violet: "#8b5cf6",
  violetClair: "#c4b5fd",
  vert: "#4ade80",
  rouge: "#f87171",
  jaune: "#fde047",
};

const styleCarte = {
  padding: 18,
  border: `1px solid ${couleurs.bordure}`,
  borderRadius: 16,
  color: couleurs.texte,
  background: couleurs.fondCarte,
  boxShadow: "0 12px 30px rgba(0, 0, 0, 0.18)",
};

const styleChamp = {
  boxSizing: "border-box",
  width: "100%",
  minWidth: 0,
  padding: "12px 13px",
  border: `1px solid ${couleurs.bordure}`,
  borderRadius: 11,
  outline: "none",
  color: couleurs.texte,
  background: "#0f172a",
};

const styleBoutonPrincipal = {
  minHeight: 44,
  padding: "11px 15px",
  border: 0,
  borderRadius: 11,
  color: "white",
  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
  fontWeight: 800,
  cursor: "pointer",
};

const styleBoutonSecondaire = {
  minHeight: 42,
  padding: "10px 14px",
  border: `1px solid ${couleurs.bordure}`,
  borderRadius: 11,
  color: couleurs.texte,
  background: "rgba(30, 41, 59, 0.85)",
  fontWeight: 700,
  cursor: "pointer",
};

const styleBoutonDanger = {
  ...styleBoutonSecondaire,
  color: "#fecaca",
  border: "1px solid rgba(248, 113, 113, 0.28)",
  background: "rgba(127, 29, 29, 0.22)",
};

export default function Admin() {
  const [motDePasse, setMotDePasse] = useState("");
  const [tokenAdmin, setTokenAdmin] = useState(
    sessionStorage.getItem("admin_token") || ""
  );

  const [connexionEnCours, setConnexionEnCours] = useState(false);
  const [repartitionEnCours, setRepartitionEnCours] = useState(false);
  const [nombreEquipes, setNombreEquipes] = useState(6);
  const [defiEnCours, setDefiEnCours] = useState(null);
  const [affectationEnCours, setAffectationEnCours] = useState(null);
  const [pointsEnCours, setPointsEnCours] = useState(false);
  const [deplacementEnCours, setDeplacementEnCours] = useState(null);
  const [adminActionEnCours, setAdminActionEnCours] = useState(false);
  const [equipesChoisies, setEquipesChoisies] = useState({});
  const [joueurADeplacer, setJoueurADeplacer] = useState(null);
  const [nouvelleEquipeId, setNouvelleEquipeId] = useState("");

  const [etat, setEtat] = useState(null);
  const [message, setMessage] = useState("");

  const [joueurPointsId, setJoueurPointsId] = useState("");
  const [joueurPointsValeur, setJoueurPointsValeur] = useState("");
  const [joueurPointsRaison, setJoueurPointsRaison] = useState("");

  const [equipePointsId, setEquipePointsId] = useState("");
  const [equipePointsValeur, setEquipePointsValeur] = useState("");
  const [equipePointsRaison, setEquipePointsRaison] = useState("");

  useEffect(() => {
    if (tokenAdmin) {
      chargerEtat();
    }
  }, [tokenAdmin]);

  async function connecterAdmin() {
    if (!motDePasse) {
      alert("Entre le mot de passe administrateur.");
      return;
    }

    setConnexionEnCours(true);
    setMessage("");

    const { data, error } = await supabase.rpc("admin_login", {
      p_password: motDePasse,
    });

    setConnexionEnCours(false);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    if (!data?.token) {
      alert("Connexion administrateur impossible.");
      return;
    }

    sessionStorage.setItem("admin_token", data.token);
    setTokenAdmin(data.token);
    setMotDePasse("");
  }

  async function chargerEtat() {
    const { data, error } = await supabase.rpc("get_state");

    if (error) {
      console.error(error);
      setMessage("Impossible de charger les données.");
      return;
    }

    setEtat(data);
  }

  async function ajouterPointsJoueur() {
    const playerId = Number(joueurPointsId);
    const points = Number(joueurPointsValeur);
    const raison = joueurPointsRaison.trim();

    if (!playerId) {
      alert("Choisis un joueur.");
      return;
    }

    if (!Number.isInteger(points) || points === 0) {
      alert("Entre un nombre entier différent de zéro.");
      return;
    }

    if (!raison) {
      alert("Entre une raison.");
      return;
    }

    const joueur = trouverJoueur(playerId);

    const confirmation = window.confirm(
      `${points > 0 ? "Ajouter" : "Retirer"} ${Math.abs(points)} point${
        Math.abs(points) > 1 ? "s" : ""
      } à ${joueur ? afficherNomComplet(joueur) : "ce joueur"} ?`
    );

    if (!confirmation) return;

    setPointsEnCours(true);
    setMessage("");

    const { error } = await supabase.rpc("admin_add_player_points", {
      p_token: tokenAdmin,
      p_player: playerId,
      p_points: points,
      p_reason: raison,
    });

    setPointsEnCours(false);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setMessage(
      `${points > 0 ? "+" : ""}${points} point${
        Math.abs(points) > 1 ? "s" : ""
      } appliqué${Math.abs(points) > 1 ? "s" : ""} à ${
        joueur ? afficherNomComplet(joueur) : "ce joueur"
      }.`
    );

    setJoueurPointsId("");
    setJoueurPointsValeur("");
    setJoueurPointsRaison("");

    await chargerEtat();
  }

  async function ajouterPointsEquipe() {
    const teamId = Number(equipePointsId);
    const points = Number(equipePointsValeur);
    const raison = equipePointsRaison.trim();

    if (!teamId) {
      alert("Choisis une équipe.");
      return;
    }

    if (!Number.isInteger(points) || points === 0) {
      alert("Entre un nombre entier différent de zéro.");
      return;
    }

    if (!raison) {
      alert("Entre une raison.");
      return;
    }

    const equipe = equipes.find(
      (element) => Number(element.id) === teamId
    );

    const confirmation = window.confirm(
      `${points > 0 ? "Ajouter" : "Retirer"} ${Math.abs(points)} point${
        Math.abs(points) > 1 ? "s" : ""
      } à ${equipe ? `${equipe.flag} ${equipe.name}` : "cette équipe"} ?`
    );

    if (!confirmation) return;

    setPointsEnCours(true);
    setMessage("");

    const { error } = await supabase.rpc("admin_add_team_points", {
      p_token: tokenAdmin,
      p_team: teamId,
      p_points: points,
      p_reason: raison,
    });

    setPointsEnCours(false);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setMessage(
      `${points > 0 ? "+" : ""}${points} point${
        Math.abs(points) > 1 ? "s" : ""
      } appliqué${Math.abs(points) > 1 ? "s" : ""} à ${
        equipe ? `${equipe.flag} ${equipe.name}` : "l’équipe"
      }.`
    );

    setEquipePointsId("");
    setEquipePointsValeur("");
    setEquipePointsRaison("");

    await chargerEtat();
  }

  async function repartirEquipes() {
    const confirmation = window.confirm(
      "Lancer la répartition complète des joueurs ? Les anciennes équipes seront remplacées."
    );

    if (!confirmation) return;

    setRepartitionEnCours(true);
    setMessage("");

    const { error } = await supabase.rpc("admin_allocate", {
  p_token: tokenAdmin,
  p_team_count: Number(nombreEquipes),
});

    setRepartitionEnCours(false);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setMessage("Les équipes ont été réparties avec succès.");
    await chargerEtat();
  }

  async function affecterAleatoirement(joueur) {
    const confirmation = window.confirm(
      `Affecter automatiquement ${joueur.first_name} à l’une des équipes les moins nombreuses ?`
    );

    if (!confirmation) return;

    setAffectationEnCours(joueur.id);
    setMessage("");

    const { data, error } = await supabase.rpc(
      "admin_assign_player_random",
      {
        p_token: tokenAdmin,
        p_player: Number(joueur.id),
      }
    );

    setAffectationEnCours(null);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    const equipeAttribuee = equipes.find(
      (equipe) => Number(equipe.id) === Number(data)
    );

    setMessage(
      `${afficherNomComplet(joueur)} a été affecté automatiquement${
        equipeAttribuee
          ? ` à ${equipeAttribuee.flag} ${equipeAttribuee.name}`
          : ""
      }.`
    );

    supprimerEquipeChoisie(joueur.id);
    await chargerEtat();
  }

  async function affecterManuellement(joueur) {
    const equipeId = Number(equipesChoisies[joueur.id]);

    if (!equipeId) {
      alert("Choisis une équipe.");
      return;
    }

    const equipeChoisie = equipes.find(
      (equipe) => Number(equipe.id) === equipeId
    );

    const confirmation = window.confirm(
      `Affecter ${afficherNomComplet(joueur)} à ${
        equipeChoisie
          ? `${equipeChoisie.flag} ${equipeChoisie.name}`
          : "cette équipe"
      } ?`
    );

    if (!confirmation) return;

    setAffectationEnCours(joueur.id);
    setMessage("");

    const { error } = await supabase.rpc(
      "admin_assign_player_manual",
      {
        p_token: tokenAdmin,
        p_player: Number(joueur.id),
        p_team: equipeId,
      }
    );

    setAffectationEnCours(null);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setMessage(
      `${afficherNomComplet(joueur)} a été affecté à ${
        equipeChoisie
          ? `${equipeChoisie.flag} ${equipeChoisie.name}`
          : "l’équipe choisie"
      }.`
    );

    supprimerEquipeChoisie(joueur.id);
    await chargerEtat();
  }

  function ouvrirDeplacement(joueur) {
    setJoueurADeplacer(joueur);
    setNouvelleEquipeId("");
    setMessage("");
  }

  function fermerDeplacement() {
    setJoueurADeplacer(null);
    setNouvelleEquipeId("");
  }

  async function confirmerDeplacement() {
    if (!joueurADeplacer) return;

    const teamId = Number(nouvelleEquipeId);

    if (!teamId) {
      alert("Choisis une nouvelle équipe.");
      return;
    }

    if (Number(joueurADeplacer.team_id) === teamId) {
      alert("Le joueur appartient déjà à cette équipe.");
      return;
    }

    const nouvelleEquipe = equipes.find(
      (equipe) => Number(equipe.id) === teamId
    );

    const confirmation = window.confirm(
      `Déplacer ${afficherNomComplet(joueurADeplacer)} vers ${
        nouvelleEquipe
          ? `${nouvelleEquipe.flag} ${nouvelleEquipe.name}`
          : "cette équipe"
      } ?`
    );

    if (!confirmation) return;

    setDeplacementEnCours(joueurADeplacer.id);
    setMessage("");

    const { error } = await supabase.rpc("admin_move_player", {
      p_token: tokenAdmin,
      p_player: Number(joueurADeplacer.id),
      p_team: teamId,
    });

    setDeplacementEnCours(null);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setMessage(
      `${afficherNomComplet(joueurADeplacer)} a été déplacé vers ${
        nouvelleEquipe
          ? `${nouvelleEquipe.flag} ${nouvelleEquipe.name}`
          : "la nouvelle équipe"
      }.`
    );

    fermerDeplacement();
    await chargerEtat();
  }

  async function validerDefi(defi, gagnantId) {
    const gagnant = trouverJoueur(gagnantId);

    const confirmation = window.confirm(
      `Confirmer la victoire de ${gagnant?.first_name ?? "ce joueur"} ?`
    );

    if (!confirmation) return;

    setDefiEnCours(defi.id);
    setMessage("");

    const { error } = await supabase.rpc(
      "admin_resolve_individual",
      {
        p_token: tokenAdmin,
        p_challenge: Number(defi.id),
        p_winner: Number(gagnantId),
      }
    );

    setDefiEnCours(null);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setMessage(
      `Victoire de ${gagnant?.first_name ?? "joueur"} validée avec succès.`
    );

    await chargerEtat();
  }

  async function supprimerDefi(defi) {
    const confirmation = window.confirm(
      `Supprimer définitivement le défi « ${defi.name} » ?`
    );

    if (!confirmation) return;

    setDefiEnCours(defi.id);
    setMessage("");

    const { error } = await supabase.rpc(
      "admin_cancel_challenge",
      {
        p_token: tokenAdmin,
        p_challenge: Number(defi.id),
      }
    );

    setDefiEnCours(null);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setMessage("Le défi a été supprimé.");
    await chargerEtat();
  }
async function generer25Joueurs() {
  if (!window.confirm("Générer 25 joueurs de test ?")) return;

  setMessage("");

  const { error } = await supabase.rpc(
    "admin_generate_players",
    {
      p_token: tokenAdmin,
    }
  );

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  setMessage("25 joueurs générés.");
  chargerEtat();
}

async function remettreCompteursAZero() {
  if (
    !window.confirm(
      "Remettre tous les points, victoires et scores à zéro ?"
    )
  )
    return;

  setMessage("");

  const { error } = await supabase.rpc(
    "admin_reset_scores",
    {
      p_token: tokenAdmin,
    }
  );

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  setMessage("Tous les compteurs ont été remis à zéro.");
  chargerEtat();
}

async function supprimerTousLesJoueurs() {
  if (
    !window.confirm(
      "Supprimer TOUS les joueurs ?"
    )
  )
    return;

  setMessage("");

  const { error } = await supabase.rpc(
    "admin_delete_all_players",
    {
      p_token: tokenAdmin,
    }
  );

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  setMessage("Tous les joueurs ont été supprimés.");
  chargerEtat();
}

async function reinitialiserOlympiades() {
  if (
    !window.confirm(
      "Réinitialiser complètement les Olympiades ?"
    )
  )
    return;

  setMessage("");

  const { error } = await supabase.rpc(
    "admin_reset_olympiads",
    {
      p_token: tokenAdmin,
    }
  );

  if (error) {
  console.error(error);
  alert(error.message);
  return;
}

console.log("✅ RPC admin_reset_olympiads réussi");

setMessage("Olympiades réinitialisées.");
chargerEtat();
}

async function supprimerJoueur(joueur) {
  if (
    !window.confirm(
      `Supprimer ${afficherNomComplet(joueur)} ?`
    )
  )
    return;

  setMessage("");

  const { error } = await supabase.rpc(
    "admin_delete_player",
    {
      p_token: tokenAdmin,
      p_player: Number(joueur.id),
    }
  );

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  setMessage(
    `${afficherNomComplet(joueur)} supprimé.`
  );

  chargerEtat();
}
  function supprimerEquipeChoisie(joueurId) {
    setEquipesChoisies((anciennesEquipes) => {
      const copie = { ...anciennesEquipes };
      delete copie[joueurId];
      return copie;
    });
  }

  function seDeconnecterAdmin() {
    sessionStorage.removeItem("admin_token");
    setTokenAdmin("");
    setEtat(null);
    setMessage("");
  }

  const joueurs = etat?.players ?? [];
  const equipes = etat?.teams ?? [];
  const defis = etat?.challenges ?? [];

  const joueursSansEquipe = joueurs.filter(
    (joueur) => !joueur.team_id
  );

  const defisEnAttente = defis.filter(
    (defi) =>
      defi.type === "individual" &&
      defi.status === "pending"
  );

  const defisTermines = defis
    .filter(
      (defi) =>
        defi.type === "individual" &&
        defi.status === "validated"
    )
    .sort(
      (a, b) =>
        new Date(b.resolved_at ?? b.created_at) -
        new Date(a.resolved_at ?? a.created_at)
    );

  function trouverJoueur(id) {
    return joueurs.find(
      (joueur) => Number(joueur.id) === Number(id)
    );
  }

  function afficherNomComplet(joueur) {
    return joueur.nickname
      ? `${joueur.first_name} — ${joueur.nickname}`
      : joueur.first_name;
  }

  function afficherNomJoueur(id) {
    const joueur = trouverJoueur(id);

    return joueur
      ? afficherNomComplet(joueur)
      : "Joueur inconnu";
  }

  function afficherEquipeDuJoueur(id) {
    const joueur = trouverJoueur(id);

    if (!joueur?.team_id) return "Sans équipe";

    const equipe = equipes.find(
      (element) =>
        Number(element.id) === Number(joueur.team_id)
    );

    return equipe
      ? `${equipe.flag} ${equipe.name}`
      : "Équipe inconnue";
  }

  function nombreMembresEquipe(equipeId) {
    return joueurs.filter(
      (joueur) =>
        Number(joueur.team_id) === Number(equipeId)
    ).length;
  }

  if (!tokenAdmin) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: "24px 18px 105px",
          color: couleurs.texte,
          background:
            "radial-gradient(circle at top, #17164f 0%, #080d20 42%, #020617 100%)",
        }}
      >
        <section
          style={{
            ...styleCarte,
            maxWidth: 460,
            margin: "30px auto",
          }}
        >
          <p
            style={{
              margin: 0,
              color: couleurs.violetClair,
              fontSize: 13,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Olympiades 2026
          </p>

          <h1 style={{ margin: "10px 0 8px" }}>
            Administration 🔐
          </h1>

          <p style={{ color: couleurs.texteSecondaire }}>
            Entre le mot de passe administrateur.
          </p>

          <input
            type="password"
            value={motDePasse}
            onChange={(event) =>
              setMotDePasse(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                connecterAdmin();
              }
            }}
            placeholder="Mot de passe"
            style={{
              ...styleChamp,
              marginTop: 20,
            }}
          />

          <button
            type="button"
            onClick={connecterAdmin}
            disabled={connexionEnCours}
            style={{
              ...styleBoutonPrincipal,
              width: "100%",
              marginTop: 12,
              opacity: connexionEnCours ? 0.6 : 1,
            }}
          >
            {connexionEnCours
              ? "Connexion..."
              : "Se connecter"}
          </button>
        </section>

        <BottomNav />
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "22px 18px 115px",
        color: couleurs.texte,
        background:
          "radial-gradient(circle at top, #17164f 0%, #080d20 42%, #020617 100%)",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: couleurs.violet,
                fontSize: 13,
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
                fontSize: "clamp(30px, 8vw, 46px)",
              }}
            >
              Administration 🔐
            </h1>

            <p style={{ color: couleurs.texteSecondaire }}>
              Gère les joueurs, les défis, les équipes et les points.
            </p>
          </div>

          <button
            type="button"
            onClick={seDeconnecterAdmin}
            style={styleBoutonSecondaire}
          >
            Quitter le mode Admin
          </button>
        </header>

        {message && (
          <div
            style={{
              marginTop: 20,
              padding: 14,
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: 12,
              color: "#bbf7d0",
              background: "rgba(20, 83, 45, 0.25)",
            }}
          >
            ✅ {message}
          </div>
        )}
        <section style={{ marginTop: 34 }}>
  <h2>Administration avancée</h2>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit,minmax(240px,1fr))",
      gap: 14,
      marginTop: 15,
    }}
  >
    <button
      disabled={adminActionEnCours}
      onClick={generer25Joueurs}
      style={{
        ...styleBoutonPrincipal,
        width: "100%",
      }}
    >
      🎲 Générer 25 joueurs
    </button>

    <button
      disabled={adminActionEnCours}
      onClick={remettreCompteursAZero}
      style={{
        ...styleBoutonSecondaire,
        width: "100%",
      }}
    >
      🔄 Remettre les compteurs à 0
    </button>

    <button
      disabled={adminActionEnCours}
      onClick={supprimerTousLesJoueurs}
      style={{
        ...styleBoutonDanger,
        width: "100%",
      }}
    >
      🗑 Supprimer tous les joueurs
    </button>

    <button
      disabled={adminActionEnCours}
      onClick={reinitialiserOlympiades}
      style={{
        ...styleBoutonDanger,
        width: "100%",
      }}
    >
      ♻ Réinitialiser Olympiades
    </button>
  </div>
</section>
        <section style={{ marginTop: 34 }}>
          <h2>Gestion manuelle des points</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(270px, 1fr))",
              gap: 16,
              marginTop: 16,
            }}
          >
            <article style={styleCarte}>
              <h3 style={{ marginTop: 0 }}>
                👤 Points joueur
              </h3>

              <select
                value={joueurPointsId}
                onChange={(event) =>
                  setJoueurPointsId(event.target.value)
                }
                disabled={pointsEnCours}
                style={styleChamp}
              >
                <option value="">Choisir un joueur</option>

                {joueurs.map((joueur) => (
                  <option key={joueur.id} value={joueur.id}>
                    {afficherNomComplet(joueur)} —{" "}
                    {Number(joueur.points ?? 0)} points
                  </option>
                ))}
              </select>

              <input
                type="text"
                inputMode="text"
                value={joueurPointsValeur}
                onChange={(event) => {
                  const valeur = event.target.value;

                  if (/^-?\d*$/.test(valeur)) {
                    setJoueurPointsValeur(valeur);
                  }
                }}
                placeholder="Points : 3 ou -2"
                disabled={pointsEnCours}
                style={{
                  ...styleChamp,
                  marginTop: 10,
                }}
              />

              <input
                type="text"
                value={joueurPointsRaison}
                onChange={(event) =>
                  setJoueurPointsRaison(event.target.value)
                }
                placeholder="Raison libre"
                disabled={pointsEnCours}
                style={{
                  ...styleChamp,
                  marginTop: 10,
                }}
              />

              <button
                type="button"
                onClick={ajouterPointsJoueur}
                disabled={pointsEnCours}
                style={{
                  ...styleBoutonPrincipal,
                  width: "100%",
                  marginTop: 12,
                }}
              >
                Valider les points du joueur
              </button>
            </article>

            <article style={styleCarte}>
              <h3 style={{ marginTop: 0 }}>
                🌍 Points équipe
              </h3>

              <select
                value={equipePointsId}
                onChange={(event) =>
                  setEquipePointsId(event.target.value)
                }
                disabled={pointsEnCours}
                style={styleChamp}
              >
                <option value="">Choisir une équipe</option>

                {equipes.map((equipe) => (
                  <option key={equipe.id} value={equipe.id}>
                    {equipe.flag} {equipe.name} —{" "}
                    {Number(equipe.score ?? 0)} points
                  </option>
                ))}
              </select>

              <input
                type="text"
                inputMode="text"
                value={equipePointsValeur}
                onChange={(event) => {
                  const valeur = event.target.value;

                  if (/^-?\d*$/.test(valeur)) {
                    setEquipePointsValeur(valeur);
                  }
                }}
                placeholder="Points : 5 ou -1"
                disabled={pointsEnCours}
                style={{
                  ...styleChamp,
                  marginTop: 10,
                }}
              />

              <input
                type="text"
                value={equipePointsRaison}
                onChange={(event) =>
                  setEquipePointsRaison(event.target.value)
                }
                placeholder="Raison libre"
                disabled={pointsEnCours}
                style={{
                  ...styleChamp,
                  marginTop: 10,
                }}
              />

              <button
                type="button"
                onClick={ajouterPointsEquipe}
                disabled={pointsEnCours}
                style={{
                  ...styleBoutonPrincipal,
                  width: "100%",
                  marginTop: 12,
                }}
              >
                Valider les points de l’équipe
              </button>
            </article>
          </div>
        </section>

        <section style={{ marginTop: 38 }}>
          <h2>Joueurs sans équipe</h2>

          {joueursSansEquipe.length === 0 ? (
            <div
              style={{
                ...styleCarte,
                marginTop: 15,
                color: couleurs.texteSecondaire,
              }}
            >
              Tous les joueurs sont déjà affectés à une équipe.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 14,
                marginTop: 15,
              }}
            >
              {joueursSansEquipe.map((joueur) => {
                const traitement =
                  affectationEnCours === joueur.id;

                const equipeChoisie =
                  equipesChoisies[joueur.id] ?? "";

                return (
                  <article key={joueur.id} style={styleCarte}>
                    <h3 style={{ marginTop: 0 }}>
                      {afficherNomComplet(joueur)}
                    </h3>

                    <p style={{ color: couleurs.texteSecondaire }}>
                      Niveau sportif :{" "}
                      <strong>{joueur.sport_level}/4</strong>
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        affecterAleatoirement(joueur)
                      }
                      disabled={traitement}
                      style={{
                        ...styleBoutonSecondaire,
                        width: "100%",
                        marginTop: 14,
                      }}
                    >
                      🎲 Affecter automatiquement
                    </button>

                    <select
                      value={equipeChoisie}
                      onChange={(event) =>
                        setEquipesChoisies(
                          (anciennesEquipes) => ({
                            ...anciennesEquipes,
                            [joueur.id]: event.target.value,
                          })
                        )
                      }
                      disabled={traitement}
                      style={{
                        ...styleChamp,
                        marginTop: 10,
                      }}
                    >
                      <option value="">Choisir une équipe</option>

                      {equipes.map((equipe) => {
                        const nombreMembres =
                          nombreMembresEquipe(equipe.id);

                        return (
                          <option
                            key={equipe.id}
                            value={equipe.id}
                          >
                            {equipe.flag} {equipe.name} —{" "}
                            {nombreMembres} joueur
                            {nombreMembres > 1 ? "s" : ""}
                          </option>
                        );
                      })}
                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        affecterManuellement(joueur)
                      }
                      disabled={traitement || !equipeChoisie}
                      style={{
                        ...styleBoutonPrincipal,
                        width: "100%",
                        marginTop: 10,
                      }}
                    >
                      Affecter manuellement
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section style={{ marginTop: 38 }}>
          <h2>Défis à valider</h2>

          {defisEnAttente.length === 0 ? (
            <div
              style={{
                ...styleCarte,
                marginTop: 15,
                color: couleurs.texteSecondaire,
              }}
            >
              Aucun défi en attente.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 14,
                marginTop: 15,
              }}
            >
              {defisEnAttente.map((defi) => {
                const traitement =
                  defiEnCours === defi.id;

                return (
                  <article key={defi.id} style={styleCarte}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 23,
                      }}
                    >
                      ⚔️ {defi.name}
                    </h3>

                    <div
                      style={{
                        display: "grid",
                        gap: 10,
                        marginTop: 16,
                      }}
                    >
                      <div
                        style={{
                          padding: 13,
                          borderRadius: 12,
                          background: couleurs.fondSecondaire,
                        }}
                      >
                        <strong>
                          {afficherNomJoueur(defi.creator_id)}
                        </strong>

                        <div
                          style={{
                            marginTop: 4,
                            color: couleurs.texteSecondaire,
                          }}
                        >
                          {afficherEquipeDuJoueur(
                            defi.creator_id
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          textAlign: "center",
                          color: couleurs.violetClair,
                          fontWeight: 900,
                        }}
                      >
                        CONTRE
                      </div>

                      <div
                        style={{
                          padding: 13,
                          borderRadius: 12,
                          background: couleurs.fondSecondaire,
                        }}
                      >
                        <strong>
                          {afficherNomJoueur(defi.opponent_id)}
                        </strong>

                        <div
                          style={{
                            marginTop: 4,
                            color: couleurs.texteSecondaire,
                          }}
                        >
                          {afficherEquipeDuJoueur(
                            defi.opponent_id
                          )}
                        </div>
                      </div>
                    </div>

                    <p
                      style={{
                        marginTop: 14,
                        color: couleurs.texteSecondaire,
                      }}
                    >
                      Témoin :{" "}
                      <strong>
                        {afficherNomJoueur(defi.witness_id)}
                      </strong>
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gap: 9,
                        marginTop: 16,
                      }}
                    >
                      <button
                        type="button"
                        disabled={traitement}
                        onClick={() =>
                          validerDefi(defi, defi.creator_id)
                        }
                        style={styleBoutonPrincipal}
                      >
                        🏆 Victoire{" "}
                        {afficherNomJoueur(defi.creator_id)}
                      </button>

                      <button
                        type="button"
                        disabled={traitement}
                        onClick={() =>
                          validerDefi(defi, defi.opponent_id)
                        }
                        style={styleBoutonPrincipal}
                      >
                        🏆 Victoire{" "}
                        {afficherNomJoueur(defi.opponent_id)}
                      </button>

                      <button
                        type="button"
                        disabled={traitement}
                        onClick={() => supprimerDefi(defi)}
                        style={styleBoutonDanger}
                      >
                        🗑️ Supprimer le défi
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section style={{ marginTop: 38 }}>
          <h2>Défis terminés</h2>

          {defisTermines.length === 0 ? (
            <div
              style={{
                ...styleCarte,
                marginTop: 15,
                color: couleurs.texteSecondaire,
              }}
            >
              Aucun défi terminé.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 14,
                marginTop: 15,
              }}
            >
              {defisTermines.map((defi) => (
                <article key={defi.id} style={styleCarte}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 21,
                      }}
                    >
                      {defi.name}
                    </h3>

                    <span
                      style={{
                        padding: "6px 9px",
                        borderRadius: 999,
                        color: "#bbf7d0",
                        background: "rgba(34, 197, 94, 0.14)",
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      Terminé
                    </span>
                  </div>

                  <p
                    style={{
                      marginTop: 12,
                      color: couleurs.texteSecondaire,
                    }}
                  >
                    {afficherNomJoueur(defi.creator_id)}
                    {" contre "}
                    {afficherNomJoueur(defi.opponent_id)}
                  </p>

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
                    <strong>
                      {afficherNomJoueur(defi.winner_id)}
                    </strong>

                    <div style={{ marginTop: 5 }}>
                      {afficherEquipeDuJoueur(defi.winner_id)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section style={{ marginTop: 38 }}>
  <h2>Répartition complète</h2>

  <article
    style={{
      ...styleCarte,
      marginTop: 15,
    }}
  >
    <p>
      Joueurs inscrits :{" "}
      <strong>{joueurs.length}</strong>
    </p>

    <p style={{ marginTop: 7 }}>
      Joueurs sans équipe :{" "}
      <strong>{joueursSansEquipe.length}</strong>
    </p>

    <label
      style={{
        display: "block",
        marginTop: 18,
        fontWeight: 800,
      }}
    >
      Nombre d’équipes

      <select
        value={nombreEquipes}
        onChange={(event) =>
          setNombreEquipes(Number(event.target.value))
        }
        disabled={repartitionEnCours}
        style={{
          ...styleChamp,
          marginTop: 8,
        }}
      >
        <option value={4}>
          4 équipes
        </option>

        <option value={5}>
          5 équipes
        </option>

        <option value={6}>
          6 équipes
        </option>
      </select>
    </label>

    <p
      style={{
        marginTop: 10,
        color: couleurs.texteSecondaire,
        fontSize: 13,
      }}
    >
      {joueurs.length > 0
        ? `${joueurs.length} joueurs → environ ${Math.floor(
            joueurs.length / nombreEquipes
          )} à ${Math.ceil(
            joueurs.length / nombreEquipes
          )} joueurs par équipe.`
        : "Inscris des joueurs avant de lancer la répartition."}
    </p>

    <button
      type="button"
      onClick={repartirEquipes}
      disabled={
        repartitionEnCours ||
        joueurs.length === 0
      }
      style={{
        ...styleBoutonDanger,
        width: "100%",
        marginTop: 15,
      }}
    >
      {repartitionEnCours
        ? "Répartition en cours..."
        : `Répartir en ${nombreEquipes} équipes`}
    </button>

    <p
      style={{
        marginTop: 12,
        color: "#fca5a5",
        fontSize: 13,
      }}
    >
      Attention : ce bouton remplace les équipes
      actuelles de tous les joueurs.
    </p>
  </article>
</section>

        <section style={{ marginTop: 38 }}>
          <h2>Composition actuelle</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
              marginTop: 15,
            }}
          >
            {equipes
  .slice(0, nombreEquipes)
  .map((equipe) => {
              const membres = joueurs.filter(
                (joueur) =>
                  Number(joueur.team_id) ===
                  Number(equipe.id)
              );

              const niveauTotal = membres.reduce(
                (total, joueur) =>
                  total +
                  Number(joueur.sport_level ?? 0),
                0
              );

              return (
                <article key={equipe.id} style={styleCarte}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 22,
                      }}
                    >
                      {equipe.flag} {equipe.name}
                    </h3>

                    <strong>{equipe.score ?? 0} pts</strong>
                  </div>

                  <p
                    style={{
                      marginTop: 9,
                      color: couleurs.texteSecondaire,
                    }}
                  >
                    {membres.length} joueur
                    {membres.length > 1 ? "s" : ""}
                    {" · "}
                    Niveau total : {niveauTotal}
                  </p>

                  {membres.length === 0 ? (
                    <p
                      style={{
                        marginTop: 14,
                        color: couleurs.texteSecondaire,
                      }}
                    >
                      Aucun joueur
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gap: 9,
                        marginTop: 14,
                      }}
                    >
                      {membres.map((joueur) => (
                        <div
                          key={joueur.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 10,
                            padding: 12,
                            border: `1px solid ${couleurs.bordure}`,
                            borderRadius: 12,
                            background: couleurs.fondSecondaire,
                          }}
                        >
                          <div>
                            <strong>
                              {afficherNomComplet(joueur)}
                            </strong>

                            <div
                              style={{
                                marginTop: 4,
                                color: couleurs.texteSecondaire,
                                fontSize: 13,
                              }}
                            >
                              Niveau {joueur.sport_level}
                              {joueur.is_captain
                                ? " · 👑 Chef"
                                : ""}
                            </div>
                          </div>

                       <div
  style={{
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  }}
>
  <button
    type="button"
    onClick={() =>
      ouvrirDeplacement(joueur)
    }
    style={styleBoutonSecondaire}
  >
    🔄 Déplacer
  </button>

  <button
    type="button"
    onClick={() =>
      supprimerJoueur(joueur)
    }
    style={styleBoutonDanger}
  >
    🗑
  </button>
</div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>

      {joueurADeplacer && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={fermerDeplacement}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1500,
            display: "grid",
            placeItems: "center",
            padding: 18,
            background: "rgba(0, 0, 0, 0.72)",
          }}
        >
          <section
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              ...styleCarte,
              width: "100%",
              maxWidth: 460,
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              Déplacer{" "}
              {afficherNomComplet(joueurADeplacer)}
            </h2>

            <p style={{ color: couleurs.texteSecondaire }}>
              Équipe actuelle :{" "}
              <strong>
                {afficherEquipeDuJoueur(
                  joueurADeplacer.id
                )}
              </strong>
            </p>

            <label
              style={{
                display: "block",
                marginTop: 18,
                fontWeight: 800,
              }}
            >
              Nouvelle équipe

              <select
                value={nouvelleEquipeId}
                onChange={(event) =>
                  setNouvelleEquipeId(event.target.value)
                }
                disabled={
                  deplacementEnCours ===
                  joueurADeplacer.id
                }
                style={{
                  ...styleChamp,
                  marginTop: 8,
                }}
              >
                <option value="">
                  Choisir une équipe
                </option>

                {equipes
                  .filter(
                    (equipe) =>
                      Number(equipe.id) !==
                      Number(joueurADeplacer.team_id)
                  )
                  .map((equipe) => (
                    <option
                      key={equipe.id}
                      value={equipe.id}
                    >
                      {equipe.flag} {equipe.name} —{" "}
                      {nombreMembresEquipe(equipe.id)} joueur
                      {nombreMembresEquipe(equipe.id) > 1
                        ? "s"
                        : ""}
                    </option>
                  ))}
              </select>
            </label>

            <div
              style={{
                display: "grid",
                gap: 9,
                marginTop: 16,
              }}
            >
              <button
                type="button"
                onClick={confirmerDeplacement}
                disabled={
                  !nouvelleEquipeId ||
                  deplacementEnCours ===
                    joueurADeplacer.id
                }
                style={styleBoutonPrincipal}
              >
                {deplacementEnCours ===
                joueurADeplacer.id
                  ? "Déplacement..."
                  : "Confirmer le déplacement"}
              </button>

              <button
                type="button"
                onClick={fermerDeplacement}
                disabled={
                  deplacementEnCours ===
                  joueurADeplacer.id
                }
                style={styleBoutonSecondaire}
              >
                Annuler
              </button>
            </div>
          </section>
        </div>
      )}

      <BottomNav />
    </main>
  );
}