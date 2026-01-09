import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, getDoc, deleteDoc, setDoc, Timestamp } from 'firebase/firestore';

export interface Room {
  id: string;
  name: string;
  createdBy: string;
  creatorName?: string;
  createdAt: Timestamp;
  password?: string;
}

export interface Participant {
  uid: string;
  agoraUid?: number;
  displayName: string;
  photoURL?: string | null;
  joinedAt: Timestamp;
}

export const joinRoom = async (roomId: string, user: { uid: string, agoraUid?: number, displayName: string, photoURL?: string | null }) => {
  try {
    const participantRef = doc(db, 'rooms', roomId, 'participants', user.uid);
    await setDoc(participantRef, {
      uid: user.uid,
      agoraUid: user.agoraUid || null,
      displayName: user.displayName,
      photoURL: user.photoURL,
      joinedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error joining room: ', error);
  }
};

export const leaveRoom = async (roomId: string, userId: string) => {
  try {
    const participantRef = doc(db, 'rooms', roomId, 'participants', userId);
    await deleteDoc(participantRef);
  } catch (error) {
    console.error('Error leaving room: ', error);
  }
};

export const subscribeToParticipants = (roomId: string, callback: (participants: Participant[]) => void) => {
  const q = query(collection(db, 'rooms', roomId, 'participants'), orderBy('joinedAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const participants: Participant[] = [];
    snapshot.forEach((doc) => {
      participants.push(doc.data() as Participant);
    });
    callback(participants);
  });
};

export const deleteRoom = async (roomId: string) => {
  try {
    await deleteDoc(doc(db, 'rooms', roomId));
  } catch (error) {
    console.error('Error deleting document: ', error);
    throw error;
  }
};

export const getRoom = async (roomId: string): Promise<Room | null> => {
  try {
    const docRef = doc(db, 'rooms', roomId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Room;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting document:", error);
    return null;
  }
};

export const createRoom = async (name: string, userId: string, userName: string, password?: string) => {
  try {
    const roomData = {
      name,
      createdBy: userId,
      creatorName: userName,
      createdAt: serverTimestamp(),
      ...(password ? { password } : {})
    };

    const docRef = await addDoc(collection(db, 'rooms'), roomData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding document: ', error);
    throw error;
  }
};

export const subscribeToRooms = (callback: (rooms: Room[]) => void) => {
  const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const rooms: Room[] = [];
    snapshot.forEach((doc) => {
      rooms.push({ id: doc.id, ...doc.data() } as Room);
    });
    callback(rooms);
  });
};
