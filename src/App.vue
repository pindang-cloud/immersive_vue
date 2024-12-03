<template>
  <div>
    <h2 class="text-center mb-3">Pilih Layer dan Clip</h2>

    <!-- Tombol untuk menambahkan layer -->
    <div v-if="isLoading" class="text-center">
      <p>Loading...</p>
      <!-- Bisa menambahkan spinner jika diperlukan -->
    </div>

    <table
      id="layersTable"
      class="table table-bordered border-secondary"
      v-if="!isLoading && layers.length > 0"
    >
      <thead>
        <tr>
          <th scope="col" class="text-center">Layer</th>
          <th scope="col" class="text-center">Clip</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(layer, layerIndex) in layers" :key="'layer-' + layerIndex">
          <td scope="row">Layer{{ layerIndex + 1 }}</td>
          <td scope="row">
            <div class="clip-container">
              <div
                v-for="(clip, clipIndex) in layer.clips.filter(
                  (clip) => clip.name && clip.thumbnail
                )"
                :key="'clip-' + clipIndex"
                class="clip-thumbnail"
                @click="connectClip(layerIndex + 1, clipIndex + 1)"
                title="Klik untuk Connect"
              >
                <img
                  :src="clip.thumbnail"
                  alt="Clip Thumbnail"
                  class="img-fluid"
                />
                <p class="clip-name">{{ clip.name.value }}</p>
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <button @click="addLayer" class="btn btn-success mb-3">Tambah Layer</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="responseMessage" class="mt-3">{{ responseMessage }}</p>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      layers: [], // Menyimpan data layer dan clip terkait
      responseMessage: "", // Pesan respons dari API
      apiBaseUrl: "http://localhost:8080/api/v1", // URL Resolume API
      isLoading: false,
    };
  },
  methods: {
    // Fungsi untuk mengambil data layer dan clip
    async fetchLayers() {
      this.isLoading = true; // Menandakan bahwa data sedang dimuat
      try {
        const layersResponse = await axios.get(
          `${this.apiBaseUrl}/composition`
        );

        const layers = layersResponse.data.layers || [];
        this.layers = await Promise.all(
          layers.map(async (layer, layerIndex) => {
            const response = await axios.get(
              `${this.apiBaseUrl}/composition/layers/${layerIndex + 1}`
            );
            const clips = response.data.clips.map(async (clip) => {
              const thumbnailResponse = await axios.get(
                `${this.apiBaseUrl}/composition/clips/by-id/${clip.id}/thumbnail`,
                { responseType: "blob" }
              );

              if (thumbnailResponse.data.size !== 394) {
                clip.thumbnail = URL.createObjectURL(thumbnailResponse.data);
              } else {
                clip.thumbnail = null;
              }

              return clip;
            });

            return {
              name: layer.name.value || `Layer ${layerIndex + 1}`,
              clips: await Promise.all(clips),
            };
          })
        );
      } catch (error) {
        console.error("Error fetching layers:", error);
        this.responseMessage = "Failed to fetch layers.";
      } finally {
        this.isLoading = false; // Menandakan bahwa data sudah selesai dimuat
      }
    },

    // Fungsi untuk menghubungkan clip ke layer tertentu
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
      console.log("addLayer function called");
      try {
        const response = await axios.post(
          `${this.apiBaseUrl}/composition/layers/add`
        );

        if (
          response.status === 200 ||
          response.status === 201 ||
          response.status === 204
        ) {
          this.responseMessage = "Layer baru berhasil ditambahkan!";
          console.log("Layer added successfully:", response.data);
          await this.fetchLayers();
        } else {
          this.responseMessage = `Layer tidak dapat ditambahkan (Status: ${response.status}).`;
          console.warn("Unexpected response status:", response.status);
        }
      } catch (error) {
        if (error.response) {
          this.responseMessage = `Gagal menambahkan layer. Server response: ${error.response.statusText}`;
        } else if (error.request) {
          this.responseMessage =
            "Gagal menambahkan layer. Periksa koneksi jaringan Anda.";
        } else {
          this.responseMessage = "Gagal menambahkan layer. Terjadi kesalahan.";
        }
      }
    },
  },

  mounted() {
    this.fetchLayers();
  },
};
</script>

<style scoped>
/* Untuk memberikan scrollbar horizontal */
.clip-container {
  display: flex;
  overflow-x: auto;
  padding: 10px;
  gap: 15px;
}

.clip-thumbnail {
  display: inline-block;
  text-align: center;
  cursor: pointer;
  border: 1px solid transparent;
  padding: 5px;
  transition: border-color 0.3s ease-in-out;
}

.clip-thumbnail:hover {
  border-color: #007bff;
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
