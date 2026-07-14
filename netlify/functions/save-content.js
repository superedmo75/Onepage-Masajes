// Usar el fetch global de Node 18+ para evitar requerir dependencias externas

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: "Método no permitido" }),
    };
  }

  try {
    const newContent = JSON.parse(event.body);

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO; // Formato: "usuario/repositorio"
    const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

    // Si no están configuradas las variables, informamos de forma amigable
    if (!GITHUB_TOKEN || !GITHUB_REPO) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: false,
          message: "Configuración incompleta en Netlify: Asegúrate de añadir las variables de entorno GITHUB_TOKEN y GITHUB_REPO para guardar cambios en producción."
        }),
      };
    }

    const filePath = "data/content.json";
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;

    // 1. Obtener el SHA actual del archivo (necesario para actualizar en GitHub)
    let currentSha = null;
    try {
      const getResponse = await fetch(`${apiUrl}?ref=${GITHUB_BRANCH}`, {
        headers: {
          "Authorization": `Bearer ${GITHUB_TOKEN}`,
          "User-Agent": "Netlify-Function-ZenVibe",
          "Accept": "application/vnd.github.v3+json"
        }
      });

      if (getResponse.ok) {
        const fileData = await getResponse.json();
        currentSha = fileData.sha;
      }
    } catch (e) {
      console.log("El archivo no existe aún o hubo un error al buscar el SHA:", e);
    }

    // 2. Codificar el nuevo contenido en Base64
    const contentString = JSON.stringify(newContent, null, 2);
    const base64Content = Buffer.from(contentString, 'utf-8').toString('base64');

    // 3. Hacer el commit a GitHub (PUT)
    const putBody = {
      message: "Actualización de contenido desde el Editor Visual",
      content: base64Content,
      branch: GITHUB_BRANCH
    };

    if (currentSha) {
      putBody.sha = currentSha;
    }

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
          message: "Contenido guardado y confirmado en GitHub con éxito. El sitio se reconstruirá automáticamente en 1 minuto." 
        }),
      };
    } else {
      throw new Error(putResult.message || "Error al subir cambios a GitHub");
    }

  } catch (error) {
    console.error("Error en save-content:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: error.message }),
    };
  }
};
