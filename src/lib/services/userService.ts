import { db, rtdb } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, getDocs, Timestamp } from 'firebase/firestore';
import { ref, onValue, get } from 'firebase/database';

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

export interface FirebaseUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: 'admin' | 'user';
  createdAt: Timestamp;
  lastSeen: Timestamp | null;
  online?: boolean;
}

const isUserOnline = (lastSeen: Timestamp | null): boolean => {
  if (!lastSeen) return false;
  const now = Date.now();
  const lastSeenMs = lastSeen.toMillis();
  return now - lastSeenMs < ONLINE_THRESHOLD_MS;
};

export const subscribeToUsers = (callback: (users: FirebaseUser[]) => void) => {
  const q = query(collection(db, 'users'), orderBy('displayName', 'asc'));
  let statuses: Record<string, { online: boolean; lastChanged: number | null }> = {};
  let firestoreUsers: FirebaseUser[] = [];

  const updateCombined = () => {
    const combined = firestoreUsers.map(user => {
      const status = statuses[user.uid];
      let online = false;
      
      if (status !== null && status !== undefined) {
        online = Boolean(status.online);
      } else if (user.online !== undefined) {
        online = user.online;
      } else {
        online = isUserOnline(user.lastSeen);
      }
      
      return {
        ...user,
        online,
      };
    });
    callback(combined);
  };

  const statusRef = ref(rtdb, 'status');
  
  get(statusRef).catch(() => {});
  
  setTimeout(() => {
    get(statusRef).catch(() => {});
  }, 3000);
  
  const unsubscribeStatus = onValue(statusRef, (snapshot) => {
    try {
      const data = snapshot.val();
      const newStatuses: Record<string, { online: boolean; lastChanged: number | null }> = {};
      
      if (data) {
        Object.keys(data).forEach(userId => {
          const statusData = data[userId];
          
          if (statusData) {
            let onlineValue = false;
            let lastChangedValue = null;
            
            if (typeof statusData === 'object') {
              if (statusData.online !== undefined) {
                onlineValue = Boolean(statusData.online);
              }
              if (statusData.lastChanged !== undefined) {
                lastChangedValue = statusData.lastChanged;
              }
            } else if (typeof statusData === 'boolean') {
              onlineValue = statusData;
            } else if (typeof statusData === 'string' || typeof statusData === 'number') {
              onlineValue = Boolean(statusData);
            }
            
            newStatuses[userId] = {
              online: onlineValue,
              lastChanged: lastChangedValue
            };
          }
        });
      }
      
      statuses = newStatuses;
      
      if (firestoreUsers.length > 0) {
        updateCombined();
      }
    } catch (error: unknown) {
      throw error;
    }
  });

  const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
    const users: FirebaseUser[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const lastSeen = data.lastSeen || null;
      users.push({
        uid: doc.id,
        email: data.email || '',
        displayName: data.displayName || 'Без имени',
        photoURL: data.photoURL || null,
        role: data.role || 'user',
        createdAt: data.createdAt || Timestamp.now(),
        lastSeen,
        online: false, 
      });
    });
    firestoreUsers = users;
    updateCombined();
  });

  return () => {
    unsubscribeStatus();
    unsubscribeFirestore();
  };
};

export const getUser = async (userId: string): Promise<FirebaseUser | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        uid: userDoc.id,
        email: data.email || '',
        displayName: data.displayName || 'Без имени',
        photoURL: data.photoURL || null,
        role: data.role || 'user',
        createdAt: data.createdAt || Timestamp.now(),
        lastSeen: data.lastSeen || null,
        online: data.online || false,
      };
    }
    return null;
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    return null;
  }
};

export const getUsers = async (): Promise<FirebaseUser[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users: FirebaseUser[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const lastSeen = data.lastSeen || null;
      const online = data.online !== undefined ? data.online : isUserOnline(lastSeen);
      users.push({
        uid: doc.id,
        email: data.email || '',
        displayName: data.displayName || 'Без имени',
        photoURL: data.photoURL || null,
        role: data.role || 'user',
        createdAt: data.createdAt || Timestamp.now(),
        lastSeen,
        online,
      });
    });
    return users;
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
    return [];
  }
};