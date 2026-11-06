# Harpot Monopoly

Monopoli bertema sekolah sihir untuk 2-4 pemain (satu perangkat atau online berdua lewat PeerJS).

## Struktur
```
harpot-monopoly/
├── index.html          kerangka halaman, modal, data lore (JSON)
├── css/style.css       tampilan: HUD, modal, efek
├── js/game.js          STATE + aturan main + HUD + jaringan (P, O, H, cur, ph)
├── js/view.js          VIEW 3D: class MagicMonopolyLGR (Three.js + GSAP)
├── img/                map.jpg, landmark.jpg, chars/ (potret), tiles/ (gambar 1:1 petak)
├── audio/              bgm.wav, dice.wav, step.wav, coin.wav, take.wav (ganti dengan file sendiri bila mau)
└── models/             opsional: {idKarakter}.glb untuk pion 3D
```

## Aturan bangunan
Mendarat di petak kosong dan membeli = Rumah 1. Mendarat lagi di petak sendiri = Upgrade ke Rumah 2.
Mendarat lagi = rumah dihancurkan dan diganti Landmark (sewa 10x dasar). Satu upgrade per giliran.

## Pion
`loadCharacterPawn(id, type)` mencoba GLB (`models/{id}.glb`), lalu sprite 2.5D dari `img/chars/{id}.jpg`, lalu pion kristal.
Sprite butuh dibuka lewat http (Vercel atau server lokal); dari file:// browser memblokirnya dan pion kristal dipakai.

## Deploy
`npx vercel --prod` di folder ini.

## Kontrol dan mekanik
- **Dadu:** tahan "Tahan & Lepas" di bawah layar. Zona bar: sampai 25% = 2-3, sampai 66% = 4-8, sisanya 9-12. Setelah dadu berhenti muncul lingkaran jumlah.
- **Bangunan:** beli petak = Rumah 1, mendarat lagi = Rumah 2, lalu Landmark (sewa 10x). Satu upgrade per giliran.
- **Takeover:** setelah bayar sewa di petak lawan (Rumah 1/2), bayar 2x harga petak untuk merebutnya; bangunannya langsung naik 1 tingkat (Rumah 1 -> Rumah 2, Rumah 2 -> Landmark). Landmark tidak bisa direbut.
- **Kartu:** Dana Umum (2 petak) dan Kesempatan (1 petak), masing-masing 14 kartu dengan efek berbeda: uang, gerak, penjara, perisai sewa, upgrade gratis, antar pemain.
- **Roda Keberuntungan:** 8 hadiah (koin, lempar lagi, Perisai Sewa, rugi koin) dengan pop-up rincian.
- **Ke Penjara:** pion dikurung sangkar dan tidak bisa bergerak 2 giliran (Minerva 1 giliran, Kartu Bebas Penjara membatalkan).
- **Gerbang Jebakan:** penalti acak 5% sampai 60% koin dalam 6 tingkat.
- **Karakter:** tiap karakter punya efek pasif; yang aktif muncul sebagai teks "✦" di atas pion. Pion 3D berupa miniatur bergaya bidak catur sesuai karakter.
- **Dekorasi peta:** ketuk objek di peta (kastil, tumpukan kartu, kuali, griffin, dadu, koin, lilin, buku, dll.) untuk detail dan varian. Tombol "✦ Detail dekorasi" menyorot titik ketuknya.
- **Mode bot:** "Lawan 2 bot" di layar awal (Voldemort dan Snape). Hanya untuk satu perangkat, bukan online.
- **Papan:** "Peta lukis / Papan 3D" menukar tampilan. Jika img/map.jpg gagal dimuat, Papan 3D dipakai otomatis.
- **Hover petak:** tooltip dan petak naik sedikit. Klik petak untuk modal detail.

## Catatan teknis
- Gambar sisi atas petak 3D dimuat lewat canvas. Dari file:// browser memblokirnya, jadi warna dasar dipakai; lewat http (Vercel) gambar tampil.
- BGM mulai setelah ketukan pertama (aturan autoplay browser).
- Model GLB opsional: taruh di models/{id}.glb lalu tambahkan `<script>window.HARPOT_GLB=true</script>` sebelum js/view.js.
- Data kartu, roda, jebakan, dan dekorasi ada di js/data.js; mengubahnya tidak menyentuh logika.
