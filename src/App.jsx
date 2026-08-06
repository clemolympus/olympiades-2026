import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Players from "./pages/Players";
import Teams from "./pages/Teams";
import Challenges from "./pages/Challenges";
import Admin from "./pages/Admin";
import Ranking from "./pages/Ranking";

export default function App() {
  return (
    <Routes>
      <Route path="/classement" element={<Ranking />} />
      <Route path="/" element={<Home />} />
      <Route path="/inscription" element={<Register />} />
      <Route path="/connexion" element={<Login />} />
      <Route path="/tableau-de-bord" element={<Dashboard />} />
      <Route path="/joueurs" element={<Players />} />
      <Route path="/equipes" element={<Teams />} />
      <Route path="/defis" element={<Challenges />} />
      <Route path="/admin" element={<Admin />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}