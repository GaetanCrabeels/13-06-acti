/**
 * Questions de la balade nature – style Totemus
 *
 * Structure d'une question :
 *   id          : identifiant unique (number)
 *   type        : 'mcq' (QCM) | 'free' (champ libre)
 *   question    : texte de la question (string)
 *   image       : chemin vers une image illustrative (string | null)
 *   options     : tableau de 4 réponses pour QCM  (string[4] | null)
 *   answer      : réponse correcte, exacte (string)
 *   timer       : durée allouée en secondes (number, défaut 15)
 *   points      : points gagnés pour une bonne réponse (number)
 *   coordinates : coordonnées GPS du prochain poste (string)
 *   coordinatesLabel : description de l'emplacement suivant (string)
 */
const QUESTIONS = [
  {
    id: 1,
    type: "mcq",
    question: "Quel est le nom de cet arbre dont l'écorce forme des plaques caractéristiques ?",
    image: null,
    options: ["Chêne pédonculé", "Platane commun", "Hêtre commun", "Charme commun"],
    answer: "Platane commun",
    timer: 15,
    points: 10,
    coordinates: "50° 51′ 12″ N, 4° 21′ 06″ E",
    coordinatesLabel: "Rendez-vous près du vieux chêne au carrefour des deux sentiers.",
  },
  {
    id: 2,
    type: "mcq",
    question: "Ce chant d'oiseau que vous entendez appartient à quel oiseau emblématique de nos forêts ?",
    image: null,
    options: ["Pinson des arbres", "Mésange charbonnière", "Merle noir", "Geai des chênes"],
    answer: "Merle noir",
    timer: 20,
    points: 15,
    coordinates: "50° 51′ 18″ N, 4° 21′ 14″ E",
    coordinatesLabel: "Direction la mare aux grenouilles, au bas du vallon.",
  },
  {
    id: 3,
    type: "free",
    question: "Combien de trous d'envol comptez-vous sur le tronc de ce hêtre (inscrire le nombre en chiffres) ?",
    image: null,
    options: null,
    answer: "7",
    timer: 30,
    points: 20,
    coordinates: "50° 51′ 25″ N, 4° 21′ 20″ E",
    coordinatesLabel: "Montez le long du talus jusqu'au grand rocher plat.",
  },
  {
    id: 4,
    type: "mcq",
    question: "Cette plante aux feuilles en cœur et à l'odeur forte est utilisée en cuisine. Comment s'appelle-t-elle ?",
    image: null,
    options: ["Ortie dioïque", "Ail des ours", "Lierre terrestre", "Menthe aquatique"],
    answer: "Ail des ours",
    timer: 15,
    points: 10,
    coordinates: "50° 51′ 30″ N, 4° 21′ 28″ E",
    coordinatesLabel: "Traversez le pont de bois et continuez 50 m sur la droite.",
  },
  {
    id: 5,
    type: "mcq",
    question: "Quel est l'insecte reconnaissable à ses élytres rouges tachetés de points noirs ?",
    image: null,
    options: ["Carabe doré", "Coccinelle à 7 points", "Gendarme", "Chrysomèle"],
    answer: "Coccinelle à 7 points",
    timer: 15,
    points: 10,
    coordinates: "50° 51′ 38″ N, 4° 21′ 35″ E",
    coordinatesLabel: "Rejoignez la clairière avec la grande fourmilière.",
  },
  {
    id: 6,
    type: "free",
    question: "Quelle est la couleur des baies de cette plante grimpante (sureau noir ou lierre) ? Répondre par « noir » ou « vert ».",
    image: null,
    options: null,
    answer: "noir",
    timer: 20,
    points: 15,
    coordinates: "50° 51′ 45″ N, 4° 21′ 40″ E",
    coordinatesLabel: "Arrivée finale : retour au point de départ, près du panneau d'information.",
  },
];
