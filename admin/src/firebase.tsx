import {initializeApp} from "firebase/app";
import {User, getAuth, onAuthStateChanged, signInWithPopup} from "firebase/auth";
import {PropsWithChildren, useEffect, useState} from "react";
import {GoogleAuthProvider} from "firebase/auth";
import {Button, Center} from "@chakra-ui/react";


const firebaseConfig = {
  apiKey: "AIzaSyDOHdRH1UZmhmiPfao3h0du1WtYTzHRHCg",
  authDomain: "real-hope-podcast.firebaseapp.com",
  projectId: "real-hope-podcast",
  storageBucket: "real-hope-podcast.appspot.com",
  messagingSenderId: "145473709243",
  appId: "1:145473709243:web:b6c67c1eb1d0766a56b59e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.useDeviceLanguage();
const provider = new GoogleAuthProvider();


export function FirebaseAuthenticated({children}: PropsWithChildren<{}>) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);
  if (!user) {
    return <LoginPage />
  }
  return <>{children}</>;
}


function LoginPage() {
  return <Center>
    <Button onClick={() => signInWithPopup(auth, provider)}>
      Sign In with Google
    </Button>
  </Center>;
}
