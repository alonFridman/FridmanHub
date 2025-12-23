import { useEffect, useState } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { auth } from "../firebase";

export const useIdToken = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (!user) {
        setToken(null);
        return;
      }
      const idToken = await user.getIdToken();
      setToken(idToken);
    });
    return unsubscribe;
  }, []);

  return token;
};
