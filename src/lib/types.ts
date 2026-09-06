export type Role = 'admin' | 'host' | 'umkm'
export type EventStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'completed'
export type RegistrationStatus = 'pending' | 'accepted' | 'rejected'

export interface Profile {
  id: string
  role: Role
  full_name: string | null
  business_name: string | null
  phone: string | null
  city: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  created_at: string
}

export interface Event {
  id: string
  host_id: string
  category_id: string | null
  title: string
  description: string | null
  cover_image: string | null
  city: string | null
  location: string | null
  address: string | null
  start_date: string
  end_date: string
  start_time: string | null
  end_time: string | null
  total_slots: number
  available_slots: number
  price: number
  status: EventStatus
  admin_notes: string | null
  tags: string[] | null
  proposal_url: string | null
  izin_url: string | null
  ktp_url: string | null
  contact_phone: string | null
  layout_image_url: string | null
  terms_conditions: string | null
  created_at: string
  updated_at: string
  // Joined
  profiles?: Profile
  categories?: Category
  registrations?: Registration[]
  event_stands?: Stand[]
  _registration_count?: number
}

export interface Stand {
  id: string
  event_id: string
  name: string
  price: number
  features: string[]
  is_available: boolean
  created_at: string
}

export interface Registration {
  id: string
  event_id: string
  umkm_id: string
  business_name: string | null
  phone: string | null
  product_type: string | null
  notes: string | null
  status: RegistrationStatus
  host_notes: string | null
  ktp_url: string | null
  address: string | null
  stand_id: string | null
  created_at: string
  updated_at: string
  // Joined
  events?: Event
  profiles?: Profile
  event_stands?: Stand
}

export type PaymentStatus = 'pending' | 'settlement' | 'expire' | 'cancel' | 'deny'

export interface Payment {
  id: string
  registration_id: string
  event_id: string
  umkm_id: string
  order_id: string
  gross_amount: number
  payment_type: string
  transaction_status: PaymentStatus
  snap_token: string | null
  payment_url: string | null
  created_at: string
  updated_at?: string
  // Joined
  events?: Event
  registrations?: Registration
}

export interface EventReview {
  id: string
  event_id: string
  umkm_id: string
  registration_id?: string | null
  rating: number
  comment: string | null
  created_at: string
  updated_at?: string
  // Joined
  profiles?: Profile
  events?: Event
}

export interface UmkmReview {
  id: string
  event_id: string
  host_id: string
  umkm_id: string
  registration_id: string
  rating: number
  comment: string | null
  created_at: string
  updated_at?: string
  // Joined
  profiles?: Profile // Host's profile
  events?: Event
}

export interface ChatMessage {
  id: string
  registration_id: string
  sender_id: string
  content: string
  created_at: string
  // Joined
  profiles?: Profile // Sender's profile
}

export interface Conversation {
  id: string
  event_id: string
  host_id: string
  umkm_id: string
  created_at: string
  // Joined
  events?: Event
  host_profile?: Profile
  umkm_profile?: Profile
  last_message?: ChatMessage
}

export interface AppUser {
  id: string
  email: string
  profile: Profile | null
}

export type Page =
  | 'landing'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'verify-email'
  // Host
  | 'host-dashboard'
  | 'host-events'
  | 'host-create-event'
  | 'host-edit-event'
  | 'host-applicants'
  // UMKM
  | 'umkm-dashboard'
  | 'umkm-browse'
  | 'umkm-event-detail'
  | 'umkm-my-registrations'
  | 'umkm-payment'
  | 'umkm-reviews'
  | 'umkm-profile'
  // Admin
  | 'admin-dashboard'
  | 'admin-events'
  | 'admin-users'
  | 'admin-categories'
