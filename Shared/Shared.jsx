import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../config/FirebaseConfig";

const getEmail = (user) =>
  user?.primaryEmailAddress?.emailAddress;

const GetFavList = async (user) => {
  const email = getEmail(user);
  if (!email) return { favorites: [] };

  const ref = doc(db, "UserFavPet", email);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data();
  }

  await setDoc(ref, {
    email,
    favorites: [],
  });

  return { favorites: [] };
};

const UpdateFav = async (user, favorites) => {
  const email = getEmail(user);
  if (!email) return;

  const ref = doc(db, "UserFavPet", email);

  await setDoc(ref, { favorites }, { merge: true });
};

export default { GetFavList, UpdateFav };
