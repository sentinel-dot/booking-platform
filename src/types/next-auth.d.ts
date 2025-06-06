import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      firstName: string
      lastName: string
      role: string
      businesses: Array<{
        id: number
        name: string
        type: string
        role: string
      }>
    }
  }

  interface User {
    id: string
    email: string
    name: string
    firstName: string
    lastName: string
    role: string
    businesses: Array<{
      id: number
      name: string
      type: string
      role: string
    }>
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    firstName: string
    lastName: string
    businesses: Array<{
      id: number
      name: string
      type: string
      role: string
    }>
  }
}