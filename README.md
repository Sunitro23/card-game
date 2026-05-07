# Card Game MVP (React + Node.js + Socket.IO)

Ce dépôt contient un socle MVP orienté **jeu de cartes en temps réel** pour mobile web.

## Architecture

- **client/** : interface React (Vite) qui n'envoie que des intentions.
- **server/** : serveur Node.js + Socket.IO, source de vérité du jeu.
- **Modes de jeu** : duel de cartes historique ou Awalé classique dans les mêmes rooms à 2 joueurs.
- **state en RAM** : aucune persistance, toutes les parties sont perdues au redémarrage.

## Démarrage rapide

### Serveur

```bash
cd server
npm install
npm run dev
```

Le serveur écoute par défaut sur `http://127.0.0.1:3001` (loopback uniquement, pas d'exposition réseau externe).

### Client

```bash
cd client
npm install
npm run dev
```

Le client Vite écoute en général sur `http://127.0.0.1:5173`.

### Variables d'environnement utiles

- `HOST` (serveur) : `127.0.0.1` par défaut
- `CLIENT_ORIGIN` (serveur) : `http://127.0.0.1:5173` par défaut
- `VITE_SOCKET_URL` (client) : `http://127.0.0.1:3001` par défaut

## Flux Socket.IO principal

### Client -> serveur (intentions)

- `room:create` `{ playerName, gameType? }` (`gameType` vaut `card_duel` par défaut ou `awale`)
- `room:join` `{ code, playerName }`
- `game:start` `{ code }`
- `turn:end` `{ code }`
- `card:play` `{ code, cardId, targetPlayerId? }`
- `combat:defend` `{ code, attackId, defenseCardId? }`
- `awale:move` `{ pitIndex }`
- `game:abort`
- `hand:mulligan` `{ code, cardIds }`

### Serveur -> client

- `room:state` : état filtré par joueur
- `game:event` : journal d'actions
- `game:error` : erreurs métier

## Mode Awalé classique intégré côté serveur

- Plateau de 12 trous, 48 graines au départ (4 par trou).
- Premier joueur tiré au hasard dans la room.
- Semis anti-horaire, avec règle du Kroo : si le trou de départ contient plus de 11 graines, il est sauté à chaque passage et reste vide.
- Capture sur le camp adverse quand la dernière graine tombe dans un trou à 2 ou 3 graines, puis capture multiple sur les trous précédents valides.
- Coups qui affament l'adversaire interdits, détection des boucles, score par graines capturées et abandon avec capture des graines restantes par l'adversaire.

## Règles MVP intégrées côté serveur

- Attaques basées sur `FOR`, `DEX`, `INT`
- Dégâts augmentés en mêlée (`proximity`)
- Compétence ultime (coût en mana, 1 fois/combat)
- Défausse + repioche (1 fois / tour, uniquement durant son tour)
- Jet de dé + modificateur de carte pour les attaques
- Pioche bonus via `SAG` sur jet réussi

## Boucle de jeu basique implémentée

La gestion des tours est stricte côté serveur : seules les actions du joueur actif sont acceptées, et un tour ne peut pas se terminer tant qu'une défense est en attente.

- Main visible côté joueur avec jeu de carte direct depuis l'UI.
- Cartes d'attaque `FOR/DEX/INT` avec bonus dégâts de proximité.
- Cartes utilitaires : `vision`, `steal`, `critical`, `move`.
- Cartes défensives : `block`, `dodge`, `counter`.
- Cartes `mana` + carte `skill` (ultime, coût 5 mana, 1 usage, immunité counter).
- Mulligan 1 fois par tour.

> Le moteur est volontairement compact : il sert de base robuste pour itérer les équilibrages.
