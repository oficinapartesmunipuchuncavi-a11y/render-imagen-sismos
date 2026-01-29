import express from "express";
import multer from "multer";
import sharp from "sharp";
import fetch from "node-fetch";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * URL RAW DEL LOGO (GitHub RAW)
 */
const LOGO_URL =
  "https://raw.githubusercontent.com/oficinapartesmunipuchuncavi-a11y/activos/main/logo2.png";

app.post("/renderizar", upload.any(), async (req, res) => {
  try {
    // =========================
    // VALIDACIONES
    // =========================
    const imagenFile = req.files.find(f => f.fieldname === "imagen");
    const datosRaw = req.body.datos;

    if (!imagenFile) {
      return res.status(400).send("No llegó imagen");
    }

    if (!datosRaw) {
      return res.status(400).send("No llegaron datos");
    }

    const datos = JSON.parse(datosRaw);

    // =========================
    // DESCARGAR LOGO
    // =========================
    const logoResponse = await fetch(LOGO_URL);
    if (!logoResponse.ok) {
      throw new Error("No se pudo descargar el logo");
    }

    const logoBuffer = await sharp(
      Buffer.from(await logoResponse.arrayBuffer())
    )
      .resize(100, 100)
      .png() // el logo puede seguir siendo PNG
      .toBuffer();

    // =========================
    // SVG OVERLAY (TEXTOS)
    // =========================
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080">
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

    // =========================
    // RENDER FINAL (JPG)
    // =========================
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
      .jpeg({ quality: 90 }) // 👈 JPG FINAL
      .toBuffer();

    // =========================
    // HEADERS CORRECTOS
    // =========================
    res.set("Content-Type", "image/jpeg");
    res.set(
      "Content-Disposition",
      'inline; filename="render.jpg"'
    );

    res.send(finalImage);

  } catch (err) {
    console.error("ERROR RENDER:", err);
    res.status(500).send("Error renderizando imagen");
  }
});

// =======================================
// PROXY MAPBOX → URL LISTA PARA REDES
// =======================================
app.get("/mapbox", async (req, res) => {
  try {
    const mapboxUrl = req.query.url;

    if (!mapboxUrl) {
      return res.status(400).send("Falta parámetro ?url=");
    }

    // Seguridad mínima: solo permitir Mapbox
    if (!mapboxUrl.startsWith("https://api.mapbox.com/")) {
      return res.status(400).send("Solo se permite api.mapbox.com");
    }

    const response = await fetch(mapboxUrl);

    if (!response.ok) {
      return res
        .status(502)
        .send("Error al obtener imagen desde Mapbox");
    }

    const contentType =
      response.headers.get("content-type") || "image/jpeg";

    const buffer = Buffer.from(await response.arrayBuffer());

    // Headers compatibles con Instagram / Facebook
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=3600");

    res.send(buffer);
  } catch (err) {
    console.error("ERROR MAPBOX PROXY:", err);
    res.status(500).send("Error proxy Mapbox");
  }
});

// =========================
// SERVER
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor escuchando en puerto", PORT);
});
