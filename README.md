# 🪵 Fanoron-telo — Jeu de stratégie malgache avec IA

> Hackathon Algorithmique Avancée — Institut Supérieur Polytechnique de Madagascar
> Site officiel de l'institut : **[www.ispm-edu.com](https://www.ispm-edu.com)**

---

## Sommaire

1. [En-tête institutionnel et identification](#1-en-tête-institutionnel-et-identification)
2. [Description du travail réalisé](#2-description-du-travail-réalisé)
3. [Guide d'installation rapide](#3-guide-dinstallation-rapide-3-commandes-max)
4. [Outils d'aide IA utilisés](#4-outils-daide-ia-utilisés)
5. [Modélisation et algorithmes de l'IA du jeu](#5-modélisation-et-algorithmes-de-lia-du-jeu)
6. [Analyses de performances](#6-analyses-de-performances)

---

## 1. En-tête institutionnel et identification

**Institut :** [Institut Supérieur Polytechnique de Madagascar — www.ispm-edu.com](https://www.ispm-edu.com)
**Nom du groupe de projet :** `2 Coding Girls`

| Nom complet | Numéro d'étudiant | Classe | Rôle précis pour ce Hackathon |
|---|---|---|---|
| RADIMIMANANA Nandrianina Rivomahefa Helisoa | 05 | IGGLIA |Frontend Developer & UI/UX Designer  / AI Engineers & Game Algorithm Developers |
| RAKOTOARIMALALA Fanomezantsoa Ianissa | 55 | IGGLIA | Backend Architect &  Backend Developer / AI Engineers & Game Algorithm Developers |

---

## 2. Description du travail réalisé

### 2.1 Présentation globale

**Fanoron-telo** est une application web complète du jeu de société traditionnel malgache du même nom, opposant alignement stratégique et anticipation. L'application propose :

- **Mode Humain vs Humain** en local (même appareil, tour par tour)
- **Mode Humain vs IA** avec 3 niveaux de difficulté (Facile / Moyen / Difficile)
- **Mode IA vs IA** (démonstration automatique, niveaux configurables indépendamment pour chaque IA)
- **Gestion robuste des règles** : phase de placement, phase de mouvement, détection d'alignement (lignes, colonnes, diagonales), détection de blocage total et de nulle par répétition
- **IA Difficile** basée sur Minimax + élagage Alpha-Beta, avec table de transposition, opening book et approfondissement itératif
- **Historique des coups** en notation `a1`–`c3`
- **Statistiques IA en direct** : temps de réflexion, profondeur de recherche, nœuds explorés, hits de la table de transposition
- **Indicateur de phase et de tour** clairement affiché
- **Annulation / rétablissement de coup (Undo/Redo)**, avec saut automatique des tours IA pour toujours revenir à un tour jouable par l'humain
- **Déploiement en ligne sur Vercel** (cf. [2.4](#24-lien-vers-la-version-hébergée))

### 2.2 Architecture et pile technologique

| Couche | Technologie |
|---|---|
| Framework UI | React 19 + TypeScript |
| Build tool | Vite |
| Rendu du plateau | SVG natif (pas de canvas, pour une accessibilité et une netteté maximales à tout zoom) |
| État du jeu | Hooks React (`useState`/`useEffect`) + moteur de règles pur (sans dépendance UI) |
| IA | Module TypeScript indépendant (`src/ai/`), exécutable aussi bien côté client que dans un Web Worker |
| Style | CSS modulaire par composant + design tokens centralisés (`src/styles/tokens.css`) |

**Organisation du code :**

```
src/
├── game/                  # Moteur de jeu — logique pure, sans dépendance React
│   ├── types.ts           # Types fondamentaux (BitBoard, GameState, Move…)
│   ├── board.ts           # Géométrie du plateau, bitboards, adjacence, lignes gagnantes
│   └── rules.ts           # Génération des coups légaux, transitions d'état
├── ai/                    # Intelligence artificielle
│   ├── evaluation.ts      # Fonction d'évaluation heuristique
│   ├── minimax.ts         # Minimax + Alpha-Beta + iterative deepening
│   ├── transpositionTable.ts
│   └── openingBook.ts
├── components/            # Composants UI (Board, GameLayout, MoveHistory…)
├── hooks/
│   └── useFanoronGame.ts  # Hook orchestrant état de jeu, déclenchement de l'IA et historique Undo/Redo
├── styles/                # Design tokens, styles globaux, boutons
└── App.tsx                # Navigation entre écrans (menu, configuration, jeu)
scripts/
├── test-engine.ts         # Suite de validation du moteur de règles et de l'IA
└── perf-test.ts           # Mesures de performance (cf. Section 6)
vercel.json                # Configuration de déploiement Vercel (build Vite + SPA rewrites)
```

La séparation stricte entre `game/` (logique pure, testable sans navigateur) et `components/` (présentation) permet de valider l'intégralité des règles et de l'IA via des scripts Node (`npx tsx scripts/test-engine.ts`), sans dépendre du rendu graphique.

### 2.3 Direction artistique

Interface inspirée des plateformes d'échecs modernes (Chess.com, Lichess) : sobriété, lisibilité, matérialité. Palette limitée et imposée :

- Fond anthracite `#1A1A1A`
- Plateau en bois sombre (dégradé radial brun)
- Vert profond inspiré de Madagascar pour les accents et surbrillances
- Ivoire/beige pour les pions clairs et le texte secondaire
- Motifs géométriques malgaches en filigrane discret (losanges entrelacés, inspirés des nattes tissées) sur certains panneaux
- Typographies : **Cinzel** (titres), **Playfair Display** (sous-titres, citations), **Inter** (texte courant), **JetBrains Mono** (notation, statistiques)

### 2.4 Lien vers la version hébergée

L'application est déployée sur **Vercel** : `https://fanorona-ia.vercel.app/`

Déploiement automatique à chaque push sur la branche principale (build Vite détecté nativement par Vercel, configuration explicite dans `vercel.json` à la racine du dépôt).

---

## 3. Guide d'installation rapide (3 commandes max)

```bash
git clone <url_du_depot>
npm install
npm run dev
```

L'application est ensuite accessible sur `http://localhost:5173`.



---

## 4. Outils d'aide IA utilisés

Dans le cadre de ce hackathon, l'équipe a utilisé **Claude (Anthropic)** comme assistant de développement principal, en complément du travail de conception humain. Utilisation concrète :

- **Exploration d'approches algorithmiques** : assistance pour comparer différentes stratégies de recherche et d'évaluation d'un jeu de plateau (Minimax, Alpha-Beta Pruning, heuristiques d'évaluation).
- **Débogage** : identification rapide d'erreurs de chemins d'import TypeScript et de paramètres inutilisés lors du build (`tsc -b`).
- **Génération de documentation** : rédaction structurée de ce README selon le plan en 6 sections imposé par l'énoncé.

**Retour d'expérience :** L'utilisation de l'IA a principalement permis d'accélérer l'exploration de différentes approches algorithmiques pour l'IA du jeu, notamment la comparaison de stratégies telles que Minimax, Alpha-Beta Pruning et diverses heuristiques d'évaluation. Elle a également été utile lors des phases de débogage en facilitant l'identification d'erreurs de compilation, de problèmes de typage TypeScript et de certaines incohérences logiques. Toutes les solutions retenues ont été analysées, adaptées, testées et validées par l'équipe avant leur intégration au projet.

---

## 5. Modélisation et algorithmes de l'IA du jeu

### 5.1 Représentation de l'état du plateau

Le plateau est modélisé par deux **bitboards** de 9 bits (`src/game/board.ts`) :

```ts
interface BitBoard {
  p1: number; // bit i = 1 si le joueur 1 occupe l'intersection i
  p2: number; // bit i = 1 si le joueur 2 occupe l'intersection i
}
```

Les 9 intersections sont indexées 0 à 8 :

```
6 -- 7 -- 8
|  \ | /  |
3 -- 4 -- 5
|  / | \  |
0 -- 1 -- 2
```

Cette représentation offre deux avantages :
- **Détection d'alignement en O(1)** : les 8 lignes gagnantes (3 horizontales, 3 verticales, 2 diagonales du carré) sont précalculées comme des masques binaires (`WINNING_MASKS`). Un alignement est détecté par un simple ET binaire entre le masque du joueur et chaque masque de ligne.
- **Hashing trivial pour la table de transposition** : la clé d'un état est directement `${p1}|${p2}|${joueurCourant}|${phase}`, sans calcul de hash coûteux.

L'**adjacence** (nécessaire en phase de mouvement) est représentée par une liste explicite (`ADJACENCY[cell]`) couvrant les connexions orthogonales et diagonales du plateau, y compris la case centrale (indice 4) qui est reliée à toutes les autres cases.

### 5.2 Minimax et fonction d'évaluation

L'IA s'appuie sur une implémentation **Negamax** (variante symétrique du Minimax, où chaque joueur maximise `-score(adversaire)`) avec **élagage Alpha-Beta** (`src/ai/minimax.ts`).

**Fonction d'évaluation** (`src/ai/evaluation.ts`), du point de vue du joueur évalué :

| Critère | Poids | Justification |
|---|---|---|
| Victoire / défaite | ±100000 (ajusté par la profondeur) | Score dominant ; les victoires rapides sont préférées, les défaites retardées |
| Menaces ouvertes (2 pions alignés, 3e case libre) | ±50 par menace | Une menace non bloquée gagne au coup suivant — poids fort |
| Contrôle du centre (case 4, 8 connexions) | ±30 | La case la plus connectée du plateau, clé en phase de mouvement |
| Différentiel de pions sur le plateau | ±3 | Stabilise l'évaluation en phase de placement |
| Mobilité (coups de mouvement disponibles) | ±4 par coup | Pertinent en phase 2 : un pion bloqué est un handicap |

### 5.3 Techniques avancées implémentées

- **Table de transposition** (`transpositionTable.ts`) : mémorise `(score, profondeur, type de borne)` pour chaque position déjà évaluée. Évite de recalculer des sous-arbres atteints par des séquences de coups différentes (transpositions), fréquentes sur un plateau aussi symétrique. Stocke également l'index du meilleur coup connu pour améliorer le tri des coups (move ordering) lors des recherches ultérieures.
- **Opening book** (`openingBook.ts`) : bibliothèque de coups d'ouverture théoriques — le centre (case 4, 8 connexions) au premier coup, un coin libre en réponse si le centre est pris. Évite une recherche coûteuse sur des positions à forte branching factor où la réponse optimale est connue à l'avance.
- **Bitboards** : cf. section 5.1.
- **Iterative deepening (approfondissement itératif)** : activé en mode Difficile. La recherche est relancée à des profondeurs croissantes (1, 2, 3…) jusqu'à un budget de temps (~900 ms), en conservant toujours le meilleur coup du dernier palier *complet*. Permet une recherche "anytime" robuste, qui s'arrête immédiatement si un coup gagnant est trouvé.
- **Move ordering** : les coups vers le centre et les coups gagnants immédiats sont triés en tête de liste avant la recherche, ce qui améliore significativement l'efficacité de l'élagage Alpha-Beta.
- **Machine Learning** : non implémenté dans le temps du hackathon. L'espace d'états du Fanoron-telo étant suffisamment restreint pour qu'une recherche Alpha-Beta avec table de transposition résolve la quasi-totalité des positions en quelques millisecondes (cf. Section 6), une approche d'apprentissage (Q-Learning, rote learning ou classification) n'apportait pas de gain de performance justifiant le temps de développement et d'entraînement supplémentaire sur ce créneau.

### 5.4 Calibrage des 3 niveaux de difficulté

| Niveau | Profondeur | Bruit aléatoire | Table de transposition | Opening book | Iterative deepening |
|---|---|---|---|---|---|
| Facile | 1 | 45 % de coups aléatoires | ❌ | ❌ | ❌ |
| Moyen | 3 | 12 % | ✅ | ✅ | ❌ |
| Difficile | jusqu'à 9 | 0 % | ✅ | ✅ | ✅ (budget ~900 ms) |

### 5.5 Undo/Redo (bonus)

L'annulation de coup est implémentée par deux piles d'états complets (`pastStates` / `futureStates`) dans `useFanoronGame.ts` : chaque coup joué empile l'état précédent dans `pastStates` et vide `futureStates` (comportement classique d'éditeur — toute nouvelle action après un retour en arrière invalide la branche "future").

En mode Humain vs IA ou IA vs IA, un Undo simple d'un seul demi-coup laisserait l'interface bloquée sur un tour IA. Le hook recule donc automatiquement à travers la pile jusqu'au dernier état où c'est au tour d'un joueur **humain**, regroupant ainsi le coup de l'IA et le coup humain précédent en une seule action perçue par l'utilisateur. Le Redo applique la même logique de façon symétrique. Undo/Redo sont désactivés pendant que l'IA réfléchit, pour éviter toute incohérence d'état pendant un calcul en cours.

---

## 6. Analyses de performances

Les mesures suivantes proviennent de `scripts/perf-test.ts`, exécuté via `npm run test:perf` (résultats reproductibles, voir le script pour la méthodologie complète).

### 6.1 Temps de réponse moyen de l'IA

| Contexte | Temps moyen |
|---|---|
| IA Difficile, 1er coup (opening book, sans recherche) | < 0,1 ms |
| IA Difficile, milieu de partie (recherche complète, profondeur 6–9) | quelques millisecondes à ~ 900 ms (budget d'iterative deepening) selon la complexité de la position |
| IA Moyenne (profondeur fixe 3) | < 5 ms typiquement |
| IA Facile (profondeur 1 ou coup aléatoire) | < 1 ms |

> Le jeu ayant un espace d'états très restreint (9 cases, 3 pions par joueur), l'IA Difficile atteint très souvent une profondeur de recherche suffisante pour résoudre l'arbre de jeu restant en quelques millisecondes ; le budget de temps de l'iterative deepening (~900 ms) n'est consommé en intégralité que sur les positions de milieu de phase de placement les plus ouvertes.

### 6.2 Résultats des affrontements IA vs IA

Sur des séries de 20 parties par confrontation (alternance du joueur qui commence) :

| Confrontation | Résultat |
|---|---|
| **Difficile vs Moyen** | Difficile gagne 50 %, nulle 50 %, **0 défaite** pour Difficile |
| **Difficile vs Facile** | Difficile gagne **100 %**, 0 nulle, 0 défaite |
| **Moyen vs Facile** | Moyen gagne 95 %, Facile gagne 5 %, 0 nulle |

**Interprétation :** l'IA Difficile ne perd jamais contre un niveau inférieur, ce qui valide la correction de l'élagage Alpha-Beta et de la fonction d'évaluation (blocage systématique des menaces adverses, exploitation systématique des menaces propres — vérifié également par tests unitaires dédiés dans `scripts/test-engine.ts`). Le taux élevé de nulles contre le niveau Moyen s'explique par la profondeur de jeu fondamentalement limitée du Fanoron-telo : avec un jeu parfait des deux côtés, de nombreuses lignes mènent à un blocage mutuel plutôt qu'à une victoire forcée.

### 6.3 Métriques liées aux techniques avancées

| Métrique | Valeur observée |
|---|---|
| Profondeur moyenne atteinte par l'IA Difficile (milieu de partie) | 6 à 9 plis |
| Nœuds explorés par coup (IA Difficile, position de milieu de partie typique) | ~ 600 nœuds |
| Effet de la table de transposition | Réduction significative du nombre de nœuds réévalués sur les positions à fort taux de transposition (plateau très symétrique) ; le nombre de *hits* est affiché en direct dans le panneau "Statistiques IA" de l'interface |
| Effet de l'opening book | Élimine toute latence de recherche sur les 2 premiers coups (réponse immédiate, < 0,1 ms) |

---

*Document généré dans le cadre du Hackathon Algorithmique Avancée — ISPM. Toute reproduction à des fins pédagogiques est autorisée avec mention de la source.*
