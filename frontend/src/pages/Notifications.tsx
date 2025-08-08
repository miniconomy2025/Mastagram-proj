import { useState, useEffect } from 'react';
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

// The Notification interface should match the data structure from your backend
// The backend `NotificationController` defines this:
// type: 'like' | 'follow' | 'comment';
// targetId: string;
// userId: string;
// createdAt: Date;
interface BackendNotification {
  type: 'like' | 'comment' | 'follow';
  targetId: string; // Corresponds to postId for likes/comments, or userId for follows
  userId: string; // The user who performed the action
  createdAt: string;
}

// We'll map the backend data to this richer frontend interface
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


const Notifications = () => {
  // CHANGED: Initial state is now an empty array, populated by the SSE stream
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    // You would use an actual API endpoint here
    const eventSource = new EventSource('https://todo-secure-list.xyz/api/notifications/subscribe');

    eventSource.onopen = () => {
      console.log('SSE connection opened.');
    };

    eventSource.onmessage = (event) => {
      // In a real application, you would fetch full user and post data here
      // This is a simplified mock of how you might process the incoming data
      const newNotificationData: BackendNotification = JSON.parse(event.data);
      console.log('New notification received:', newNotificationData);
      
      const newNotification: Notification = {
        id: newNotificationData.targetId, // Use targetId for uniqueness
        type: newNotificationData.type,
        user: {
          username: newNotificationData.userId, // Map userId from backend
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50' // Placeholder avatar
        },
        content: newNotificationData.type === 'comment' ? 'A new comment' : undefined, // Placeholder content
        post: {
            id: newNotificationData.targetId,
            image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100' // Placeholder image
        },
        timestamp: 'Just now',
        read: false
      };
      
      setNotifications(prev => [newNotification, ...prev]);
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
    };

    // Cleanup function to close the SSE connection on component unmount
    return () => {
      eventSource.close();
      console.log('SSE connection closed.');
    };
  }, []);

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

  // NEW: Function to mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
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
          <button 
            className="notifications-mark-read"
            onClick={markAllAsRead} // NEW: onClick handler
          >
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