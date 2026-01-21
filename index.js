import express from "express";
import multer from "multer";
import sharp from "sharp";

const app = express();
const upload = multer();

app.post("/renderizar", upload.any(), async (req, res) => {
  try {

    const imagenFile = req.files.find(f => f.fieldname === "imagen");
    const datosRaw = req.body.datos;

    if (!imagenFile || !datosRaw) {
      return res.status(400).send("Faltan campos imagen o datos");
    }

    const baseImage = imagenFile.buffer;
    const datos = JSON.parse(datosRaw);

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

    const finalImage = await sharp(baseImage)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .png()
      .toBuffer();

    res.set("Content-Type", "image/png");
    res.send(finalImage);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error renderizando imagen");
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor escuchando en puerto", PORT);
});

