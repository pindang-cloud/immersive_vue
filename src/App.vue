<template>
  <div>
    <b-navbar type="light" variant="light">
      <b-navbar variant="faded" type="light">
        <b-navbar-brand tag="h1" class="mb-0">Immersive Dinner</b-navbar-brand>
      </b-navbar>

      <b-navbar-nav class="ml-auto">
        <b-nav-item-dropdown
          id="my-nav-dropdown"
          text="Konten"
          toggle-class="nav-link-custom"
          right
        >
          <b-dropdown-item @click="addLayer"> Tambah Meja </b-dropdown-item>
          <b-dropdown-item @click="showUploadDialog">
            Upload Konten
          </b-dropdown-item>
          <b-dropdown-divider></b-dropdown-divider>
          <b-dropdown-item @click="addColumn"> Tambah Column </b-dropdown-item>
        </b-nav-item-dropdown>
      </b-navbar-nav>
    </b-navbar>
    <b-container>
      <div>
        <!-- Tombol untuk Beralih Tampilan -->
        <div class="d-flex justify-content-center mt-3 mb-3">
          <b-button
            variant="secondary"
            :disabled="selectedView === 1"
            @click="switchView(1)"
            class="mx-1"
          >
            Background Ruangan
          </b-button>
          <b-button
            variant="secondary"
            :disabled="selectedView === 2"
            @click="switchView(2)"
            class="mx-1"
          >
            Konten Meja
          </b-button>
        </div>

        <div v-if="selectedView === 1">
          <h2 class="text-center mb-3 mt-3">Play Background Ruangan</h2>
          <b-spinner
            v-if="isLoading"
            class="d-block mx-auto"
            label="Loading..."
          ></b-spinner>

          <div class="card-container">
          <div
            v-for="(column, index) in columns"
            :key="index"
            class="column-card"
            :style="{ backgroundImage: `url('https://images.tokopedia.net/img/cache/500-square/product-1/2015/8/22/560625/560625_16d9754c-b111-4ced-bd04-fab057d74b5e.jpg.webp?ect=4g')` }"
            @click="playColumn(index + 1)"
          >
            <div class="column-text">Kolom {{ index + 1 }}</div>
          </div>
        </div>          
        </div>
        <div v-if="selectedView === 2">
          <h2 class="text-center mb-3 mt-3">Pilih Meja dan Konten</h2>

          <b-spinner
            v-if="isLoading"
            class="d-block mx-auto"
            label="Loading..."
          ></b-spinner>

          <b-table
            v-if="!isLoading && layers.length > 0"
            :items="layers"
            :fields="tableFields"
            class="mt-3"
            responsive
          >
            <template #cell(Meja)="data">
              <div class="text-center">Meja {{ data.index + 1 }}</div>
            </template>

            <template #cell(konten)="data">
              <div class="konten-container">
                <div
                  v-for="(clip, index) in data.item.konten"
                  :key="index"
                  class="konten-thumbnail"
                  @click="connectClip(data.index + 1, index + 1)"
                  title="Klik untuk Connect"
                >
                  <b-img
                    :src="clip.thumbnail"
                    alt="Konten Thumbnail"
                    fluid
                    class="mb-2"
                    v-if="clip.thumbnail"
                  ></b-img>
                  <p class="konten-name">
                    {{ clip.name?.value || "Unnamed Konten" }}
                  </p>
                  <b-button
                    variant="outline-secondary"
                    @click="showLayerClipDialog(data.index + 1, index + 1)"
                  >
                    Ganti Clip
                  </b-button>
                </div>
              </div>
            </template>
          </b-table>

          <b-alert
            v-if="responseMessage"
            variant="info"
            class="mt-3"
            dismissible
          >
            {{ responseMessage }}
          </b-alert>
        </div>
      </div>
    </b-container>
  </div>
</template>
<style scoped>
.card-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  padding: 20px;
}

.column-card {
  background-size: cover;
  background-position: center;
  height: 150px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 16px;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.8);
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.column-card:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border: 2px solid #007bff;
}

.column-text {
  background-color: rgba(0, 0, 0, 0.2);
  padding: 10px 20px;
  border-radius: 5px;
}

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
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

export default {
  data() {
    return {
      columns: [
        { image: "/meja.png" },
        { image: "/meja.png" },
        { image: "/meja.png" },
        // Tambahkan gambar kolom lainnya di sini
      ],
      selectedView: 1,
      layers: [],
      responseMessage: "",
      apiBaseUrl: config.apiBaseUrl,
      isLoading: false,
      video: [],
    };
  },
  methods: {
    switchView(view) {
      this.selectedView = view;
    },
    async fetchVideos() {
      try {
        const response = await axios.get("http://localhost:3000/get-videos", {
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.data && Array.isArray(response.data.videos)) {
          this.videos = response.data.videos;
          console.log("Fetched Videos");
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        if (error.response) {
          this.error = `Server Error: ${error.response.status}`;
          console.error("Server Response Error:", {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          });
        } else {
          this.error = error.message || "Gagal mengambil video";
          console.error("Fetch Videos Error:", error);
        }
      }
    },

    async showLayerClipDialog(layerIndex, clipIndex) {
      console.log(`Layer: ${layerIndex}, Clip: ${clipIndex}`);

      try {
        // Ambil daftar video dari server
        const response = await axios.get("http://localhost:3000/get-videos");
        if (response.data && response.data.success) {
          const videos = response.data.videos;

          // Tampilkan daftar video dalam dialog
          const { value: selectedVideoId } = await Swal.fire({
            title: "Pilih Video",
            html: `
              <div class="video-list" style="max-height: 400px; overflow-y: auto;">
                ${videos
                  .map(
                    (video) => `
                      <div 
                        style="margin-bottom: 10px; cursor: pointer; padding: 10px; border: 1px solid #ccc; border-radius: 5px;" 
                        data-id="${video.id_video}">
                        <strong>${video.nama_video}</strong><br>
                        <video 
                          src="D:/vuejs_immersiveDinner/immersive_vue/backend/video/1734162501648_fun-3d-cartoon-chicken-with-a-helmet-with-alpha-c-2024-11-14-16-49-01-utc.mov" 
                          style="max-width: 100%; height: auto; margin-top: 5px;" 
                          controls>
                        </video>
                      </div>
                    `
                  )
                  .join("")}
              </div>
            `,
            showCancelButton: true,
            confirmButtonText: "Pilih",
            preConfirm: () => {
              const selectedVideoElement = Swal.getPopup().querySelector(
                '.video-list div[data-selected="true"]'
              );
              if (!selectedVideoElement) {
                Swal.showValidationMessage("Harap pilih satu video!");
                return null;
              }
              return selectedVideoElement.getAttribute("data-id");
            },
            didOpen: () => {
              const videoElements =
                Swal.getPopup().querySelectorAll(".video-list div");
              videoElements.forEach((element) => {
                element.addEventListener("click", () => {
                  videoElements.forEach((el) => {
                    el.setAttribute("data-selected", "false");
                    el.style.border = "1px solid #ccc";
                  });
                  element.setAttribute("data-selected", "true");
                  element.style.border = "2px solid #007bff";
                });
              });
            },
          });

          if (selectedVideoId) {
            const selectedVideo = videos.find(
              (video) => video.id_video == selectedVideoId
            );
            if (selectedVideo) {
              // Kirim path video ke fungsi changeClip dalam format URL
              const videoPath = encodeURI(
                `file:///D:/vuejs_immersiveDinner/immersive_vue/backend/video/1734162501648_fun-3d-cartoon-chicken-with-a-helmet-with-alpha-c-2024-11-14-16-49-01-utc.mov`
              );
              await this.changeClip(layerIndex, clipIndex, videoPath);
            } else {
              throw new Error("Video yang dipilih tidak ditemukan");
            }
          }
        } else {
          throw new Error(
            response.data.error || "Gagal mengambil daftar video"
          );
        }
      } catch (error) {
        console.error("Error in showLayerClipDialog:", error);
        Swal.fire("Error", `Terjadi kesalahan: ${error.message}`, "error");
      }
    },

    async changeClip(layerIndex, clipIndex, videoPath) {
      try {
        const apiUrl = `http://localhost:8080/composition/layers/${layerIndex}/clips/${clipIndex}/open`;

        // Kirim permintaan POST ke Resolume API
        const response = await axios.post(apiUrl, videoPath, {
          headers: {
            "Content-Type": "text/plain",
          },
        });

        if (response.status === 204) {
          console.log(
            `Video berhasil dimuat ke Layer ${layerIndex}, Clip ${clipIndex}`
          );
        } else {
          throw new Error("Gagal memuat video, status tidak sesuai");
        }
      } catch (error) {
        console.error("Error in changeClip:", error);
        Swal.fire("Error", `Gagal memuat video: ${error.message}`, "error");
      }
    },
    async showUploadDialog() {
      const { value: file } = await Swal.fire({
        title: "Upload Content",
        html: `
          <input id="file-input" type="file" accept="video/*" class="form-control">
          <div class="text-center">
            <video id="video-preview" controls style="max-width: 100%; margin-top: 10px; display: none;"></video>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Upload",
        didOpen: () => {
          const fileInput = Swal.getPopup().querySelector("#file-input");
          const videoPreview = Swal.getPopup().querySelector("#video-preview");

          fileInput.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (file) {
              console.log("Selected File:", file);
              const url = URL.createObjectURL(file);
              videoPreview.src = url;
              videoPreview.style.display = "block";
            } else {
              videoPreview.style.display = "none";
            }
          });
        },
        preConfirm: () => {
          const fileInput = Swal.getPopup().querySelector("#file-input");
          if (!fileInput.files.length) {
            Swal.showValidationMessage("Please select a video file!");
            return null;
          }
          return fileInput.files[0];
        },
      });

      if (file) {
        const formData = new FormData();
        formData.append("video", file);

        try {
          // Log detail file
          console.log("Uploading File Details:", {
            name: file.name,
            size: file.size,
            type: file.type,
          });

          const response = await fetch("http://localhost:3000/upload", {
            method: "POST",
            body: formData,
            // Optional: tambahkan timeout
            signal: AbortSignal.timeout(30000),
          });

          // Log response
          console.log("Response Status:", response.status);

          // Parse respons
          const result = await response.json();

          // Cek status respons
          if (response.ok) {
            console.log("Upload Successful:", result);
            Swal.fire("Success!", "Video uploaded successfully!", "success");
          } else {
            throw new Error(result.error || "Upload failed");
          }
        } catch (error) {
          console.error("Complete Upload Error:", error);

          // Tampilkan pesan error mendetail
          Swal.fire(
            "Upload Error",
            `Failed to upload content: ${error.message}`,
            "error"
          );
        }
      }
    },

    async fetchLayers() {
      this.isLoading = true;
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
            const validKonten = konten.filter((clip) => clip !== null);

            return {
              Meja: layer.name.value || `Layer ${layerIndex + 1}`,
              konten: validKonten, // Hanya memasukkan konten valid
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
        const { dialog } = require("electron");
        const fs = require("fs");
        const path = require("path");

        // Tentukan direktori Resolume
        const resolumeDir =
          "C:\\Program Files\\Resolume Arena\\default\\Presets\\Sources";

        // Buka dialog untuk memilih file video
        const selectedFiles = dialog.showOpenDialogSync({
          title: "Pilih Video untuk Ditambahkan",
          filters: [
            { name: "Video Files", extensions: ["mp4", "mov", "avi", "mkv"] },
          ],
          properties: ["openFile"],
        });

        if (selectedFiles && selectedFiles.length > 0) {
          const sourceFile = selectedFiles[0];
          const fileName = path.basename(sourceFile);
          const targetFile = path.join(resolumeDir, fileName);

          // Salin file ke direktori Resolume
          fs.copyFileSync(sourceFile, targetFile);

          this.responseMessage = `Konten "${fileName}" berhasil ditambahkan ke Resolume!`;
        } else {
          this.responseMessage = "Tidak ada file yang dipilih.";
        }
      } catch (error) {
        console.error("Error adding content:", error);
        this.responseMessage = "Gagal menambahkan konten.";
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
        // Tampilkan dialog konfirmasi sebelum menambahkan layer
        const result = await Swal.fire({
          title: "Apakah Anda yakin?",
          text: "Anda akan menambahkan meja baru.",
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Ya, tambahkan!",
          cancelButtonText: "Batal",
          reverseButtons: true,
        });

        if (result.isConfirmed) {
          // Jika pengguna menekan tombol "Ya"
          const response = await axios.post(
            `${this.apiBaseUrl}/composition/layers/add`
          );

          if ([200, 201, 204].includes(response.status)) {
            // Tampilkan pesan sukses
            await Swal.fire({
              title: "Berhasil!",
              text: "Meja baru berhasil ditambahkan!",
              icon: "success",
              confirmButtonText: "OK",
            });

            this.responseMessage = "Meja baru berhasil ditambahkan!";
            await this.fetchLayers(); // Memuat ulang daftar layer
          }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          // Jika pengguna menekan tombol "Batal"
          Swal.fire({
            title: "Dibatalkan",
            text: "Meja baru tidak jadi ditambahkan.",
            icon: "error",
            confirmButtonText: "OK",
          });
        }
      } catch (error) {
        // Tampilkan pesan error jika ada kesalahan
        await Swal.fire({
          title: "Kesalahan!",
          text: "Gagal menambahkan meja. Silakan coba lagi.",
          icon: "error",
          confirmButtonText: "OK",
        });

        console.error("Error adding layer:", error);
        this.responseMessage = "Gagal menambahkan Meja.";
      }
    },

    async playColumn(kolomIndex) {
      try {
        const columnResponse = await axios.post(
          `${this.apiBaseUrl}/composition/columns/${kolomIndex}/connect`
        );
        console.log("Kolom berhasil dihubungkan:", columnResponse.data);
      } catch (error) {
        console.error("Error menghubungkan kolom:", error);
      }
    },

    async addColumn() {
      try {
        const result = await Swal.fire({
          title: "Apa kamu yakin?",
          text: "Apakah kamu ingin menambahkan kolom baru?",
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Ya!",
          cancelButtonText: "Batal",
          reverseButtons: true,
        });

        if (result.isConfirmed) {
          const columnRespon = await axios.post(
            `${this.apiBaseUrl}/composition/columns/add`
          );

          Swal.fire({
            title: "Berhasil!",
            text: "Kolom berhasil ditambahkan.",
            icon: "success",
            confirmButtonText: "OK",
          });

          console.log(columnRespon);
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          // Jika pengguna menekan tombol "No"
          Swal.fire({
            title: "Batal",
            text: "Kolom batal di tambahkan.",
            icon: "error",
            confirmButtonText: "OK",
          });
        }
      } catch (error) {
        Swal.fire({
          title: "Error!",
          text: "Terjadi kesalahan saat menambahkan kolom.",
          icon: "error",
          confirmButtonText: "OK",
        });

        console.error("Error add column", error);
      }
    },
  },
  mounted() {
    this.fetchLayers();
    // this.fetchVideos();
  },
};
</script>
