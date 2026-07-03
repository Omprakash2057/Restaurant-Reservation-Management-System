import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Loading…</span>
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/reservations'} replace />;
  }

  return (
    <div className="hero">
      <div className="hero-content">
        <div className="hero-eyebrow">
          ✦ Reserve Your Table
        </div>

        <h1 className="hero-title">
          Dining made<br />
          <span className="highlight">effortlessly elegant</span>
        </h1>

        <p className="hero-desc">
          Book your perfect table in seconds. Choose your date, time, and party size —
          we'll handle the rest so you can focus on the experience.
        </p>

        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary" style={{ padding: '13px 32px', fontSize: '0.95rem' }}>
            Book a Table
          </Link>
          <Link to="/login" className="btn btn-secondary" style={{ padding: '13px 32px', fontSize: '0.95rem' }}>
            Sign In
          </Link>
        </div>

        <div className="hero-features">
          <div className="feature-card">
            <span className="feature-icon">📅</span>
            <div className="feature-title">Instant Availability</div>
            <div className="feature-desc">See which tables are free for your chosen date and time in real time.</div>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🎯</span>
            <div className="feature-title">No Double Bookings</div>
            <div className="feature-desc">Server-side conflict checks guarantee your reservation is always secure.</div>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🛡️</span>
            <div className="feature-title">Manage Anytime</div>
            <div className="feature-desc">View, track, or cancel your reservations from your personal dashboard.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
