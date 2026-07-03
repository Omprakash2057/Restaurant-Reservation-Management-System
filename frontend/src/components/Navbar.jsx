import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <span className="brand-icon">🍽</span>
        TableVue
      </Link>

      <div className="nav-links">
        {user ? (
          <div className="nav-user">
            {user.role === 'admin' ? (
              <Link to="/admin">Admin Dashboard</Link>
            ) : (
              <Link to="/reservations">My Reservations</Link>
            )}
            <span className="nav-user-name">{user.name}</span>
            <span className={`badge ${user.role === 'admin' ? 'admin' : ''}`}>
              {user.role}
            </span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
