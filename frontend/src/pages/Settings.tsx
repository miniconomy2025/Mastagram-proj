import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/api';
import { 
  ArrowLeft,
  User,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight
} from 'lucide-react';
import './Settings.css'; 

const Settings = () => {

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Edit Profile', href: '/profile/edit' },
        { icon: Shield, label: 'Privacy & Security', href: '/settings/privacy' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', href: '/settings/notifications' }
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', href: '/help' },
        { icon: LogOut, label: 'Sign Out', isDestructive: true }
      ]
    }
  ];

  return (
    <div className="settings-page-container">
      {/* Header */}
      <div className="header-sticky">
        <div className="header-content">
          <Link to="/profile">
            <ArrowLeft className="header-icon" />
          </Link>
          <h1 className="header-title">Settings</h1>
          <div className="spacer-div" /> {/* Spacer */}
        </div>
      </div>

      <div className="main-content">
        {settingsGroups.map((group, groupIndex) => (
          <Card key={groupIndex} className="settings-card">
            <CardHeader className="card-header-padding">
              <CardTitle className="card-title">{group.title}</CardTitle>
            </CardHeader>
            <CardContent className="card-content-padding">
              <div className="settings-group-list">
                {group.items.map((item, itemIndex) => {
                  const Icon = item.icon;

                  const content = (
                    <div className="settings-item-content">
                      <Icon className={`settings-icon ${
                        item.isDestructive ? 'icon-destructive' : 'icon-muted'
                      }`} />
                      <span className={`text-foreground-color ${
                        item.isDestructive ? 'text-destructive-color' : ''
                      }`}>
                        {item.label}
                      </span>
                      {!item.isDestructive && (
                        <ChevronRight className="chevron-icon" />
                      )}
                    </div>
                  );

                  if (item.href) {
                    return (
                      <Link key={itemIndex} to={item.href} className="settings-item-link">
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <button 
                      key={itemIndex} 
                      className="settings-item-button"
                      onClick={() => {
                        if (item.isDestructive) {
                          auth.logout();
                        }
                      }}
                    >
                      {content}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* App Info */}
        <div className="app-info-section">
          <p>Made with ❤️ by Mastagram Team</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
