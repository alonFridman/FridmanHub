import { Navigate, Route, Routes, useLocation, Link } from "react-router-dom";
import { Today } from "./pages/Today";
import { Week } from "./pages/Week";
import { Setup } from "./pages/Setup";
import { useAuthContext } from "./context/AuthProvider";

const NavButton = ({ to, label }: { to: string; label: string }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`px-4 py-2 rounded-lg text-title font-semibold focus-visible:outline-highlight focus-visible:outline-2 ${
        active ? "bg-highlight text-black" : "bg-white/10 text-white"
      }`}
    >
      {label}
    </Link>
  );
};

const AuthGate = ({ children }: { children: JSX.Element }) => {
  const { user, loading, signIn } = useAuthContext();

  if (loading) {
    return <div className="p-10 text-center text-headline">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="tv-panel max-w-xl text-center">
          <h1 className="text-display font-bold mb-4">Family Portal</h1>
          <p className="text-body mb-6 text-white/80">
            Sign in with Google to view your family schedules.
          </p>
          <button className="tv-button" onClick={signIn}>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return children;
};

const Header = () => {
  const { signOutUser, user } = useAuthContext();
  return (
    <header className="flex items-center justify-between p-6">
      <div>
        <h1 className="text-display font-bold">Family Portal</h1>
        <p className="text-body text-white/80">Unified view for today and the week.</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-body text-white/90">{user?.displayName}</span>
        <button className="tv-button" onClick={signOutUser}>
          Sign out
        </button>
      </div>
    </header>
  );
};

const Navigation = () => (
  <nav className="flex gap-4 px-6 pb-6 flex-wrap">
    <NavButton to="/today" label="Today" />
    <NavButton to="/week" label="Week" />
    <NavButton to="/setup" label="Setup" />
  </nav>
);

function App() {
  return (
    <AuthGate>
      <div className="min-h-screen bg-primary text-white">
        <Header />
        <Navigation />
        <main className="px-6 pb-12">
          <Routes>
            <Route path="/today" element={<Today />} />
            <Route path="/week" element={<Week />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="*" element={<Navigate to="/today" replace />} />
          </Routes>
        </main>
      </div>
    </AuthGate>
  );
}

export default App;
