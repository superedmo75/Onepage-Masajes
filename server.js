const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Asegurar que la carpeta 'images' existe
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// Credenciales fijas para desarrollo local
const ADMIN_USER = "admin";
const ADMIN_PASS = "zenvibe2026";

// Endpoint de login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true, token: "session_token_zenvibe_2026" });
  } else {
    res.status(401).json({ success: false, message: "Usuario o contraseña incorrectos" });
  }
});

// Endpoint para guardar el contenido JSON
app.post('/api/save', (req, res) => {
  try {
    const newContent = req.body;
    const dataPath = path.join(__dirname, 'data', 'content.json');
    
    // Asegurar que la carpeta 'data' existe
    const dataDir = path.dirname(dataPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(dataPath, JSON.stringify(newContent, null, 2), 'utf8');
    res.json({ success: true, message: "Contenido guardado correctamente" });
  } catch (error) {
    console.error("Error al guardar contenido:", error);
    res.status(500).json({ success: false, message: "Error al guardar el archivo" });
  }
});

// Endpoint para subir imágenes en base64
app.post('/api/upload', (req, res) => {
  try {
    const { name, base64 } = req.body;
    if (!base64 || !name) {
      return res.status(400).json({ success: false, message: "Nombre de archivo o datos base64 faltantes" });
    }

    // Generar un nombre único de archivo para evitar sobreescribir existentes
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(name) || '.png';
    const cleanName = path.basename(name, ext).replace(/[^a-zA-Z0-9]/g, '-');
    const uniqueFilename = `${cleanName}-${uniqueSuffix}${ext}`;
    
    const filePath = path.join(__dirname, 'images', uniqueFilename);
    const buffer = Buffer.from(base64, 'base64');

    fs.writeFileSync(filePath, buffer);

    res.json({ 
      success: true, 
      imageUrl: `images/${uniqueFilename}`,
      filename: uniqueFilename
    });
  } catch (error) {
    console.error("Error al subir imagen:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor de desarrollo corriendo en http://localhost:${PORT}`);
});
