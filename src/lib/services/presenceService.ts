import { rtdb } from '@/lib/firebase';
import { ref, set, onDisconnect, serverTimestamp, onValue, get } from 'firebase/database';
import { auth } from '@/lib/firebase';

export const initPresence = () => {
  const user = auth.currentUser;
  if (!user) {
    console.warn('Пользователь не аутентифицирован, presence не инициализирован');
    return;
  }

  const userId = user.uid;
  const userStatusDatabaseRef = ref(rtdb, `status/${userId}`);

  set(userStatusDatabaseRef, {
    online: true,
    lastChanged: serverTimestamp(),
  }).then(() => {
    onDisconnect(userStatusDatabaseRef).set({
      online: false,
      lastChanged: serverTimestamp(),
    }).catch((error) => {
      console.error('Ошибка настройки onDisconnect:', error);
    });
  }).catch((error) => {
    console.error('Ошибка установки статуса online:', error);
    if (error.code === 'PERMISSION_DENIED') {
      console.error('Ошибка доступа к Realtime Database. Проверьте правила безопасности.');
    }
  });
};

export const clearPresence = () => {
  const user = auth.currentUser;
  if (!user) return;

  const userId = user.uid;
  const userStatusRef = ref(rtdb, `status/${userId}`);

  set(userStatusRef, null).catch((error) => {
    console.error('Ошибка очистки статуса:', error);
  });
};

export const subscribeToUserStatus = (
  userId: string,
  callback: (online: boolean, lastChanged: number | null) => void
) => {
  const userStatusRef = ref(rtdb, `status/${userId}`);
  return onValue(userStatusRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data.online, data.lastChanged);
    } else {
      callback(false, null);
    }
  });
};

export const getUserStatus = async (userId: string) => {
  const userStatusRef = ref(rtdb, `status/${userId}`);
  try {
    const snapshot = await get(userStatusRef);
    const data = snapshot.val();
    if (data) {
      return { online: data.online, lastChanged: data.lastChanged };
    }
    return { online: false, lastChanged: null };
  } catch (error) {
    console.error('Ошибка получения статуса пользователя:', error);
    return { online: false, lastChanged: null };
  }
};

export const subscribeToAllStatuses = (
  callback: (statuses: Record<string, { online: boolean; lastChanged: number | null }>) => void
) => {
  const statusesRef = ref(rtdb, 'status');
  return onValue(statusesRef, (snapshot) => {
    const data = snapshot.val() || {};
    callback(data);
  });
};