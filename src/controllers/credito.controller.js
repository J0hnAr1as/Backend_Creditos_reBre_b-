import { db } from "../config/db.js"
import jwt from "jsonwebtoken"

/*
========================================
HELPER - VALIDAR TOKEN
========================================
*/
const obtenerUsuarioDesdeToken = (req) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return null

  const token = authHeader.split(" ")[1]
  return jwt.verify(token, process.env.JWT_SECRET)
}

/*
========================================
CREAR CRÉDITO
========================================
*/
export const crearCredito = async (req, res) => {
  try {

    const decoded = obtenerUsuarioDesdeToken(req)
    if (!decoded) {
      return res.status(401).json({ message: "No autorizado" })
    }

    const { clienteId, montoPrestamo, montoAPagar, fechaPago } = req.body

    if (!clienteId || !montoPrestamo || !montoAPagar || !fechaPago) {
      return res.status(400).json({ message: "Datos incompletos" })
    }

    // Verificar que el cliente existe
    const clienteDoc = await db.collection("clientes").doc(clienteId).get()
    if (!clienteDoc.exists) {
      return res.status(404).json({ message: "Cliente no encontrado" })
    }

    // No permitir otro pendiente
    const pendienteSnapshot = await db.collection("creditos")
      .where("clienteId", "==", clienteId)
      .where("estado", "==", "PENDIENTE")
      .limit(1)
      .get()

    if (!pendienteSnapshot.empty) {
      return res.status(400).json({
        message:
          "El cliente ya tiene un crédito pendiente. Debe pagarlo antes de crear uno nuevo."
      })
    }

    const nuevoCredito = {
      clienteId,
      cobradorId: decoded.userId,
      montoPrestamo: Number(montoPrestamo),
      montoAPagar: Number(montoAPagar),
      saldoPendiente: Number(montoAPagar),
      fechaPago: new Date(fechaPago),
      fechaOrigen: new Date(),
      estado: "PENDIENTE",
      abonos: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const docRef = await db.collection("creditos").add(nuevoCredito)

    res.status(201).json({
      _id: docRef.id,
      ...nuevoCredito
    })

  } catch (error) {
    console.log("Error creando crédito:", error)
    res.status(500).json({ message: "Error creando crédito" })
  }
}

/*
========================================
OBTENER CRÉDITOS POR CLIENTE
========================================
*/
export const obtenerCreditosPorCliente = async (req, res) => {
  try {

    const { clienteId } = req.params

    const snapshot = await db.collection("creditos")
      .where("clienteId", "==", clienteId)
      .orderBy("createdAt", "desc")
      .get()

    const creditos = []
    for (const doc of snapshot.docs) {
      const data = doc.data()

      // Populate manual del cliente
      let clienteData = null
      if (data.clienteId) {
        const clienteDoc = await db.collection("clientes").doc(data.clienteId).get()
        if (clienteDoc.exists) {
          const cd = clienteDoc.data()
          clienteData = { _id: clienteDoc.id, nombre: cd.nombre, cedula: cd.cedula }
        }
      }

      creditos.push({
        _id: doc.id,
        ...data,
        clienteId: clienteData || data.clienteId,
        fechaPago: data.fechaPago?.toDate ? data.fechaPago.toDate() : data.fechaPago,
        fechaOrigen: data.fechaOrigen?.toDate ? data.fechaOrigen.toDate() : data.fechaOrigen,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        abonos: (data.abonos || []).map(a => ({
          ...a,
          fecha: a.fecha?.toDate ? a.fecha.toDate() : a.fecha
        }))
      })
    }

    res.json(creditos)

  } catch (error) {
    console.log("Error obteniendo créditos:", error)
    res.status(500).json({ message: "Error obteniendo créditos" })
  }
}

/*
========================================
OBTENER TODOS LOS CRÉDITOS DEL COBRADOR
========================================
*/
export const obtenerCreditosDelCobrador = async (req, res) => {
  try {

    const decoded = obtenerUsuarioDesdeToken(req)
    if (!decoded) {
      return res.status(401).json({ message: "No autorizado" })
    }

    const snapshot = await db.collection("creditos")
      .where("cobradorId", "==", decoded.userId)
      .orderBy("createdAt", "desc")
      .get()

    const creditos = []
    for (const doc of snapshot.docs) {
      const data = doc.data()

      // Populate manual del cliente
      let clienteData = null
      if (data.clienteId) {
        const clienteDoc = await db.collection("clientes").doc(data.clienteId).get()
        if (clienteDoc.exists) {
          const cd = clienteDoc.data()
          clienteData = { _id: clienteDoc.id, nombre: cd.nombre, cedula: cd.cedula }
        }
      }

      creditos.push({
        _id: doc.id,
        ...data,
        clienteId: clienteData || data.clienteId,
        fechaPago: data.fechaPago?.toDate ? data.fechaPago.toDate() : data.fechaPago,
        fechaOrigen: data.fechaOrigen?.toDate ? data.fechaOrigen.toDate() : data.fechaOrigen,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        abonos: (data.abonos || []).map(a => ({
          ...a,
          fecha: a.fecha?.toDate ? a.fecha.toDate() : a.fecha
        }))
      })
    }

    res.json(creditos)

  } catch (error) {
    console.log("Error obteniendo créditos:", error)
    res.status(500).json({ message: "Error obteniendo créditos" })
  }
}

/*
========================================
ABONAR A CRÉDITO
========================================
*/
export const abonarCredito = async (req, res) => {
  try {

    const decoded = obtenerUsuarioDesdeToken(req)
    if (!decoded) {
      return res.status(401).json({ message: "No autorizado" })
    }

    const { id } = req.params
    const { monto } = req.body

    if (!monto || Number(monto) <= 0) {
      return res.status(400).json({ message: "Monto inválido" })
    }

    const creditoRef = db.collection("creditos").doc(id)
    const creditoDoc = await creditoRef.get()

    if (!creditoDoc.exists) {
      return res.status(404).json({ message: "Crédito no encontrado" })
    }

    const credito = creditoDoc.data()

    // Solo el dueño puede abonar
    if (credito.cobradorId !== decoded.userId) {
      return res.status(403).json({ message: "No autorizado para este crédito" })
    }

    if (credito.estado === "PAGADO") {
      return res.status(400).json({ message: "El crédito ya está pagado" })
    }

    if (Number(monto) > credito.saldoPendiente) {
      return res.status(400).json({
        message: "El abono no puede ser mayor al saldo pendiente"
      })
    }

    const nuevoSaldo = credito.saldoPendiente - Number(monto)
    const nuevoAbono = {
      monto: Number(monto),
      fecha: new Date()
    }

    const abonos = credito.abonos || []
    abonos.push(nuevoAbono)

    const updateData = {
      saldoPendiente: nuevoSaldo,
      abonos,
      updatedAt: new Date()
    }

    if (nuevoSaldo === 0) {
      updateData.estado = "PAGADO"
    }

    await creditoRef.update(updateData)

    const creditoActualizado = {
      _id: id,
      ...credito,
      ...updateData
    }

    res.json({
      message: "Abono registrado correctamente",
      credito: creditoActualizado
    })

  } catch (error) {
    console.log("Error registrando abono:", error)
    res.status(500).json({ message: "Error registrando abono" })
  }
}

/*
========================================
MARCAR COMO PAGADO
========================================
*/
export const marcarComoPagado = async (req, res) => {
  try {

    const decoded = obtenerUsuarioDesdeToken(req)
    if (!decoded) {
      return res.status(401).json({ message: "No autorizado" })
    }

    const { id } = req.params

    const creditoRef = db.collection("creditos").doc(id)
    const creditoDoc = await creditoRef.get()

    if (!creditoDoc.exists) {
      return res.status(404).json({ message: "Crédito no encontrado" })
    }

    const credito = creditoDoc.data()

    if (credito.cobradorId !== decoded.userId) {
      return res.status(403).json({ message: "No autorizado para este crédito" })
    }

    await creditoRef.update({
      estado: "PAGADO",
      saldoPendiente: 0,
      updatedAt: new Date()
    })

    res.json({ message: "Crédito marcado como PAGADO" })

  } catch (error) {
    console.log("Error marcando crédito como pagado:", error)
    res.status(500).json({ message: "Error actualizando crédito" })
  }
}

/*
========================================
OBTENER CRÉDITOS POR COBRADOR (ADMIN)
========================================
*/
export const obtenerCreditosPorCobrador = async (req, res) => {
  try {

    const { cobradorId } = req.params

    if (!cobradorId) {
      return res.status(400).json({ message: "CobradorId requerido" })
    }

    const snapshot = await db.collection("creditos")
      .where("cobradorId", "==", cobradorId)
      .orderBy("createdAt", "desc")
      .get()

    const creditos = []
    for (const doc of snapshot.docs) {
      const data = doc.data()

      // Populate manual del cliente
      let clienteData = null
      if (data.clienteId) {
        const clienteDoc = await db.collection("clientes").doc(data.clienteId).get()
        if (clienteDoc.exists) {
          const cd = clienteDoc.data()
          clienteData = { _id: clienteDoc.id, nombre: cd.nombre, cedula: cd.cedula }
        }
      }

      creditos.push({
        _id: doc.id,
        ...data,
        clienteId: clienteData || data.clienteId,
        fechaPago: data.fechaPago?.toDate ? data.fechaPago.toDate() : data.fechaPago,
        fechaOrigen: data.fechaOrigen?.toDate ? data.fechaOrigen.toDate() : data.fechaOrigen,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        abonos: (data.abonos || []).map(a => ({
          ...a,
          fecha: a.fecha?.toDate ? a.fecha.toDate() : a.fecha
        }))
      })
    }

    res.json(creditos)

  } catch (error) {
    console.log("Error obteniendo créditos por cobrador:", error)
    res.status(500).json({ message: "Error obteniendo créditos" })
  }
}