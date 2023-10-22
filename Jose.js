const express = require("express");
const fs = require("fs");
const cron = require('node-cron');
const router = express.Router();



const { MongoClient, ServerApiVersion } = require("mongodb");
const { ObjectId } = require("mongodb");
const uri =
	"mongodb+srv://riocuarto:3122113787@cluster0.bo3lerw.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});


//obtener cuadre
router.get("/cuadre",async (req, res)=>{
  try {
		// Conectar a la base de datos
		await client.connect();
		const database = client.db("RioCuarto");
		const cuadre = database.collection("cuadre");

		// Operación
		const data = cuadre.find();
		const semanas = [];

		if ((await cuadre.countDocuments()) === 0) {
			res.status(200).send("No hay ningun cuadre semanal en la base de datos");
			return; // Sale de la función aquí si no hay clientes
		}

		for await (const semana of data) {
			// Convertir el _id a una cadena de caracteres
      const cuadreStringId = { ...semana, _id: semana._id.toString() };
			semanas.push(cuadreStringId);
		}
		// Cerrar la conexión después de manejar la operación
		await client.close();

		// Enviar la lista de clientes con _id convertido
		res.send(semanas);
		console.log("cuadre enviados correctamente");
	} catch (error) {
		console.error("Error al obtener cuadre:", error);
		res.status(500).send("Error al obtener cuadre");
	}
})


// obtener lista de clientes 							lista
router.get("/", async (req, res) => {
	try {
		// Conectar a la base de datos
		await client.connect();
		const database = client.db("RioCuarto");
		const clients = database.collection("clients");

		// Operación
		const data = clients.find();
		let clientes = [];

		if ((await clients.countDocuments()) === 0) {
			res.status(200).send("No hay clientes en la base de datos");
			return; // Sale de la función aquí si no hay clientes
		}

		for await (const cliente of data) {
			// Convertir el _id a una cadena de caracteres
			const clientWithStrId = { ...cliente, _id: cliente._id.toString() };
			clientes.push(clientWithStrId);
		}

		// Cerrar la conexión después de manejar la operación
		await client.close();

		// Enviar la lista de clientes con _id convertido
		res.send(clientes);
		console.log("clientes enviados correctamente");
	} catch (error) {
		console.error("Error al obtener clientes:", error);
		res.status(500).send("Error al obtener clientes");
	}
});

// añadir nuevo cliente                                        lista
router.post("/", async (req, res) => {
	try {
		// Conectarse al cliente
		await client.connect();

		const database = client.db("RioCuarto");
		const clients = database.collection("clients");

		const newClient = {
			activo: true,
			...req.body,
			prestamos: [],
			historial: [],
		};

		const result = await clients.insertOne(newClient);
		console.log(
			`A document was inserted with the _id: ${result.insertedId}`
		);

		// Cerrar la conexión después de manejar la operación
		await client.close();

		res.status(200).send("Cliente agregado correctamente");
	} catch (error) {
		console.error("Error al agregar el cliente:", error);
		res.status(500).send("Error al agregar el cliente");
	}
});

// agregar prestamo							listo
router.post("/:idClient/loans", async (req, res) => {
	try {
		const clientId = req.params.idClient;
		const loanData = req.body; // Datos del préstamo que vienen en el body de la solicitud

		// Generar un nuevo ObjectId para el préstamo
		const newLoanId = new ObjectId();
    

		// Agregar propiedades al objeto del préstamo
		loanData._id = newLoanId;
		loanData.cancelado = false;
		loanData.resta = req.body.monto;
		loanData.cuotas = [];

		// Conectar a la base de datos
		await client.connect();
		const database = client.db("RioCuarto");
		const clients = database.collection("clients");

		// Convertir el id de cadena de caracteres a ObjectId
		const objectId = ObjectId.createFromHexString(clientId);

		// Actualizar la propiedad 'prestamos' del cliente con el nuevo préstamo
		const result = await clients.updateOne(
			{ _id: objectId },
			{ $push: { prestamos: loanData } }
		);

		// Cerrar la conexión después de manejar la operación
		await client.close();

		if (result.modifiedCount === 0) {
			res.status(404).send("Cliente no encontrado");
			return;
		}

		res.send("Préstamo agregado exitosamente");
		console.log("Préstamo agregado exitosamente");
    cuadre(req.body.monto,0,req.body.fecha)
	} catch (error) {
		console.error("Error al agregar préstamo:", error);
		res.status(500).send("Error al agregar préstamo");
	}
});

// eliminar prestamo									listo
router.delete("/:idClient/loans/:idLoan", async (req, res) => {
	try {
		const { idClient, idLoan } = req.params;

		// Conectar a la base de datos
		await client.connect();
		const database = client.db("RioCuarto");
		const clients = database.collection("clients");

		const objectId = new ObjectId(idClient);
    
		// Obtener el cliente
		const cliente = await clients.findOne({ _id: objectId });

		if (!cliente) {
			await client.close();
			return res.status(404).send("Cliente no encontrado");
		}

		// Buscar el préstamo en la lista de préstamos del cliente
		const prestamo = cliente.prestamos.find(p => p._id.toString() === idLoan);

		if (!prestamo) {
			await client.close();
			return res.status(404).send("Préstamo no encontrado");
		}

		const monto = prestamo.monto;

		// Eliminar el préstamo del cliente
		const result = await clients.updateOne(
			{ _id: objectId },
			{ $pull: { prestamos: { _id: new ObjectId(idLoan) } } }
		);

		await client.close();

		if (result.modifiedCount > 0) {
			res.send("Préstamo eliminado correctamente");
			console.log("Préstamo eliminado correctamente");
			
			// Agregar aquí la lógica para realizar el cuadre
			cuadre(-monto, 0, "");
		} else {
			res.status(404).send("Préstamo no encontrado");
		}
	} catch (error) {
		console.error("Error al eliminar préstamo:", error);
		res.status(500).send("Error al eliminar préstamo");
	}
});


// Agregar cuota al préstamo                listo
router.post("/:idClient/loans/:idLoan/cuotas", async (req, res) => {
	try {
		const { idClient, idLoan } = req.params;

		// Generar un nuevo ObjectId para la cuota
		const newCuotaId = new ObjectId();

		// Datos de la cuota con el nuevo ID
		const newCuota = {
			_id: newCuotaId,
			...req.body,
		};

		// Conectar a la base de datos
		await client.connect();
		const database = client.db("RioCuarto");
		const clients = database.collection("clients");

		const objectIdClient = ObjectId.createFromHexString(idClient);
		const objectIdLoan = ObjectId.createFromHexString(idLoan);

		const result = await clients.updateOne(
			{ _id: objectIdClient, "prestamos._id": objectIdLoan },
			{ $push: { "prestamos.$.cuotas": newCuota } }
		);

		if (result.modifiedCount > 0) {
			// Obtener el préstamo actualizado
			const updatedClient = await clients.findOne({
				_id: objectIdClient,
			});
			const updatedLoan = updatedClient.prestamos.find((loan) =>
				loan._id.equals(objectIdLoan)
			);

			// Realizar el tratamiento adicional
			const parsedResta = updatedLoan.resta;
			const parsedMonto = req.body.monto;
			updatedLoan.resta = parsedResta - parsedMonto;

			if (parseInt(updatedLoan.resta) === 0) {
				updatedLoan.cancelado = true;
				updatedLoan.fechaPago = req.body.fecha;
				const loanIndex = updatedClient.prestamos.findIndex((loan) =>
					loan._id.equals(objectIdLoan)
				);
				updatedClient.historial.unshift(updatedLoan);
				updatedClient.prestamos.splice(loanIndex, 1);
			}

			await clients.updateOne(
				{ _id: objectIdClient },
				{
					$set: {
						prestamos: updatedClient.prestamos,
						historial: updatedClient.historial,
					},
				}
			);

			await client.close();

			res.send("Cuota agregada correctamente");
			console.log("Cuota agregada correctamente");
      cuadre(0,req.body.monto,req.body.fecha)
		} else {
			res.status(404).send("Cliente o préstamo no encontrado");
		}
	} catch (error) {
		console.error("Error al agregar cuota:", error);
		res.status(500).send("Error al agregar cuota");
	}
});

// eliminar cuota                           listo
router.delete("/:idClient/loans/:idLoan/cuotas/:idCuota", async (req, res) => {
	try {
		const { idClient, idLoan, idCuota } = req.params;

		// Conectar a la base de datos
		await client.connect();
		const database = client.db("RioCuarto");
		const clients = database.collection("clients");


		const objectIdClient = ObjectId.createFromHexString(idClient);
		const objectIdLoan = ObjectId.createFromHexString(idLoan);
		const objectIdCuota = ObjectId.createFromHexString(idCuota);

		const updatedClient = await clients.findOne({ _id: objectIdClient });
		const updatedLoan = updatedClient.prestamos.find((loan) =>
			loan._id.equals(objectIdLoan)
		);
		const cuotaToDelete = updatedLoan.cuotas.find((cuota) =>
			cuota._id.equals(objectIdCuota)
		);

		// Sumar el monto de la cuota eliminada al monto que resta
		const parsedMonto = cuotaToDelete.monto;
		updatedLoan.resta += parsedMonto;

		// Eliminar la cuota de la lista de cuotas del préstamo
		updatedLoan.cuotas = updatedLoan.cuotas.filter(
			(cuota) => !cuota._id.equals(objectIdCuota)
		);

		// Guardar el préstamo actualizado en la base de datos
		await clients.updateOne(
			{ _id: objectIdClient },
			{ $set: { prestamos: updatedClient.prestamos } }
		);

		await client.close();

		res.send("Cuota eliminada correctamente y monto sumado al préstamo");
		console.log("Cuota eliminada correctamente y monto sumado al préstamo");
	} catch (error) {
		console.error("Error al eliminar cuota:", error);
		res.status(500).send("Error al eliminar cuota");
	}
});


// Función para obtener el lunes más cercano en el pasado a partir de una fecha
function obtenerLunesMasCercano(fecha) {
  var diaSemana = fecha.getDay(); // Obtener el día de la semana (0 para domingo, 1 para lunes, etc.)
  var diferenciaDias = diaSemana - 1; // Calcula la diferencia de días con respecto al lunes
  if (diferenciaDias < 0) {
    // Si es domingo (0), ajustamos la diferencia para ir al lunes de la semana pasada
    diferenciaDias = 6;
  }
  var fechaLunes = new Date(fecha);
  fechaLunes.setDate(fecha.getDate() - diferenciaDias); // Resta los días necesarios para llegar al lunes
  fechaLunes.setHours(0, 0, 0, 0); // Establece la hora en 00:00:00
  return fechaLunes;
}

//funcion para manipular la collecion cuadre
async function cuadre(prestamo, cuota, fecha) {
  console.log(fecha)
  try {
    await client.connect();
    const database = client.db("RioCuarto");
    const cuadre = database.collection("cuadre");

    const fechaActual = fecha === '' ? new Date() : new Date(fecha);
    const fechalunes = obtenerLunesMasCercano(fechaActual);
    const query = { fechaInicio: fechalunes };
    const update = {
      $inc: { prestado: prestamo, cobrado: cuota, adeudado: prestamo - cuota }
    };

    // Usa el método updateOne con upsert: true para insertar un nuevo documento si no se encuentra uno existente
    const result = await cuadre.updateOne(query, update, { upsert: true });

    if (result.modifiedCount === 0 && result.upsertedCount === 0) {
      console.error("No se encontraron ni se crearon documentos.");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Cerrar la conexión después de manejar la operación
    if (client) {
      await client.close();
    }
  }
}





module.exports = router;
