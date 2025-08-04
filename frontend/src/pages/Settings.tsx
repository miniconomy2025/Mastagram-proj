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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto flex items-center justify-between p-4">
          <Link to="/profile">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </Link>
          <h1 className="font-heading font-bold text-xl text-foreground">Settings</h1>
          <div className="w-6" /> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {settingsGroups.map((group, groupIndex) => (
          <Card key={groupIndex} className="border-border shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-foreground">{group.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {group.items.map((item, itemIndex) => {
                  const Icon = item.icon;

                  const content = (
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-5 h-5 ${
                          item.isDestructive ? 'text-destructive' : 'text-muted-foreground'
                        }`} />
                        <span className={`text-foreground ${
                          item.isDestructive ? 'text-destructive' : ''
                        }`}>
                          {item.label}
                        </span>
                      </div>
                      {!item.isDestructive && (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  );

                  if (item.href) {
                    return (
                      <Link key={itemIndex} to={item.href}>
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <button 
                      key={itemIndex} 
                      className="w-full text-left"
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
        <div className="text-center text-muted-foreground text-sm space-y-1">
          <p>Made with ❤️ by Mastagram Team</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;