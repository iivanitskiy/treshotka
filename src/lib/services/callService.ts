import { db } from '@/lib/firebase';
import { collection, doc, setDoc, onSnapshot, deleteDoc, getDoc } from 'firebase/firestore';

const CALLS_COLLECTION = 'calls';

interface CallData {
  callerId: string;
  callerName: string;
  timestamp: number;
  status: 'ringing' | 'active' | 'ended';
}

export const sendCallRequest = async (callerId: string, callerName: string, calleeId: string): Promise<boolean> => {
  try {
    const callRef = doc(collection(db, CALLS_COLLECTION), calleeId);
    const callData: CallData = {
      callerId,
      callerName,
      timestamp: Date.now(),
      status: 'ringing'
    };
    
    await setDoc(callRef, callData);
    return true;
  } catch (error) {
    console.error('Failed to send call request:', error);
    return false;
  }
};

export const answerCall = async (userId: string): Promise<boolean> => {
  try {
    const callRef = doc(collection(db, CALLS_COLLECTION), userId);
    const callDoc = await getDoc(callRef);
    
    if (callDoc.exists() && callDoc.data().status === 'ringing') {
      await setDoc(callRef, { status: 'active' }, { merge: true });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to answer call:', error);
    return false;
  }
};

export const rejectCall = async (userId: string): Promise<void> => {
  try {
    const callRef = doc(collection(db, CALLS_COLLECTION), userId);
    await deleteDoc(callRef);
  } catch (error) {
    console.error('Failed to reject call:', error);
  }
};

export const endCall = async (userId: string): Promise<void> => {
  try {
    const callRef = doc(collection(db, CALLS_COLLECTION), userId);
    await deleteDoc(callRef);
  } catch (error) {
    console.error('Failed to end call:', error);
  }
};

export const monitorCall = (userId: string, onCallUpdate: (callData: CallData | null) => void) => {
  const callRef = doc(collection(db, CALLS_COLLECTION), userId);
  
  const unsubscribe = onSnapshot(callRef, (doc) => {
    if (doc.exists()) {
      onCallUpdate(doc.data() as CallData);
    } else {
      onCallUpdate(null);
    }
  }, (error) => {
    console.error('Error monitoring call:', error);
    onCallUpdate(null);
  });
  
  return unsubscribe;
};

export const isUserOnCall = async (userId: string): Promise<boolean> => {
  try {
    const callRef = doc(collection(db, CALLS_COLLECTION), userId);
    const callDoc = await getDoc(callRef);
    
    if (callDoc.exists()) {
      const data = callDoc.data();
      return data.status === 'active';
    }
    
    return false;
  } catch (error) {
    console.error('Failed to check call status:', error);
    return false;
  }
};