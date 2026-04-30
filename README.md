# Crescendo — Simulateur de portefeuille

> Simulateur interactif de croissance de portefeuille avec intérêts composés, données historiques réelles et projection par paliers.

**[crescendo-simulator.vercel.app](https://crescendo-simulator.vercel.app)**

---

## Fonctionnalités

- **Recherche d'actifs en temps réel** — ETF, actions, fonds, crypto via Yahoo Finance
- **TCAC historique automatique** — le taux de croissance annuel est récupéré sur les données réelles (jusqu'à 15 ans)
- **Portefeuille multi-actifs** — combinez plusieurs actifs avec une allocation personnalisée
- **Projection par paliers** — tableau des jalons (100 K€, 200 K€, …) avec délai entre chaque
- **Graphique interactif** — courbe du portefeuille vs capital investi
- **Calcul en temps réel** — chaque modification recalcule instantanément la projection

## Stack technique

| Outil | Rôle |
|---|---|
| React 19 | UI |
| Vite 8 | Build & dev server |
| Tailwind CSS 4 | Styles |
| Recharts | Graphique |
| Yahoo Finance API | Données de marché |
| Vercel | Hébergement & proxy API |

## Lancer en local

```bash
git clone https://github.com/<your-username>/crescendo.git
cd crescendo
npm install
npm run dev
```

L'application tourne sur `http://localhost:5173`. Le proxy Vite redirige automatiquement `/api/yahoo` vers Yahoo Finance.

## Déploiement Vercel

Le projet inclut une fonction serverless (`api/yahoo/[...slug].js`) qui agit comme proxy vers Yahoo Finance — nécessaire car les requêtes directes côté client sont bloquées par CORS en production.

```bash
npm install -g vercel
vercel
```

## Licence

MIT © Raphaël Sourdis
