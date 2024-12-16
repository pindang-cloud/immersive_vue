const express = require('express');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2/promise'); // Gunakan promise version
const cors = require('cors');
const fs = require('fs');
const port = 8080;

const app = express();
const PORT = 3000;
let connection;
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'immersivedinner'
};
// Konfigurasi CORS yang lebih permisif untuk debugging
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware untuk parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const videoDir = path.join(__dirname, 'video');
app.use('/video', express.static(videoDir));

// Membuat direktori video jika belum ada
if (!fs.existsSync(videoDir)){
  fs.mkdirSync(videoDir, { recursive: true });
}

// Fungsi untuk membuat koneksi database
async function createDatabaseConnection() {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
    setTimeout(createDatabaseConnection, 5000);
  }
}

createDatabaseConnection();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Destination folder:', videoDir);
    cb(null, videoDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    console.log('Generated filename:', uniqueName);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
}).single('video');

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

    console.log('Request file:', req.file);
    console.log('Request body:', req.body);

    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ 
        error: 'No file uploaded' 
      });
    }

    try {
      // Simpan path relatif
      const filePath = `D:/vuejs_immersiveDinner/immersive_vue/backend/video/`;
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

app.get

app.get('/get-videos', async (req, res) => {
  try {
    // Query untuk mengambil semua data dari tabel 'videos'
    const [rows] = await connection.execute('SELECT * FROM videos');
    
    // Pastikan data dikembalikan dalam bentuk array
    const videos = rows.map(row => ({
      id_video: row.id_video,
      nama_video: row.nama_video,
      path: row.path,
      created_at: row.created_at
    }));
 
    // Kirim respons JSON dengan data yang berhasil diambil
    res.status(200).json({
      success: true,
      videos: videos
    });
  } catch (error) {
    console.error('Error fetching videos:', error.message);

    // Kirim respons error jika terjadi masalah
    res.status(500).json({
      success: false,
      error: 'Failed to fetch videos',
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
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Tambahkan penanganan proses
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});