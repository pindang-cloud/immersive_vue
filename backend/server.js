const express = require('express');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2/promise'); // Gunakan promise version
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Konfigurasi CORS yang lebih permisif untuk debugging
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware untuk parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Buat direktori uploads jika belum ada
const uploadDir = path.join(__dirname, 'video'); // Sesuaikan dengan folder Anda
if (!fs.existsSync(uploadDir)){
  fs.mkdirSync(uploadDir);
}

// Konfigurasi koneksi database dengan promise
let connection;
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'immersivedinner'
};

// Fungsi untuk membuat koneksi database
async function createDatabaseConnection() {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
    // Coba reconnect setelah beberapa saat
    setTimeout(createDatabaseConnection, 5000);
  }
}

// Inisialisasi koneksi database
createDatabaseConnection();

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Destination folder:', uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    console.log('Generated filename:', uniqueName);
    cb(null, uniqueName);
  }
});

// Konfigurasi upload
const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 100 * 1024 * 1024 // 100MB
  }
}).single('video');

// Endpoint upload video dengan debugging lengkap
app.post('/upload', (req, res) => {
  console.log('Upload endpoint hit');
  
  upload(req, res, async (err) => {
    // Log setiap tahap proses
    console.log('Upload middleware called');
    
    // Tangani error multer
    if (err) {
      console.error('Multer Error:', err);
      return res.status(400).json({
        error: 'File upload error',
        details: err.message
      });
    }

    // Log informasi file
    console.log('Request file:', req.file);
    console.log('Request body:', req.body);

    // Cek apakah file ada
    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ 
        error: 'No file uploaded' 
      });
    }

    try {
      // Simpan path relatif
      const filePath = `/video/${req.file.filename}`; // Sesuaikan dengan folder Anda
      const videoName = req.file.originalname;

      // Tambahkan logging sebelum query
      console.log('Attempting to insert into database');
      console.log('File Path:', filePath);
      console.log('Video Name:', videoName);

      // Query insert ke database
      const query = 'INSERT INTO videos (path, nama_video) VALUES (?, ?)';
      const [result] = await connection.execute(query, [filePath, videoName]);

      console.log('Database insert result:', result);

      // Kirim respons sukses
      console.log('Video saved successfully');
      res.status(200).json({ 
        message: 'Video uploaded successfully', 
        path: filePath,
        name: videoName,
        insertId: result.insertId
      });

    } catch (error) {
      console.error('Database/Server Error:', error);
      res.status(500).json({ 
        error: 'Failed to save video', 
        details: error.message 
      });
    }
  });
});

app.get('/get-videos', async (req, res) => {
  try {
    // Query untuk mengambil semua video
    const query = 'USE immersivedinner; SELECT * FROM videos ORDER BY created_at DESC';
    
    // Eksekusi query
    const [videos] = await db.promise().query(query);

    // Kirim respons
    res.status(200).json({ 
      message: 'Videos retrieved successfully',
      total: videos.length,
      videos: videos 
    });

  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve videos', 
      message: error.message 
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    error: 'Unexpected server error',
    details: err.message
  });
});

// Jalankan server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Tambahkan penanganan proses
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});