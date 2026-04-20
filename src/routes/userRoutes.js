import express from "express"
import { crearUsuario } from "../controllers/user.controller.js"
import { db } from "../config/db.js"
import { verifyToken } from "../middlewares/auth.middleware.js"

const router = express.Router()

// Crear usuario
router.post("/", crearUsuario)

//Obtener todos los usuarios (necesario para cargar cobradores)
router.get("/", verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection("users").get()
    const users = snapshot.docs.map(doc => ({
      _id: doc.id,
      ...doc.data()
    }))
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo usuarios" })
  }
})

export default router