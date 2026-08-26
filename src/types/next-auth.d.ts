import type { Role } from '@/generated/prisma/enums'
import type { DefaultSession } from 'next-auth'

// Teach TypeScript about the extra fields we put on the session and the JWT,
// so `session.user.role` is typed instead of `any`/`unknown`.
declare module 'next-auth' {
  interface Session {
    user: { id: string; role: Role } & DefaultSession['user']
  }

  interface User {
    role: Role
  }
}

// The JWT interface is declared in @auth/core/jwt; "next-auth/jwt" only
// re-exports it, so augmenting that path silently does nothing.
declare module '@auth/core/jwt' {
  interface JWT {
    id: string
    role: Role
  }
}
