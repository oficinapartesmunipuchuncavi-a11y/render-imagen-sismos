import express from "express";
import multer from "multer";
import sharp from "sharp";

const app = express();
const upload = multer();

app.post("/render", upload.fields([
  { name: "image" },
  { name: "data" }
]), async (req, res) => {
  try {
    const baseImage = req.files.image[0].buffer;
    const data = JSON.parse(req.body.data);

    const svgText = `
      <svg width="1200" height="675">
        <style>
          .title { fill: white; font-size: 48px; font-weight: bold; }
          .text { fill: white; font-size: 32px; }
        </style>
        <text x="40" y="60" class="title">${data.titulo}</text>
        <text x="40" y="120" class="text">${data.linea1}</text>
        <text x="40" y="170" class="text">${data.linea2}</text>
        <text x="40" y="220" class="text">${data.linea3}</text>
        <text x="40" y="270" class="text">${data.linea4}</text>
      </svg>
    `;

    const finalImage = await sharp(baseImage)
      .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
      .png()
      .toBuffer();

    res.set("Content-Type", "image/png");
    res.send(finalImage);

  } catch (error) {
    console.error(error);
    res.status(500).send("Error generando imagen");
  }
});

app.get("/", (req, res) => {
  res.send("Servicio de imágenes activo");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor activo en puerto", PORT);
});
