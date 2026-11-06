HARPOT MONOPOLY - PETA KEDUA "MAPS HD" (37 petak)

Peta Harpot lama (36 petak) TIDAK berubah dan tetap bawaan. Peta kedua dipilih di layar awal:
tombol "Maps HD (37 petak, lore Harry Potter)" membuka halaman dengan ?map=2.
Main online: tautan undangan membawa ?map=2, dan tamu otomatis mengikuti peta tuan rumah.

FILE BARU
- js/lore_tiles.js   Salinan LORE_Javascript__Tiap_Tiles_.js (HP_TILES_LORE, getTileLore). Tidak diubah.
- js/map2.js         Pemilih peta (MAPSEL), 37 posisi petak, jenis petak, modal/bonus Mulai. Nama dan harga
                     petak dibangun dari HP_TILES_LORE, jadi mengubah lore ikut mengubah peta ini.
- img/maps2/tiles/0..36.jpg   Petak Maps HD, crop tengah jadi persegi 512px (tidak digepengkan), jpg 78%.
- img/maps2/board.jpg/.mp4    Papan Wizarding (lihat bagian v3 di bawah).

FILE YANG DIUBAH (perubahan kecil)
- js/game.js    const raw / POS memilih data peta; START_M, GO, JNAME menggantikan angka 1000, 200 dan nama
                penjara; pickMap(); snapshot membawa map; modal petak memakai lore kaya di peta 2.
- js/view.js    Tekstur petak lewat TILE_IMG(i); tooltip peta 2 hanya name + subtitle.
- index.html    Skrip baru, tombol pilih peta, elemen modal-sub dan modal-fun.
- css/style.css Gaya peta 2 (papan, modal lore). Hanya aktif untuk body.map2 / #tile-modal.rich.

ATURAN PETA 2 (aturan main inti tidak disentuh)
- Rumah 1 -> Rumah 2 -> Landmark, takeover 2x, bot, penjara, roda, jebakan tetap sama.
- Harga memakai harga lore (150 sampai 900G). Karena itu modal awal 2000G dan bonus Mulai 400G (2x).
  Ubah di MAP2.money dan MAP2.go (js/map2.js).
- Petak spesial memakai nama lore: Platform 9 3/4 = Mulai, Azkaban Prison = Penjara,
  Ministry of Magic = Ke Penjara, Weasleys' Wizard Wheezes = Roda Keberuntungan,
  The Forbidden Forest = Gerbang Jebakan, Hogsmeade Station dan The Knight Bus = Stasiun (sewa 25G x jumlah).
  Petak spesial tidak dijual (harga game 0). Semua petak lain adalah properti berharga lore.
- Peta 2 tidak punya petak Dana Umum, Kesempatan, dan Pajak (lore tidak memuatnya).

MODAL DAN TOOLTIP (peta 2)
- Klik petak: gambar, category, name, subtitle, lore, funFact ("Tahukah kamu?"), lalu harga, pemilik, level,
  sewa per level, aturan petak, dan tombol bangun. Data id tidak ada: modal tetap terbuka dengan data game.
- Hover: name + subtitle.

BATAS YANG DIKETAHUI

PAPAN WIZARDING + RUMAH BERGAMBAR (v3)
Papan Peta 2
- img/maps2/board.mp4  Video loop 9 detik 1280x720 (naga menyembur api, ular bergerak, asap). Sambungan
                       loop di-crossfade 1 detik agar tidak meloncat. Diputar tanpa suara di belakang kanvas 3D.
- img/maps2/board.jpg  Frame pertama video: poster saat video belum jalan (iOS mode hemat daya) dan latar halaman.
- Papan Peta 2 sekarang 16:9. 37 posisi petak (MAP2.POS) dihitung dari 4 sudut papan lewat homografi,
  petak 0 di sudut depan (petak panah "511"), jalan ke kiri searah panah. MAP2.SC = skala perspektif rumah.
- Petak 3D (slab) kembali seperti Peta 1: tak terlihat, muncul saat hover (gambar petak Maps HD tetap dipakai
  di hover dan modal lore).

Rumah (kedua peta) - js/houses-img.js + js/houses-art.js
- Tingkat 1, Tingkat 2, Landmark 4D = potongan gambar referensi (latar dihapus), WebP di img/houses/.
  Peta 1 memakai rumah dari gambar berlatar papan Harpot, Peta 2 dari gambar berlatar papan naga/ular.
- js/houses-art.js berisi gambar yang sama sebagai data URI, supaya tetap tampil saat index.html dibuka
  langsung dari file:// (WebGL menolak gambar file:// biasa).
- Motion bangun (mengikuti video Workflow Bangun Rumah 1-Landmark):
  beli petak (Rumah 1): akta emas bersinar -> pecah jadi hujan koin -> cincin sihir hijau -> rumah muncul
  dari kabur ke tajam + kilau -> papan nama TINGKAT 1. Selama momen ini rumah maju ke depan pion dan membesar.
  Naik ke Rumah 2: cincin ungu + emas, rumah lama berganti. Landmark: cincin biru/hijau/putih + ledakan emas.
- Idle: asap cerobong, cahaya warna pemilik di alas, cincin pelan berputar di Landmark.
- Takeover hanya mengganti warna cahaya pemilik. Ikon rumah hijau 2D di petak disembunyikan saat 3D aktif.
- js/houses4d.js (rumah prosedural lama) tidak dimuat lagi; file dibiarkan di paket sebagai cadangan.

PERBAIKAN v4
- Kastil Peta 2 transparan saat pion 3D lewat di belakangnya (petak belakang, terutama kanan atas):
  js/castle-xray.js menggambar potongan kastil (img/maps2/castle.webp, data URI di houses-art.js) di depan
  pion dengan opasitas 0.55, memudar halus. Pion di depan kastil tidak memicu efek ini.
- Rumah (semua peta) 72% lebih kecil dan digeser ke sisi petak yang menghadap tengah papan (SMALL, INSET
  di js/houses-img.js). Momen bangun tetap membesar di depan pion lalu kembali ke ukuran kecil.
- Rumah menyatu dengan petak: alas batu dipudarkan ke bawah (14% bawah gambar) + bayangan kontak gelap.
- Takeover: setelah merebut, bangunan langsung naik 1 tingkat (Rumah 1 -> Rumah 2, Rumah 2 -> Landmark),
  gratis, dengan animasi naik level. js/game.js fungsi takeover(). Landmark tetap tidak bisa direbut.

DETAIL DEKORASI PETA 2 (v5)
- Tombol "Detail dekorasi" aktif di Peta 2. 16 benda bisa diketuk: kastil, naga, ular, patung griffin,
  Topi Seleksi, Golden Snitch, 3 botol ramuan, Galleon, peta tua, lambang asrama (3 varian), tongkat, tinta,
  lilin, perapian, kartu takdir, danau. Tiap benda: gambar close-up, deskripsi, dan 3-4 varian.
- Data: MAP2_SPOTS di js/map2.js (posisi piksel bingkai 1280x720).
- Gambar per varian: img/maps2/spots/{id}_{1..n}.jpg (48 gambar). Klik varian = gambar ikut berganti.
  Gambar ditampilkan utuh (contain) dalam kotak tinggi tetap, tidak dipotong ke persegi.
- js/game.js initSpots/openSpot memilih SPOTS (Peta 1) atau MAP2_SPOTS (Peta 2).

OPTIMASI PERFORMA (v6, kedua peta; tampilan tidak berubah)
Diukur di Chrome dengan 3 pemain + 16 bangunan:
- draw() (dipanggil tiap langkah pion): 2,7 ms -> 0,13 ms. Papan dan HUD hanya ditulis ulang bila isinya
  berubah (js/game.js). Bonus: scroll log dan animasi tidak ter-reset.
- Draw call: 160 -> 128. Bagian miniatur pion dan sangkar yang materialnya sama digabung jadi satu mesh
  (view.js mergeStatic), bentuk dan warna identik.
- Geometri GPU: 161 -> 50, heap JS 15 -> 10 MB. Koin, kilau, asap, rumah memakai geometri bersama;
  asap cerobong memakai 4 kepulan bergiliran, bukan objek baru tiap detik (js/houses-img.js).
- Tidak ada lagi tersendat saat beli rumah pertama: tekstur rumah/efek diunggah ke GPU dan shader
  dikompilasi saat game menganggur (prewarm).
- Layar 90/120 Hz: render 3D dibatasi 60 fps (hemat GPU dan baterai, tidak cepat panas).
- Tekstur gambar petak (hanya untuk hover, sekitar 60px) 512 -> 256 px di Peta 2: hemat sekitar 35 MB memori GPU.
- Video papan Peta 2 berhenti saat tab disembunyikan atau saat mode Papan 3D.
- Latar halaman tidak lagi memakai background-attachment:fixed (penyebab repaint penuh tiap scroll di HP).
