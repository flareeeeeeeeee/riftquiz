import { initializeApp, getApps } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCsgmW6mAW_DNxg6xeA0srPN9w0AlL8UJE",
  authDomain: "tcg-gt.firebaseapp.com",
  projectId: "tcg-gt",
  storageBucket: "tcg-gt.firebasestorage.app",
  messagingSenderId: "65987602910",
  appId: "1:65987602910:web:cf4de32f660acfaa81d54f",
  measurementId: "G-TTWQXEYM2R",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const storage = getStorage(app);
