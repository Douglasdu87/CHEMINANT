/* =========================================================
   CHEMINONS — données fictives (démo frontend)
   ========================================================= */

const CH_DATA = {};

/* ---------- Églises partenaires ---------- */
CH_DATA.churches = [
  { id: "c1", name: "Église Évangélique de la Croix-Rousse", city: "Lyon", denomination: "Évangélique", referent: "Pasteur Daniel Moreau" },
  { id: "c2", name: "Paroisse Saint-Jean-Baptiste", city: "Paris 15e", denomination: "Catholique", referent: "Père Antoine Lefèvre" },
  { id: "c3", name: "Église Protestante Unie du Marais", city: "Paris 4e", denomination: "Protestante", referent: "Pasteure Claire Fontaine" },
  { id: "c4", name: "Centre Chrétien Béthel", city: "Marseille", denomination: "Pentecôtiste", referent: "Pasteur Emmanuel Kouassi" },
  { id: "c5", name: "Église Baptiste du Centre", city: "Bordeaux", denomination: "Baptiste", referent: "Pasteur Thomas Girard" },
  { id: "c6", name: "Assemblée de Dieu de Lille", city: "Lille", denomination: "Pentecôtiste", referent: "Pasteur Joël Mbemba" },
  { id: "c7", name: "Paroisse Notre-Dame-des-Champs", city: "Nantes", denomination: "Catholique", referent: "Père Luc Bernard" },
  { id: "c8", name: "Église Vie et Lumière", city: "Toulouse", denomination: "Évangélique", referent: "Pasteure Ruth Ndiaye" },
  { id: "c9", name: "Église Évangélique de Cocody", city: "Abidjan", denomination: "Évangélique", referent: "Pasteur Koffi Yao", region: "afrique" },
  { id: "c10", name: "Assemblée Chrétienne de Dakar", city: "Dakar", denomination: "Pentecôtiste", referent: "Pasteure Awa Diop", region: "afrique" }
];

/* Précisions que l'administrateur peut demander à une église candidate au partenariat */
CH_DATA.partnerQuestions = [
  "Pour quelles raisons votre église souhaite-t-elle devenir partenaire de Cheminons ?",
  "Comment avez-vous entendu parler de Cheminons ?",
  "La direction ou le conseil de l'église a-t-il validé cette démarche ?",
  "Combien de jeunes adultes célibataires votre communauté compte-t-elle environ ?",
  "Quelle expérience le référent pressenti a-t-il de l'accompagnement des couples ?",
  "De combien de temps le référent dispose-t-il pour les entretiens de validation ?",
  "Quelles coordonnées (téléphone, adresse e-mail) pouvons-nous utiliser pour joindre le référent ?",
  "Votre église accompagne-t-elle déjà des couples vers le mariage (préparation, suivi) ?"
];

/* ---------- Dimensions de compatibilité ---------- */
CH_DATA.dimensions = [
  "Foi", "Vision du mariage", "Projet familial", "Valeurs", "Communication",
  "Mode de vie", "Projet géographique", "Engagement", "Attentes relationnelles"
];

/* Niveaux affichés (jamais de pourcentage mis en avant) */
CH_DATA.levels = {
  forte: { label: "Forte convergence", badge: "sage" },
  convergence: { label: "Convergence", badge: "sage" },
  compatible: { label: "Compatible", badge: "sky" },
  discuter: { label: "À discuter", badge: "amber" }
};

/* ---------- Profils ---------- */
CH_DATA.profiles = [
  {
    id: "p1", firstName: "Rebecca", age: 29, gender: "F", city: "Lyon", churchId: "c1",
    job: "Infirmière puéricultrice", colors: ["#a3204f", "#e08a5b"],
    quote: "Je crois que l'amour se construit dans la fidélité des petites choses.",
    about: "Engagée dans l'accueil des familles à l'église depuis 6 ans. J'aime la randonnée, la cuisine du monde et les longues discussions autour d'un thé. Je prie pour un foyer ouvert, où l'on sert ensemble.",
    faith: "Convertie à 17 ans, baptisée en 2014", children: "Souhaite des enfants", mobility: "Ouverte à rester en région lyonnaise",
    service: "Accueil, louange", languages: "Français, anglais", interests: ["Randonnée", "Cuisine", "Louange", "Lecture"],
    conv: [["Vision chrétienne", "forte"], ["Projet familial", "convergence"], ["Localisation", "compatible"], ["Mode de vie", "convergence"], ["Vision de l'éducation", "discuter"]],
    score: 86, suggested: true, receivedInterest: true
  },
  {
    id: "p2", firstName: "Esther", age: 32, gender: "F", city: "Paris", churchId: "c3",
    job: "Juriste en droit social", colors: ["#2f5f8a", "#7cb4c9"],
    quote: "Chercher d'abord le Royaume, et avancer pas à pas.",
    about: "Je sers dans l'équipe d'étude biblique des jeunes adultes. Passionnée de piano et de théâtre. Je recherche une relation sérieuse fondée sur le dialogue et la prière.",
    faith: "Grandie dans la foi, engagement personnel à 20 ans", children: "Souhaite des enfants", mobility: "Mobile en France",
    service: "Étude biblique", languages: "Français, allemand", interests: ["Piano", "Théâtre", "Voyages", "Bénévolat"],
    conv: [["Vision chrétienne", "forte"], ["Valeurs", "forte"], ["Projet géographique", "discuter"], ["Communication", "convergence"], ["Engagement", "convergence"]],
    score: 81, suggested: true
  },
  {
    id: "p3", firstName: "Grâce", age: 27, gender: "F", city: "Lyon", churchId: "c1",
    job: "Professeure des écoles", colors: ["#3d7a5a", "#c7962c"],
    quote: "Rire, servir et prier : le trio d'un foyer heureux.",
    about: "Monitrice à l'école du dimanche, j'adore les enfants et les jeux de société. Je suis quelqu'un de joyeux et d'attentif, qui accorde beaucoup d'importance à la famille.",
    faith: "Baptisée en 2016", children: "Souhaite une famille nombreuse", mobility: "Souhaite rester à Lyon",
    service: "École du dimanche", languages: "Français, lingala", interests: ["Enfance", "Jeux de société", "Chant", "Pâtisserie"],
    conv: [["Vision chrétienne", "forte"], ["Projet familial", "forte"], ["Localisation", "forte"], ["Mode de vie", "compatible"], ["Projet professionnel", "compatible"]],
    score: 89, suggested: true
  },
  {
    id: "p4", firstName: "Marie", age: 34, gender: "F", city: "Nantes", churchId: "c7",
    job: "Architecte", colors: ["#7d153b", "#c06c84"],
    quote: "La beauté de Dieu se voit aussi dans ce que l'on bâtit ensemble.",
    about: "Je participe à la chorale paroissiale et à un groupe de prière hebdomadaire. J'aime dessiner, le vélo et la mer. J'aspire à un couple qui grandit spirituellement.",
    faith: "Catholique pratiquante", children: "Ouverte à la question", mobility: "Ouverte à déménager",
    service: "Chorale", languages: "Français, italien", interests: ["Dessin", "Vélo", "Chorale", "Océan"],
    conv: [["Vision chrétienne", "convergence"], ["Projet familial", "discuter"], ["Mode de vie", "convergence"], ["Projet géographique", "compatible"], ["Valeurs", "forte"]],
    score: 72
  },
  {
    id: "p5", firstName: "Déborah", age: 30, gender: "F", city: "Marseille", churchId: "c4",
    job: "Cheffe de projet digital", colors: ["#c7962c", "#a3204f"],
    quote: "Je cherche un partenaire de prière avant tout.",
    about: "Responsable des médias de mon église, j'aime la photo, la course à pied et organiser des rencontres. Directe et bienveillante, j'apprécie l'honnêteté.",
    faith: "Baptisée en 2012", children: "Souhaite des enfants", mobility: "Mobile en France",
    service: "Médias", languages: "Français, anglais, espagnol", interests: ["Photo", "Course à pied", "Médias", "Mission"],
    conv: [["Vision chrétienne", "forte"], ["Engagement", "forte"], ["Projet familial", "convergence"], ["Localisation", "discuter"], ["Communication", "convergence"]],
    score: 78, suggested: true, receivedInterest: true
  },
  {
    id: "p6", firstName: "Naomi", age: 28, gender: "F", city: "Toulouse", churchId: "c8",
    job: "Pharmacienne", colors: ["#5b3e8a", "#d38fb4"],
    quote: "Où tu iras j'irai.",
    about: "Je sers dans l'intercession et l'accueil des étudiants. Amatrice de jardinage, de musique gospel et de voyages missionnaires.",
    faith: "Convertie à 19 ans", children: "Souhaite des enfants", mobility: "Prête à déménager",
    service: "Intercession", languages: "Français, anglais", interests: ["Jardinage", "Gospel", "Mission", "Lecture"],
    conv: [["Vision chrétienne", "forte"], ["Projet familial", "convergence"], ["Projet géographique", "convergence"], ["Valeurs", "convergence"], ["Mode de vie", "discuter"]],
    score: 80
  },
  {
    id: "p7", firstName: "Lydie", age: 35, gender: "F", city: "Bordeaux", churchId: "c5",
    job: "Comptable", colors: ["#1f6f78", "#8fc1a9"],
    quote: "Construire sur le roc.",
    about: "Trésorière de mon église, j'aime l'ordre, la musique classique et les balades en forêt. Je souhaite avancer avec sérieux et douceur.",
    faith: "Baptisée en 2008", children: "Ouverte à la question", mobility: "Souhaite rester en Gironde",
    service: "Trésorerie", languages: "Français", interests: ["Musique classique", "Forêt", "Lecture", "Bénévolat"],
    conv: [["Vision chrétienne", "convergence"], ["Valeurs", "forte"], ["Localisation", "discuter"], ["Engagement", "convergence"], ["Projet familial", "compatible"]],
    score: 70
  },
  {
    id: "p8", firstName: "Sarah", age: 26, gender: "F", city: "Lille", churchId: "c6",
    job: "Étudiante en médecine", colors: ["#b5485d", "#f2b880"],
    quote: "Que tout se fasse avec amour.",
    about: "Je dirige un groupe de jeunes et je joue de la guitare. Je suis curieuse, sportive, et j'aime servir les personnes isolées.",
    faith: "Grandie dans la foi", children: "Souhaite des enfants", mobility: "Mobile après mes études",
    service: "Jeunesse", languages: "Français, anglais", interests: ["Guitare", "Sport", "Jeunesse", "Solidarité"],
    conv: [["Vision chrétienne", "forte"], ["Mode de vie", "convergence"], ["Projet professionnel", "discuter"], ["Projet familial", "convergence"], ["Communication", "compatible"]],
    score: 75, paid: false // formule non réglée : n'apparaît pas dans la messagerie
  },
  /* Profils masculins (affichés si l'utilisateur est une femme) */
  {
    id: "p9", firstName: "Jonathan", age: 31, gender: "M", city: "Lyon", churchId: "c1",
    job: "Ingénieur", colors: ["#2f5f8a", "#3d7a5a"],
    quote: "Servir Dieu ensemble, c'est le plus beau projet.",
    about: "Batteur dans le groupe de louange, j'aime le VTT et les projets humanitaires. Je souhaite construire un foyer solide et ouvert.",
    faith: "Baptisé en 2013", children: "Souhaite des enfants", mobility: "Ouvert à déménager",
    service: "Louange", languages: "Français, anglais", interests: ["VTT", "Batterie", "Humanitaire", "Cuisine"],
    conv: [["Vision chrétienne", "forte"], ["Projet familial", "convergence"], ["Localisation", "forte"], ["Valeurs", "convergence"], ["Projet professionnel", "discuter"]],
    score: 84, suggested: true, receivedInterest: true
  },
  {
    id: "p10", firstName: "David", age: 33, gender: "M", city: "Paris", churchId: "c2",
    job: "Professeur d'histoire", colors: ["#7d153b", "#c7962c"],
    quote: "Aimer, c'est choisir chaque jour.",
    about: "Engagé dans le scoutisme et la catéchèse. J'aime la lecture, la randonnée et les débats passionnés autour d'un bon repas.",
    faith: "Catholique pratiquant", children: "Souhaite des enfants", mobility: "Paris ou région",
    service: "Catéchèse", languages: "Français, latin", interests: ["Lecture", "Randonnée", "Histoire", "Scoutisme"],
    conv: [["Vision chrétienne", "forte"], ["Valeurs", "forte"], ["Localisation", "discuter"], ["Engagement", "convergence"], ["Communication", "convergence"]],
    score: 79, suggested: true
  },
  {
    id: "p11", firstName: "Samuel", age: 29, gender: "M", city: "Marseille", churchId: "c4",
    job: "Entrepreneur", colors: ["#c7962c", "#3d7a5a"],
    quote: "Avec Dieu, nous ferons des exploits.",
    about: "Je dirige une petite entreprise de rénovation et je sers dans l'accueil. Sportif, je joue au football et j'aime la mer.",
    faith: "Converti à 22 ans", children: "Souhaite des enfants", mobility: "Mobile",
    service: "Accueil", languages: "Français, anglais", interests: ["Football", "Mer", "Entrepreneuriat", "Musique"],
    conv: [["Vision chrétienne", "convergence"], ["Projet familial", "forte"], ["Mode de vie", "compatible"], ["Localisation", "discuter"], ["Engagement", "convergence"]],
    score: 74
  },
  {
    id: "p12", firstName: "Élie", age: 36, gender: "M", city: "Toulouse", churchId: "c8",
    job: "Médecin généraliste", colors: ["#5b3e8a", "#2f5f8a"],
    quote: "Marcher humblement avec son Dieu.",
    about: "Ancien de l'église, je m'occupe de la pastorale des couples. Passionné de montagne et de chant choral.",
    faith: "Baptisé en 2005", children: "Ouvert à la question", mobility: "Souhaite rester à Toulouse",
    service: "Anciens", languages: "Français, anglais", interests: ["Montagne", "Chant", "Médecine", "Lecture"],
    conv: [["Vision chrétienne", "forte"], ["Engagement", "forte"], ["Valeurs", "convergence"], ["Projet géographique", "discuter"], ["Mode de vie", "compatible"]],
    score: 77, paid: false
  }
];

/* ---------- Parcours global (15 étapes) ---------- */
CH_DATA.journey = [
  { key: "inscription", title: "Inscription", desc: "Création du compte et du profil.", phase: "Validation" },
  { key: "eglise", title: "Rattachement à une église", desc: "Choix de votre communauté locale.", phase: "Validation" },
  { key: "validation", title: "Validation du référent", desc: "Entretien et validation par votre référent.", phase: "Validation" },
  { key: "active", title: "Profil activé", desc: "Vous pouvez découvrir des profils.", phase: "Validation" },
  { key: "recherche", title: "Recherche / suggestions", desc: "Explorer et recevoir des suggestions.", phase: "Rencontre" },
  { key: "interet", title: "Intérêt", desc: "Manifester son intérêt pour une personne.", phase: "Rencontre" },
  { key: "reciproque", title: "Intérêt réciproque", desc: "L'intérêt est partagé.", phase: "Rencontre" },
  { key: "relation", title: "Mise en relation", desc: "Accès à l'espace « Notre cheminement ».", phase: "Rencontre" },
  { key: "discernement", title: "Temps de discernement", desc: "Trois mois d'échange sur Cheminons pour apprendre à se connaître, prier et éprouver la relation.", phase: "Discernement" },
  { key: "decision", title: "Décision d'avancer ensemble", desc: "Après trois mois, chacun active le parcours Cheminons depuis son profil.", phase: "Discernement" },
  { key: "parcours", title: "Entrée dans le parcours Cheminons", desc: "Le couple est en cheminement.", phase: "Préparation" },
  { key: "ecole", title: "École du mariage", desc: "10 modules de formation.", phase: "Préparation" },
  { key: "accompagnement", title: "Accompagnement", desc: "Suivi pastoral personnalisé.", phase: "Préparation" },
  { key: "preparation", title: "Préparation au mariage", desc: "Projet matrimonial et cérémonie.", phase: "Préparation" },
  { key: "mariage", title: "Mariage", desc: "L'alliance devant Dieu.", phase: "Préparation" }
];

/* ---------- Modération des signalements ----------
   Un signalement est transmis au référent de l'église du membre qui signale ET à
   l'administrateur. Seul l'administrateur décide : avertissement, suspension
   temporaire (2 jours minimum, selon l'objet du signalement) ou, en cas de
   récidive (sanction déjà prononcée), désactivation du compte. */
CH_DATA.moderation = {
  minSuspensionDays: 2,
  suspensionDays: [2, 3, 7, 15, 30],
  decisions: {
    avertissement: { label: "Avertissement", badge: "amber" },
    suspension: { label: "Suspension temporaire", badge: "danger" },
    desactivation: { label: "Compte désactivé", badge: "danger" },
    classe: { label: "Classé sans suite", badge: "sky" }
  }
};

/* ---------- Temps d'épreuve avant le parcours Cheminons ----------
   Le parcours Cheminons (et donc l'École du mariage) ne peut être activé
   qu'après 3 mois d'échange sur la plateforme depuis la mise en relation.
   Chacun l'active ensuite depuis son profil ; il s'ouvre quand les deux l'ont fait. */
CH_DATA.cheminantDelayMonths = 3;

/* ---------- École du mariage : 10 modules ---------- */
CH_DATA.modules = [
  { id: 1, title: "Les fondements", duration: "2 h 30", topics: ["Pourquoi le mariage ?", "Vision chrétienne du mariage", "Engagement", "Alliance", "Responsabilités"],
    verse: ["C'est pourquoi l'homme quittera son père et sa mère, et s'attachera à sa femme, et ils deviendront une seule chair.", "Genèse 2.24"] },
  { id: 2, title: "Connaître son cœur", duration: "3 h", topics: ["Histoire personnelle", "Blessures", "Attentes", "Peurs", "Réactions émotionnelles", "Pardon", "Maturité émotionnelle"],
    verse: ["Garde ton cœur plus que toute autre chose, car de lui viennent les sources de la vie.", "Proverbes 4.23"] },
  { id: 3, title: "Communication", duration: "2 h 45", topics: ["Écouter", "Parler", "Désaccord", "Conflits", "Communication non violente", "Demander pardon", "Pardonner"],
    verse: ["Que chacun soit prompt à écouter, lent à parler, lent à se mettre en colère.", "Jacques 1.19"] },
  { id: 4, title: "Vie spirituelle du couple", duration: "2 h", topics: ["Prière", "Parole de Dieu", "Vie d'église", "Service", "Croissance spirituelle"],
    verse: ["La corde à trois fils ne se rompt pas facilement.", "Ecclésiaste 4.12"] },
  { id: 5, title: "Intimité et sexualité", duration: "2 h 30", sensitive: true, topics: ["Vision chrétienne de l'intimité", "Respect", "Consentement", "Attentes", "Communication", "Préparation à la vie conjugale"],
    verse: ["L'amour est patient, il est plein de bonté.", "1 Corinthiens 13.4"] },
  { id: 6, title: "Argent et travail", duration: "2 h", topics: ["Budget", "Revenus", "Dettes", "Dépenses", "Générosité", "Objectifs financiers", "Carrière"],
    verse: ["Là où est ton trésor, là aussi sera ton cœur.", "Matthieu 6.21"] },
  { id: 7, title: "Famille et enfants", duration: "2 h 30", topics: ["Désir d'enfants", "Éducation", "Autorité", "Transmission de la foi", "Relations avec les familles"],
    verse: ["Instruis l'enfant selon la voie qu'il doit suivre.", "Proverbes 22.6"] },
  { id: 8, title: "Gestion des conflits", duration: "2 h", topics: ["Conflits récurrents", "Différences", "Colère", "Pardon", "Limites", "Recherche de solutions"],
    verse: ["Que le soleil ne se couche pas sur votre colère.", "Éphésiens 4.26"] },
  { id: 9, title: "Projet de vie", duration: "2 h 15", topics: ["Lieu de vie", "Carrière", "Ministère", "Famille", "Finances", "Projets personnels", "Vision à 5/10/20 ans"],
    verse: ["Recommande ton sort à l'Éternel, et tes projets réussiront.", "Proverbes 16.3"] },
  { id: 10, title: "Préparation finale au mariage", duration: "3 h", topics: ["Bilan", "Points de vigilance", "Discussions finales", "Accompagnement pastoral", "Projet matrimonial", "Préparation de la cérémonie", "Engagement"],
    verse: ["Ce que Dieu a uni, que l'homme ne le sépare pas.", "Marc 10.9"] }
];

/* Chaque module suit la même structure de leçons (formats) */
/* ---------- École du mariage : cours vidéo et audio ----------
   Chaque module se compose d'une introduction vidéo puis d'un cours par thème,
   alternativement en vidéo et en audio. La progression est suivie pour chaque
   conjoint et visible du couple, de son référent et de l'administrateur. */
CH_DATA.courseSpeakers = [
  "Pasteur Daniel Moreau",
  "Claire et Thomas Lefort, couple accompagnateur",
  "Ruth Ndiaye, conseillère conjugale",
  "Père Antoine Lefèvre",
  "Pasteure Claire Fontaine"
];
/* Démo uniquement : en mode supabase, les cours sont ceux que l'administrateur
   dépose dans #/cours (fichiers MP3 ou MP4). id : rang du cours dans son module. */
CH_DATA.courses = Object.fromEntries(CH_DATA.modules.map(m => [m.id, [
  { title: `Introduction : ${m.title}`, type: "video", minutes: 8, speaker: CH_DATA.courseSpeakers[0] },
  ...m.topics.map((t, i) => ({
    title: t,
    type: i % 2 ? "audio" : "video",
    minutes: 10 + ((i * 7 + m.id * 3) % 15),
    speaker: CH_DATA.courseSpeakers[(i + m.id) % CH_DATA.courseSpeakers.length]
  }))
].map((c, i) => ({ id: i, description: "", url: null, ...c }))]));

CH_DATA.lessonFormats = [
  { type: "video", label: "Vidéo", icon: "video" },
  { type: "audio", label: "Audio", icon: "audio" },
  { type: "texte", label: "Texte", icon: "text" },
  { type: "pdf", label: "PDF", icon: "pdf" },
  { type: "questionnaire", label: "Questionnaire", icon: "quiz" },
  { type: "exercice", label: "Exercice individuel", icon: "pen" }
];

/* ---------- Notre cheminement ---------- */
CH_DATA.walkPrompts = {
  questions: [
    "Comment avez-vous rencontré le Seigneur ?",
    "Quel passage biblique vous accompagne en ce moment ?",
    "Qu'est-ce qui vous fait vous sentir aimé(e) ?",
    "Comment imaginez-vous un dimanche idéal en famille ?",
    "Quelle place occupe le service dans votre vie ?",
    "Quelle est la personne qui a le plus marqué votre foi ?"
  ],
  topics: [
    "Nos familles respectives", "Notre vision du mariage", "Nos projets professionnels",
    "Le rôle de l'église dans notre vie", "Nos manières de gérer le stress", "Nos rêves à 10 ans"
  ],
  discernment: [
    "Prier chacun pour cette rencontre pendant une semaine",
    "Premier appel vidéo",
    "Partager nos histoires de foi",
    "Échanger sur nos visions du mariage",
    "Première rencontre en lieu public",
    "Informer nos référents respectifs",
    "Temps de prière ensemble",
    "Discerner : souhaitons-nous avancer ensemble ?"
  ],
  resources: [
    { title: "Discerner la volonté de Dieu dans une relation", type: "Article · 8 min" },
    { title: "Les 5 premières conversations essentielles", type: "Guide PDF" },
    { title: "Prier pour une rencontre", type: "Audio · 12 min" }
  ],
  prayer: "Seigneur, nous te confions cette rencontre. Donne-nous la sagesse de discerner ta volonté, la patience d'apprendre à nous connaître et la paix dans chacune de nos décisions. Que ton amour guide nos paroles. Amen."
};

/* ---------- Candidats pour l'espace référent ---------- */
/* ---------- Messagerie entre membres ----------
   Ouverte aux membres validés par leur référent ET à jour de leur formule (CH.canChat).
   Présence simulée : minutes depuis la dernière connexion (0 = en ligne). */
CH_DATA.chat = {
  presence: { p1: 0, p2: 0, p3: 14, p4: 190, p5: 0, p6: 0, p7: 75, p8: 0, p9: 0, p10: 6, p11: 320, p12: 0 },
  reactions: [
    { key: "amen", label: "Amen", icon: "pray" },
    { key: "merci", label: "Merci", icon: "heart" },
    { key: "bravo", label: "Encourageant", icon: "star" }
  ],
  /* Questions pour lancer ou relancer un échange ; {interest} et {service} viennent du profil */
  starters: [
    "J'ai vu « {interest} » parmi vos centres d'intérêt : qu'est-ce qui vous plaît le plus ?",
    "Vous servez dans votre église (« {service} ») : comment avez-vous commencé ?",
    "Quel passage de la Bible vous accompagne en ce moment ?",
    "Qu'est-ce qui vous a amené sur Cheminons ?",
    "Comment se passe votre semaine ?",
    "Quel chant de louange tournerait en boucle chez vous ?"
  ],
  /* Réponses simulées de la démo (le serveur relaiera les vrais messages) */
  replies: {
    question: [
      "Belle question ! Je dirais que c'est surtout une affaire de fidélité au quotidien. Et vous ?",
      "Bonne question… Je crois que c'est ce qui m'a le plus fait grandir ces dernières années. Vous, qu'en pensez-vous ?",
      "Ah, il faudrait un bon thé pour bien y répondre ! En quelques mots : beaucoup de prière et de patience."
    ],
    interest: [
      "Oui ! J'y consacre du temps chaque semaine, c'est ma petite respiration. Vous aussi, vous avez une activité qui vous ressource ?",
      "Vous avez l'œil : c'est une vraie passion pour moi. Et de votre côté, qu'est-ce qui vous passionne ?"
    ],
    general: [
      "Merci pour votre message, cela me fait plaisir d'échanger avec vous.",
      "Je me retrouve beaucoup dans ce que vous dites.",
      "C'est encourageant de lire cela. Que Dieu vous bénisse dans cette semaine !",
      "Très juste. On en reparle volontiers, j'aime ce genre de discussion."
    ]
  },
  /* Parole du jour affichée dans la messagerie (une par jour de la semaine) */
  verses: [
    ["Que tout ce que vous faites se fasse avec amour.", "1 Corinthiens 16.14"],
    ["Portez les fardeaux les uns des autres.", "Galates 6.2"],
    ["Que votre parole soit toujours accompagnée de grâce.", "Colossiens 4.6"],
    ["Encouragez-vous mutuellement et édifiez-vous les uns les autres.", "1 Thessaloniciens 5.11"],
    ["L'amour est patient, il est plein de bonté.", "1 Corinthiens 13.4"],
    ["Recherchez la paix et poursuivez-la.", "Psaume 34.15"],
    ["Là où deux ou trois sont assemblés en mon nom, je suis au milieu d'eux.", "Matthieu 18.20"]
  ],
  charter: [
    "Je m'adresse à chacun avec respect, douceur et vérité.",
    "Je ne demande ni argent, ni coordonnées bancaires, ni informations privées.",
    "Je propose toute première rencontre dans un lieu public, et j'en parle à mon référent.",
    "Je signale tout comportement inapproprié : mon référent en est informé."
  ],
  reportReasons: ["Propos irrespectueux ou déplacés", "Demande d'argent ou d'informations personnelles", "Faux profil ou usurpation", "Insistance malgré un refus", "Autre motif"]
};

CH_DATA.candidates = [
  { id: "k1", name: "Samuel Kabongo", age: 31, city: "Lyon", since: "28 sept. 2026", interview: "a_planifier", decision: null, plan: "single", colors: ["#3d7a5a", "#2f5f8a"], note: "Membre depuis 2019, sert à l'accueil." },
  { id: "k2", name: "Myriam Dupont", age: 27, city: "Lyon", since: "24 sept. 2026", interview: "planifie", date: "2026-10-09T18:30", decision: null, plan: "single", colors: ["#a3204f", "#c7962c"], note: "Membre depuis 2021, chorale." },
  { id: "k3", name: "Benjamin Rousseau", age: 34, city: "Villeurbanne", since: "15 sept. 2026", interview: "realise", decision: null, plan: "cheminant", colors: ["#5b3e8a", "#c06c84"], note: "Fréquente l'église depuis 8 mois." },
  { id: "k4", name: "Ruth Mensah", age: 29, city: "Lyon", since: "10 sept. 2026", interview: "realise", decision: "valider", validatedAt: "2026-10-04", plan: "cheminant", colors: ["#c7962c", "#a3204f"], note: "Responsable jeunesse." },
  { id: "k5", name: "Paul Henry", age: 38, city: "Caluire", since: "2 sept. 2026", interview: "realise", decision: "mettre_en_attente", plan: "single", colors: ["#1f6f78", "#8fc1a9"], note: "" },
  { id: "k6", name: "Élise Martin", age: 30, city: "Lyon", since: "12 août 2026", interview: "realise", decision: "valider", validatedAt: "2026-08-21", plan: "single", colors: ["#2f5f8a", "#7cb4c9"], note: "Groupe de maison." },
  { id: "k7", name: "David Okafor", age: 33, city: "Vénissieux", since: "29 juil. 2026", interview: "realise", decision: "valider", validatedAt: "2026-08-08", validatedBy: "ref-c1-2", plan: "cheminant", colors: ["#3d7a5a", "#c7962c"], note: "Équipe technique." }
];

/* Référents : chaque église en désigne autant qu'elle le souhaite (depuis #/eglise/referents).
   Le premier de chaque église est aussi son contact principal (CH_DATA.churches[].referent).
   demoReferentId : le référent connecté dans l'espace référent de la démo. */
CH_DATA.referents = [
  { id: "ref-c1-1", churchId: "c1", name: "Pasteur Daniel Moreau", role: "Pasteur / prêtre", trained: true },
  { id: "ref-c1-2", churchId: "c1", name: "Sœur Esther Lambert", role: "Responsable de pastorale des couples", trained: true },
  { id: "ref-c2-1", churchId: "c2", name: "Père Antoine Lefèvre", role: "Pasteur / prêtre", trained: true },
  { id: "ref-c2-2", churchId: "c2", name: "Frère Paul Martin", role: "Diacre", trained: true },
  { id: "ref-c3-1", churchId: "c3", name: "Pasteure Claire Fontaine", role: "Pasteur / prêtre", trained: true },
  { id: "ref-c4-1", churchId: "c4", name: "Pasteur Emmanuel Kouassi", role: "Pasteur / prêtre", trained: true },
  { id: "ref-c5-1", churchId: "c5", name: "Pasteur Thomas Girard", role: "Pasteur / prêtre", trained: true },
  { id: "ref-c6-1", churchId: "c6", name: "Pasteur Joël Mbemba", role: "Pasteur / prêtre", trained: true },
  { id: "ref-c7-1", churchId: "c7", name: "Père Luc Bernard", role: "Pasteur / prêtre", trained: true },
  { id: "ref-c8-1", churchId: "c8", name: "Pasteure Ruth Ndiaye", role: "Pasteur / prêtre", trained: true },
  { id: "ref-c9-1", churchId: "c9", name: "Pasteur Koffi Yao", role: "Pasteur / prêtre", trained: true },
  { id: "ref-c9-2", churchId: "c9", name: "Ancien Didier Ahoua", role: "Ancien", trained: true },
  { id: "ref-c10-1", churchId: "c10", name: "Pasteure Awa Diop", role: "Pasteur / prêtre", trained: true }
];
CH_DATA.demoReferentId = "ref-c1-1";

/* Inscriptions validées dans les autres églises du réseau (historique de démo pour l'administration).
   referentId : le référent qui a validé (sa part lui revient, celle de l'église à son église). */
CH_DATA.registrationsHistory = [
  { id: "v14", name: "Grâce Nlandu", churchId: "c1", referentId: "ref-c1-2", plan: "single", validatedAt: "2026-09-26" },
  { id: "v1", name: "Claire Dubois", churchId: "c2", referentId: "ref-c2-1", plan: "single", validatedAt: "2026-10-03" },
  { id: "v2", name: "Thomas Bernard", churchId: "c3", referentId: "ref-c3-1", plan: "cheminant", validatedAt: "2026-09-28" },
  { id: "v3", name: "Naomi Kouassi", churchId: "c4", referentId: "ref-c4-1", plan: "single", validatedAt: "2026-09-22" },
  { id: "v4", name: "Lucas Girard", churchId: "c5", referentId: "ref-c5-1", plan: "cheminant", validatedAt: "2026-09-15" },
  { id: "v5", name: "Inès Morel", churchId: "c2", referentId: "ref-c2-2", plan: "cheminant", validatedAt: "2026-09-09" },
  { id: "v6", name: "Jérémie Lukusa", churchId: "c6", referentId: "ref-c6-1", plan: "single", validatedAt: "2026-08-30" },
  { id: "v7", name: "Sarah Mendy", churchId: "c8", referentId: "ref-c8-1", plan: "single", validatedAt: "2026-08-19" },
  { id: "v8", name: "Hugo Lemaire", churchId: "c7", referentId: "ref-c7-1", plan: "cheminant", validatedAt: "2026-08-12" },
  { id: "v9", name: "Aya Konan", churchId: "c9", referentId: "ref-c9-1", plan: "single", validatedAt: "2026-10-05" },
  { id: "v10", name: "Serge Kouadio", churchId: "c9", referentId: "ref-c9-2", plan: "cheminant", validatedAt: "2026-09-20" },
  { id: "v11", name: "Fatou Sow", churchId: "c10", referentId: "ref-c10-1", plan: "cheminant", validatedAt: "2026-09-02" },
  { id: "v12", name: "Ibrahima Fall", churchId: "c10", referentId: "ref-c10-1", plan: "single", validatedAt: "2026-08-25" },
  { id: "v13", name: "Marie-Ange Tanoh", churchId: "c9", referentId: "ref-c9-2", plan: "single", validatedAt: "2026-08-14" }
];

/* Couples suivis à l'École du mariage (progression des cours vidéo et audio, en % par conjoint) */
CH_DATA.couples = [
  { names: "Ruth & Jonathan", churchId: "c1", since: "Juillet 2026", status: "Couple en cheminement", progress: [62, 55], module: 6, lastDays: 2, colors: [["#c7962c", "#a3204f"], ["#2f5f8a", "#3d7a5a"]] },
  { names: "Anne & Mathieu", churchId: "c1", since: "Mars 2026", status: "Accompagnement", progress: [100, 100], module: 10, lastDays: 5, colors: [["#7d153b", "#c06c84"], ["#5b3e8a", "#2f5f8a"]] },
  { names: "Priscille & Daniel", churchId: "c4", since: "Août 2026", status: "Couple en cheminement", progress: [24, 9], module: 3, lastDays: 26, colors: [["#1f6f78", "#8fc1a9"], ["#c7962c", "#3d7a5a"]] },
  { names: "Awa & Ibrahima", churchId: "c10", since: "Juin 2026", status: "Couple en cheminement", progress: [71, 74], module: 8, lastDays: 1, colors: [["#b5485d", "#f2b880"], ["#2f5f8a", "#7cb4c9"]] }
];

CH_DATA.decisions = {
  valider: { label: "Validé", badge: "sage" },
  refuser: { label: "Non validé", badge: "danger" },
  demander_infos: { label: "Infos demandées", badge: "gold" },
  mettre_en_attente: { label: "En attente", badge: "amber" }
};
CH_DATA.interviewSteps = [
  { key: "a_planifier", label: "À planifier" },
  { key: "planifie", label: "Planifié" },
  { key: "realise", label: "Réalisé" }
];

/* ---------- Accompagnement pastoral (étape 13) ---------- */
CH_DATA.sessions = [
  { title: "Rencontre de lancement", with: "Votre référent", desc: "Faire le point sur l'École du mariage et poser le cadre de l'accompagnement.", duration: "1 h" },
  { title: "Relecture de votre histoire", with: "Couple accompagnateur", desc: "Revenir sur votre rencontre, vos familles et ce que vous avez découvert l'un de l'autre.", duration: "1 h 30" },
  { title: "Points de vigilance", with: "Couple accompagnateur", desc: "Aborder avec bienveillance les sujets « à discuter » identifiés pendant le parcours.", duration: "1 h 30" },
  { title: "Projet de vie partagé", with: "Couple accompagnateur", desc: "Mettre en commun votre vision à 5, 10 et 20 ans.", duration: "1 h 30" },
  { title: "Entretien pastoral pré-mariage", with: "Votre référent", desc: "Bilan final et discernement avant d'engager la préparation du mariage.", duration: "1 h" }
];

/* ---------- Préparation au mariage (étape 14) ---------- */
CH_DATA.prepTasks = [
  { title: "Projet matrimonial", items: ["Rédiger notre lettre d'engagement", "Établir le budget du mariage", "Choisir notre lieu de vie après le mariage", "Discuter du régime matrimonial"] },
  { title: "Démarches", items: ["Déposer le dossier de mariage civil en mairie", "Choisir nos témoins", "Informer nos deux églises"] },
  { title: "Célébration", items: ["Fixer la date avec l'église", "Choisir l'officiant", "Préparer le déroulement du culte", "Choisir les textes bibliques et les chants"] }
];

/* ---------- Tarifs ----------
   SINGLE    : formule mensuelle.
   CHEMINONS : formule trimestrielle (moins chère que 3 mois de SINGLE).
   Afrique   : équivalent en francs CFA (1 € = 655,957 FCFA), arrondi à 500 FCFA.
   taxRate   : taxe incluse dans le prix affiché, déduite avant le calcul des reversements.
               Europe 20 % (TVA France) ; Afrique 18 % : taux PROVISOIRE, variable selon le pays. */
CH_DATA.pricing = [
  {
    region: "europe", label: "Europe", currency: "EUR", taxRate: 0.20, note: "Prix en euros, TTC",
    plans: {
      single: { amount: 29, period: "par mois", months: 1 },
      cheminant: { amount: 80, period: "par trimestre", months: 3 }
    }
  },
  {
    region: "afrique", label: "Afrique", currency: "XOF", taxRate: 0.18, note: "Prix en francs CFA (zones UEMOA et CEMAC)",
    plans: {
      single: { amount: 19000, period: "par mois", months: 1 },
      cheminant: { amount: 52500, period: "par trimestre", months: 3 }
    }
  }
];

/* Contenu commun aux deux régions */
CH_DATA.plans = {
  single: {
    name: "SINGLE", audience: "Formule mensuelle",
    features: ["Validation par un référent de votre église", "Recherche et suggestions de profils", "Intérêts et mise en relation", "Espace « Notre cheminement »"]
  },
  cheminant: {
    name: "CHEMINONS", audience: "Formule trimestrielle",
    features: ["Tout ce que comprend SINGLE", "Facturation tous les trois mois"]
  }
};

/* Moyens de paiement selon la région de la formule choisie. Le règlement se fait chez le
   prestataire (Stripe et PayPal en Europe, agrégateur Mobile Money en Afrique) :
   aucune donnée bancaire ne transite par Cheminons. */
CH_DATA.paymentMethods = {
  europe: [
    { key: "carte", label: "Carte bancaire", detail: "Visa, Mastercard, CB", provider: "Stripe" },
    { key: "paypal", label: "PayPal", detail: "Avec ou sans compte PayPal", provider: "PayPal" }
  ],
  afrique: [
    { key: "mobile", label: "Mobile Money", detail: "Orange Money, Wave, MTN MoMo, Moov Money", provider: "Agrégateur Mobile Money" }
  ]
};

/* Reversements sur chaque inscription validée, calculés sur le montant hors taxes.
   Visibles uniquement par leur bénéficiaire : le référent dans son espace, l'église dans le sien. */
CH_DATA.reversion = { referent: 0.10, church: 0.10 };
