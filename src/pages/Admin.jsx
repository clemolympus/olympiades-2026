import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import BottomNav from "../components/BottomNav";

export default function Admin() {
  const [motDePasse, setMotDePasse] = useState("");
  const [tokenAdmin, setTokenAdmin] = useState(
    sessionStorage.getItem("admin_token") || ""
  );

  const [connexionEnCours, setConnexionEnCours] = useState(false);
  const [repartitionEnCours, setRepartitionEnCours] = useState(false);
  const [defiEnCours, setDefiEnCours] = useState(null);
  const [affectationEnCours, setAffectationEnCours] = useState(null);
  const [pointsEnCours, setPointsEnCours] = useState(false);
  const [deplacementEnCours, setDeplacementEnCours] = useState(null);

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
    return joueur ? afficherNomComplet(joueur) : "Joueur inconnu";
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
          maxWidth: 480,
          margin: "40px auto",
          padding: "20px 20px 100px",
        }}
      >
        <h1>Administration</h1>
        <p>Entre le mot de passe administrateur.</p>

        <input
          type="password"
          value={motDePasse}
          onChange={(event) => setMotDePasse(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") connecterAdmin();
          }}
          placeholder="Mot de passe"
          style={{
            boxSizing: "border-box",
            display: "block",
            width: "100%",
            padding: 12,
            marginTop: 16,
            marginBottom: 16,
          }}
        />

        <button
          type="button"
          onClick={connecterAdmin}
          disabled={connexionEnCours}
        >
          {connexionEnCours ? "Connexion..." : "Se connecter"}
        </button>

        <BottomNav />
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "40px auto",
        padding: "20px 20px 100px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1>Administration</h1>
          <p>Mode administrateur actif.</p>
        </div>

        <button type="button" onClick={seDeconnecterAdmin}>
          Quitter le mode Admin
        </button>
      </div>

      {message && (
        <div
          style={{
            marginTop: 20,
            padding: 14,
            border: "1px solid #86efac",
            borderRadius: 10,
            background: "#dcfce7",
          }}
        >
          {message}
        </div>
      )}

      <section style={{ marginTop: 32 }}>
        <h2>Gestion manuelle des points</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            marginTop: 18,
          }}
        >
          <article
            style={{
              padding: 20,
              border: "1px solid #ddd",
              borderRadius: 14,
              background: "white",
            }}
          >
            <h3 style={{ marginTop: 0 }}>👤 Points joueur</h3>

            <select
              value={joueurPointsId}
              onChange={(event) => setJoueurPointsId(event.target.value)}
              disabled={pointsEnCours}
              style={{
                boxSizing: "border-box",
                width: "100%",
                padding: 11,
                marginBottom: 10,
              }}
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
              type="number"
              step="1"
              value={joueurPointsValeur}
              onChange={(event) =>
                setJoueurPointsValeur(event.target.value)
              }
              placeholder="Points : 3 ou -2"
              disabled={pointsEnCours}
              style={{
                boxSizing: "border-box",
                width: "100%",
                padding: 11,
                marginBottom: 10,
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
                boxSizing: "border-box",
                width: "100%",
                padding: 11,
                marginBottom: 12,
              }}
            />

            <button
              type="button"
              onClick={ajouterPointsJoueur}
              disabled={pointsEnCours}
            >
              Valider les points du joueur
            </button>
          </article>

          <article
            style={{
              padding: 20,
              border: "1px solid #ddd",
              borderRadius: 14,
              background: "white",
            }}
          >
            <h3 style={{ marginTop: 0 }}>🌍 Points équipe</h3>

            <select
              value={equipePointsId}
              onChange={(event) => setEquipePointsId(event.target.value)}
              disabled={pointsEnCours}
              style={{
                boxSizing: "border-box",
                width: "100%",
                padding: 11,
                marginBottom: 10,
              }}
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
              type="number"
              step="1"
              value={equipePointsValeur}
              onChange={(event) =>
                setEquipePointsValeur(event.target.value)
              }
              placeholder="Points : 5 ou -1"
              disabled={pointsEnCours}
              style={{
                boxSizing: "border-box",
                width: "100%",
                padding: 11,
                marginBottom: 10,
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
                boxSizing: "border-box",
                width: "100%",
                padding: 11,
                marginBottom: 12,
              }}
            />

            <button
              type="button"
              onClick={ajouterPointsEquipe}
              disabled={pointsEnCours}
            >
              Valider les points de l’équipe
            </button>
          </article>
        </div>
      </section>

      <section style={{ marginTop: 40 }}>
        <h2>Joueurs sans équipe</h2>

        {joueursSansEquipe.length === 0 ? (
          <p>Tous les joueurs sont déjà affectés à une équipe.</p>
        ) : (
          <div style={{ display: "grid", gap: 16, marginTop: 20 }}>
            {joueursSansEquipe.map((joueur) => {
              const traitement = affectationEnCours === joueur.id;
              const equipeChoisie = equipesChoisies[joueur.id] ?? "";

              return (
                <article
                  key={joueur.id}
                  style={{
                    padding: 20,
                    border: "1px solid #ddd",
                    borderRadius: 14,
                    background: "white",
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>
                    {afficherNomComplet(joueur)}
                  </h3>

                  <p>
                    Niveau sportif :{" "}
                    <strong>{joueur.sport_level}/4</strong>
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gap: 12,
                      marginTop: 18,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => affecterAleatoirement(joueur)}
                      disabled={traitement}
                    >
                      🎲 Affecter automatiquement
                    </button>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 10,
                      }}
                    >
                      <select
                        value={equipeChoisie}
                        onChange={(event) =>
                          setEquipesChoisies((anciennesEquipes) => ({
                            ...anciennesEquipes,
                            [joueur.id]: event.target.value,
                          }))
                        }
                        disabled={traitement}
                        style={{
                          boxSizing: "border-box",
                          flex: "1 1 230px",
                          minWidth: 0,
                          padding: 11,
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
                        onClick={() => affecterManuellement(joueur)}
                        disabled={traitement || !equipeChoisie}
                      >
                        Affecter manuellement
                      </button>
                    </div>
                  </div>

                  {traitement && <p>Affectation en cours...</p>}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section style={{ marginTop: 40 }}>
        <h2>Défis à valider</h2>

        {defisEnAttente.length === 0 ? (
          <p>Aucun défi en attente.</p>
        ) : (
          <div style={{ display: "grid", gap: 16, marginTop: 20 }}>
            {defisEnAttente.map((defi) => {
              const traitement = defiEnCours === defi.id;

              return (
                <article
                  key={defi.id}
                  style={{
                    padding: 20,
                    border: "1px solid #ddd",
                    borderRadius: 14,
                    background: "white",
                  }}
                >
                  <h3>{defi.name}</h3>

                  <p>
                    <strong>
                      {afficherNomJoueur(defi.creator_id)}
                    </strong>
                    {" — "}
                    {afficherEquipeDuJoueur(defi.creator_id)}
                  </p>

                  <p style={{ fontWeight: 700 }}>contre</p>

                  <p>
                    <strong>
                      {afficherNomJoueur(defi.opponent_id)}
                    </strong>
                    {" — "}
                    {afficherEquipeDuJoueur(defi.opponent_id)}
                  </p>

                  <p>
                    Témoin :{" "}
                    <strong>
                      {afficherNomJoueur(defi.witness_id)}
                    </strong>
                    {" — "}
                    {afficherEquipeDuJoueur(defi.witness_id)}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                      marginTop: 18,
                    }}
                  >
                    <button
                      type="button"
                      disabled={traitement}
                      onClick={() =>
                        validerDefi(defi, defi.creator_id)
                      }
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
                    >
                      🏆 Victoire{" "}
                      {afficherNomJoueur(defi.opponent_id)}
                    </button>

                    <button
                      type="button"
                      disabled={traitement}
                      onClick={() => supprimerDefi(defi)}
                    >
                      🗑️ Supprimer
                    </button>
                  </div>

                  {traitement && <p>Traitement en cours...</p>}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section style={{ marginTop: 40 }}>
        <h2>Défis terminés</h2>

        {defisTermines.length === 0 ? (
          <p>Aucun défi terminé.</p>
        ) : (
          <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
            {defisTermines.map((defi) => (
              <article
                key={defi.id}
                style={{
                  padding: 16,
                  border: "1px solid #ddd",
                  borderRadius: 12,
                  background: "white",
                }}
              >
                <strong>{defi.name}</strong>

                <p>
                  {afficherNomJoueur(defi.creator_id)} contre{" "}
                  {afficherNomJoueur(defi.opponent_id)}
                </p>

                <p>
                  Gagnant :{" "}
                  <strong>
                    🏆 {afficherNomJoueur(defi.winner_id)}
                  </strong>
                </p>

                <p>
                  Équipe gagnante :{" "}
                  {afficherEquipeDuJoueur(defi.winner_id)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: 40 }}>
        <h2>Répartition complète</h2>

        <p>Joueurs inscrits : {joueurs.length}</p>
        <p>Joueurs sans équipe : {joueursSansEquipe.length}</p>

        <button
          type="button"
          onClick={repartirEquipes}
          disabled={repartitionEnCours || joueurs.length === 0}
        >
          {repartitionEnCours
            ? "Répartition en cours..."
            : "Refaire toute la répartition"}
        </button>

        <p
          style={{
            marginTop: 10,
            fontSize: 13,
            color: "#666",
          }}
        >
          Attention : ce bouton remplace les équipes actuelles de
          tous les joueurs.
        </p>
      </section>

      <section style={{ marginTop: 40 }}>
        <h2>Composition actuelle</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginTop: 20,
          }}
        >
          {equipes.map((equipe) => {
            const membres = joueurs.filter(
              (joueur) =>
                Number(joueur.team_id) === Number(equipe.id)
            );

            const niveauTotal = membres.reduce(
              (total, joueur) =>
                total + Number(joueur.sport_level ?? 0),
              0
            );

            return (
              <article
                key={equipe.id}
                style={{
                  padding: 18,
                  border: "1px solid #ddd",
                  borderRadius: 12,
                  background: "white",
                }}
              >
                <h3>
                  {equipe.flag} {equipe.name}
                </h3>

                <p>
                  {membres.length} joueur
                  {membres.length > 1 ? "s" : ""}
                </p>

                <p>Niveau total : {niveauTotal}</p>

                {membres.length === 0 ? (
                  <p>Aucun joueur</p>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gap: 10,
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
                          gap: 10,
                          padding: 11,
                          border: "1px solid #e5e7eb",
                          borderRadius: 10,
                          background: "#f8fafc",
                        }}
                      >
                        <div>
                          <strong>
                            {afficherNomComplet(joueur)}
                          </strong>

                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 13,
                              color: "#666",
                            }}
                          >
                            Niveau {joueur.sport_level}
                            {joueur.is_captain
                              ? " — Chef d’équipe"
                              : ""}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => ouvrirDeplacement(joueur)}
                          disabled={
                            deplacementEnCours === joueur.id
                          }
                        >
                          🔄 Déplacer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {joueurADeplacer && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "grid",
            placeItems: "center",
            padding: 20,
            background: "rgba(0, 0, 0, 0.55)",
          }}
          onClick={fermerDeplacement}
        >
          <section
            style={{
              width: "100%",
              maxWidth: 460,
              padding: 22,
              borderRadius: 16,
              background: "white",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>
              Déplacer {afficherNomComplet(joueurADeplacer)}
            </h2>

            <p>
              Équipe actuelle :{" "}
              <strong>
                {afficherEquipeDuJoueur(joueurADeplacer.id)}
              </strong>
            </p>

            <label>
              Nouvelle équipe
              <select
                value={nouvelleEquipeId}
                onChange={(event) =>
                  setNouvelleEquipeId(event.target.value)
                }
                disabled={
                  deplacementEnCours === joueurADeplacer.id
                }
                style={{
                  boxSizing: "border-box",
                  display: "block",
                  width: "100%",
                  padding: 12,
                  marginTop: 8,
                  marginBottom: 16,
                }}
              >
                <option value="">Choisir une équipe</option>

                {equipes
                  .filter(
                    (equipe) =>
                      Number(equipe.id) !==
                      Number(joueurADeplacer.team_id)
                  )
                  .map((equipe) => (
                    <option key={equipe.id} value={equipe.id}>
                      {equipe.flag} {equipe.name} —{" "}
                      {nombreMembresEquipe(equipe.id)} joueur
                      {nombreMembresEquipe(equipe.id) > 1 ? "s" : ""}
                    </option>
                  ))}
              </select>
            </label>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={confirmerDeplacement}
                disabled={
                  !nouvelleEquipeId ||
                  deplacementEnCours === joueurADeplacer.id
                }
              >
                {deplacementEnCours === joueurADeplacer.id
                  ? "Déplacement..."
                  : "Confirmer le déplacement"}
              </button>

              <button
                type="button"
                onClick={fermerDeplacement}
                disabled={
                  deplacementEnCours === joueurADeplacer.id
                }
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