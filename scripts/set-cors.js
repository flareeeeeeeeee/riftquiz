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
      origin: [
        "https://dq-eight.vercel.app",
        "http://localhost:3000",
        "https://*.vercel.app",
      ],
      method: ["GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS"],
      maxAgeSeconds: 3600,
      responseHeader: [
        "Content-Type",
        "Content-Length",
        "Content-Range",
        "x-goog-resumable",
        "x-goog-content-length-range",
      ],
    },
  ]);

  // Verify
  const [metadata] = await bucket.getMetadata();
  console.log("CORS configured:", JSON.stringify(metadata.cors, null, 2));
}

setCors().catch(console.error);
