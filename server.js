const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

const cors = require("cors");
app.use(cors());

app.use(express.json());

app.use("/Jose", require("./Jose")); // clientes
app.use("/william", require("./William")); // clientes

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});


