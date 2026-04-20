import bcrypt from "bcryptjs"
import { db } from "../config/db.js"

export const crearUsuario = async (req, res) => {
  try {
    console.log("🟢 BODY RECIBIDO:", req.body)

    const {
      nombre,
      cedula,
      celular,
      direccion,
      email,
      password,
      rol
    } = req.body

    if (!nombre || !cedula || !celular || !direccion || !email || !password || !rol) {
      console.log("🔴 Faltan campos:", {
        nombre,
        cedula,
        celular,
        direccion,
        email,
        password,
        rol
      })
      return res.status(400).json({ message: "Faltan campos obligatorios" })
    }

    const emailNormalizado = email.trim().toLowerCase()

    // Verificar si ya existe un usuario con ese email
    const existeSnapshot = await db.collection("users")
      .where("email", "==", emailNormalizado)
      .limit(1)
      .get()

    if (!existeSnapshot.empty) {
      console.log("🔴 Usuario ya existe")
      return res.status(400).json({ message: "El usuario ya existe" })
    }

    // Hash de password manualmente (antes lo hacía el pre-save de Mongoose)
    const hashedPassword = await bcrypt.hash(password, 10)

    const nuevoUsuario = {
      nombre,
      cedula,
      celular,
      direccion,
      email: emailNormalizado,
      password: hashedPassword,
      rol,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const docRef = await db.collection("users").add(nuevoUsuario)

    console.log("✅ Usuario guardado correctamente con ID:", docRef.id)

    res.status(201).json({ message: "Usuario creado correctamente" })

  } catch (error) {
    console.error("🔥 ERROR CREAR USUARIO:", error)
    res.status(500).json({ message: error.message })
  }
}