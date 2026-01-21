import express from "express";
import multer from "multer";
import sharp from "sharp";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.post("/renderizar", upload.any(), async (req, res) => {
  try {
    const imagenFile = req.files.find(f => f.fieldname === "imagen");
    const datosRaw = req.body.datos;

    if (!imagenFile) {
      return res.status(400).send("No llegó imagen");
    }

    if (!datosRaw) {
      return res.status(400).send("No llegaron datos");
    }

    const datos = JSON.parse(datosRaw);

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080">
        <style>
          .titulo { fill: white; font-size: 48px; font-weight: bold; font-family: Arial, sans-serif; }
          .texto { fill: white; font-size: 32px; font-family: Arial, sans-serif; }
        </style>
        <text x="40" y="80" class="titulo">${datos.titulo}</text>
        <text x="40" y="150" class="texto">${datos.linea1}</text>
        <text x="40" y="200" class="texto">${datos.linea2}</text>
        <text x="40" y="250" class="texto">${datos.linea3}</text>
        <text x="40" y="300" class="texto">${datos.linea4}</text>
      </svg>
    `;

    const finalImage = await sharp(imagenFile.buffer)
      .resize(1080, 1080)
      .composite([{ input: Buffer.from(svg) }])
      .png()
      .toBuffer();

    res.set("Content-Type", "image/png");
    res.send(finalImage);

  } catch (err) {
    console.error("ERROR RENDER:", err);
    res.status(500).send("Error renderizando imagen");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor escuchando en puerto", PORT);
});
