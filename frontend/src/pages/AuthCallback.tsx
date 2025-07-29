import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = () => {
      const idToken = searchParams.get('id_token');
      const refreshToken = searchParams.get('refresh_token');
      const error = searchParams.get('error');

      if (error) {
        let errorMessage = 'Authentication failed';
        
        switch (error) {
          case 'no_tokens':
            errorMessage = 'No authentication tokens received';
            break;
          case 'auth_failed':
            errorMessage = 'Authentication process failed';
            break;
          case 'oauth_failed':
            errorMessage = 'OAuth authentication failed';
            break;
          case 'server_error':
            errorMessage = 'Server error during authentication';
            break;
          default:
            errorMessage = 'Authentication failed';
        }

        toast({
          title: "Authentication Error",
          description: errorMessage,
          variant: "destructive"
        });

        navigate('/login');
        return;
      }

      if (idToken && refreshToken) {
        // Store tokens securely
        localStorage.setItem('id_token', idToken);
        localStorage.setItem('refresh_token', refreshToken);
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, '/');
        
        toast({
          title: "Welcome!",
          description: "Successfully signed in",
        });

        navigate('/');
      } else {
        toast({
          title: "Authentication Error",
          description: "Missing authentication tokens",
          variant: "destructive"
        });
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-full flex items-center justify-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-foreground"></div>
        </div>
        <h1 className="font-heading font-bold text-xl text-foreground mb-2">Completing Sign In</h1>
        <p className="text-muted-foreground">Please wait while we finish setting up your account...</p>
      </div>
    </div>
  );
};

export default AuthCallback;