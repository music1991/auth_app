const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

let storage;

// 1. CAMBIO CLAVE: Detectar Cloudinary por sus variables, no por el entorno
const hasCloudinaryConfig = process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_KEY;

if (hasCloudinaryConfig) {
  // CONFIGURACIÓN PARA VERCEL (NUBE)
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
  });

  storage = new CloudinaryStorage({ 
    cloudinary: cloudinary,
    params: {
      folder: 'recursos_app',
      allowed_formats: ['pdf', 'doc', 'docx', 'jpg', 'png', 'jpeg'],
      resource_type: 'auto' // Esto es vital para que acepte PDFs
    },
  });
  console.log("Almacenamiento configurado en Cloudinary");

} else {
  // CONFIGURACIÓN PARA TU PC (LOCAL)
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const cleanName = file.originalname.replace(/\s+/g, '_');
      cb(null, `${Date.now()}-${cleanName}`);
    }
  });
  console.log("Almacenamiento configurado en disco local");
}

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = upload;
