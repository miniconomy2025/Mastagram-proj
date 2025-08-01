import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Heart,
  MessageCircle,
  UserPlus,
  AtSign,
  Dot
} from 'lucide-react';
import './Notifications.css';

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
        return <Heart className="notification-icon like" />;
      case 'comment':
        return <MessageCircle className="notification-icon comment" />;
      case 'follow':
        return <UserPlus className="notification-icon follow" />;
      case 'mention':
        return <AtSign className="notification-icon mention" />;
      default:
        return <Dot className="notification-icon default" />;
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
    <div className="notifications-container">
      {/* Header */}
      <div className="notifications-header">
        <div className="notifications-header-content">
          <Link to="/feed" className="notifications-header-back">
            <ArrowLeft style={{ width: '1.5rem', height: '1.5rem' }} />
          </Link>
          <h1 className="notifications-title">Notifications</h1>
          <button className="notifications-mark-read">
            Mark all read
          </button>
        </div>
      </div>

      <div className="notifications-main">
        {/* Tabs */}
        <div className="notifications-tabs">
          <div className="notifications-tabs-list">
            <button 
              className="notifications-tabs-trigger" 
              data-state={activeTab === 'all' ? 'active' : ''}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button 
              className="notifications-tabs-trigger" 
              data-state={activeTab === 'unread' ? 'active' : ''}
              onClick={() => setActiveTab('unread')}
            >
              Unread
            </button>
            <button 
              className="notifications-tabs-trigger" 
              data-state={activeTab === 'like' ? 'active' : ''}
              onClick={() => setActiveTab('like')}
            >
              Likes
            </button>
            <button 
              className="notifications-tabs-trigger" 
              data-state={activeTab === 'comment' ? 'active' : ''}
              onClick={() => setActiveTab('comment')}
            >
              Comments
            </button>
          </div>

          <div className="notifications-content">
            {filteredNotifications.length === 0 ? (
              <div className="notifications-empty">
                <Heart className="notifications-empty-icon" />
                <h3 className="notifications-empty-title">
                  No notifications yet
                </h3>
                <p className="notifications-empty-description">
                  When people interact with your posts, you'll see it here
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-card ${!notification.read ? 'unread' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-content">
                    {/* User Avatar */}
                    <img
                      src={notification.user.avatar}
                      alt={notification.user.username}
                      className="notification-avatar"
                    />

                    {/* Content */}
                    <div className="notification-body">
                      <div className="notification-header">
                        {getNotificationIcon(notification.type)}
                        {!notification.read && (
                          <div className="notification-unread-dot" />
                        )}
                      </div>

                      <p className="notification-text">
                        <span className="notification-username">@{notification.user.username}</span>
                        {' '}
                        <span className="notification-action">
                          {getNotificationText(notification)}
                        </span>
                      </p>

                      {notification.content && (
                        <p className="notification-comment">
                          "{notification.content}"
                        </p>
                      )}

                      <p className="notification-timestamp">
                        {notification.timestamp}
                      </p>
                    </div>

                    {/* Post Thumbnail */}
                    {notification.post && (
                      <img
                        src={notification.post.image}
                        alt="Post"
                        className="notification-post-thumbnail"
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;