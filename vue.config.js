const fs = require('fs');
const net = require('net');

// Fungsi untuk memeriksa apakah port tersedia
const isPortAvailable = (port) => {
  return new Promise((resolve, reject) => {
    const server = net.createServer().listen(port, () => {
      server.close();
      resolve(true);
    });
    server.on('error', (err) => {
      resolve(false);
    });
  });
};

// Menentukan port Vue.js secara dinamis
const getPort = async () => {
  const is8081Available = await isPortAvailable(8081);
  return is8081Available ? 8081 : 8082; // Pilih port 8081 jika tersedia, jika tidak pilih 8082
};

module.exports = async () => {
  const port = await getPort(); // Ambil port yang tersedia

  return {
    devServer: {
      port: port, // Gunakan port yang ditemukan
    },
  };
};
