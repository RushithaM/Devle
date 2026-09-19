import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";
import { AuthScreen } from "./screens/AuthScreen";
import { GameScreen } from "./screens/GameScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { ProfileScreen } from "./screens/ProfileScreen";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthScreen />} />
      <Route path="/register" element={<AuthScreen />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/play/daily" element={<GameScreen mode="daily" />} />
        <Route path="/play/practice/:topic" element={<GameScreen mode="practice" />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/stats" element={<Navigate to="/profile" replace />} />
      </Route>
    </Routes>
  );
}
