import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { db } from "../config/db.js"

/* LOGIN ADMIN (WEB) */
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body

    const snapshot = await db.collection("users")
      .where("email", "==", email)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return res.status(401).json({ message: "Credenciales incorrectas" })
    }

    const userDoc = snapshot.docs[0]
    const user = { id: userDoc.id, ...userDoc.data() }

    if (user.rol !== "ADMIN") {
      return res.status(401).json({ message: "Credenciales incorrectas" })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)

    if (!isValid) {
      return res.status(401).json({ message: "Credenciales incorrectas" })
    }

    const token = jwt.sign(
      { userId: user.id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    )

    res.json({ token })

  } catch (error) {
    console.error("Error en login admin:", error)
    res.status(500).json({ message: "Error en login admin" })
  }
}

/* LOGIN COBRADOR (MOBILE) */
export const loginCobrador = async (req, res) => {
  try {
    const { email, password } = req.body

    const snapshot = await db.collection("users")
      .where("email", "==", email)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return res.status(401).json({ message: "Credenciales incorrectas" })
    }

    const userDoc = snapshot.docs[0]
    const user = { id: userDoc.id, ...userDoc.data() }

    if (user.rol !== "COBRADOR") {
      return res.status(401).json({ message: "Credenciales incorrectas" })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)

    if (!isValid) {
      return res.status(401).json({ message: "Credenciales incorrectas" })
    }

    const token = jwt.sign(
      { userId: user.id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    )

    res.json({ token })

  } catch (error) {
    console.error("Error en login cobrador:", error)
    res.status(500).json({ message: "Error en login cobrador" })
  }
}