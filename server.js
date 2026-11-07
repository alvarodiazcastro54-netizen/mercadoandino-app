// MercadoAndino - aplicación web de prueba (HT-05, PIAD-626)
// Corre en instancias EC2 de un Auto Scaling Group detrás de un Application Load Balancer.
const express = require("express");
const os = require("os");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const app = express();

// Las credenciales llegan solas desde LabInstanceProfile: no se escriben llaves en el código.
// requestChecksumCalculation "WHEN_REQUIRED" evita que el SDK agregue un checksum CRC32
// a la URL prefirmada, que haría fallar la subida desde el navegador.
const s3 = new S3Client({ region: "us-east-1", requestChecksumCalculation: "WHEN_REQUIRED" });

// Solo fotos JPG o PNG, como pide el caso.
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png"];

app.get("/", (req, res) => res.send("MercadoAndino v2 - instancia " + os.hostname()));

app.get("/health", (req, res) => res.status(200).send("ok"));

// Operación 01.5: URL prefirmada de corta duración (5 minutos) para subir una foto a S3.
app.get("/api/upload-url", async (req, res) => {
  const type = String(req.query.type || "");
  if (!TIPOS_PERMITIDOS.includes(type)) {
    return res.status(400).json({ error: "Solo se aceptan fotos image/jpeg o image/png" });
  }
  // Limpia el nombre para que no se cuelen barras ni caracteres raros en la clave.
  const name = String(req.query.name || "foto").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const key = `uploads/${Date.now()}-${name}`;
  try {
    const cmd = new PutObjectCommand({ Bucket: process.env.BUCKET, Key: key, ContentType: type });
    // v2: se firma también el Content-Type, así S3 rechaza una subida con otro tipo de archivo.
    const url = await getSignedUrl(s3, cmd, { expiresIn: 300, signableHeaders: new Set(["content-type"]) });
    res.json({ url, key });
  } catch (err) {
    console.error("Error al generar la URL prefirmada:", err);
    res.status(500).json({ error: "No se pudo generar la URL de subida" });
  }
});

// Página mínima para probar la subida directa desde el navegador.
app.get("/subir", (req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>MercadoAndino - Subir foto</title>
<style>body{font-family:system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 16px;color:#1f2937}
h1{font-size:1.4rem}button{padding:8px 16px;font-size:1rem}pre{background:#f3f4f6;padding:12px;white-space:pre-wrap;word-break:break-all}</style>
</head><body>
<h1>MercadoAndino: subir foto de producto</h1>
<p>Instancia: <b>${os.hostname()}</b></p>
<input type="file" id="foto" accept="image/jpeg,image/png"> <button id="subir">Subir</button>
<pre id="estado">Elige una foto JPG o PNG.</pre>
<script>
document.getElementById("subir").onclick = async () => {
  const f = document.getElementById("foto").files[0];
  const estado = document.getElementById("estado");
  if (!f) { estado.textContent = "Primero elige una foto."; return; }
  estado.textContent = "1) Pidiendo URL prefirmada al servidor...";
  const r = await fetch("/api/upload-url?name=" + encodeURIComponent(f.name) + "&type=" + encodeURIComponent(f.type));
  const datos = await r.json();
  if (!r.ok) { estado.textContent = "Error: " + datos.error; return; }
  estado.textContent += "\\n2) Subiendo directo a S3 con PUT...";
  const put = await fetch(datos.url, { method: "PUT", headers: { "Content-Type": f.type }, body: f });
  estado.textContent += put.ok
    ? "\\n3) Listo. Respuesta de S3: HTTP " + put.status + "\\nClave: " + datos.key
    : "\\nFalló la subida: HTTP " + put.status;
};
</script>
</body></html>`);
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log(`MercadoAndino escuchando en el puerto ${PORT}`));
