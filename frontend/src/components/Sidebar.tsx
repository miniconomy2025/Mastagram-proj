import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  Plus,
  Heart,
  User,
  Settings,
  TrendingUp,
  Bookmark,
  LogIn,
} from 'lucide-react';
import { auth } from '../lib/api';
import './Sidebar.css';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Saved', href: '/saved', icon: Bookmark },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="logo-container">
        <div className="logo-icon">
          <span className="logo-letter">M</span>
        </div>
        <h1 className="logo-text">Mastagram</h1>
      </div>

      {/* Navigation */}
      <nav className="nav-container">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="nav-icon" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Create Post Button */}
      <div className="create-post-container">
      <NavLink to="/create" className="create-post-button">
        <Plus className="create-post-icon" />
         Create Post
      </NavLink>
      </div>
      

      {/* User Profile */}
      <div className="user-profile-container">
        {auth.isAuthenticated() ? (
          <div className="user-profile-content">
            <div className="user-avatar">
              {auth.getUser()?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-info">
              <p className="user-name">{auth.getUser()?.name || 'Unknown User'}</p>
              <p className="user-username">@{auth.getUser()?.email?.split('@')[0] || 'user'}</p>
            </div>
          </div>
        ) : (
          <NavLink to="/login" className="login-prompt">
            <LogIn className="login-icon" />
            <div className="login-info">
              <p className="login-text">Sign in to Mastagram</p>
              <p className="login-subtext">Connect and share</p>
            </div>
          </NavLink>
        )}
      </div>
    </div>
  );
};
