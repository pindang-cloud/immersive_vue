<template>
  <div>
    <b-container>
      <h2 class="text-center mb-3">Pilih Layer dan Clip</h2>

      <!-- Spinner untuk loading -->
      <b-spinner
        v-if="isLoading"
        class="d-block mx-auto"
        label="Loading..."
      ></b-spinner>

      <!-- Tabel dengan gambar tersusun horizontal -->
      <b-table
        v-if="!isLoading && layers.length > 0"
        :items="layers"
        :fields="tableFields"
        class="mt-3"
        responsive
      >
        <!-- Cell untuk layer -->
        <template #cell(name)="data">
          <div class="text-center">Layer {{ data.index + 1 }}</div>
        </template>


        <!-- Cell untuk clips -->
        <template #cell(clips)="data">
          <div class="clip-container">
            <div
              v-for="(clip, index) in data.item.clips"
              :key="index"
              class="clip-thumbnail"
              @click="connectClip(data.index + 1, index + 1)"
              title="Klik untuk Connect"
            >
              <b-img
                :src="clip.thumbnail"
                alt="Clip Thumbnail"
                fluid
                class="mb-2"
                v-if="clip.thumbnail"
              ></b-img>
              <p class="clip-name">{{ clip.name?.value || "Unnamed Clip" }}</p>
            </div>
          </div>
        </template>
      </b-table>

      <!-- Tombol untuk menambahkan layer -->
      <b-button @click="addLayer" variant="success" class="mt-3">
        Tambah Layer
      </b-button>

      <!-- Tampilkan pesan respons -->
      <b-alert
        v-if="responseMessage"
        variant="info"
        class="mt-3"
        dismissible
      >
        {{ responseMessage }}
      </b-alert>
    </b-container>
  </div>
</template>

<style scoped>
.clip-container {
  display: flex;
  overflow-x: auto;
  gap: 10px;
  padding: 10px;
}

.clip-thumbnail {
  text-align: center;
  cursor: pointer;
  padding: 10px;
  border: 2px solid transparent;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.clip-thumbnail:hover {
  border-color: #007bff;
  background-color: rgba(0, 123, 255, 0.1);
}

.clip-thumbnail:active {
  border-color: #0056b3;
  background-color: rgba(0, 86, 179, 0.2);
}

.clip-thumbnail img {
  max-width: 100px;
  height: auto;
  border-radius: 8px;
}

.clip-name {
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
            
            // Memproses clips dan memfilter clip yang tidak valid
            const clips = await Promise.all(
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

                // Memastikan hanya clip yang memiliki nama dan thumbnail yang valid yang diterima
                if (clip.name?.value && clip.thumbnail) {
                  return clip;
                } else {
                  return null; // Mengembalikan null untuk clip yang tidak valid
                }
              })
            );

            // Filter untuk menghapus clip yang bernilai null (tidak valid)
            const validClips = clips.filter(clip => clip !== null);

            return {
              name: layer.name.value || `Layer ${layerIndex + 1}`,
              clips: validClips, // Hanya memasukkan clip valid
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

    // Fungsi untuk menghubungkan clip
    async connectClip(layerIndex, clipIndex) {
      try {
        const response = await axios.post(
          `${this.apiBaseUrl}/composition/layers/${layerIndex}/clips/${clipIndex}/connect`
        );
        if (response.status === 204) {
          this.responseMessage = `Clip ${clipIndex} in Layer ${layerIndex} connected successfully!`;
        }
      } catch (error) {
        console.error("Error connecting clip:", error);
        this.responseMessage = `Failed to connect Clip ${clipIndex} in Layer ${layerIndex}.`;
      }
    },

    // Fungsi untuk menambahkan layer baru
    async addLayer() {
      try {
        const response = await axios.post(
          `${this.apiBaseUrl}/composition/layers/add`
        );
        if ([200, 201, 204].includes(response.status)) {
          this.responseMessage = "Layer baru berhasil ditambahkan!";
          await this.fetchLayers();
        }
      } catch (error) {
        console.error("Error adding layer:", error);
        this.responseMessage = "Failed to add layer.";
      }
    },
  },
  mounted() {
    this.fetchLayers(); // Memuat data saat komponen dipasang
  },
};
</script>
