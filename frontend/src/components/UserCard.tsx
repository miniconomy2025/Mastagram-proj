import { UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  follower_count: number;
  following_count: number;
  created_at: string;
}

interface UserCardProps {
  user: User;
}

export const UserCard = ({ user }: UserCardProps) => {
  return (
    <div className="bg-card rounded-2xl shadow-card border border-border p-6 animate-slide-up">
      <div className="flex items-start space-x-4">
        <div className="relative">
          <img
            src={user.avatar_url}
            alt={user.username}
            className="w-16 h-16 rounded-full object-cover border-2 border-primary"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <Users className="w-3 h-3 text-primary-foreground" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-heading font-bold text-lg text-foreground truncate">
                {user.display_name}
              </h3>
              <p className="text-primary font-medium">@{user.username}</p>
            </div>
            
            <Button 
              size="sm" 
              className="bg-gradient-primary hover:opacity-90 transition-opacity shrink-0"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Follow
            </Button>
          </div>
          
          {user.bio && (
            <p className="text-muted-foreground mt-2 leading-relaxed line-clamp-2">
              {user.bio}
            </p>
          )}
          
          <div className="flex items-center space-x-4 mt-3">
            <div className="flex items-center space-x-1">
              <span className="font-bold text-foreground">{user.follower_count.toLocaleString()}</span>
              <span className="text-muted-foreground text-sm">followers</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="font-bold text-foreground">{user.following_count.toLocaleString()}</span>
              <span className="text-muted-foreground text-sm">following</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};