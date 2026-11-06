/* =====================================================================
   HARPOT MONOPOLY: PETAK KEDUA "MAPS HD" (37 petak, lore dari HP_TILES_LORE)
   Dimuat setelah js/lore_tiles.js dan SEBELUM js/game.js.
   Peta dipilih di layar awal (tautan ?map=2). Tanpa ?map=2 game persis seperti semula (Peta Harpot, 36 petak).
   Nama dan harga petak diambil langsung dari HP_TILES_LORE, jadi mengubah lore ikut mengubah peta ini.
   ===================================================================== */
const MAPSEL=(()=>{try{return new URLSearchParams(location.search).get('map')==='2'?2:1}catch(e){return 1}})();
/* Jenis petak: S Mulai, J Penjara (Azkaban), W Ke Penjara, F Roda Keberuntungan, X Gerbang Jebakan, R Stasiun.
   Selain itu properti. Huruf warna (b l p o r y g n) hanya penanda warna badge di game.js (const G). */
const MAP2_TYPE={0:'S',3:'J',9:'W',13:'F',24:'X',15:'R',25:'R',
  1:'b',17:'b',28:'b',6:'l',7:'l',20:'l',21:'l',5:'p',8:'p',12:'p',10:'o',11:'o',14:'o',29:'o',32:'o',
  22:'r',23:'r',27:'r',30:'r',18:'y',19:'y',26:'y',16:'g',31:'g',34:'g',2:'n',4:'n',33:'n',35:'n',36:'n'};
const MAP2_SPECIAL='SJWFXR';   /* petak bukan-properti: tidak dijual, harga 0 */
/* 37 posisi (persen papan 16:9 = bingkai video img/maps2/board.mp4) di sepanjang cincin petak papan Wizarding.
   Dihitung dari 4 sudut papan lewat homografi; petak 0 (Mulai) di sudut depan, lalu ke kiri searah panah.
   SC = skala perspektif tiap petak (petak belakang sedikit lebih kecil), dipakai rumah di js/houses-img.js. */
const MAP2={
  money:2000,go:400,   /* harga lore kira-kira 2x harga Peta Harpot, jadi modal dan bonus Mulai ikut 2x */
  POS:[[59.3,84.1],[54.8,80.5],[50.3,76.9],[45.8,73.3],[41.2,69.7],[36.6,66.0],[32.0,62.4],[27.4,58.7],[22.8,55.0],[18.2,51.3],[19.7,47.1],[23.1,42.8],[26.6,38.5],[30.0,34.3],[33.3,30.2],[36.6,26.1],[39.9,22.1],[43.1,18.1],[46.3,14.2],[50.0,14.0],[54.3,17.5],[58.6,21.0],[62.9,24.6],[67.2,28.1],[71.4,31.5],[75.6,35.0],[79.8,38.5],[84.0,41.9],[86.5,45.5],[83.6,49.6],[80.7,53.7],[77.8,57.9],[74.8,62.1],[71.8,66.4],[68.7,70.7],[65.6,75.1],[62.5,79.6]],
  SC:[1.03,1.04,1.04,1.04,1.05,1.05,1.05,1.05,1.06,1.06,1.05,1.04,1.03,1.02,1.01,1.00,0.99,0.98,0.97,0.96,0.96,0.96,0.96,0.95,0.95,0.95,0.95,0.94,0.95,0.95,0.96,0.97,0.98,0.99,1.00,1.01,1.02],
  raw:(typeof HP_TILES_LORE!=='undefined'?HP_TILES_LORE:[]).map(t=>{
    const c=MAP2_TYPE[t.id]||'b',p=MAP2_SPECIAL.includes(c)&&c!=='R'?0:t.price;
    return t.name+'|'+c+(c==='S'||c==='J'||c==='W'||c==='F'||c==='X'?'':'|'+p);
  }).join(';')
};
/* gambar petak: Peta 2 memakai img/maps2/tiles/{id}.jpg (persegi 512px, crop tengah dari Maps HD) */
const TILE_IMG=i=>MAPSEL===2?'img/maps2/tiles/'+i+'.jpg':'img/tiles/'+i+'.jpg';
/* fallback: bila lore gagal dimuat, peta 2 tidak dipakai (game kembali ke Peta Harpot) */
if(MAPSEL===2&&MAP2.raw.split(';').length!==37){console.warn('map2: lore 37 petak tidak lengkap, memakai Peta Harpot');location.replace(location.pathname)}
/* papan Peta 2 hidup: video loop (naga menyembur api, ular bergerak). Poster = img/maps2/board.jpg bila video tak bisa autoplay. */
if(MAPSEL===2){const bg=document.getElementById('mapbg');if(bg){const v=document.createElement('video');
  v.muted=true;v.loop=true;v.autoplay=true;v.playsInline=true;['muted','playsinline','webkit-playsinline','autoplay','loop'].forEach(a=>v.setAttribute(a,''));
  v.preload='auto';v.poster='img/maps2/board.jpg';v.src='img/maps2/board.mp4';bg.appendChild(v);
  const go=()=>{const p=v.play();if(p&&p.catch)p.catch(()=>{})};go();addEventListener('pointerdown',go,{once:true});
  const upd=()=>{if(document.hidden||document.body.classList.contains('boxmode'))v.pause();else if(v.paused)go()};   /* video berhenti saat tab tersembunyi / Papan 3D */
  document.addEventListener('visibilitychange',upd);new MutationObserver(upd).observe(document.body,{attributes:true,attributeFilter:['class']})}}   /* iOS hemat daya: putar ulang setelah sentuhan pertama */
/* Dekorasi Peta 2 yang bisa diketuk (tombol "Detail dekorasi"). pts = posisi piksel pada bingkai video 1280x720,
   r = radius area ketuk, v = varian. Gambar per varian: img/maps2/spots/{id}_{1..n}.jpg (potongan papan resolusi tinggi,
   dibingkai utuh tanpa dipotong paksa ke persegi). */
const MAP2_SPOTS=[
  {id:'castle',n:'Kastil Hogwarts',pts:[[700,230]],r:60,desc:'Kastil di atas tebing batu ini menjadi jantung papan. Ratusan jendelanya menyala setiap malam dan asap tipis naik dari menara-menaranya.',
   v:[{n:'Menara Astronomi',d:'Menara tertinggi, tempat para murid mengamati bintang lewat teleskop kuningan.'},{n:'Aula Besar',d:'Langit-langitnya disihir menyerupai langit di luar. Pesta awal tahun selalu diadakan di sini.'},{n:'Jembatan Viaduk',d:'Lengkung batu panjang yang menghubungkan kastil dengan halaman depan.'}]},
  {id:'dragon',n:'Naga Penjaga',pts:[[1150,470]],r:80,desc:'Naga bersisik gelap ini menjaga sudut kanan papan. Sesekali ia menyemburkan api ke petak di depannya, mengingatkan bahwa harta selalu dijaga.',
   v:[{n:'Semburan Api',d:'Apinya cukup panas untuk melelehkan Galleon, tapi entah kenapa papan tidak pernah terbakar.'},{n:'Sayap Berduri',d:'Sayapnya terbentang saat ada pemain yang membangun Landmark di dekatnya.'},{n:'Mata Kuning',d:'Konon naga ini hanya tidur sekejap, satu mata selalu terbuka.'}]},
  {id:'basilisk',n:'Ular Raksasa',pts:[[260,560]],r:70,desc:'Ular hitam bersisik mengilap melingkar di sisi kiri papan. Kepalanya bergerak pelan mengikuti setiap pion yang lewat.',
   v:[{n:'Sisik Hitam',d:'Setiap sisiknya memantulkan cahaya lilin seperti logam yang dipoles.'},{n:'Lidah Bercabang',d:'Ia mendesis pelan saat ada pemain yang menolak membayar sewa.'},{n:'Lilitan Peta',d:'Tubuhnya melingkari peta tua, seolah menjaga rahasia di dalamnya.'}]},
  {id:'griffin',n:'Patung Griffin Batu',pts:[[165,150]],r:70,desc:'Patung griffin dari batu gelap mencengkeram bola rune. Patung ini menjaga sudut meja sejak permainan pertama dimainkan.',
   v:[{n:'Bola Rune',d:'Rune di bola itu berpendar samar saat dadu dilempar.'},{n:'Sayap Batu',d:'Bulu-bulunya dipahat satu per satu oleh pematung penyihir.'},{n:'Penjaga Diam',d:'Kata orang, ia akan hidup bila ada yang berbuat curang.'}]},
  {id:'hat',n:'Topi Seleksi',pts:[[1150,85]],r:60,desc:'Topi tua yang lusuh dan penuh tambalan. Ia pernah menentukan asrama ribuan murid, kini cukup puas mengamati permainan.',
   v:[{n:'Lipatan Mulut',d:'Lipatan kainnya bisa bergerak seperti mulut yang bergumam.'},{n:'Ujung Miring',d:'Ujungnya selalu miring ke arah pemain yang sedang memimpin.'},{n:'Kain Usang',d:'Berabad-abad dipakai, tapi tak pernah benar-benar sobek.'}]},
  {id:'snitch',n:'Golden Snitch',pts:[[1125,205]],r:28,desc:'Bola emas kecil bersayap perak di atas tatakan kayu. Dalam Quidditch, menangkapnya bisa mengakhiri pertandingan.',
   v:[{n:'Sayap Perak',d:'Sayapnya bergetar halus walau tak ada angin.'},{n:'Ingatan Sentuhan',d:'Snitch mengingat tangan pertama yang menyentuhnya.'},{n:'Tatakan Kayu',d:'Diletakkan di sini agar tidak terbang ke petak lain.'}]},
  {id:'potion',n:'Botol Ramuan',pts:[[1225,195],[1210,360],[1000,60]],r:34,desc:'Botol-botol ramuan berjejer di tepi meja: biru, hijau, dan jingga. Masing-masing berpendar dari dalam.',
   v:[{n:'Ramuan Biru',d:'Menenangkan pikiran sebelum mengambil keputusan besar.'},{n:'Ramuan Hijau',d:'Berbau tanah basah. Dipercaya membawa keberuntungan saat melewati Mulai.'},{n:'Ramuan Jingga',d:'Hangat seperti api perapian, diminum saat malam bersalju.'}]},
  {id:'coins',n:'Tumpukan Galleon',pts:[[85,345]],r:48,desc:'Galleon emas, Sickle perak, dan Knut perunggu ditumpuk di sudut meja. Inilah bank para pemain.',
   v:[{n:'Galleon Emas',d:'Mata uang tertinggi. Semua harga petak dihitung dalam Galleon.'},{n:'Sickle Perak',d:'Tujuh belas Sickle setara satu Galleon.'},{n:'Knut Perunggu',d:'Koin terkecil, biasa dipakai untuk membeli permen.'}]},
  {id:'mapscroll',n:'Peta Tua',pts:[[100,520]],r:44,desc:'Perkamen tua bergambar lorong dan jalan rahasia. Tintanya tampak bergerak bila dilihat cukup lama.',
   v:[{n:'Jejak Kaki',d:'Jejak kecil berpindah di atas kertas, menandai siapa yang sedang berjalan.'},{n:'Lorong Rahasia',d:'Menunjukkan jalan pintas yang tidak ada di papan biasa.'},{n:'Sumpah Pembuka',d:'Peta hanya terbuka bagi yang berniat iseng.'}]},
  {id:'crest',n:'Lambang Asrama',pts:[[565,635],[660,690],[920,640],[965,150]],r:32,desc:'Lencana bordir asrama tergeletak di sekitar papan. Pemain sering memilih lencana sebelum permainan dimulai.',
   v:[{n:'Singa Merah',d:'Asrama para pemberani.'},{n:'Elang Biru',d:'Asrama para pemikir dan pencinta ilmu.'},{n:'Ular Hijau',d:'Asrama para ambisius yang pandai mengatur siasat.'}]},
  {id:'wand',n:'Tongkat Sihir',pts:[[460,650]],r:34,desc:'Tongkat kayu berukir dengan ujung bercahaya. Tergeletak di tepi papan, siap dipakai siapa pun yang dipilihnya.',
   v:[{n:'Kayu Holly',d:'Ringan dan setia pada pemiliknya.'},{n:'Inti Bulu Phoenix',d:'Langka dan sulit dijinakkan.'},{n:'Ujung Bercahaya',d:'Menyala sendiri saat ada mantra besar di dekatnya.'}]},
  {id:'ink',n:'Botol Tinta',pts:[[300,205]],r:30,desc:'Botol tinta hitam dan pena bulu panjang, dipakai mencatat setiap transaksi di papan.',
   v:[{n:'Tinta Hitam',d:'Tidak pernah habis walau dipakai menulis ratusan akta.'},{n:'Pena Bulu',d:'Bulu burung hantu, tulisannya selalu rapi.'},{n:'Catatan Akta',d:'Setiap petak yang dibeli tercatat otomatis di perkamen.'}]},
  {id:'candles',n:'Lilin Melayang',pts:[[525,30]],r:40,desc:'Lilin-lilin tebal menerangi meja dari belakang. Lelehannya tak pernah menetes ke papan.',
   v:[{n:'Cahaya Hangat',d:'Nyalanya makin terang saat malam makin larut.'},{n:'Lilin Abadi',d:'Tidak pernah memendek meski menyala sepanjang permainan.'},{n:'Asap Wangi',d:'Asapnya berbau kayu manis dan madu.'}]},
  {id:'fire',n:'Perapian',pts:[[220,30]],r:40,desc:'Api perapian berkobar di belakang meja, menghangatkan ruangan selama permainan.',
   v:[{n:'Api Jingga',d:'Api biasa untuk menghangatkan tangan.'},{n:'Api Hijau',d:'Bila bubuk ajaib ditaburkan, api berubah hijau dan bisa dipakai bepergian.'},{n:'Bara Merah',d:'Bara yang tersisa menyala sampai pagi.'}]},
  {id:'card',n:'Kartu Takdir',pts:[[1005,580]],r:46,desc:'Kartu bergambar segel merah tergeletak di dekat naga. Tidak ada yang berani membaliknya.',
   v:[{n:'Segel Merah',d:'Segelnya hangat, seolah baru saja dicap.'},{n:'Tepi Hangus',d:'Bekas semburan api naga terlihat di sudutnya.'},{n:'Ramalan',d:'Konon berisi nasib pemain yang akan menang.'}]},
  {id:'lake',n:'Danau Hitam',pts:[[760,470]],r:32,desc:'Danau gelap di kaki tebing kastil, tempat air terjun jatuh. Riaknya membentuk lingkaran yang tak pernah berhenti.',
   v:[{n:'Air Terjun',d:'Mengalir dari celah tebing di bawah kastil.'},{n:'Riak Abadi',d:'Lingkaran air terus menyebar walau tak ada yang melempar batu.'},{n:'Penghuni Danau',d:'Ada yang bilang seekor cumi raksasa tinggal di dasarnya.'}]},
];
