import { ArrowLeft, Moon, Sun, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppData } from "../state/AppDataContext";
import { useAuth } from "../state/AuthContext";

interface HeaderProps {
  onBack?: () => void;
  showProfile?: boolean;
}

export function Header({ onBack, showProfile }: HeaderProps) {
  const { theme, setTheme } = useAppData();
  const { user } = useAuth();
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <header className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="rounded-md p-1.5 text-text-dim transition hover:text-text"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <Link to="/" className="font-mono text-xl font-extrabold tracking-tight text-text">
          DEVLE
        </Link>
      </div>
      <div className="flex items-center gap-1">
        {showProfile && user && (
          <Link
            to="/profile"
            aria-label="View profile"
            className="rounded-md p-2 text-text-dim transition hover:text-text"
          >
            <UserRound size={18} />
          </Link>
        )}
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          className="rounded-md p-2 text-text-dim transition hover:text-text"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
