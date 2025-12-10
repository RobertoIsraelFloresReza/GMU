import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCpqccsDBPIsCGFzNcCw0IOo7i34GX8D_c",
  authDomain: "grocerydelivery-pro.firebaseapp.com",
  projectId: "grocerydelivery-pro",
  storageBucket: "grocerydelivery-pro.firebasestorage.app",
  messagingSenderId: "244265753932",
  appId: "1:244265753932:web:4cc30df026abeab0a583e9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = getMessaging(app);

// VAPID Public Key (Web Push certificate)
const VAPID_KEY = "BOInXkr23ApUKI2-rsnSuy2oWJWAhrxrlb7Wbdf7pvYaW71GWOZTxjwuFzT3yYhe8mB4wI1YZc_TtV0ay0mrZm4";

/**
 * Request notification permission and get FCM token
 */
export const requestNotificationPermission = async () => {
  try {
    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('Notification permission granted.');

      // Get FCM token
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY
      });

      if (currentToken) {
        console.log('FCM Token:', currentToken);
        return currentToken;
      } else {
        console.log('No registration token available.');
        return null;
      }
    } else {
      console.log('Notification permission denied.');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

/**
 * Handle foreground messages (when app is open)
 */
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      resolve(payload);
    });
  });

export { messaging };
