import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

export default function Register() {
  const navigate = useNavigate();

  const [prenom, setPrenom] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [niveau, setNiveau] = useState("2");
  const [chefEquipe, setChefEquipe] = useState(false);
  const [chargement, setChargement] = useState(false);

  async function inscrire() {
    if (!prenom.trim()) {
      alert("Entre ton prénom.");
      return;
    }

    if (motDePasse.length < 4) {
      alert("Le mot de passe doit contenir au moins 4 caractères.");
      return;
    }

    if (motDePasse !== confirmation) {
      alert("Les deux mots de passe ne sont pas identiques.");
      return;
    }

    setChargement(true);

    const { data, error } = await supabase.rpc("register_player", {
      p_first_name: prenom.trim(),
      p_nickname: pseudo.trim(),
      p_password: motDePasse,
      p_level: Number(niveau),
      p_wants_captain: chefEquipe,
    });

    setChargement(false);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    sessionStorage.setItem("player_id", String(data.player_id));
    sessionStorage.setItem("player_token", data.token);

    alert("Inscription réussie !");
    navigate("/tableau-de-bord");
  }

  return (
    <main style={{ maxWidth: 480, margin: "40px auto", padding: 20 }}>
      <h1>Inscription joueur</h1>

      <label>
        Prénom
        <input
          type="text"
          value={prenom}
          onChange={(event) => setPrenom(event.target.value)}
          style={{ display: "block", width: "100%", margin: "8px 0 16px" }}
        />
      </label>

      <label>
        Pseudo facultatif
        <input
          type="text"
          value={pseudo}
          onChange={(event) => setPseudo(event.target.value)}
          style={{ display: "block", width: "100%", margin: "8px 0 16px" }}
        />
      </label>

      <label>
        Mot de passe
        <input
          type="password"
          value={motDePasse}
          onChange={(event) => setMotDePasse(event.target.value)}
          style={{ display: "block", width: "100%", margin: "8px 0 16px" }}
        />
      </label>

      <label>
        Confirmer le mot de passe
        <input
          type="password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          style={{ display: "block", width: "100%", margin: "8px 0 16px" }}
        />
      </label>

      <label>
        Niveau sportif
        <select
          value={niveau}
          onChange={(event) => setNiveau(event.target.value)}
          style={{ display: "block", width: "100%", margin: "8px 0 16px" }}
        >
          <option value="1">1 — Peu sportif</option>
          <option value="2">2 — Moyen</option>
          <option value="3">3 — Sportif</option>
          <option value="4">4 — Très sportif</option>
        </select>
      </label>

      <label style={{ display: "block", marginBottom: 20 }}>
        <input
          type="checkbox"
          checked={chefEquipe}
          onChange={(event) => setChefEquipe(event.target.checked)}
        />
        {" "}Je veux bien être chef d’équipe
      </label>

      <button type="button" onClick={inscrire} disabled={chargement}>
        {chargement ? "Inscription..." : "S’inscrire"}
      </button>
    </main>
  );
}