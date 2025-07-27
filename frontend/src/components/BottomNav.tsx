import { NavLink } from 'react-router-dom';
import { Home, Search, Plus, Heart, User } from 'lucide-react';
import './BottomNav.css';

const navigation = [
  { name: 'Feed', href: '/feed', icon: Home },
  { name: 'Search', href: '/', icon: Search },
  { name: 'Create', href: '/create', icon: Plus },
  { name: 'Activity', href: '/notifications', icon: Heart },
  { name: 'Profile', href: '/profile', icon: User },
];

export const BottomNav = () => {
  return (
    <div className="bottom-nav">
      <div className="bottom-nav-container">
        <nav className="bottom-nav-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => 
                  `bottom-nav-link ${isActive ? 'active' : ''}`
                }
              >
                <Icon className="bottom-nav-icon" />
                <span className="bottom-nav-text">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};