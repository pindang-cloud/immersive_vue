<template>
  <div>
    <b-navbar type="light" variant="light">
      <b-navbar variant="faded" type="light">
        <b-navbar-brand tag="h1" class="mb-0">Immersive Dinner</b-navbar-brand>
      </b-navbar>

      <b-navbar-nav class="ml-auto">
        <b-nav-item-dropdown id="my-nav-dropdown" text="Konten" toggle-class="nav-link-custom" right>
          <b-dropdown-item @click="addLayer">
              Tambah Meja
          </b-dropdown-item>
          <b-dropdown-divider></b-dropdown-divider>
          <b-dropdown-item @click="addContent">Tambah Konten</b-dropdown-item>
          <b-dropdown-divider></b-dropdown-divider>
          <b-dropdown-item>Test</b-dropdown-item>
        </b-nav-item-dropdown>
      </b-navbar-nav>
    </b-navbar>
    <b-container>
      <h2 class="text-center mb-3 mt-3">Pilih Meja dan Konten</h2>

      <!-- Spinner untuk loading -->
      <b-spinner v-if="isLoading" class="d-block mx-auto" label="Loading..." ></b-spinner>

      <!-- Tabel dengan gambar tersusun horizontal -->
      <b-table v-if="!isLoading && layers.length > 0" :items="layers" :fields="tableFields" class="mt-3" responsive >
        <!-- Cell untuk Meja -->
        <template #cell(Meja)="data">
          <div class="text-center">Meja {{ data.index + 1 }}</div>
        </template>

        <!-- Cell untuk Konten -->
        <template #cell(konten)="data">
          <div class="konten-container">
            <div v-for="(clip, index) in data.item.konten" :key="index" class="konten-thumbnail" @click="connectClip(data.index + 1, index + 1)" title="Klik untuk Connect">
              <b-img :src="clip.thumbnail" alt="Konten Thumbnail" fluid class="mb-2" v-if="clip.thumbnail"></b-img>
              <p class="konten-name">{{ clip.name?.value || "Unnamed Konten" }}</p>
            </div>
          </div>
        </template>
      </b-table>

      <!-- Tampilkan pesan respons -->
      <b-alert v-if="responseMessage" variant="info" class="mt-3" dismissible >
        {{ responseMessage }}
      </b-alert>
    </b-container>
  </div>
</template>
<style scoped>
.konten-container {
  display: flex;
  overflow-x: auto;
  gap: 10px;
  padding: 10px;
}

.konten-thumbnail {
  text-align: center;
  cursor: pointer;
  padding: 10px;
  border: 2px solid transparent;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.konten-thumbnail:hover {
  border-color: #007bff;
  background-color: rgba(0, 123, 255, 0.1);
}

.konten-thumbnail:active {
  border-color: #0056b3;
  background-color: rgba(0, 86, 179, 0.2);
}

.konten-thumbnail img {
  max-width: 100px;
  height: auto;
  border-radius: 8px;
}

.konten-name {
  margin-top: 5px;
  font-size: 14px;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}
</style>

<script>
import axios from "axios";
import config from "./config";

export default {
  name: "app",
  data() {
    return {
      layers: [], // Data untuk tabel
      responseMessage: "", // Pesan dari operasi API
      apiBaseUrl: config.apiBaseUrl,
      isLoading: false, // Status loading
    };
  },
  methods: {
    // Fungsi untuk memuat data dari API
    async fetchLayers() {
      this.isLoading = true;
      try {
        const layersResponse = await axios.get(`${this.apiBaseUrl}/composition`);
        const layers = layersResponse.data.layers || [];
        
        this.layers = await Promise.all(
          layers.map(async (layer, layerIndex) => {
            const response = await axios.get(
              `${this.apiBaseUrl}/composition/layers/${layerIndex + 1}`
            );
            
            // Memproses konten dan memfilter konten yang tidak valid
            const konten = await Promise.all(
              response.data.clips.map(async (clip) => {
                const thumbnailResponse = await axios.get(
                  `${this.apiBaseUrl}/composition/clips/by-id/${clip.id}/thumbnail`,
                  { responseType: "blob" }
                );

                // Menambahkan thumbnail jika ukurannya valid
                if (thumbnailResponse.data) {
                  clip.thumbnail = URL.createObjectURL(thumbnailResponse.data);
                } else {
                  clip.thumbnail = null;
                }

                // Memastikan hanya konten yang memiliki nama dan thumbnail yang valid yang diterima
                if (clip.name?.value && clip.thumbnail) {
                  return clip;
                } else {
                  return null; // Mengembalikan null untuk konten yang tidak valid
                }
              })
            );

            // Filter untuk menghapus konten yang bernilai null (tidak valid)
            const validKonten = konten.filter(clip => clip !== null);

            return {
              Meja: layer.name.value || `Layer ${layerIndex + 1}`,
              konten: validKonten,
            };
          })
        );
      } catch (error) {
        console.error("Error fetching layers:", error);
        this.responseMessage = "Failed to fetch layers.";
      } finally {
        this.isLoading = false;
      }
    },

    async addContent() {
      try {
        // Dialog file untuk memilih file video
        const { dialog } = require('electron');
        const fs = require('fs');
        const path = require('path');

        // Tentukan direktori Resolume
        const resolumeDir = 'C:\\Program Files\\Resolume Arena\\default\\Presets\\Sources';

        // Buka dialog untuk memilih file video
        const selectedFiles = dialog.showOpenDialogSync({
          title: 'Pilih Video untuk Ditambahkan',
          filters: [
            { name: 'Video Files', extensions: ['mp4', 'mov', 'avi', 'mkv'] }
          ],
          properties: ['openFile']
        });

        if (selectedFiles && selectedFiles.length > 0) {
          const sourceFile = selectedFiles[0];
          const fileName = path.basename(sourceFile);
          const targetFile = path.join(resolumeDir, fileName);

          // Salin file ke direktori Resolume
          fs.copyFileSync(sourceFile, targetFile);

          this.responseMessage = `Konten "${fileName}" berhasil ditambahkan ke Resolume!`;
        } else {
          this.responseMessage = 'Tidak ada file yang dipilih.';
        }
      } catch (error) {
        console.error('Error adding content:', error);
        this.responseMessage = 'Gagal menambahkan konten.';
      }
    },

    // Fungsi untuk menghubungkan konten
    async connectClip(layerIndex, clipIndex) {
      try {
        const response = await axios.post(
          `${this.apiBaseUrl}/composition/layers/${layerIndex}/clips/${clipIndex}/connect`
        );
        if (response.status === 204) {
          this.responseMessage = `Konten ${clipIndex} di Meja ${layerIndex} berhasil terhubung!`;
        }
      } catch (error) {
        console.error("Error connecting konten:", error);
        this.responseMessage = `Gagal menghubungkan Konten ${clipIndex} di Meja ${layerIndex}.`;
      }
    },

    // Fungsi untuk menambahkan Meja baru
    async addLayer() {
      try {
        const response = await axios.post(
          `${this.apiBaseUrl}/composition/layers/add`
        );
        if ([200, 201, 204].includes(response.status)) {
          this.responseMessage = "Meja baru berhasil ditambahkan!";
          await this.fetchLayers();
        }
      } catch (error) {
        console.error("Error adding layer:", error);
        this.responseMessage = "Gagal menambahkan Meja.";
      }
    },
  },
  mounted() {
    this.fetchLayers(); // Memuat data saat komponen dipasang
  },
};
</script>
