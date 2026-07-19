/**
 * Cloudinary Unsigned Upload — Custom Media Library untuk Decap CMS
 * Memungkinkan upload file ke Cloudinary TANPA login.
 * Menggunakan Unsigned Upload Preset.
 */
const CloudinaryUnsignedMediaLibrary = {
  name: "cloudinary-unsigned",

  init: function ({ options, handleInsert }) {
    const cloudName = options.cloud_name;
    const uploadPreset = options.upload_preset;

    // Inject CSS for the upload overlay (only once)
    if (!document.getElementById("cld-unsigned-styles")) {
      const style = document.createElement("style");
      style.id = "cld-unsigned-styles";
      style.textContent = `
        .cld-overlay {
          position: fixed; inset: 0; z-index: 99999;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .cld-modal {
          background: #fff; border-radius: 20px; padding: 2.5rem 2rem;
          max-width: 420px; width: 90%; text-align: center;
          box-shadow: 0 24px 80px rgba(0,0,0,0.18);
          animation: cldSlideUp 0.3s ease;
        }
        @keyframes cldSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cld-modal h3 {
          margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 700; color: #1a1a1a;
        }
        .cld-modal p {
          margin: 0 0 1.5rem; font-size: 0.9rem; color: #666;
        }
        .cld-progress-wrap {
          width: 100%; height: 6px; background: #e5e7eb;
          border-radius: 999px; overflow: hidden; margin-bottom: 1rem;
        }
        .cld-progress-bar {
          height: 100%; width: 0%; background: #386a20;
          border-radius: 999px; transition: width 0.3s ease;
        }
        .cld-status {
          font-size: 0.85rem; color: #386a20; font-weight: 600;
        }
        .cld-error {
          color: #dc2626; font-weight: 600; font-size: 0.9rem;
        }
        .cld-btn-retry {
          margin-top: 1rem; padding: 0.5rem 1.5rem;
          background: #386a20; color: #fff; border: none;
          border-radius: 12px; font-size: 0.9rem; font-weight: 600;
          cursor: pointer;
        }
        .cld-btn-retry:hover { background: #2d5619; }
      `;
      document.head.appendChild(style);
    }

    function showUploadModal() {
      const overlay = document.createElement("div");
      overlay.className = "cld-overlay";
      overlay.innerHTML = `
        <div class="cld-modal">
          <h3>📤 Mengunggah File...</h3>
          <p>Mohon tunggu, file sedang dikirim ke server.</p>
          <div class="cld-progress-wrap">
            <div class="cld-progress-bar" id="cldProgressBar"></div>
          </div>
          <div class="cld-status" id="cldStatus">Mempersiapkan...</div>
        </div>
      `;
      document.body.appendChild(overlay);
      return overlay;
    }

    function uploadFile(file) {
      return new Promise(function (resolve, reject) {
        const overlay = showUploadModal();
        const progressBar = document.getElementById("cldProgressBar");
        const statusEl = document.getElementById("cldStatus");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        // Detect resource type based on file MIME type
        var resourceType = "image";
        if (file.type && file.type.startsWith("video/")) {
          resourceType = "video";
        } else if (file.type && !file.type.startsWith("image/")) {
          resourceType = "raw";
        }

        const xhr = new XMLHttpRequest();
        xhr.open(
          "POST",
          "https://api.cloudinary.com/v1_1/" + cloudName + "/" + resourceType + "/upload"
        );

        xhr.upload.addEventListener("progress", function (e) {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            progressBar.style.width = pct + "%";
            statusEl.textContent = "Mengunggah... " + pct + "%";
          }
        });

        xhr.addEventListener("load", function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            statusEl.textContent = "✅ Berhasil!";
            progressBar.style.width = "100%";
            setTimeout(function () {
              overlay.remove();
            }, 600);
            resolve(data.secure_url);
          } else {
            var errorMsg = "Upload gagal.";
            try {
              var errData = JSON.parse(xhr.responseText);
              errorMsg = errData.error
                ? errData.error.message
                : "Terjadi kesalahan.";
            } catch (e) {}
            overlay.querySelector(".cld-modal").innerHTML =
              '<h3>❌ Gagal Mengunggah</h3>' +
              '<p class="cld-error">' + errorMsg + "</p>" +
              '<button class="cld-btn-retry" onclick="this.closest(\'.cld-overlay\').remove()">Tutup</button>';
            reject(new Error(errorMsg));
          }
        });

        xhr.addEventListener("error", function () {
          overlay.querySelector(".cld-modal").innerHTML =
            '<h3>❌ Koneksi Gagal</h3>' +
            '<p class="cld-error">Pastikan Anda terhubung ke internet.</p>' +
            '<button class="cld-btn-retry" onclick="this.closest(\'.cld-overlay\').remove()">Tutup</button>';
          reject(new Error("Network error"));
        });

        xhr.send(formData);
      });
    }

    return {
      show: function (opts) {
        var allowMultiple = opts && opts.allowMultiple;
        var imagesOnly = opts && opts.imagesOnly;

        var input = document.createElement("input");
        input.type = "file";
        input.style.display = "none";
        if (imagesOnly) {
          input.accept = "image/*";
        } else {
          input.accept = "image/*,video/*,.pdf,.doc,.docx";
        }
        if (allowMultiple) {
          input.multiple = true;
        }

        input.addEventListener("change", async function () {
          var files = Array.from(input.files);
          if (files.length === 0) return;

          // Validate video file size (max 20MB)
          var MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB
          for (var v = 0; v < files.length; v++) {
            if (files[v].type && files[v].type.startsWith("video/") && files[v].size > MAX_VIDEO_SIZE) {
              var sizeMB = (files[v].size / 1024 / 1024).toFixed(1);
              var overlay = document.createElement("div");
              overlay.className = "cld-overlay";
              overlay.innerHTML =
                '<div class="cld-modal">' +
                '<h3>⚠️ Video Terlalu Besar</h3>' +
                '<p>Ukuran video <strong>' + sizeMB + ' MB</strong> melebihi batas maksimal <strong>20 MB</strong>. Silakan kompres video terlebih dahulu.</p>' +
                '<button class="cld-btn-retry" onclick="this.closest(\'.cld-overlay\').remove()">Tutup</button>' +
                '</div>';
              document.body.appendChild(overlay);
              input.remove();
              return;
            }
          }

          try {
            if (files.length === 1) {
              var url = await uploadFile(files[0]);
              handleInsert(url);
            } else {
              var urls = [];
              for (var i = 0; i < files.length; i++) {
                var url = await uploadFile(files[i]);
                urls.push({ url: url });
              }
              handleInsert(urls.map(function (u) { return u.url; }));
            }
          } catch (err) {
            console.error("Cloudinary unsigned upload error:", err);
          }

          input.remove();
        });

        document.body.appendChild(input);
        input.click();
      },

      hide: function () {},
      enableStandalone: function () {
        return false;
      },
    };
  },
};

CMS.registerMediaLibrary(CloudinaryUnsignedMediaLibrary);
