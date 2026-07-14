// Usar el fetch global de Node 18+ para evitar requerir dependencias externas
const path = require('path');

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: "Método no permitido" }),
    };
  }

  try {
    const { name, type, base64 } = JSON.parse(event.body);

    if (!base64 || !name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Nombre de archivo o datos base64 faltantes" }),
      };
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO;
    const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

    if (!GITHUB_TOKEN || !GITHUB_REPO) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: false,
          message: "Configuración incompleta en Netlify: Asegúrate de añadir las variables de entorno GITHUB_TOKEN y GITHUB_REPO para guardar imágenes en producción."
        }),
      };
    }

    // Generar un nombre único de archivo para evitar sobreescribir existentes
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(name) || '.png';
    const cleanName = path.basename(name, ext).replace(/[^a-zA-Z0-9]/g, '-');
    const uniqueFilename = `${cleanName}-${uniqueSuffix}${ext}`;
    
    const filePath = `images/${uniqueFilename}`;
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;

    // Subir imagen a GitHub (PUT)
    const putBody = {
      message: `Subida de imagen ${uniqueFilename} desde el Editor Visual`,
      content: base64, // El contenido ya está en base64 limpio enviado desde el cliente
      branch: GITHUB_BRANCH
    };

    const putResponse = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "Netlify-Function-ZenVibe",
        "Accept": "application/vnd.github.v3+json"
      },
      body: JSON.stringify(putBody)
    });

    const putResult = await putResponse.json();

    if (putResponse.ok) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          success: true, 
          imageUrl: filePath,
          filename: uniqueFilename
        }),
      };
    } else {
      throw new Error(putResult.message || "Error al subir la imagen a GitHub");
    }

  } catch (error) {
    console.error("Error en upload function:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: error.message }),
    };
  }
};
