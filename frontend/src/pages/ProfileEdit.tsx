import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useApiMutation, useApiQuery } from '@/lib/api';
import { Label } from '@/components/ui/label';
import './ProfileEdit.css'; 

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
const ACCEPT_IMAGES = ALLOWED_IMAGE_MIME_TYPES.join(',');

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
    name?: string;            // fallback when backend sends `name`
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
        displayName: profile.displayName ?? profile.name ?? '',
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

  const DISPLAY_NAME_MAX = 32;
  const BIO_MAX = 160;


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'displayName') {
        return { ...prev, [name]: value.slice(0, DISPLAY_NAME_MAX) };
      }
      if (name === 'bio') {
        return { ...prev, [name]: value.slice(0, BIO_MAX) };
      }
      return { ...prev, [name]: value };
    });
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.avatar) {
      if (!ALLOWED_IMAGE_MIME_TYPES.includes(formData.avatar.type)) {
        toast({
          title: 'Unsupported image type',
          description: 'Allowed formats: JPEG, PNG, WEBP, GIF.',
        });
        return;
      }
      if (formData.avatar.size > MAX_FILE_SIZE) {
        toast({
          title: 'Image too large',
          description: 'Max file size is 5 MB.',
        });
        return;
      }
    }
    setIsLoading(true);
    const form = new FormData();
    if (formData.displayName) form.append('displayName', formData.displayName);
    if (formData.bio) form.append('bio', formData.bio);
    if (formData.avatar) form.append('avatar', formData.avatar);
    updateProfile.mutate(form);
  };


  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
        toast({
          title: 'Unsupported image type',
          description: 'Allowed formats: JPEG, PNG, WEBP, GIF.',
        });
        if (e.target) e.target.value = '';
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
          toast({
            title: 'Image too large',
            description: 'Max file size is 5 MB.',
          });
        if (e.target) e.target.value = '';
        return;
      }
      setFormData(prev => ({
        ...prev,
        avatar: file,
        avatarPreview: URL.createObjectURL(file)
      }));
    }
  };

  if (isProfileLoading) {
    return (
      <div className="loading-state-container">
        <span>Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="profile-edit-container">
      {/* Header */}
      <header className="header-sticky">
        <div className="header-content">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/profile')}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="header-title">
            Edit Profile
          </h1>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="spinner">↻</span>
            ) : (
              <Check className="w-6 h-6" />
            )}
          </Button>
        </div>
      </header>

      <main className="main-content">
        <form onSubmit={handleSubmit} className="form-section">
          {/* Avatar Section */}
          <div className="avatar-section">
            <div className="avatar-wrapper">
              <img 
                src={formData.avatarPreview} 
                alt="Profile" 
                className="avatar-image"
              />
              <label 
                htmlFor="avatar-upload"
                className="avatar-upload-label"
              >
                <Camera className="camera-icon" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept={ACCEPT_IMAGES}
                  onChange={handleAvatarChange}
                  className="hidden-input"
                  ref={fileInputRef}
                />
              </label>
            </div>
          </div>

          {/* Form Fields */}
          <div className="form-fields-group">
            <div className="form-field">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="input-field"
                maxLength={DISPLAY_NAME_MAX}
              />
              <div className="char-count">
                {formData.displayName.length}/{DISPLAY_NAME_MAX}
              </div>
            </div>

            <div className="form-field">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                readOnly
                disabled
                className="input-field"
              />
              <p className="username-hint">
                Username cannot be changed.
              </p>
            </div>

            <div className="form-field">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="input-field"
                maxLength={BIO_MAX}
              />
              <div className="char-count">
                {formData.bio.length}/{BIO_MAX}
              </div>
            </div>
          </div>

          <div className="submit-button-wrapper">
            <Button 
              type="submit" 
              className="submit-button"
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
