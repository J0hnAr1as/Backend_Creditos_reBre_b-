import express from "express"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config()

// Inicializar Firebase al importar
import "./config/db.js"

import authRoutes from "./routes/auth.routes.js"
import userRoutes from "./routes/userRoutes.js"
import clienteRoutes from "./routes/cliente.routes.js"
import creditoRoutes from "./routes/credito.routes.js"

const app = express()

app.use(cors())
app.use(express.json())

// 🔹 Ruta raíz
app.get("/", (req, res) => {
  res.json({ message: "API Créditos reBre-be funcionando correctamente 🚀" })
})

// 🔹 Rutas API
app.use("/auth", authRoutes)
app.use("/users", userRoutes)
app.use("/clientes", clienteRoutes)
app.use("/creditos", creditoRoutes)

// Solo escuchar en desarrollo local (Vercel no usa listen)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`)
  })
}

export default app