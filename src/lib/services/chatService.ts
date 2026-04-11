import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, Timestamp, doc, deleteDoc } from 'firebase/firestore';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: Timestamp;
}

export const sendMessage = async (roomId: string, text: string, senderId: string, senderName: string) => {
  try {
    await addDoc(collection(db, 'rooms', roomId, 'messages'), {
      text,
      senderId,
      senderName,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Ошибка при отправке сообщения: ', error);
    throw error;
  }
};

export const subscribeToMessages = (roomId: string, callback: (messages: Message[]) => void) => {
  const q = query(collection(db, 'rooms', roomId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((docSnap) => {
      messages.push({ id: docSnap.id, ...docSnap.data() } as Message);
    });
    callback(messages);
  });
};

export const deleteMessage = async (roomId: string, messageId: string) => {
  try {
    await deleteDoc(doc(db, 'rooms', roomId, 'messages', messageId));
  } catch (error) {
    console.error('Ошибка при удалении сообщения: ', error);
    throw error;
  }
};
