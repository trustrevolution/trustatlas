import { create } from 'zustand'

// Simplified store - charts fetch data directly via API
// This store is minimal, can be expanded as needed

interface AppState {
  // Loading state for any global operations
  isLoading: boolean
  setLoading: (loading: boolean) => void
}

export const useStore = create<AppState>()((set) => ({
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}))
