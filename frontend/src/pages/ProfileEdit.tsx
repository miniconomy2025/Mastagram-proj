import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Camera, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useApiMutation, useApiQuery } from '@/lib/api';
import { Label } from '@/components/ui/label';



const ProfileEdit = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    bio: '',
    avatar: null as File | null,
    avatarPreview: ''
  });

  // Types matching backend response
  type ProfileResponse = {
    username?: string;
    email?: string;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
  };

  type UpdateProfileResponse = {
    success: boolean;
    data?: ProfileResponse;
    error?: {
      message: string;
      code?: string;
      statusCode?: number;
      details?: string[];
    };
  };

  // Fetch user profile
  const { data: profile, isLoading: isProfileLoading } = useApiQuery<ProfileResponse>(
    ['profile'],
    '/profile'
  );

  // Initialize form with fetched profile
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        displayName: profile.displayName ?? '',
        username: profile.username ?? '',
        bio: profile.bio ?? '',
        avatar: null,
        avatarPreview: profile.avatarUrl ?? ''
      }));
    }
  }, [profile]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mutation for PATCH /profile
  const updateProfile = useApiMutation<UpdateProfileResponse, FormData>(
    'PATCH',
    '/profile',
    {
      onSuccess: (data) => {
        setIsLoading(false);
        toast({
          title: 'Profile updated',
          description: 'Your changes have been saved successfully.'
        });
        navigate('/profile');
      },
      onError: (error: Error) => {
        setIsLoading(false);
        toast({
          title: 'Update failed',
          description: error?.message || 'Could not update profile.'
        });
      }
    }
  );


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const form = new FormData();
    if (formData.username) form.append('username', formData.username);
    if (formData.displayName) form.append('displayName', formData.displayName);
    if (formData.bio) form.append('bio', formData.bio);
    if (formData.avatar) form.append('avatar', formData.avatar);
    updateProfile.mutate(form);
  };


  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        avatar: file,
        avatarPreview: URL.createObjectURL(file)
      }));
    }
  };

  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span>Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto flex items-center justify-between p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/profile')}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="font-heading font-bold text-xl text-foreground">
            Edit Profile
          </h1>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="animate-spin">↻</span>
            ) : (
              <Check className="w-6 h-6" />
            )}
          </Button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <img 
                src={formData.avatarPreview} 
                alt="Profile" 
                className="w-24 h-24 rounded-full border-2 border-primary object-cover"
              />
              <label 
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer"
              >
                <Camera className="w-4 h-4 text-white" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  ref={fileInputRef}
                />
              </label>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default ProfileEdit;