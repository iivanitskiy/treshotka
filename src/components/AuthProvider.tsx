"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAppDispatch } from "@/lib/hooks";
import { setUser, clearUser, setLoading } from "@/lib/features/auth/authSlice";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        let role: "admin" | "user" = "user";
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            role = userDoc.data().role as "admin" | "user";
          }
        } catch (error) {
          console.error("Ошибка при выборе роли пользователя:", error);
        }

        dispatch(
          setUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: role,
          })
        );
      } else {
        dispatch(clearUser());
      }
      dispatch(setLoading(false));
    });

    return () => unsubscribe();
  }, [dispatch]);

  return <>{children}</>;
}
