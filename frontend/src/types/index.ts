export type ShowType = 'MOVIE' | 'BUS' | 'CONCERT' | 'SPORT' | 'OTHER';
export type ShowStatus = 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';
export type SeatStatus = 'AVAILABLE' | 'LOCKED' | 'BOOKED';
export type UserRole = 'admin' | 'user';
export type Theme = 'light' | 'dark';

export interface Show {
  id: string;
  name: string;
  type: ShowType;
  venue: string;
  description?: string;
  start_time: string;
  end_time?: string;
  total_seats: number;
  booked_seats: number;
  available_seats: number;
  price: number;
  status: ShowStatus;
  poster_url?: string;
  created_at: string;
}

export interface Seat {
  id: string;
  show_id: string;
  seat_code: string;
  row_label: string;
  seat_num: number;
  status: SeatStatus;
}

export interface Booking {
  id: string;
  show_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  seat_ids: string[];
  seat_codes: string[];
  total_amount: number;
  status: BookingStatus;
  expires_at: string;
  created_at: string;
  // joined
  show_name?: string;
  show_type?: ShowType;
  venue?: string;
  start_time?: string;
  price?: number;
}

export interface CreateShowPayload {
  name: string;
  type: ShowType;
  venue: string;
  description?: string;
  start_time: string;
  end_time?: string;
  total_seats: number;
  price: number;
}

export interface CreateBookingPayload {
  show_id: string;
  seat_ids: string[];
  user_name: string;
  user_email: string;
  user_phone: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  status?: string;
  booking?: Booking;
}

export interface AppContextType {
  auth: { isAuthenticated: boolean; role: UserRole; name: string };
  theme: Theme;
  shows: Show[];
  loadingShows: boolean;
  login: (role: UserRole) => void;
  logout: () => void;
  toggleTheme: () => void;
  fetchShows: (force?: boolean) => Promise<void>;
  invalidateShows: () => void;
}
