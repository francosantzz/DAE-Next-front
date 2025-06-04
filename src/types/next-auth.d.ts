import 'next-auth';
import { JWT } from 'next-auth/jwt';
import NextAuth from "next-auth";

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    role: string;
    accessToken: string;
    refreshToken: string;
  }

  interface Session {
    user: {
      id?: string;
      email?: string;
      role?: string;
      accessToken?: string;
      refreshToken?: string;
    };
    error?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }
}
