export const prices = [
  ["Homme","Débardeur",300,500],["Homme","T-shirt / Tricot",450,800],["Homme","Chemise simple",500,1000],["Homme","Chemise Luxe",800,1500],["Homme","Jeans",500,1000],["Homme","Pantalon tissu",500,1000],["Homme","Gilet / Cardigan",600,1000],["Homme","Pull-over",700,1200],["Homme","Blouson léger",700,1200],["Homme","Blouson épais / Manteau",1000,1500],["Homme","Tunique Haut",700,1200],["Homme","Tunique complet",1000,2000],["Homme","Bazin complet 2P",1000,2000],["Homme","Bazin complet luxe 2P",1500,3000],["Homme","Bazin complet 3P",1500,3000],["Homme","Bazin complet luxe 3P",2000,4500],["Homme","Costume homme 2P",1500,3000],["Homme","Costume homme 3P",2000,4000],["Homme","Lessi complet 2P",2000,4000],["Homme","Lessi complet 3P",2500,5000],["Homme","Pagne Traditionnel Lokpo",2500,5000],
  ["Femme","Chemisier",500,900],["Femme","Jupe simple",500,900],["Femme","Jeans féminin",500,900],["Femme","Robe simple",700,1200],["Femme","Blouson féminin",700,1200],["Femme","Pull-over féminin",700,1200],["Femme","Costume haut femme",800,1500],["Femme","Tunique femme",1000,2000],["Femme","Robe Bazin",1000,1500],["Femme","Robe Bazin cérémonie",1500,2500],["Femme","Complet pagne 2P",1000,2000],["Femme","Complet Pagne 3P",1500,2500],["Femme","Costume complet femme",1500,2500],
  ["Linges de maison","Taie",300,500],["Linges de maison","Serviette moyenne",600,1000],["Linges de maison","Serviette grande",800,1500],["Linges de maison","Drap simple 2P",700,1000],["Linges de maison","Drap double 2P",1000,2000],["Linges de maison","Drap simple 3P",1000,2000],["Linges de maison","Drap double 3P",1500,2500],["Linges de maison","Couverture épaisse",1500,2500],["Linges de maison","Rideau léger",700,1200],["Linges de maison","Rideau lourd",1000,2000]
].map(([category,name,standard,express], id) => ({ id, category, name, standard, express }));

export const nav = [
  ["/","Accueil"],
  ["/services","Services & tarifs"],
  ["/devis","Devis instantané"],
  ["/apropos","À propos"],
  ["/galerie","Galerie"],
  ["/contact","Contact"]
];

// Photos réelles du pressing — galerie, héro droite, "Découvrez"
export const gallery = [
  ["Accueil & Réception", "/gallery/p1.jpg"],
  ["Espace Vêtements", "/gallery/p2.jpg"],
  ["Salle d'attente", "/gallery/p3.jpg"],
  ["Vue générale", "/gallery/p4.jpg"],
  ["Portant sur mesure", "/gallery/p5.jpg"]
];

// Photos en fond pour le diaporama de la section héro (INTOUCHABLES)
export const heroBackgrounds = [
  "/gallery/h1.jpg",
  "/gallery/h2.jpg",
  "/gallery/h3.jpg",
  "/gallery/h4.jpg",
  "/gallery/h5.jpg"
];

export const reviews = [
  {
    name: "Koffi Mensah",
    text: "Un service de pressing exceptionnel. Mes vêtements sont traités avec beaucoup de soin et je les récupère toujours impeccables. Je recommande fortement.",
    stars: 5,
    date: "Avis client",
    avatar: "KM"
  },
  {
    name: "Afiwa d'Almeida",
    text: "Service soigné et équipe accueillante. Mes tenues traditionnelles sont nettoyées avec une attention particulière pour ne pas abîmer les tissus délicats.",
    stars: 5,
    date: "Avis client",
    avatar: "AD"
  },
  {
    name: "Jean-Paul Agbodja",
    text: "Très satisfait du travail. Le repassage est parfait, même sur mes costumes les plus difficiles. Les prix sont très transparents.",
    stars: 5,
    date: "Avis client",
    avatar: "JP"
  },
  {
    name: "Mawuli Dossou",
    text: "Qualité constante à chaque passage. L'équipe est dévouée et le linge sent toujours très bon. Le meilleur service de la ville.",
    stars: 5,
    date: "Avis client",
    avatar: "MD"
  },
  {
    name: "Ama Kpodo",
    text: "Une vraie référence en matière de soin textile. Le délai express est respecté, ce qui me sauve souvent pour mes événements.",
    stars: 5,
    date: "Avis client",
    avatar: "AK"
  },
  {
    name: "Rodrigue Amégah",
    text: "Une prestation digne des grands professionnels. Mon costume a été repassé à la perfection sans aucun pli disgracieux. Superbe travail.",
    stars: 5,
    date: "Avis client",
    avatar: "RA"
  }
];

export const contactInfo = {
  address: "Tabligbo Ntifafa-komé",
  addressFull: "Tabligbo Ntifafa-komé, Togo",
  phone: "+228 90 78 81 78",
  phone2: "+228 99 16 39 34",
  phoneRaw: "+22890788178",
  hoursSimple: "07h00 – 21h00",
  daysSimple: "Lun – Dim (tous les jours)",
  hours: [
    { day: "Lundi",    open: "07h00", close: "21h00" },
    { day: "Mardi",    open: "07h00", close: "21h00" },
    { day: "Mercredi", open: "07h00", close: "21h00" },
    { day: "Jeudi",    open: "07h00", close: "21h00" },
    { day: "Vendredi", open: "07h00", close: "21h00" },
    { day: "Samedi",   open: "07h00", close: "21h00" },
    { day: "Dimanche", open: "07h00", close: "21h00" },
  ],
  rating: null,
  reviewCount: null,
  mapsLink: "https://www.google.com/maps/place/VISION+PRESSING/@6.5899959,1.487008,17z/data=!3m1!4b1!4m6!3m5!1s0x10241300605b769f:0x13cb31fa7b7b81ac!8m2!3d6.5899959!4d1.4895829!16s%2Fg%2F11yc15f9wl"
};

export const money = (n) => `${n.toLocaleString("fr-FR")} FCFA`;
