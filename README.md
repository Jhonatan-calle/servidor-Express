# Servidor de Préstamos - Versión Preliminar

Este es un pequeño servidor desarrollado con Express que recibe solicitudes GET, POST y DELETE para una versión preliminar de una aplicación de préstamos. Este proyecto sirve como una demostración de mis conocimientos sobre desarrollo backend y servidores, mostrando un sistema básico pero funcional para manejar solicitudes relacionadas con la gestión de préstamos y deudas.

## Descripción

Este servidor permite realizar las siguientes operaciones:

- **GET**: Obtener la información de préstamos y deudas almacenados en el servidor.
- **POST**: Registrar nuevos préstamos o deudas en el sistema.
- **PUT**: Actualizar la información de un préstamo o deuda existente.
- **DELETE**: Eliminar un préstamo o deuda del sistema.

Aunque es una versión preliminar, el servidor demuestra la estructura básica de un API RESTful que podría utilizarse en aplicaciones más complejas. Es una muestra de mi capacidad para implementar servicios backend y manejar solicitudes HTTP.

## Herramientas Utilizadas

Este proyecto se ha implementado utilizando las siguientes herramientas:

- **Express**: Un framework web para Node.js que facilita la creación de servidores y APIs RESTful. Se utilizó para manejar las solicitudes y respuestas HTTP.
- **Node.js**: Entorno de ejecución para JavaScript, utilizado para desarrollar el servidor backend.
- **Nodemon**: Herramienta que reinicia automáticamente el servidor cuando se detectan cambios en el código, facilitando el desarrollo.

## Estado del Proyecto

El servidor es funcional en su versión preliminar, aunque no está en producción ni se planea su desarrollo adicional. Está disponible como referencia y ejemplo de implementación básica de un servidor backend.

## Instalación y Ejecución

Para probar o utilizar el servidor, es necesario:

1. Clonar este repositorio.
2. Instalar las dependencias necesarias utilizando npm.
3. Ejecutar el servidor en tu entorno local.

```bash
git clone https://github.com/tu-usuario/servidor-prestamos.git
cd servidor-prestamos
npm install
npm start
