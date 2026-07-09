import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// Configure Axios to send the API Key for Catalyst API Gateway Authentication
axios.defaults.headers.common['X-Catalyst-API-Key'] = 'rakshak-secure-key-2026';

const syncUsersToBackend = async (users: any[]) => {
  try {
    await axios.put('/server/rakshak_function/api/ui/users', users);
  } catch (error) {
    console.error('Failed to sync users to backend', error);
  }
};

export interface User {
  id: string;
  name: string;
  role: string;
  status: string;
  lastLogin: string;
  division: string;
  username?: string;
  password?: string;
}

const DEFAULT_USERS: User[] = [
  { id: 'U001', name: 'Super Admin', role: 'Super Admin', status: 'Active', lastLogin: 'Today, 09:00 AM', division: 'Headquarters', username: 'admin', password: 'admin' },
  { id: 'U002', name: 'Ramesh', role: 'Desk Officer', status: 'Active', lastLogin: 'Today, 10:00 AM', division: 'Front Desk', username: 'ramesh', password: 'password' }
];

interface UserStore {
  users: User[];
  setUsers: (users: User[]) => void;
  addUser: (user: Omit<User, 'id' | 'status' | 'lastLogin'>) => void;
  updateUser: (id: string, userData: Partial<User>) => void;
  deleteUser: (id: string) => void;
  toggleUserStatus: (id: string) => void;
  fetchUsers: () => Promise<void>;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      users: DEFAULT_USERS,
      setUsers: (users) => set({ users }),
      addUser: (userData) =>
        set((state) => {
          const maxId = state.users
            .map((u) => parseInt(u.id.replace('U', ''), 10))
            .reduce((a, b) => Math.max(a, b), 0);
          const newId = `U${String(maxId + 1).padStart(3, '0')}`;
          const newUser: User = {
            ...userData,
            id: newId,
            status: 'Active',
            lastLogin: 'Never (newly provisioned)',
          };
          const newUsers = [...state.users, newUser];
          syncUsersToBackend(newUsers);
          return { users: newUsers };
        }),

      updateUser: (id, userData) =>
        set((state) => {
          const newUsers = state.users.map((u) => (u.id === id ? { ...u, ...userData } : u));
          syncUsersToBackend(newUsers);
          return { users: newUsers };
        }),

      deleteUser: (id) =>
        set((state) => {
          const newUsers = state.users.filter((u) => u.id !== id);
          syncUsersToBackend(newUsers);
          return { users: newUsers };
        }),

      toggleUserStatus: (id) =>
        set((state) => {
          const newUsers = state.users.map((u) => {
            if (u.id === id) {
              return { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' };
            }
            return u;
          });
          syncUsersToBackend(newUsers);
          return { users: newUsers };
        }),

      fetchUsers: async () => {
        try {
          const res = await axios.get('/server/rakshak_function/api/ui/users');
          if (res.data && Array.isArray(res.data) && res.data.length > 0) {
            let fetchedUsers = res.data;
            let needsSync = false;
            // Check if it's legacy data without username field or if it contains Tejashwini
            const hasTejashwini = fetchedUsers.some(u => u.name === 'Tejashwini');
            if (!fetchedUsers[0].username || hasTejashwini) {
              fetchedUsers = DEFAULT_USERS;
              needsSync = true;
            }
            
            set({ users: fetchedUsers });
            if (needsSync) {
              syncUsersToBackend(fetchedUsers);
            }
          } else {
            syncUsersToBackend(get().users);
          }
        } catch (error) {
          console.error('Failed to fetch users from backend', error);
        }
      }
    }),
    {
      name: 'user-storage',
      version: 4,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          if (persistedState.users && persistedState.users.length > 0 && !persistedState.users[0].username) {
            return { ...persistedState, users: DEFAULT_USERS };
          }
        }
        if (version === 1) {
          // Hard reset to remove default mock users from v1
          return { ...persistedState, users: DEFAULT_USERS };
        }
        if (version === 2) {
          // Migration from version 2 to 3 completed.
          return persistedState;
        }
        if (version === 3) {
          // Hard reset to update Tejashwini to admin
          return { ...persistedState, users: DEFAULT_USERS };
        }
        return persistedState;
      }
    }
  )
);
