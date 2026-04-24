import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import { handleSendEmail } from "./src/services/emailHandler.js";

dotenv.config();

// Robust Firebase Config Loading
let firebaseConfig: any = { projectId: process.env.VITE_FIREBASE_PROJECT_ID };
try {
  const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
} catch (e) {
  console.warn("[Server] Could not load local firebase config file.");
}

// Initialize Firebase Admin
const adminApp = (admin.apps.length === 0 && firebaseConfig.projectId) 
  ? admin.initializeApp({ 
      projectId: firebaseConfig.projectId 
    })
  : admin.app();

// Get Firestore instance.
const db = (admin.apps.length > 0) 
  ? getFirestore(adminApp, firebaseConfig.firestoreDatabaseId || '(default)')
  : null;

// Test Firestore connection on startup with better logging
(async () => {
  try {
    console.log(`[Server] Connecting to Firestore database: ${firebaseConfig.firestoreDatabaseId || '(default)'}`);
    const settingsDoc = await db.collection('communicationSettings').doc('global').get();
    if (settingsDoc.exists) {
      console.log("[Server] Firebase Admin SDK connected to Firestore successfully.");
    } else {
      console.warn("[Server] Firebase Admin SDK connected, but 'communicationSettings/global' not found.");
    }
  } catch (error: any) {
    console.error("[Server] Firebase Admin SDK connectivity check FAILED.");
    console.error(`[Server] Error Details: ${error.message}`);
    if (error.message.includes('7 PERMISSION_DENIED')) {
      console.warn("[Server] HINT: This usually means the Service Account lacks 'Cloud Datastore User' IAM role for this database.");
      console.warn("[Server] ACTION: Falling back to possible Environment Variables for Email Keys.");
    }
  }
})();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Send Email
  app.post("/api/send-email", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const result = await handleSendEmail(req.body, authHeader);
      res.json(result);
    } catch (error: any) {
      console.error("[Email Proxy Error]:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
