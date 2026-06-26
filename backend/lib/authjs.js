import { skipCSRFCheck } from '@auth/core'
import Google from '@auth/core/providers/google'
import Apple from '@auth/core/providers/apple'
import MicrosoftEntraID from '@auth/core/providers/microsoft-entra-id'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

function findOrCreateUser(profile, provider, account) {
  const providerId = account?.providerAccountId || profile?.sub
  const email = profile?.email
  const avatar = profile?.picture
  const name = profile?.name || ''
  const firstName = profile?.given_name || profile?.givenName || name.split(' ')[0] || provider
  const lastName = profile?.family_name || profile?.familyName || name.split(' ').slice(1).join(' ') || 'User'

  return User.findOne({ provider, providerId })
    .then(user => {
      if (user) return user

      return User.findOne({ email })
        .then(existingUser => {
          if (existingUser) {
            existingUser.provider = provider
            existingUser.providerId = providerId
            existingUser.isVerified = true
            if (avatar && !existingUser.avatar) existingUser.avatar = avatar
            return existingUser.save().then(u => u)
          }

          const newUser = new User({
            firstName,
            lastName,
            email,
            provider,
            providerId,
            isVerified: true,
            avatar
          })
          return newUser.save().then(u => u)
        })
    })
}

export const authConfig = {
  providers: [],
  secret: process.env.JWT_SECRET,
  trustHost: true,
  basePath: '/api/authjs',
  skipCSRFCheck,
  jwt: {
    encode: async ({ token, secret }) => {
      return jwt.sign(token, secret, { expiresIn: '7d' })
    },
    decode: async ({ token, secret }) => {
      if (!token) return null
      try {
        return jwt.verify(token, secret)
      } catch {
        return null
      }
    }
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account) return false
      if (account.provider === 'credentials') return false
      const provider = account.provider === 'microsoft-entra-id' ? 'microsoft' : account.provider
      try {
        await findOrCreateUser(profile, provider, account)
        return true
      } catch (err) {
        console.error('Auth.js signIn error:', err)
        return false
      }
    },
    async jwt({ token, account, profile }) {
      if (account) {
        const provider = account.provider === 'microsoft-entra-id' ? 'microsoft' : account.provider
        const dbUser = await User.findOne({ provider, providerId: account.providerAccountId }).select('-password').lean()
        if (dbUser) {
          token.id = dbUser._id.toString()
          token.email = dbUser.email
          token.firstName = dbUser.firstName
          token.lastName = dbUser.lastName
          token.avatar = dbUser.avatar
          token.isVerified = dbUser.isVerified
        }
      }
      return token
    },
    async redirect({ url, baseUrl }) {
      if (url.includes('/callback/')) {
        return `${baseUrl}/exchange-token`
      }
      return url
    }
  }
}

if (process.env.GOOGLE_CLIENT_ID) {
  authConfig.providers.push(Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }))
}

if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  authConfig.providers.push(Apple({
    clientId: process.env.APPLE_CLIENT_ID,
    clientSecret: process.env.APPLE_CLIENT_SECRET,
  }))
}

if (process.env.MICROSOFT_CLIENT_ID) {
  authConfig.providers.push(MicrosoftEntraID({
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
  }))
}
