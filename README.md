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

## Administration HADASSA

Le back-office est accessible via `/admin.html` et utilise Supabase Auth avec Google OAuth.

- `admin.html`, `admin/admin.css`, `admin/admin.js` : interface privée et workflows d’administration.
- `supabase/migrations/20261126113608_hadassa_admin_foundation.sql` : tables, RLS, médias et journal d’activité.
- `supabase/migrations/20261126114147_hadassa_admin_hardened_access.sql` : fonctions internes et politiques d’activation des invitations.

Le premier compte autorisé est `drivelinkxv76@gmail.com`. L’activation se fait à la première connexion Google vérifiée. Le fournisseur Google doit être activé dans Supabase Auth et l’URL du site/prévisualisation doit être autorisée dans les URL de redirection.

Les administrateurs invités sont liés à leur adresse e-mail Google. Les rôles disponibles sont Super Admin, Administrateur et Éditeur. Les droits de gestion des médias et des contenus sont vérifiés par les politiques RLS côté base de données.

Le CMS permet déjà d’enregistrer des blocs de contenu JSON. Le raccordement de l’ensemble des champs de ces blocs au portfolio public reste une étape d’intégration distincte avant validation finale.
