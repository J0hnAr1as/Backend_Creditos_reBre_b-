import bcrypt from "bcryptjs"
import { db } from "../config/db.js"

export const crearCobrador = async (req, res) => {
  try {
    const nombre = req.body.nombre.trim()
    const email = req.body.email.trim().toLowerCase()
    const password = req.body.password.trim()

    const hashedPassword = await bcrypt.hash(password, 10)

    const nuevoCobrador = {
      nombre,
      email,
      password: hashedPassword,
      rol: "COBRADOR",
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const docRef = await db.collection("users").add(nuevoCobrador)

    res.status(201).json({
      _id: docRef.id,
      ...nuevoCobrador
    })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const listarCobradores = async (req, res) => {
  try {
    const snapshot = await db.collection("users")
      .where("rol", "==", "COBRADOR")
      .get()

    const cobradores = snapshot.docs.map(doc => ({
      _id: doc.id,
      ...doc.data()
    }))

    res.json(cobradores)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
