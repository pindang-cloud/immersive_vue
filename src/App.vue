<template>
  <div>
    <h1
      class="text-center mt-3 bg-primary rounded text-white mx-auto d-block"
      style="max-width: 500px"
    >
      Kontrol Resolume Arena
    </h1>

    <div class="container mt-5">
      <h2 class="text-center mb-3">Pilih Konten</h2>
      <table class="table table-bordered border-secondary">
        <thead>
          <tr>
            <th scope="col" class="text-center">Table (Layer)</th>
            <th scope="col" class="text-center">Content (Clips)</th>
            <th scope="col" class="text-center">Playing now</th>
            <th scope="col" class="text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <select
                id="layer-select"
                v-model.number="layerIndex"
                class="form-control"
              >
                <option
                  v-for="(layer, index) in layers"
                  :key="index"
                  :value="index + 1"
                >
                  {{
                    layer.name.value === "Layer #"
                      ? `Layer ${index + 1}`
                      : layer.name.value
                  }}
                </option>
              </select>
            </td>
            <td>
              <div class="container overflow-auto">
                <div class="d-flex vh-60">
                  <div
  class="col-6"
  v-for="(thumbnail, index) in filteredThumbnails"
  :key="index"
>
  <img
    v-if="thumbnail"
    :src="thumbnail"
    alt="Clip Thumbnail"
    role="button"
    class="img-fluid"
    :class="[
      activeClipIndex === index
        ? 'active-border'
        : 'default-border',
    ]"
    @click="setClipIndex(index)"
  />
</div>

                </div>
              </div>
            </td>
            <td>
              <img src="https://via.placeholder.com/150" alt="" />
            </td>
            <td>
              <button @click="connectClip" class="btn btn-primary">
                Kirim
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-if="responseMessage" class="mt-3">{{ responseMessage }}</p>
    </div>
  </div>
</template>

<script>
import axios from "axios";

// Set konfigurasi default untuk axios
axios.defaults.headers.common["Accept"] = "application/json";

export default {
  data() {
    return {
      thumbnails: [], // Array 2D untuk menyimpan thumbnail per layer
      layers: [], // Daftar layer dari Resolume
      apiBaseUrl: "http://192.168.100.156:8080/api/v1", // URL Resolume API
      layerIndex: 1, // Nilai default untuk Layer Index
      clipIndex: 1, // Nilai default untuk Clip Index
      responseMessage: "", // Pesan respons dari request
      activeClipIndex: null, // Indeks aktif untuk clip
    };
  },
  computed: {
    // Filter thumbnail berdasarkan layer yang dipilih
    filteredThumbnails() {
      return this.thumbnails[this.layerIndex - 1] || [];
    },
  },
  methods: {
    // Fungsi untuk mengatur clip index
    setClipIndex(index) {
      this.clipIndex = index + 1; // Clip index di Resolume berbasis 1
      this.activeClipIndex = index;
    },

    // Fungsi untuk mengambil daftar layer dari Resolume
    async fetchLayers() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/composition`);
        this.layers = response.data.layers || [];
        console.log("Layers fetched successfully:", this.layers);

        // Ambil thumbnail setelah daftar layer berhasil diambil
        await this.fetchThumbnails();
      } catch (error) {
        this.handleError(error, "Failed to fetch layers.");
      }
    },

    // Fungsi untuk mengambil thumbnail dari clip pada setiap layer
    async fetchThumbnails() {
  try {
    this.thumbnails = []; // Reset thumbnails sebelum diisi ulang

    // Loop paralel untuk setiap layer
    const thumbnailPromises = this.layers.map(async (layer, layerIndex) => {
      const response = await axios.get(
        `${this.apiBaseUrl}/composition/layers/${layerIndex + 1}`
      );
      const clips = response.data.clips || [];

      // Ambil thumbnail untuk setiap clip
      const clipThumbnails = await Promise.all(
        clips.map(async (clip) => {
          const thumbnailResponse = await axios.get(
            `${this.apiBaseUrl}/composition/clips/by-id/${clip.id}/thumbnail`,
            { responseType: "blob" } // Mengambil sebagai blob
          );

          // Periksa ukuran file
          if (thumbnailResponse.data.size === 394) {
            console.log(`Ignoring thumbnail for clip ID ${clip.id}, size is 394 bytes.`);
            return null; // Abaikan thumbnail dengan ukuran 394 byte
          }

          return URL.createObjectURL(thumbnailResponse.data);
        })
      );

      return clipThumbnails.filter((thumbnail) => thumbnail !== null); // Hilangkan thumbnail null
    });

    // Tunggu semua request selesai
    this.thumbnails = await Promise.all(thumbnailPromises);
    console.log("Thumbnails fetched successfully:", this.thumbnails);
  } catch (error) {
    this.handleError(error, "Failed to fetch thumbnails.");
  }
},

    async connectClip() {
      if (
        !this.layerIndex ||
        this.layerIndex < 1 ||
        !this.clipIndex ||
        this.clipIndex < 1
      ) {
        this.responseMessage =
          "Layer Index dan Clip Index harus bernilai 1 atau lebih.";
        return;
      }

      try {
        const response = await axios.post(
          `${this.apiBaseUrl}/composition/layers/${this.layerIndex}/clips/${this.clipIndex}/connect`,
          true,
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        if (response.status === 204) {
          this.responseMessage = "Clip connected successfully!";
          this.activeClipIndex = null; // Reset clip aktif
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          this.responseMessage = "Layer or clip does not exist!";
        } else {
          this.handleError(error, "Error connecting clip.");
        }
      }
    },

    // Fungsi untuk menangani kesalahan
    handleError(error, defaultMessage) {
      if (error.response) {
        // Kesalahan dari server
        console.error("Server error:", error.response.data);
        this.responseMessage = `${defaultMessage} (Server response: ${error.response.statusText})`;
      } else if (error.request) {
        // Kesalahan jaringan
        console.error("Network error:", error.request);
        this.responseMessage = "Network error. Please check your connection.";
      } else {
        // Kesalahan lain
        console.error("Error:", error.message);
        this.responseMessage = defaultMessage;
      }
    },
  },
  mounted() {
    // Ambil daftar layer dan thumbnail saat komponen di-mount
    this.fetchLayers();
  },
};
</script>


<style scoped>
.default-border {
  border: 1px solid #ddd; /* Border default berwarna abu-abu */
  border-radius: 4px; /* Opsional: Membuat border sedikit membulat */
  transition: border 0.3s ease-in-out; /* Animasi untuk perubahan border */
}

.active-border {
  border: 3px solid #007bff; /* Border aktif berwarna biru terang */
  border-radius: 8px; /* Opsional: Membuat border lebih membulat */
}
.my-brand-image {
  object-position: center;
  height: 100%;
  width: 100%;
  border: 2px solid #ddd; /* Add border with a light gray color */
  border-radius: 8px; /* Optional: rounded corners */
}
</style>
