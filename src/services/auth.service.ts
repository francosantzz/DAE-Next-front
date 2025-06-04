import { signIn, signOut } from 'next-auth/react';

export class AuthService {
  static async login(email: string, password: string) {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async logout() {
    await signOut({ redirect: true, callbackUrl: '/login' });
  }

  static async refreshToken() {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
} 