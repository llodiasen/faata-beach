import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface JWTPayload {
  userId: string
  role?: string
}

export function generateToken(userId: string, role?: string): string {
  const payload: any = { userId }
  if (role) {
    payload.role = role
  }
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '30d',
  })
}

export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      userId: decoded.userId,
      role: decoded.role,
    } as JWTPayload
  } catch (error) {
    throw new Error('Token invalide')
  }
}

export function getTokenFromRequest(req: { headers: { authorization?: string } }): string | null {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1]
  }
  return null
}

