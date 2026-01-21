import express from "express";
import multer from "multer";
import sharp from "sharp";

const app = express();
const upload = multer();

// RUTA
app.post("/renderizar", upload.fields([
  { name: "imagen", maxCount: 1 },
  { name: "datos", maxCount: 1 }
]), async (req, res) => {
  try {
    const imagenBase = req.files.imagen[0].buffer;
    const datos = JSON.parse(req.body.datos);

    const svg = `
      <svg width="1200" height="675">
        <style>
          .titulo { fill: white; font-size: 48px; font-weight: bold; }
          .texto { fill: white; font-size: 32px; }
        </style>
        <text x="40" y="60" class="titulo">${datos.titulo}</text>
        <text x="40" y="120" class="texto">${datos.linea1}</text>
        <text x="40" y="170" class="texto">${datos.linea2}</text>
        <text x="40" y="220" class="texto">${datos.linea3}</text>
        <text x="40" y="270" class="texto">${datos.linea4}</text>
      </svg>
    `;

    const salida = await sharp(imagenBase)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .png()
      .toBuffer();

    res.set("Content-Type", "image/png");
    res.send(salida);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al renderizar" });
  }
});

// 🔥 ESTO ES LO QUE FALTABA
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});
