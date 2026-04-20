import admin from "firebase-admin"

// Evitar re-inicializar en invocaciones sucesivas (Vercel serverless warm starts)
if (!admin.apps.length) {
  // En Vercel: la clave viene de la variable de entorno FIREBASE_SERVICE_ACCOUNT
  // En local: se lee del archivo serviceAccountKey.json
  let serviceAccount

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  } else {
    // Fallback para desarrollo local
    const { readFileSync } = await import("fs")
    const { fileURLToPath } = await import("url")
    const { dirname, join } = await import("path")

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)

    serviceAccount = JSON.parse(
      readFileSync(join(__dirname, "serviceAccountKey.json"), "utf8")
    )
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })

  console.log("✅ Firebase Admin inicializado correctamente")
}

const db = admin.firestore()

export { db }
export default admin
