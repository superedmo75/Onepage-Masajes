exports.handler = async (event, context) => {
  // Solo permitir solicitudes POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: "Método no permitido" }),
    };
  }

  try {
    const { username, password } = JSON.parse(event.body);

    // Obtener credenciales de variables de entorno o usar valores por defecto
    const ADMIN_USER = process.env.ADMIN_USER || "admin";
    const ADMIN_PASS = process.env.ADMIN_PASS || "zenvibe2026";

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: true, token: "session_token_zenvibe_2026" }),
      };
    } else {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message: "Usuario o contraseña incorrectos" }),
      };
    }
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: "Datos de entrada inválidos" }),
    };
  }
};
