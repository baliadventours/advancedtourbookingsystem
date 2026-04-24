import { handleSendEmail } from "../src/services/emailHandler.js";

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    const result = await handleSendEmail(req.body, authHeader);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("[Vercel API Error]:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
