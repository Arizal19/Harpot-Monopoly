HARPOT MONOPOLY - RUMAH 4D v2 (REALISTIS)

Rumah penyihir realistis untuk Harpot Monopoly (Three.js r128). Acuan visual: "House 1" dan "House 2" dari Maps HD.
Tanpa file gambar: semua prosedural (geometri + tekstur canvas). view.js TIDAK diubah.

ISI PAKET
1. js/houses4d.js            Modul produksi. Patch MagicMonopolyLGR.prototype. Muat SETELAH js/view.js.
2. index.html                Hanya tambah <script src="js/houses4d.js"></script> setelah js/view.js.
3. test/houses4d.test.js     10 test, memakai Three.js asli. Jalankan: node test/houses4d.test.js
                             (set THREE_PATH=path/ke/three.min.js bila js/three.min.js tidak ada).
4. houses4d-demo.html        Demo mandiri satu petak. Tombol: bangun, bangun instan, naik level 2, hapus.

PERUBAHAN DARI VERSI LAMA
- Level 1 (Rumah 1)  = pondok batu: pondasi batu, dinding plaster + rangka kayu, atap sirap lumut, cerobong,
                       pintu kayu, jendela menyala, tanaman rambat, pagar kecil, semak, batu taman.
- Level 2 (Rumah 2)  = SATU rumah kayu 2 lantai (referensi House 2) yang MENGGANTIKAN pondok.
                       Dulu level 2 = dua kotak berdampingan. view.js masih memanggil addHouse dua kali
                       (x = -18 lalu +18); panggilan kedua diabaikan modul.
- Pose miring ke kamera seperti slab petak (pitch + yaw), jadi terlihat 3D di kamera ortografik.
- Orb melayang dan PointLight dihapus: papan penuh rumah melewati batas uniform GPU. Jendela menyala lewat
  material emissive + halo additive.
- Tiap rumah digabung jadi sekitar 10 mesh (satu per material). Variasi kecil per petak lewat seed.
- Warna pemilik: bendera/panji kecil + cincin rune di tanah.

EFEK 4D (waktu)
- Asap cerobong naik, jendela berkedip seperti lilin, panji bergoyang, cincin rune bernapas.
- Animasi beli: rumah naik dari bawah petak lalu pop elastis, debu #d8b98a, teks "RUMAH SIHIR".
- Animasi naik level: pondok mengecil, rumah 2 lantai muncul, teks "RUMAH 2 TINGKAT".
- Petak yang dimuat awal (silent) tanpa animasi masuk, tapi loop ambient tetap jalan.
- reduced-motion: tidak ada animasi sama sekali.

Z-ORDER (gambar petak tetap terlihat)
- Permukaan petak z = -2 + 4U, holder rumah z = 20, pion z = 40 + indeks pemain.
- Rumah dipipihkan di sumbu z (0.28) sehingga tetap di antara petak dan pion. Proyeksi ortografik
  mengabaikan z, jadi pemipihan tidak mengubah gambar.
- Cakram dasar + cincin rune maksimal sekitar 42 unit, petak sekitar 59 unit: gambar petak membingkai rumah.

VERIFIKASI
- node test/houses4d.test.js : 10 lulus.
- Dicoba di game nyata (begin(2), set kepemilikan beberapa petak level 1 dan 2, naik level 1 -> 2):
  rumah tampil, pion tetap di depan, tanpa error konsol.
- Catatan: ikon rumah hijau datar di atas petak adalah badge DOM bawaan game (.hs di game.js), bukan bagian modul ini.

BATAS YANG DIKETAHUI
- Level 3 (Landmark) masih memakai buildLandmark() asli di view.js. Bisa dibuat versi kastil seperti gambar
  "Castle Hogwarts Landmark" di langkah berikutnya.
- Tekstur dibuat sekali (cache global). Geometri dibebaskan saat rumah dihapus (retire).
