/* =====================================================================
   HARPOT MONOPOLY: DATA (roda, jebakan, dek kartu, dekorasi peta)
   Dimuat sebelum js/game.js. Mengubah isi file ini tidak mengubah logika.
   ===================================================================== */
const WHEEL=[
  {t:'+300G',k:'jackpot',m:300},{t:'+200G',k:'win',m:200},{t:'+100G',k:'win',m:100},{t:'+50G',k:'win',m:50},
  {t:'Lempar lagi',k:'extra',x:'roll'},{t:'Perisai Sewa',k:'shield',x:'shield'},{t:'-50G',k:'lose',m:-50},{t:'-100G',k:'lose',m:-100}
];
/* Gerbang Jebakan: penalti acak dari yang terkecil sampai terparah (maks. 60% koin). w = bobot peluang. */
const TRAP=[
  {n:'Sepele',pct:.05,w:30},{n:'Ringan',pct:.10,w:25},{n:'Sedang',pct:.20,w:20},
  {n:'Berat',pct:.35,w:13},{n:'Parah',pct:.50,w:8},{n:'Maut',pct:.60,w:4}
];
/* f = jenis efek: money, collectAll, payAll, repair, passJail, shield, freeBuild, extra, jail, moveTo, moveBack, moveFwd, nearestR */
const DECKS={
  dana:{name:'Dana Umum',icon:'🏦',cards:[
    {t:'Warisan Bibi Penyihir',x:'Terima 150G dari warisan.',f:'money',v:150},
    {t:'Hadiah Turnamen Sapu',x:'Juara balap sapu: terima 100G.',f:'money',v:100},
    {t:'Dana Beasiswa',x:'Beasiswa sekolah sihir cair: terima 200G.',f:'money',v:200},
    {t:'Harta Karun Kecil',x:'Menemukan peti tua: terima 80G.',f:'money',v:80},
    {t:'Lotre Galleon',x:'Tiket undian beruntung: terima 50G.',f:'money',v:50},
    {t:'Ramuan Gagal',x:'Kuali meledak: bayar 60G.',f:'money',v:-60},
    {t:'Iuran Sekolah',x:'Bayar iuran sekolah 80G.',f:'money',v:-80},
    {t:'Biaya Penyembuh',x:'Bayar ongkos penyembuh 100G.',f:'money',v:-100},
    {t:'Pesta Ulang Tahun',x:'Semua pemain lain memberimu 30G.',f:'collectAll',v:30},
    {t:'Renovasi Menara',x:'Bayar 25G per Rumah dan 100G per Landmark milikmu.',f:'repair',h:25,l:100},
    {t:'Kartu Bebas Penjara',x:'Simpan: kebal dari satu hukuman penjara.',f:'passJail'},
    {t:'Perisai Sewa',x:'Simpan: bebas membayar satu kali sewa.',f:'shield'},
    {t:'Sapu ke Titik Awal',x:'Maju ke Mulai dan ambil bonus.',f:'moveTo',to:'START'},
    {t:'Diskon Tukang',x:'Upgrade bangunan berikutnya gratis.',f:'freeBuild'}
  ]},
  kesempatan:{name:'Kesempatan',icon:'📜',cards:[
    {t:'Sapu Terbang ke Mulai',x:'Terbang ke Mulai dan ambil bonus.',f:'moveTo',to:'START'},
    {t:'Mundur 3 Petak',x:'Angin sakal mendorongmu mundur 3 petak.',f:'moveBack',v:3},
    {t:'Maju 3 Petak',x:'Angin buritan mendorongmu maju 3 petak.',f:'moveFwd',v:3},
    {t:'Kunjungan Observatorium',x:'Maju ke Observatorium.',f:'moveTo',to:'Observatorium'},
    {t:'Undangan Kastil Elderoak',x:'Maju ke Kastil Elderoak.',f:'moveTo',to:'Kastil Elderoak'},
    {t:'Tersesat di Hutan',x:'Kamu tersesat dan tiba di Hutan Berbisik.',f:'moveTo',to:'Hutan Berbisik'},
    {t:'Teleportasi ke Roda',x:'Lingkaran sihir membawamu ke Roda Keberuntungan.',f:'moveTo',to:'Roda Keberuntungan'},
    {t:'Stasiun Sapu Terdekat',x:'Maju ke Stasiun Sapu terdekat.',f:'nearestR'},
    {t:'Kutukan Penjara',x:'Kutukan menjatuhkanmu ke Menara Hukuman.',f:'jail'},
    {t:'Mantra Salah Sasaran',x:'Mantramu meleset: bayar 150G.',f:'money',v:-150},
    {t:'Kejutan Peri',x:'Peri kecil menjatuhkan 120G untukmu.',f:'money',v:120},
    {t:'Traktir Semua',x:'Bayar 20G kepada setiap pemain lain.',f:'payAll',v:20},
    {t:'Putaran Ekstra',x:'Lempar dadu sekali lagi.',f:'extra'},
    {t:'Sihir Pembangun',x:'Upgrade bangunan berikutnya gratis.',f:'freeBuild'}
  ]}
};
/* Dekorasi peta yang bisa diketuk. pts = posisi (piksel pada peta 1024x765), r = radius area ketuk. v = varian. */
const SPOTS=[
  {id:'castle',n:'Kastil Pusat',pts:[[505,330]],r:70,desc:'Kastil di atas tebing berkabut ini menjadi lambang Harpot Monopoly. Cahaya emas berputar di gerbangnya setiap kali ada yang melewati Mulai.',
   v:[{n:'Menara Utara',d:'Menara tertinggi, tempat para penyihir membaca bintang sebelum ujian.'},{n:'Gerbang Emas',d:'Gerbang yang hanya terbuka bagi pemain yang berani mengambil risiko besar.'},{n:'Jembatan Kabut',d:'Jembatan batu yang menghilang saat badai dan muncul kembali saat fajar.'}]},
  {id:'deckK',n:'Tumpukan Kesempatan',pts:[[320,345]],r:46,desc:'Kartu Kesempatan penuh kejutan: gerakan mendadak, hadiah, bahkan kutukan. Ditarik saat mendarat di petak Kesempatan.',v:'kesempatan'},
  {id:'deckD',n:'Tumpukan Dana Umum',pts:[[700,340]],r:46,desc:'Kartu Dana Umum kebanyakan soal uang dan perlindungan, sesekali ada tagihan. Ditarik saat mendarat di petak Dana Umum.',v:'dana'},
  {id:'hat',n:'Topi Penyihir',pts:[[440,222]],r:30,desc:'Sebuah topi penyihir bertabur bintang tergeletak di papan. Tidak ada yang mengaku sebagai pemiliknya.',
   v:[{n:'Topi Ungu',d:'Dipakai penyihir bintang. Konon menambah kepercayaan diri saat melempar dadu.'},{n:'Topi Zamrud',d:'Hijau tua dengan pita perak, gaya para penyihir bangsawan.'},{n:'Topi Hitam',d:'Topi paling klasik. Ujungnya selalu miring ke arah angin.'}]},
  {id:'broom',n:'Sapu Terbang',pts:[[385,258],[482,188]],r:34,desc:'Sapu terbang adalah kendaraan utama antar petak. Beberapa dibiarkan menunggu di papan.',
   v:[{n:'Sapu Kayu',d:'Pegangan aus dan ranting kasar, tapi paling awet dan murah.'},{n:'Sapu Perak',d:'Ringan dan cepat, cocok untuk balapan jarak pendek.'},{n:'Sapu Balap',d:'Ramping dan lincah. Hanya penyihir terlatih yang sanggup mengendalikannya.'}]},
  {id:'cauldron',n:'Kuali Ramuan',pts:[[545,195],[585,228]],r:32,desc:'Kuali besi yang selalu mendidih. Warna ramuannya berubah mengikuti suasana hati yang mengaduknya.',
   v:[{n:'Ramuan Hijau',d:'Menambah stamina, tapi rasanya seperti rumput basah.'},{n:'Ramuan Ungu',d:'Membuat suara terdengar lebih bijak selama satu jam.'},{n:'Ramuan Emas',d:'Paling langka. Berkilau dan berbau madu.'}]},
  {id:'griffin',n:'Patung Griffin',pts:[[640,255]],r:34,desc:'Patung griffin penjaga papan. Matanya dikatakan mengikuti pemain yang curang.',
   v:[{n:'Griffin Muda',d:'Masih belajar terbang dan sering menabrak lampu.'},{n:'Griffin Dewasa',d:'Penjaga setia yang tidak pernah berkedip.'},{n:'Griffin Legendaris',d:'Sayapnya konon bisa menutupi seluruh kastil.'}]},
  {id:'dice',n:'Dadu Bintang',pts:[[500,512],[555,505]],r:36,desc:'Sepasang dadu dengan bintang emas sebagai ganti titik. Dalam game ini kamu menentukan hasilnya dengan bar Tahan & Lepas.',
   v:[{n:'Dadu Gelap',d:'Batu hitam berkilau. Dikenal membawa angka-angka besar bagi yang berani.'},{n:'Dadu Terang',d:'Gading pucat. Cenderung memberi langkah kecil yang aman.'},{n:'Zona Bar',d:'Bar sampai 25% menghasilkan 2-3, sampai 66% menghasilkan 4-8, sisanya 9-12.'}]},
  {id:'spells',n:'Kartu Mantra',pts:[[640,420]],r:52,desc:'Kartu-kartu bergambar mantra tergeletak di tengah papan sebagai hiasan para penyihir.',
   v:[{n:'Mantra Sapu',d:'Memanggil sapu terbang dari jarak jauh.'},{n:'Mantra Petir',d:'Menyalakan penangkal petir di menara.'},{n:'Mantra Cahaya',d:'Menerangi lorong gelap tanpa lilin.'}]},
  {id:'coins',n:'Koin Galleon',pts:[[80,468],[910,220],[655,655]],r:46,desc:'Tumpukan koin yang dipakai di seluruh game. Satuan uangnya G.',
   v:[{n:'Koin Emas',d:'Bernilai tinggi. Dipakai untuk membeli properti dan membangun.'},{n:'Koin Perak',d:'Bernilai sedang. Dipakai untuk membayar sewa harian.'},{n:'Koin Bintang',d:'Koin langka bergambar bintang, hadiah dari Roda Keberuntungan.'}]},
  {id:'candle',n:'Lilin Penyihir',pts:[[62,170],[995,235],[990,490]],r:46,desc:'Lilin besar yang menyala sepanjang permainan dan tidak pernah habis.',
   v:[{n:'Lilin Emas',d:'Apinya hangat dan tenang. Menjaga penyihir tetap fokus.'},{n:'Lilin Bisik',d:'Apinya berderak pelan seakan menyampaikan rahasia.'},{n:'Lilin Abadi',d:'Lilin tertua di meja. Konon sudah menyala sejak sekolah ini berdiri.'}]},
  {id:'bottles',n:'Botol Ramuan',pts:[[760,75],[885,65],[965,115]],r:48,desc:'Botol-botol kaca besar berisi ramuan yang disimpan untuk keadaan darurat.',
   v:[{n:'Ramuan Cokelat',d:'Pahit dan kental. Bagus untuk melawan kantuk.'},{n:'Ramuan Hijau',d:'Berbau lumut. Katanya menyembuhkan segala jenis flu.'},{n:'Ramuan Ungu',d:'Berpendar lembut. Jangan diminum sebelum bertanya dulu.'}]},
  {id:'books',n:'Buku Kuno',pts:[[85,115],[620,45],[60,640]],r:60,desc:'Tumpukan buku mantra yang halamannya berpindah sendiri saat tidak diperhatikan.',
   v:[{n:'Buku Mantra',d:'Berisi mantra dasar dan peringatan tentang mantra yang salah.'},{n:'Buku Ramuan',d:'Resep lengkap, termasuk bagian yang sengaja disobek.'},{n:'Buku Peta',d:'Peta bintang dan jalur sapu di sekitar kastil.'}]},
  {id:'propcards',n:'Kartu Properti',pts:[[195,545],[300,605],[835,545],[770,585]],r:62,desc:'Kartu hiasan bergambar properti, stasiun, dan utilitas. Hanya penanda di meja, bukan kartu permainan.',
   v:[{n:'Properti',d:'Tiap properti mulai dari Rumah 1, lalu Rumah 2, lalu Landmark.'},{n:'Stasiun Sapu',d:'Sewa 25G dikali jumlah stasiun yang dimiliki pemilik.'},{n:'Utilitas',d:'Sewa mengikuti angka dadu: 4 kali, atau 10 kali bila punya dua sumur.'}]}
];
function deckVariants(dk){
  const cat=c=>({money:'Uang',collectAll:'Antar pemain',payAll:'Antar pemain',repair:'Antar pemain',moveTo:'Gerak',moveBack:'Gerak',moveFwd:'Gerak',nearestR:'Gerak'})[c.f]||'Spesial';
  const g={};DECKS[dk].cards.forEach(c=>{(g[cat(c)]=g[cat(c)]||[]).push(c.t+' ('+c.x.replace(/\.$/,'')+')')});
  return Object.keys(g).map(n=>({n,d:g[n].join(' • ')}));
}
