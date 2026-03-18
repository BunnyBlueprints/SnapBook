import axios, { AxiosError } from 'axios';
import { Show, Seat, Booking, CreateShowPayload, CreateBookingPayload, ApiResponse } from '../types';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE, timeout: 10000 });

api.interceptors.response.use(
  r => r,
  (e: AxiosError<{ message: string }>) =>
    Promise.reject(new Error(e.response?.data?.message || e.message || 'Request failed'))
);

export const showApi = {
  list:    (p?: { type?: string; search?: string }) =>
    api.get<ApiResponse<Show[]>>('/shows', { params: p }).then(r => r.data.data || []),
  getById: (id: string) =>
    api.get<ApiResponse<Show>>(`/shows/${id}`).then(r => r.data.data!),
  getSeats: (id: string) =>
    api.get<ApiResponse<Seat[]>>(`/shows/${id}/seats`).then(r => r.data.data || []),
  create:  (p: CreateShowPayload) =>
    api.post<ApiResponse<Show>>('/admin/shows', p).then(r => r.data),
  cancel:  (id: string) =>
    api.delete<ApiResponse<Show>>(`/admin/shows/${id}`).then(r => r.data),
  listAll: () =>
    api.get<ApiResponse<Show[]>>('/admin/shows').then(r => r.data.data || []),
};

export const bookingApi = {
  create:  (p: CreateBookingPayload) =>
    api.post<ApiResponse<Booking>>('/bookings', p).then(r => r.data),
  getById: (id: string) =>
    api.get<ApiResponse<Booking>>(`/bookings/${id}`).then(r => r.data.data!),
  cancel:  (id: string) =>
    api.delete<ApiResponse<Booking>>(`/bookings/${id}`).then(r => r.data),
  listAll: (p?: { show_id?: string; status?: string; page?: number }) =>
    api.get<any>('/admin/bookings', { params: p }).then(r => r.data),
};

export default api;
