import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email y contraseña son requeridos');
          }

          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
          console.log('URL del backend:', backendUrl);

          if (!backendUrl) {
            throw new Error('La URL del backend no está configurada');
          }

          try {
            const res = await fetch(`${backendUrl}/auth/login`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            });

            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}));
              throw new Error(errorData.message || `Error del servidor: ${res.status}`);
            }

            const data = await res.json();
            console.log('Respuesta del backend:', data);

            if (data) {
              return {
                id: data.user.id,
                email: data.user.email,
                role: data.user.role,
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
              };
            }

            return null;
          } catch (error) {
            console.error('Error al conectar con el backend:', error);
            if (error instanceof Error && 'code' in error && error.code === 'ECONNREFUSED') {
              throw new Error('No se pudo conectar con el servidor. Por favor, verifica que el backend esté corriendo.');
            }
            throw new Error('Error al conectar con el servidor');
          }
        } catch (error) {
          console.error('Error en authorize:', error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.role = user.role;
        token.exp = Math.floor(Date.now() / 1000) + (6 * 60 * 60); // 6 horas en segundos
      }

      // Verificar si el token está expirado
      if (token.exp && typeof token.exp === 'number' && Date.now() >= token.exp * 1000) {
        return { ...token, error: "TokenExpired" };
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.accessToken = token.accessToken;
        session.user.refreshToken = token.refreshToken;
        session.user.role = token.role;
        session.error = token.error;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 6 * 60 * 60, // 6 horas
  },
  events: {
    async signOut() {
      // Limpiar cualquier estado local al cerrar sesión
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
});

export { handler as GET, handler as POST };
