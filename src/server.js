import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import TelegramBot from "node-telegram-bot-api"

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

// 🔹 Telegram Bot
const token = process.env.TELEGRAM_BOT_TOKEN
const bot = new TelegramBot(token)

// Configurar webhook (Telegram enviará mensajes aquí)
bot.setWebHook(`https://creditos-re-bre-b-backend.vercel.app/api/telegram/${token}`)

bot.onText(/\/crearcliente (.+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const params = match[1].split(",") // ejemplo: "Juan Pérez,3001234567,Calle 123"

  if (params.length < 3) {
    return bot.sendMessage(chatId, "⚠️ Formato inválido. Usa: /crearcliente Nombre,Telefono,Direccion")
  }

  const [nombre, telefono, direccion] = params.map(p => p.trim())

  try {
    // Llamada al backend para crear cliente
    const response = await axios.post("https://creditos-re-bre-b-backend.vercel.app/api/clientes", {
      nombre,
      telefono,
      direccion
    })

    bot.sendMessage(chatId, `✅ Cliente creado: ${response.data.nombre}`)
  } catch (error) {
    bot.sendMessage(chatId, "❌ Error al crear cliente: " + error.message)
  }
})

// Endpoint para recibir mensajes de Telegram
app.post(`/api/telegram/${token}`, (req, res) => {
  bot.processUpdate(req.body)
  res.sendStatus(200)
})

// Ejemplo de respuesta automática
bot.on("message", (msg) => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId, `Hola ${msg.from.first_name}, recibí tu mensaje: ${msg.text}`)
})

// Solo escuchar en desarrollo local (Vercel no usa listen)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`)
  })
}

export default app
