require("dotenv").config();
const { initializeApp, cert } = require("firebase-admin/app");
const { getStorage } = require("firebase-admin/storage");

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const bucket = getStorage().bucket();

async function setCors() {
  await bucket.setCorsConfiguration([
    {
      origin: ["*"],
      method: ["GET", "POST", "PUT", "DELETE", "HEAD"],
      maxAgeSeconds: 3600,
      responseHeader: ["Content-Type", "Authorization", "Content-Length", "x-goog-resumable"],
    },
  ]);
  console.log("CORS configured successfully!");
}

setCors().catch(console.error);
