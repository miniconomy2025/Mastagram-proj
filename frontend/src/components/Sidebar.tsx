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
} from 'lucide-react';
import './Sidebar.css';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Trending', href: '/trending', icon: TrendingUp },
  { name: 'Notifications', href: '/notifications', icon: Heart },
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
        <button className="create-post-button">
          <Plus className="create-post-icon" />
          Create Post
        </button>
      </div>

      {/* User Profile */}
      <div className="user-profile-container">
        <div className="user-profile-content">
          <div className="user-avatar">A</div>
          <div className="user-info">
            <p className="user-name">Alfred Malope</p>
            <p className="user-username">@king</p>
          </div>
        </div>
      </div>
    </div>
  );
};
