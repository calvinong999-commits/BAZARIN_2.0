export type Role = 'umkm' | 'host' | 'admin'

export type AppScreen =
  | 'role-select'
  | 'login'
  | 'signup'
  | 'verify-email'
  | 'verify-success'
  | 'host-events'
  | 'host-profile'
  | 'host-create-event'
  | 'umkm-events'
  | 'umkm-joined'
  | 'umkm-profile'
  | 'umkm-join-event'
  | 'admin-active'
  | 'admin-pending'

export interface User {
  id: string
  name: string
  phone: string
  email: string
  password: string
  role: Role
  verified: boolean
  businessName?: string
}

export interface Event {
  id: string
  name: string
  hostId: string
  hostName: string
  phone: string
  type: string
  date: string
  location: string
  tentCount: number
  image: string
  status: 'active' | 'pending'
  description?: string
}

export interface JoinRequest {
  id: string
  eventId: string
  userId: string
  umkmName: string
  phone: string
  joinedAt: string
}

export interface AppState {
  screen: AppScreen
  role: Role | null
  currentUser: User | null
  pendingVerifyEmail: string
  pendingVerifyName: string
  pendingVerifyPhone: string
  pendingVerifyPassword: string
  selectedEventId: string | null
  users: User[]
  events: Event[]
  joinRequests: JoinRequest[]
}
