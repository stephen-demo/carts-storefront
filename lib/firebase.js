import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBlj1LVTFohM5_RoCxKLNDklxhFTfOWYjk",
  authDomain: "cartsbydemo.firebaseapp.com",
  projectId: "cartsbydemo",
  storageBucket: "cartsbydemo.firebasestorage.app",
  messagingSenderId: "102962316210",
  appId: "1:102962316210:web:944551550bfda8baa39aab",
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
export const db = getFirestore(app)
