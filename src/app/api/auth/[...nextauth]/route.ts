import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
            isActive: true,
          },
          include: {
            userBusinesses: {
              include: {
                business: true,
              },
            },
          },
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isPasswordValid) {
          return null
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLogin: new Date(),
            loginCount: user.loginCount + 1,
          },
        })

        return {
          id: user.id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          businesses: user.userBusinesses.map(ub => ({
            id: ub.business.id,
            name: ub.business.name,
            type: ub.business.type,
            role: ub.role,
          })),
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.businesses = user.businesses
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub || ''
        session.user.role = (token.role as string) || 'owner'
        session.user.firstName = (token.firstName as string) || ''
        session.user.lastName = (token.lastName as string) || ''
        session.user.businesses = (token.businesses as any[]) || []
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin'//,
    //signUp: '/auth/signup',
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }