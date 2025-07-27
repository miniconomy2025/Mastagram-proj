import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Heart,
  MessageCircle,
  UserPlus,
  AtSign,
  Dot
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  user: {
    username: string;
    avatar: string;
  };
  content?: string;
  post?: {
    id: string;
    image: string;
  };
  timestamp: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'like',
    user: {
      username: 'mike_creates',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50'
    },
    post: {
      id: '1',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100'
    },
    timestamp: '2m ago',
    read: false
  },
  {
    id: '2',
    type: 'comment',
    user: {
      username: 'mike_creates',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50'
    },
    content: 'Amazing shot! What camera did you use?',
    post: {
      id: '1',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100'
    },
    timestamp: '5m ago',
    read: false
  },
  {
    id: '3',
    type: 'follow',
    user: {
      username: 'alex_dev',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50'
    },
    timestamp: '1h ago',
    read: true
  },
  {
    id: '4',
    type: 'mention',
    user: {
      username: 'emma_design',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50'
    },
    content: 'Check out this amazing work by @johndoe!',
    timestamp: '3h ago',
    read: true
  }
];

const Notifications = () => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [activeTab, setActiveTab] = useState('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-heart fill-current" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-primary" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-accent" />;
      case 'mention':
        return <AtSign className="w-5 h-5 text-primary" />;
      default:
        return <Dot className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return 'commented on your post';
      case 'follow':
        return 'started following you';
      case 'mention':
        return 'mentioned you in a post';
      default:
        return '';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notif.read;
    return notif.type === activeTab;
  });

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto flex items-center justify-between p-4">
          <Link to="/feed">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </Link>
          <h1 className="font-heading font-bold text-xl text-foreground">Notifications</h1>
          <Button variant="ghost" size="sm" className="text-primary">
            Mark all read
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-background border-b border-border">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="like">Likes</TabsTrigger>
            <TabsTrigger value="comment">Comments</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <div className="p-4 space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                    No notifications yet
                  </h3>
                  <p className="text-muted-foreground">
                    When people interact with your posts, you'll see it here
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`p-4 border-border cursor-pointer transition-all hover:shadow-md ${
                      !notification.read ? 'bg-primary/5 border-primary/20' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* User Avatar */}
                      <img
                        src={notification.user.avatar}
                        alt={notification.user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {getNotificationIcon(notification.type)}
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>

                        <p className="text-foreground">
                          <span className="font-medium">@{notification.user.username}</span>
                          {' '}
                          <span className="text-muted-foreground">
                            {getNotificationText(notification)}
                          </span>
                        </p>

                        {notification.content && (
                          <p className="text-muted-foreground text-sm mt-1">
                            "{notification.content}"
                          </p>
                        )}

                        <p className="text-muted-foreground text-sm mt-1">
                          {notification.timestamp}
                        </p>
                      </div>

                      {/* Post Thumbnail */}
                      {notification.post && (
                        <img
                          src={notification.post.image}
                          alt="Post"
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Notifications;