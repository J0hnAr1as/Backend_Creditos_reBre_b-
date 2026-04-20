import { db } from "../config/db.js"

/*
========================================
CREAR CLIENTE
========================================
*/
export const crearCliente = async (req, res) => {
  try {
    const { nombre, cedula, telefono, direccion, cobrador } = req.body

    if (!nombre || !cedula) {
      return res.status(400).json({
        message: "Nombre y cédula son obligatorios"
      })
    }

    // Verificar unicidad de cédula (reemplaza el unique index de Mongoose)
    const existeSnapshot = await db.collection("clientes")
      .where("cedula", "==", cedula.trim())
      .limit(1)
      .get()

    if (!existeSnapshot.empty) {
      return res.status(400).json({
        message: "Ya existe un cliente con esa cédula"
      })
    }

    const nuevoCliente = {
      nombre: nombre.trim(),
      cedula: cedula.trim(),
      telefono: telefono ? telefono.trim() : "",
      direccion: direccion ? direccion.trim() : "",
      cobrador: cobrador || req.user.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const docRef = await db.collection("clientes").add(nuevoCliente)

    return res.status(201).json({
      _id: docRef.id,
      ...nuevoCliente
    })

  } catch (error) {
    console.log("Error creando cliente:", error)
    return res.status(500).json({ message: "Error creando cliente" })
  }
}

/*
========================================
OBTENER CLIENTES SEGÚN ROL
========================================
*/
export const obtenerMisClientes = async (req, res) => {
  try {
    let query = db.collection("clientes")

    if (req.user.rol === "COBRADOR") {
      query = query.where("cobrador", "==", req.user.userId)
    }

    const snapshot = await query.get()

    const clientes = []
    for (const doc of snapshot.docs) {
      const data = doc.data()

      // Populate manual del cobrador
      let cobradorData = null
      if (data.cobrador) {
        const cobradorDoc = await db.collection("users").doc(data.cobrador).get()
        if (cobradorDoc.exists) {
          const cd = cobradorDoc.data()
          cobradorData = { _id: cobradorDoc.id, nombre: cd.nombre, email: cd.email }
        }
      }

      clientes.push({
        _id: doc.id,
        ...data,
        cobrador: cobradorData || data.cobrador
      })
    }

    return res.json(clientes)

  } catch (error) {
    console.log("Error obteniendo clientes:", error)
    return res.status(500).json({ message: "Error obteniendo clientes" })
  }
}

/*
========================================
OBTENER CLIENTES POR COBRADOR (ADMIN)
========================================
*/
export const obtenerClientesPorCobrador = async (req, res) => {
  try {
    const { cobradorId } = req.params

    const snapshot = await db.collection("clientes")
      .where("cobrador", "==", cobradorId)
      .get()

    const clientes = []
    for (const doc of snapshot.docs) {
      const data = doc.data()

      // Populate manual del cobrador
      let cobradorData = null
      if (data.cobrador) {
        const cobradorDoc = await db.collection("users").doc(data.cobrador).get()
        if (cobradorDoc.exists) {
          const cd = cobradorDoc.data()
          cobradorData = { _id: cobradorDoc.id, nombre: cd.nombre, email: cd.email }
        }
      }

      clientes.push({
        _id: doc.id,
        ...data,
        cobrador: cobradorData || data.cobrador
      })
    }

    res.json(clientes)

  } catch (error) {
    console.log("Error obteniendo clientes por cobrador:", error)
    res.status(500).json({ message: "Error obteniendo clientes" })
  }
}