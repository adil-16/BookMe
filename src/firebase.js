import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from '@firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDGyDUZ2tQDfpk3v6lOpRuSIIREDYYMeXc',
  authDomain: 'bookme-4e5d8.firebaseapp.com',
  projectId: 'bookme-4e5d8',
  storageBucket: 'bookme-4e5d8.appspot.com',
  messagingSenderId: '928081505282',
  appId: '1:928081505282:web:65e7194f09fbd537f68b1b',
  measurementId: 'G-Y4LHJSWQWZ',
};

export const app = firebase.initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const offline = enableIndexedDbPersistence;
