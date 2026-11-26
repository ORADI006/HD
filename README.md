# HADASSA — Portfolio

Portfolio statique déployé sur Vercel.

## Structure

- `index.html` : structure et contenu HTML.
- `css/style.css` : styles, thèmes et responsive design.
- `js/theme.js` : restauration du thème avant l'affichage.
- `js/main.js` : interactions du site et chargement des médias rotatifs depuis Supabase.
- `media/` : images et vidéos locales utilisées comme médias initiaux/de secours.

## Médias rotatifs

Les emplacements Projet, Experience Digital et MC Mariage sont pilotés par les tables Supabase `media_rotation_slots` et `media_assets`. Les fichiers locaux de `media/` servent de médias initiaux/de secours.

Les nouveaux médias ajoutés au stockage Supabase doivent être enregistrés dans `media_assets` avec le bon `slot_key` et un ordre `position` cohérent.
