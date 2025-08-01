import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import './AuthCallback.css';

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
        localStorage.setItem('id_token', idToken);
        localStorage.setItem('refresh_token', refreshToken);

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
    <div className="auth-callback-container">
      <div className="auth-callback-content">
        <div className="spinner-wrapper">
          <div className="spinner" />
        </div>
        <h1 className="auth-title">Completing Sign In</h1>
        <p className="auth-description">Please wait while we finish setting up your account...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
