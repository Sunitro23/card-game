# Card Game MVP (React + Node.js + Socket.IO)

Ce dépôt contient un socle MVP orienté **jeu de cartes en temps réel** pour mobile web.

## Architecture

- **client/** : interface React (Vite) qui n'envoie que des intentions.
- **server/** : serveur Node.js + Socket.IO, source de vérité du jeu.
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

- `room:create` `{ playerName }`
- `room:join` `{ code, playerName }`
- `game:start` `{ code }`
- `turn:end` `{ code }`
- `card:play` `{ code, cardId, targetPlayerId?, facedown? }`
- `combat:defend` `{ code, attackId, defenseCardId? }`
- `combat:bluff:guess` `{ code, attackId, guess: 'attack' | 'other' }`
- `hand:mulligan` `{ code, cardIds }`

### Serveur -> client

- `room:state` : état filtré par joueur
- `game:event` : journal d'actions
- `game:error` : erreurs métier

## Règles MVP intégrées côté serveur

- Attaques basées sur `FOR`, `DEX`, `INT`
- Dégâts augmentés en mêlée (`proximity`)
- Bluff (`CHA`) avec limite d'utilisations
- Compétence ultime (coût en mana, 1 fois/combat)
- Défausse + repioche (1 fois / tour)
- Jet de dé + modificateur de carte pour les attaques
- Pioche bonus via `SAG` sur jet réussi

> Le moteur est volontairement compact : il sert de base robuste pour itérer les équilibrages.
