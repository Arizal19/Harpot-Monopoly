/**
 * harpot-monopoly - Database Lore Lengkap (Petak 0 - 36)
 * Berisi cerita latar belakang, harga, dan signifikansi magis dari setiap petak.
 */

const HP_TILES_LORE = [
  {
    id: 0,
    name: "Platform 9 ¾",
    subtitle: "King's Cross Station",
    category: "Start",
    price: 0,
    lore: "Pintu gerbang rahasia antara dunia Muggle dan dunia sihir di Stasiun King's Cross, London. Tersembunyi di balik dinding bata solid antara peron 9 dan 10. Setiap tanggal 1 September, para siswa menembus dinding ini untuk naik Hogwarts Express. Lewatilah petak ini untuk memulai kembali petualanganmu dan klaim 200 Galleons dari Kementerian!",
    funFact: "Para Muggle sering heran melihat anak-anak membawa kereta barang penuh kandang burung hantu yang lenyap ke dalam dinding."
  },
  {
    id: 1,
    name: "Ollivanders Wand Shop",
    subtitle: "Diagon Alley",
    category: "Landmark Shop",
    price: 500,
    lore: "Pembuat tongkat sihir terbaik sejak tahun 382 Sebelum Masehi. Di sinilah setiap penyihir mendapatkan tongkat pertama mereka—atau lebih tepatnya, tongkatlah yang memilih penyihirnya. Toko kecil yang padat dengan ribuan kotak tongkat sihir yang menyimpan keajaiban alami dari bulu Phoenix, serat jantung Naga, atau rambut Unicorn.",
    funFact: "Garrick Ollivander memiliki ingatan eidetik tentang setiap tongkat sihir yang pernah ia jual."
  },
  {
    id: 2,
    name: "Gringotts Wizarding Bank",
    subtitle: "Diagon Alley",
    category: "Financial Landmark",
    price: 900,
    lore: "Satu-satunya bank di dunia sihir yang dioperasikan sepenuhnya oleh para Goblin. Terkenal sangat aman, berlapis-lapis di bawah tanah London, dan dijaga oleh naga serta mantra kuno yang mematikan. Selain menyimpan emas dan harta karun keluarga penyihir, ia juga menjadi tempat penyimpanan barang-barang yang sangat rahasia.",
    funFact: " Goblin di Gringotts punya pepatah: 'Jika kau mencari di bawah lantai kami untuk harta yang bukan milikmu, pencuri, kau telah diperingatkan.'"
  },
  {
    id: 3,
    name: "Azkaban Prison",
    subtitle: "North Sea Fortress",
    category: "Prison / Penjara",
    price: 500,
    lore: "Sebuah benteng batu mengerikan dan terisolasi di tengah Laut Utara yang dingin. Dijaga oleh para Dementor jahat yang mengisap semua kenangan bahagia dan kewarasan para narapidana. Tempat ini diperuntukkan bagi para penyihir gelap yang melanggar Hukum Sihir tertinggi.",
    funFact: "Hanya sedikit penyihir yang pernah lolos dari sini dengan kemampuan sendiri, salah satunya adalah Sirius Black dalam wujud Animagusnya."
  },
  {
    id: 4,
    name: "Hogwarts Great Hall",
    subtitle: "Hogwarts Castle",
    category: "Historical Landmark",
    price: 800,
    lore: "Jantung kehidupan sosial di Kastil Hogwarts. Ruangan megah dengan langit-langit berbalut sihir yang meniru cuaca luar, ribuan lilin melayang, dan empat meja panjang untuk tiap asrama. Tempat ini menjadi saksi upacara seleksi siswa baru oleh Topi Seleksi, pesta makan malam magis, dan duel-duel bersejarah.",
    funFact: "Langit-langit Great Hall tidak benar-benar terbuka ke luar, melainkan hanya disihir agar terlihat persis seperti langit di luar."
  },
  {
    id: 5,
    name: "Borgin and Burkes",
    subtitle: "Knockturn Alley",
    category: "Dark Antique Shop",
    price: 400,
    lore: "Toko barang antik gelap yang terletak di jalanan kumuh Knockturn Alley. Tempat ini dipenuhi oleh barang-barang sihir hitam yang berbahaya dan terkutuk, seperti Tangan Kemuliaan, kalung Opal maut, hingga Lemari Penghilang (Vanishing Cabinet) yang legendaris.",
    funFact: "Keluarga Malfoy sering menggunakan toko ini untuk menjual atau menyembunyikan barang-barang ilegal mereka dari razia Kementerian."
  },
  {
    id: 6,
    name: "Honeydukes Sweet Shop",
    subtitle: "Hogsmeade",
    category: "Sweet Shop / Kedai Permen",
    price: 200,
    lore: "Surga dunia bagi para pencinta manis di desa Hogsmeade. Terkenal dengan permen-permen ajaibnya seperti Bertie Bott's Every Flavour Beans (permen segala rasa), Chocolate Frogs (Cokelat Kodok yang bisa melompat), hingga permen pedas Pepper Imps yang membuat pemakannya mengeluarkan api dan asap dari mulut.",
    funFact: "Ada jalan rahasia bawah tanah dari Hogwarts yang langsung tembus ke dalam ruang bawah tanah Honeydukes."
  },
  {
    id: 7,
    name: "The Three Broomsticks",
    subtitle: "Hogsmeade",
    category: "Landmark Pub",
    price: 250,
    lore: "Sebuah penginapan dan pub hangat yang selalu ramai dikunjungi oleh para siswa Hogwarts dan penduduk setempat. Dikelola oleh Madam Rosmerta yang menawan, tempat ini terkenal dengan Butterbeer (bir mentega) hangat yang lezat dan berbusa, serta minuman Mead Ek yang matang.",
    funFact: "Ini adalah tempat favorit Harry, Ron, dan Hermione untuk menghangatkan diri di tengah musim dingin Hogsmeade."
  },
  {
    id: 8,
    name: "The Shrieking Shack",
    subtitle: "Hogsmeade",
    category: "Haunted Landmark",
    price: 450,
    lore: "Dikenal sebagai bangunan paling berhantu di seluruh Britania Raya karena suara jeritan mengerikan yang sering terdengar dari dalamnya di masa lalu. Padahal, bangunan terlantar ini adalah tempat persembunyian rahasia Remus Lupin saat ia berubah wujud menjadi manusia serigala selama masa sekolahnya.",
    funFact: "Jeritan yang terdengar sebenarnya berasal dari Lupin saat bertransformasi, bukan karena aktivitas hantu asli."
  },
  {
    id: 9,
    name: "Ministry of Magic",
    subtitle: "Atrium & Fountain",
    category: "Government Landmark",
    price: 700,
    lore: "Pusat pemerintahan dunia sihir Britania yang terletak jauh di bawah tanah kota London. Atriumnya yang megah dihiasi oleh ubin gelap mengkilap, perapian jaringan Floo yang sibuk, dan Air Mancur Persaudaraan Sihir yang legendaris. Tempat para Auror, birokrat, dan menteri merancang hukum serta menjaga kerahasiaan sihir.",
    funFact: "Para tamu harus masuk lewat bilik telepon umum yang rusak di London dengan mengetik angka 62442 (MAGIC)."
  },
  {
    id: 10,
    name: "Quidditch Pitch",
    subtitle: "Hogwarts Stadium",
    category: "Sports Landmark",
    price: 600,
    lore: "Stadion megah berpagar tinggi di luar kastil Hogwarts tempat olahraga sihir Quidditch dimainkan. Dikelilingi tribun tinggi dengan spanduk asrama yang berkibar, tempat para Chaser, Beater, Keeper, dan Seeker bertarung di udara demi menangkap Golden Snitch di bawah sorak-sorai ratusan penonton.",
    funFact: "Pertandingan Quidditch bisa berlangsung berhari-hari jika Golden Snitch sangat sulit ditemukan."
  },
  {
    id: 11,
    name: "The Burrow",
    subtitle: "Ottery St Catchpole",
    category: "Family Home",
    price: 280,
    lore: "Rumah keluarga Weasley yang penuh keajaiban, bertingkat-tingkat, dan tampak seolah-olah ditahan oleh mantra sihir agar tidak runtuh. Dipenuhi barang-barang ajaib yang bergerak sendiri, jam keluarga yang menunjukkan kondisi darurat, serta gnome-gnome nakal di kebunnya. Rumah paling hangat yang selalu terbuka bagi siapa saja.",
    funFact: "Setiap barang di The Burrow, dari piring yang mencuci diri hingga sikat yang bergerak, mencerminkan sihir domestik yang luar biasa."
  },
  {
    id: 12,
    name: "12 Grimmauld Place",
    subtitle: "London",
    category: "Secret Headquarters",
    price: 300,
    lore: "Rumah kuno milik keluarga berdarah murni Black yang terlindung oleh berbagai mantra penyembunyi dari pandangan kaum Muggle. Diwariskan kepada Sirius Black, tempat suram ini kemudian dijadikan sebagai Markas Besar Orde Phoenix untuk merencanakan perlawanan terhadap Lord Voldemort.",
    funFact: "Rumah ini dijaga oleh potret ibu Sirius yang terus berteriak marah dan peri rumah tua yang membenci semua orang, Kreacher."
  },
  {
    id: 13,
    name: "Weasleys' Wizard Wheezes",
    subtitle: "Diagon Alley",
    category: "Novelty & Joke Shop",
    price: 400,
    lore: "Toko lelucon luar biasa milik si kembar Fred dan George Weasley yang sangat meriah dan penuh warna di tengah kegelapan Diagon Alley. Menjual berbagai penemuan jenius mereka seperti Skiving Snackboxes, U-No-Poo, Pygmy Puffs, hingga kembang api magis yang tak bisa padam.",
    funFact: "Fred dan George memulai bisnis ini dengan modal dari piala kemenangan Turnamen Triwizard milik Harry Potter."
  },
  {
    id: 14,
    name: "Hagrid's Hut",
    subtitle: "Hogwarts Grounds",
    category: "Grounds Landmark",
    price: 240,
    lore: "Sebuah pondok batu kecil beratap jerami di tepi Hutan Terlarang, tempat tinggal Rubeus Hagrid dan anjingnya, Fang. Tempat hangat ini selalu dipenuhi oleh hewan-hewan magis berbahaya kesukaan Hagrid, bau kue keras buatannya, dan teh hangat yang disuguhkan dalam cangkir raksasa.",
    funFact: "Di sinilah naga peliharaan Norbert si punggung-bersisik Norbert menetas secara ilegal di dalam perapian Hagrid."
  },
  {
    id: 15,
    name: "Hogsmeade Station",
    subtitle: "Railway Station",
    category: "Transit Landmark",
    price: 200,
    lore: "Stasiun kereta kecil bergaya pedesaan di dekat desa Hogsmeade tempat Hogwarts Express berhenti untuk menurunkan para siswa di setiap awal ajaran baru. Dari peron berlampu minyak dan penuh salju ini, para siswa baru akan menyeberangi danau dengan perahu kecil, sementara siswa senior naik kereta yang ditarik Thestral.",
    funFact: "Terletak cukup jauh dari sekolah, menjamin tidak ada teknologi transportasi modern yang mendekati kastil."
  },
  {
    id: 16,
    name: "Malfoy Manor",
    subtitle: "Wiltshire",
    category: "Aristocratic Estate",
    price: 320,
    lore: "Sebuah rumah besar yang megah, dingin, dan dikelilingi oleh taman luas serta gerbang besi yang bisa mendeteksi penyusup. Milik keluarga bangsawan Malfoy yang kaya raya, tempat ini sempat menjadi markas tidak resmi bagi Lord Voldemort dan para Pelahap Maut selama Perang Sihir Kedua.",
    funFact: "Di bawah lantai ruang bawah tanahnya terdapat penjara rahasia tempat para tawanan, termasuk Luna Lovegood dan Ollivander, disekap."
  },
  {
    id: 17,
    name: "4 Privet Drive",
    subtitle: "Little Whinging",
    category: "Muggle Residence",
    price: 150,
    lore: "Sebuah rumah pinggiran kota yang sangat biasa dan membosankan milik keluarga Dursley. Di sinilah Harry Potter menghabiskan masa kecilnya yang tidak bahagia, tinggal di dalam lemari bawah tangga sebelum akhirnya mengetahui bahwa dirinya adalah seorang penyihir.",
    funFact: "Mantra perlindungan kuno yang diaktifkan oleh pengorbanan ibunya membuat Harry tetap aman di sini hingga ia berusia 17 tahun."
  },
  {
    id: 18,
    name: "Flourish and Blotts",
    subtitle: "Diagon Alley",
    category: "Book Shop",
    price: 260,
    lore: "Toko buku andalan para siswa Hogwarts untuk membeli buku pelajaran sihir mereka. Rak-raknya yang menjulang tinggi dipenuhi oleh ribuan buku, mulai dari mantra dasar, sejarah sihir, hingga buku-buku berbahaya yang harus dikurung dalam kandang seperti 'The Monster Book of Monsters'.",
    funFact: "Toko ini sering mengalami kekacauan luar biasa saat harus menangani buku-buku sihir yang bisa menggigit atau menghilang."
  },
  {
    id: 19,
    name: "Madam Malkin's",
    subtitle: "Diagon Alley",
    category: "Robe Shop",
    price: 180,
    lore: "Toko pakaian sihir 'Robes for All Occasions' tempat para siswa Hogwarts mengukur dan membeli jubah sekolah mereka. Dikelola oleh Madam Malkin yang lincah dan cerewet, toko ini menyediakan berbagai jubah berkualitas, mulai dari jubah sehari-hari hingga jubah pesta formal yang mewah.",
    funFact: "Di sinilah Harry Potter pertama kali bertemu dengan Draco Malfoy, saat mereka berdua sedang mengukur jubah sekolah pertama mereka."
  },
  {
    id: 20,
    name: "Hog's Head Inn",
    subtitle: "Hogsmeade",
    category: "Common Pub",
    price: 220,
    lore: "Sebuah kedai tua yang kumuh dan terpencil di pinggiran Hogsmeade, dikelola oleh Aberforth Dumbledore. Terkenal karena pelanggannya yang aneh, misterius, dan sering kali menyembunyikan wajah mereka. Tempat ini menjadi lokasi pertemuan pertama pembentukan Laskar Dumbledore (Dumbledore's Army).",
    funFact: "Aberforth selalu lebih memilih ditemani oleh kambing-kambingnya daripada para penyihir yang mengunjungi kedainya."
  },
  {
    id: 21,
    name: "Zonko's Joke Shop",
    subtitle: "Hogsmeade",
    category: "Joke Shop",
    price: 150,
    lore: "Toko lelucon favorit para siswa Hogwarts yang berburu barang-barang usil untuk dikerjai di sekolah. Menjual Dungbombs, Hiccup Sweets, Frog Spawn Soap, hingga Nosebiter Teacups yang terkenal jahil. Selalu ramai dan bising oleh suara gelak tawa pengunjung.",
    funFact: "Fred dan George sempat ingin membeli toko ini sebelum akhirnya memutuskan untuk membuka cabang mereka sendiri."
  },
  {
    id: 22,
    name: "The Owlery",
    subtitle: "Hogwarts Castle",
    category: "School Facility",
    price: 180,
    lore: "Terletak di puncak salah satu menara kastil Hogwarts yang berangin dan dingin. Tempat tinggal bagi ratusan burung hantu milik sekolah maupun siswa, yang bertugas mengirimkan surat dan paket ke seluruh penjuru dunia sihir. Lantainya selalu tertutup jerami, kotoran, dan sisa makanan.",
    funFact: "Harry sering mengunjungi menara ini tidak hanya untuk mengirim surat lewat Hedwig, tetapi juga untuk mencari ketenangan."
  },
  {
    id: 23,
    name: "Godric's Hollow",
    subtitle: "West Country",
    category: "Historical Village",
    price: 320,
    lore: "Sebuah desa bersejarah bersalju tempat tinggal para penyihir dan Muggle secara berdampingan. Merupakan tempat kelahiran Godric Gryffindor, kediaman keluarga Dumbledore, serta lokasi tragis tempat orang tua Harry Potter gugur akibat serangan Voldemort demi menyelamatkan putra mereka.",
    funFact: "Di tengah desa terdapat monumen magis yang akan berubah menjadi patung keluarga Potter saat didekati oleh para penyihir."
  },
  {
    id: 24,
    name: "The Forbidden Forest",
    subtitle: "Hogwarts Boundary",
    category: "Dark Magical Woods",
    price: 350,
    lore: "Hutan lebat, gelap, dan liar yang berbatasan langsung dengan kastil Hogwarts. Sangat dilarang untuk dimasuki oleh para siswa karena dipenuhi makhluk-makhluk magis berbahaya seperti Centaur, Unicorn, Acromantula (laba-laba raksasa), hingga sisa-sisa kawanan serigala.",
    funFact: "Meskipun dilarang, Harry dan teman-temannya hampir setiap tahun berakhir di dalam hutan ini untuk menyelesaikan berbagai masalah."
  },
  {
    id: 25,
    name: "The Knight Bus",
    subtitle: "London Transit",
    category: "Magical Transit",
    price: 200,
    lore: "Kendaraan darurat bertingkat tiga berwarna ungu tua untuk para penyihir yang tersesat atau terlantar. Bus ini melaju dengan kecepatan luar biasa tanpa terlihat oleh kaum Muggle, mampu melompati rintangan, mengerut di antara kendaraan lain, dan melakukan perjalanan seketika dengan suara dentuman keras.",
    funFact: "Ditemani kondektur Stan Shunpike dan pengemudi Ernie Prang yang sering kali mengabaikan keselamatan penumpang demi kecepatan."
  },
  {
    id: 26,
    name: "The Leaky Cauldron",
    subtitle: "Charing Cross Road",
    category: "Wizarding Pub",
    price: 180,
    lore: "Sebuah pub tua kecil yang suram di London yang berfungsi sebagai gerbang transisi utama antara dunia Muggle dan Diagon Alley. Di belakang pub ini terdapat dinding bata rahasia yang jika diketuk dengan pola tongkat sihir tertentu akan terbuka menjadi jalanan sihir yang ramai.",
    funFact: "Muggle yang lewat tidak pernah menyadari keberadaan pub ini, pandangan mereka selalu teralihkan ke toko-toko modern di sekitarnya."
  },
  {
    id: 27,
    name: "St. Mungo's",
    subtitle: "London",
    category: "Magical Hospital",
    price: 260,
    lore: "Rumah sakit khusus untuk menangani penyakit dan cedera magis, mulai dari gigitan hewan buas, kutukan, hingga kecelakaan mantra. Tersembunyi di balik fasad toko serba ada Muggle tua yang terbengkalai, para penyihir masuk dengan berbicara kepada manekin di jendela.",
    funFact: "Dikelola oleh para Penyembuh (Healers) yang mengenakan jubah hijau limau, selalu siap menghadapi kasus-kasus paling aneh sekalipun."
  },
  {
    id: 28,
    name: "Shell Cottage",
    subtitle: "Tinworth",
    category: "Seaside Home",
    price: 240,
    lore: "Sebuah pondok kecil yang indah, bertabur kerang-kerang laut di tebing berangin pesisir Cornwall. Merupakan rumah bagi Bill Weasley dan Fleur Delacour, tempat ini sempat menjadi perlindungan aman bagi Harry dan teman-temannya setelah pelarian berisiko mereka dari Malfoy Manor.",
    funFact: "Di halaman luar pondok ini, dekat deburan ombak, terdapat makam Dobby, peri rumah yang gugur sebagai pahlawan bebas."
  },
  {
    id: 29,
    name: "Lovegood House",
    subtitle: "Ottery St Catchpole",
    category: "Eccentric Tower",
    price: 220,
    lore: "Sebuah menara batu hitam ganjil berbentuk mirip bidak benteng catur, tempat tinggal Xenophilius dan Luna Lovegood. Rumah yang eksentrik ini dipenuhi oleh tanaman ajaib yang aneh, tumpukan edisi majalah 'The Quibbler' yang baru dicetak, dan berbagai artefak sihir tidak biasa.",
    funFact: "Di puncaknya pernah terdapat cula Erumpent berbahaya yang akhirnya meledak dan menghancurkan sebagian rumah mereka."
  },
  {
    id: 30,
    name: "Gryffindor Common Room",
    subtitle: "Hogwarts Castle",
    category: "Tower Dormitory",
    price: 550,
    lore: "Ruang santai hangat berbalut permadani merah dan emas di puncak salah satu menara Hogwarts. Dijaga oleh potret Fat Lady yang menuntut kata sandi untuk masuk. Tempat ini selalu ramai oleh suara tawa, kehangatan perapian, dan siswa yang bersantai di sofa-sofa empuk.",
    funFact: "Dari jendela-jendela bulatnya, para siswa dapat menikmati pemandangan luas danau dan lapangan Quidditch."
  },
  {
    id: 31,
    name: "Slytherin Common Room",
    subtitle: "Hogwarts Castle",
    category: "Dungeon Dormitory",
    price: 550,
    lore: "Sebuah ruang bawah tanah yang panjang, megah, dan dingin di bawah Danau Hitam. Berdinding batu alam dengan pilar-pilar berukir dan lampu-lampu kehijauan yang memberikan atmosfer misterius. Melalui jendela kacanya yang tebal, para siswa bisa melihat langsung ke dalam kehidupan bawah air danau.",
    funFact: "Terkadang, cumi-cumi raksasa atau makhluk bawah air lainnya terlihat melintas dan mengamati dari balik kaca."
  },
  {
    id: 32,
    name: "Quality Quidditch Supplies",
    subtitle: "Diagon Alley",
    category: "Sporting Goods Shop",
    price: 600,
    lore: "Toko perlengkapan Quidditch paling populer di Diagon Alley. Jendelanya selalu dipadati oleh para penggemar yang ingin melihat sapu terbang generasi terbaru, seperti Nimbus 2000 atau Firebolt. Menjual segala kebutuhan Quidditch, mulai dari jubah, pemukul, hingga bola latih.",
    funFact: "Menjadi tempat berkumpulnya para remaja penyihir yang bermimpi menjadi pemain Quidditch profesional."
  },
  {
    id: 33,
    name: "The Room of Requirement",
    subtitle: "Hogwarts Castle",
    category: "Hidden Vault",
    price: 650,
    lore: "Sebuah ruangan gaib di Hogwarts yang hanya akan muncul jika seseorang sangat membutuhkannya. Ruangan ini akan menyesuaikan isinya dengan kebutuhan orang tersebut—menjadi tempat latihan rahasia, tempat persembunyian barang-barang yang ingin dilupakan, atau gudang rahasia.",
    funFact: "Dikenal juga sebagai 'Ruang Datang dan Pergi', ia tidak akan pernah terlihat di Peta Perampok (Marauder's Map)."
  },
  {
    id: 34,
    name: "The Chamber of Secrets",
    subtitle: "Hogwarts Underground",
    category: "Ancient Chamber",
    price: 700,
    lore: "Sebuah kamar bawah tanah rahasia yang dibangun oleh Salazar Slytherin tanpa sepengetahuan para pendiri Hogwarts lainnya. Dipenuhi oleh patung-patung ular raksasa dan air yang gelap, kamar ini menjadi rumah bagi Basilisk maut yang hanya bisa dikendalikan oleh keturunan langsung Slytherin.",
    funFact: "Pintu masuknya tersembunyi di balik wastafel di kamar mandi perempuan yang dihuni oleh hantu Moaning Myrtle."
  },
  {
    id: 35,
    name: "Gringotts Lestrange Vault",
    subtitle: "Subterranean Gringotts",
    category: "High Security Vault",
    price: 750,
    lore: "Salah satu brankas paling dalam dan dijaga paling ketat di Gringotts, milik keluarga penyihir hitam Lestrange. Dipenuhi oleh gunung-gunung emas, piala-piala berharga, dan dijaga oleh naga buta yang ganas. Di sinilah salah satu pecahan jiwa (Horcrux) Voldemort disembunyikan.",
    funFact: "Setiap barang di dalam brankas ini dilindungi oleh Kutukan Gemino dan Flagrante, membuat barang yang disentuh berlipat ganda dan membakar pencurinya."
  },
  {
    id: 36,
    name: "Hogwarts Castle",
    subtitle: "Highlands",
    category: "Magical Academy",
    price: 800,
    lore: "Sekolah Sihir terbaik di dunia, sebuah kastil kuno megah yang tersembunyi di pegunungan Skotlandia. Dilindungi oleh ratusan mantra pertahanan agar tidak terlihat oleh para Muggle. Tempat ini adalah rumah bagi ribuan generasi penyihir, dipenuhi tangga yang bergerak sendiri, hantu-hantu ramah, dan rahasia sihir yang tak terhitung jumlahnya.",
    funFact: "Merupakan lokasi utama pertempuran puncak melawan Voldemort dan pasukannya, membuktikan diri sebagai benteng pertahanan sihir terkuat."
  }
];

// Helper functions untuk mempermudah pemanggilan data
function getTileLore(id) {
  return HP_TILES_LORE.find(tile => tile.id === id) || null;
}

function searchLore(query) {
  const q = query.toLowerCase();
  return HP_TILES_LORE.filter(tile => 
    tile.name.toLowerCase().includes(q) || 
    tile.subtitle.toLowerCase().includes(q) || 
    tile.lore.toLowerCase().includes(q)
  );
}

// Ekspor modul jika digunakan di NodeJS, jika tidak akan diakses via window global browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HP_TILES_LORE, getTileLore, searchLore };
}