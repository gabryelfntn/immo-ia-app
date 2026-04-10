-- Réparation : profils sans agence (tableau de bord vide, « Aucune agence associée »).
-- À exécuter dans Supabase → SQL Editor (rôle postgres : contourne la RLS).
--
-- 1) DIAGNOSTIC — note les UUID affichés
select id, name, created_at
from public.agencies
order by created_at;

select id, full_name, agency_id, role
from public.profiles
order by coalesce(full_name, '');

-- 2) Voir quelle agence utilisent encore tes données (biens / contacts)
select distinct agency_id as agency_des_donnees, count(*)::int as nb_biens
from public.properties
group by agency_id;

select distinct agency_id as agency_des_donnees, count(*)::int as nb_contacts
from public.contacts
group by agency_id;

-- 3) RÉPARATION MANUELLE (recommandé si tu connais l’UUID de ton agence)
-- Remplace AGENCY_UUID par l’id de la table agencies (étape 1 ou 2).
-- Tu peux cibler un ou plusieurs utilisateurs.
--
-- update public.profiles
-- set agency_id = 'AGENCY_UUID'::uuid
-- where id = 'USER_UUID_FROM_AUTH'::uuid;
--
-- 4) RÉPARATION « une seule agence » (à n’utiliser que si tu n’as qu’UNE ligne dans agencies)
-- update public.profiles p
-- set agency_id = (select a.id from public.agencies a order by a.created_at limit 1)
-- where p.agency_id is null;
--
-- 5) Si agency_id des biens existe mais PAS dans agencies (agence supprimée) :
-- il faut recréer l’agence ou restaurer une sauvegarde ; contacter le support sinon.
--
-- 6) Compte « isolé » : bon agency_id mais 0 donnée dans l’app
--    → profiles.id DOIT être égal à auth.users.id (pas une autre ligne « copie »).
--    Remplace l’email ci-dessous :
--
-- select au.id as auth_user_id, au.email, p.id as profile_id, p.agency_id, p.role
-- from auth.users au
-- left join public.profiles p on p.id = au.id
-- where au.email = 'email.du.collegue@example.com';
--
-- Si profile_id est NULL : insérer le profil avec id = auth_user_id.
-- Si profile_id ≠ auth_user_id : tu as une ligne profiles orpheline ; corrige l’id ou supprime le doublon.
