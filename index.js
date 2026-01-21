import express from "express";
import multer from "multer";
import sharp from "sharp";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * URL RAW DEL LOGO (IMPORTANTE: raw.githubusercontent.com)
 */
const LOGO_URL =
  "https://raw.githubusercontent.com/oficinapartesmunipuchuncavi-a11y/activos/main/logo2.png";

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

    /**
     * Descargar logo desde GitHub RAW
     */
    const logoResponse = await fetch(LOGO_URL);
    if (!logoResponse.ok) {
      throw new Error("No se pudo descargar el logo");
    }
    const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());

    /**
     * SVG: cuadro negro inferior + texto centrado
     */
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080">

  <!-- Cuadro negro inferior -->
  <rect
    x="90"
    y="780"
    width="900"
    height="260"
    rx="22"
    ry="22"
    fill="rgba(0,0,0,0.70)"
  />

  <style>
    .titulo {
      fill: #ffffff;
      font-size: 34px;
      font-weight: bold;
      font-family: Arial, sans-serif;
      text-anchor: middle;
    }
    .texto {
      fill: #ffffff;
      font-size: 26px;
      font-family: Arial, sans-serif;
      text-anchor: middle;
    }
  </style>

  <text x="540" y="830" class="titulo">${datos.titulo}</text>
  <text x="540" y="875" class="texto">${datos.linea1}</text>
  <text x="540" y="915" class="texto">${datos.linea2}</text>
  <text x="540" y="955" class="texto">${datos.linea3}</text>
  <text x="540" y="995" class="texto">${datos.linea4}</text>

</svg>
`;

    /**
     * Render final
     */
    const finalImage = await sharp(imagenFile.buffer)
      .resize(1080, 1080)
      .composite([
        {
          input: logoBuffer,
          top: 30,
          left: 30
        },
        {
          input: Buffer.from(svg),
          top: 0,
          left: 0
        }
      ])
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
