interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
  };
}

const API_URL = 'http://localhost:5000/api/auth';

// Stockage du token
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

class AuthService {
  // Sauvegarder le token et l'utilisateur
  private setSession(token: string, user: User) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // Récupérer le token
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  // Récupérer l'utilisateur
  getUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Vérifier si l'utilisateur est admin
  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'admin';
  }

  // Inscription
  async register(name: string, email: string, password: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.data) {
        this.setSession(data.data.token, data.data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur register:', error);
      return false;
    }
  }

  // Connexion
  async login(email: string, password: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.data) {
        this.setSession(data.data.token, data.data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur login:', error);
      return false;
    }
  }

  // Déconnexion
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export default new AuthService();