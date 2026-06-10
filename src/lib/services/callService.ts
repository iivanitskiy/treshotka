import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  getDoc,
} from "firebase/firestore";

export const CALL_RING_TIMEOUT_MS = 30_000;

export type CallStatus =
  | "ringing"
  | "accepted"
  | "rejected"
  | "ended"
  | "busy"
  | "missed"
  | "failed";

export interface CallDocument {
  callerId: string;
  callerName: string;
  calleeId: string;
  calleeName: string;
  status: CallStatus;
  offer?: RTCSessionDescriptionInit | null;
  answer?: RTCSessionDescriptionInit | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CallWithId extends CallDocument {
  id: string;
}

const ACTIVE_STATUSES: CallStatus[] = ["ringing", "accepted"];

const callsCol = () => collection(db, "calls");
const callDoc = (callId: string) => doc(db, "calls", callId);
const iceCol = (callId: string) => collection(db, "calls", callId, "iceCandidates");
const callBusyDoc = (userId: string) => doc(db, "callBusy", userId);

export async function setUserCallBusy(
  userId: string,
  busy: boolean
): Promise<void> {
  await setDoc(
    callBusyDoc(userId),
    { busy, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function clearUserCallBusy(userId: string): Promise<void> {
  try {
    await setDoc(callBusyDoc(userId), { busy: false, updatedAt: serverTimestamp() });
  } catch (e) {
    console.warn("clearUserCallBusy:", e);
  }
}

export async function isUserInActiveCall(userId: string): Promise<boolean> {
  try {
    const snap = await getDoc(callBusyDoc(userId));
    return snap.exists() && snap.data()?.busy === true;
  } catch {
    return false;
  }
}

export function subscribeToBusyUserIds(
  callback: (busyIds: Set<string>) => void
): Unsubscribe {
  const q = query(collection(db, "callBusy"), where("busy", "==", true));

  return onSnapshot(
    q,
    (snap) => {
      const busy = new Set<string>();
      snap.forEach((d) => busy.add(d.id));
      callback(busy);
    },
    (err) => {
      console.error("subscribeToBusyUserIds:", err);
      callback(new Set());
    }
  );
}

export async function createCall(params: {
  callerId: string;
  callerName: string;
  calleeId: string;
  calleeName: string;
}): Promise<string> {
  const ref = doc(callsCol());
  const now = serverTimestamp();
  await setDoc(ref, {
    ...params,
    status: "ringing" as CallStatus,
    offer: null,
    answer: null,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateCallStatus(
  callId: string,
  status: CallStatus
): Promise<void> {
  await updateDoc(callDoc(callId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function setCallOffer(
  callId: string,
  offer: RTCSessionDescriptionInit
): Promise<void> {
  await updateDoc(callDoc(callId), {
    offer,
    updatedAt: serverTimestamp(),
  });
}

export async function setCallAnswer(
  callId: string,
  answer: RTCSessionDescriptionInit
): Promise<void> {
  await updateDoc(callDoc(callId), {
    answer,
    status: "accepted",
    updatedAt: serverTimestamp(),
  });
}

export async function addIceCandidate(
  callId: string,
  fromUserId: string,
  candidate: RTCIceCandidateInit
): Promise<void> {
  await addDoc(iceCol(callId), {
    fromUserId,
    candidate,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToRemoteIceCandidates(
  callId: string,
  remoteUserId: string,
  onCandidate: (candidate: RTCIceCandidateInit) => void
): Unsubscribe {
  const q = query(iceCol(callId), where("fromUserId", "==", remoteUserId));
  return onSnapshot(q, (snap) => {
    snap.docChanges().forEach((change) => {
      if (change.type === "added") {
        const data = change.doc.data();
        if (data.candidate) onCandidate(data.candidate as RTCIceCandidateInit);
      }
    });
  });
}

export function subscribeToCall(
  callId: string,
  callback: (call: CallWithId | null) => void
): Unsubscribe {
  return onSnapshot(
    callDoc(callId),
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback({ id: snap.id, ...(snap.data() as CallDocument) });
    },
    (err) => console.error("subscribeToCall:", err)
  );
}

export function subscribeToIncomingCalls(
  userId: string,
  callback: (call: CallWithId | null) => void
): Unsubscribe {
  const q = query(
    callsCol(),
    where("calleeId", "==", userId),
    where("status", "==", "ringing")
  );

  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        callback(null);
        return;
      }
      const docSnap = snap.docs[0];
      callback({
        id: docSnap.id,
        ...(docSnap.data() as CallDocument),
      });
    },
    (err) => {
      console.error("subscribeToIncomingCalls:", err);
      callback(null);
    }
  );
}

export async function deleteCallArtifacts(callId: string): Promise<void> {
  try {
    const iceSnap = await getDocs(iceCol(callId));
    await Promise.all(iceSnap.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(callDoc(callId));
  } catch (e) {
    console.warn("Очистка звонка:", e);
  }
}

export async function getCall(callId: string): Promise<CallWithId | null> {
  const snap = await getDoc(callDoc(callId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as CallDocument) };
}
