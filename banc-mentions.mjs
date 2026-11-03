#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════════════════
   banc-mentions.mjs — Sén Péi : la page « Mentions légales et données personnelles »,
   son lien sur chaque page, et la bibliothèque supabase-js hébergée sur le site.

   Né le mardi 03/11/2026. Lecture seule : ce banc lit les fichiers, il ne touche à rien,
   n'appelle aucun site et n'écrit pas dans la base.

   Usage (depuis la racine du dépôt) :
     node banc-mentions.mjs                       contrôle le dossier du banc (travail en cours)
     node banc-mentions.mjs --mise-en-ligne       LE contrôle d'avant le push : la vraie date doit
                                                  avoir remplacé le repère « [date de mise en ligne] »
     node banc-mentions.mjs <dossier>             contrôle un autre dossier (ex. un export d'origin/main)
     node banc-mentions.mjs --brouillon <fichier> montre où le texte s'écarte d'un brouillon
     node banc-mentions.mjs --empreinte           affiche l'empreinte du texte actuel (voir plus bas)
   Sortie : une ligne OK / ROUGE par contrôle ; code 0 si tout est vert, 1 sinon.
   Sans --mise-en-ligne, le vert ne vaut PAS feu vert de mise en ligne : le repère de date y est
   attendu. Le texte validé est contrôlé à chaque lancement par son empreinte (EMPREINTE_TEXTE),
   sans fichier extérieur.
   ═══════════════════════════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const MISE_EN_LIGNE = args.includes('--mise-en-ligne');
const AFFICHE_EMPREINTE = args.includes('--empreinte');
const iB = args.indexOf('--brouillon');
const BROUILLON = iB >= 0 ? args[iB + 1] : null;
const libres = args.filter((a, i) => !a.startsWith('--') && !(iB >= 0 && i === iB + 1));
const RACINE = path.resolve(libres[0] || path.dirname(fileURLToPath(import.meta.url)));

const PAGE = 'mentions-legales.html';
const LIBELLE = 'Mentions légales et données personnelles';
const REPERE = '[date de mise en ligne]';
const PAGES = ['index.html', 'app.html', 'decouvrir.html', 'fiche.html', PAGE];
const PAGES_SUPABASE = ['app.html', 'decouvrir.html', 'fiche.html'];
const RUBRIQUES = ['Qui édite Sén Péi', 'Qui héberge le site et les données', 'Vos données personnelles',
  'Cookies et traceurs', 'Contenus publiés', 'Droit applicable'];
const CDN = /jsdelivr|unpkg\.com|esm\.sh|cdnjs|skypack|jspm\.io/i;
// Empreinte sha256 du texte validé par Guillaume le mardi 03/11/2026 (« Oui, les 4 choix »), calculée
// sur le brouillon mentions-legales-BROUILLON-2026-11-03.html : contenu de la balise <main> (texte ET
// balises, donc les liens et adresses), ligne de date masquée, espaces normalisés (fonction corps).
// Ne la changer qu'après un nouveau oui de Guillaume sur un nouveau texte : node banc-mentions.mjs --empreinte
const EMPREINTE_TEXTE = 'a2941b303b6d54669fec95b64ad327007fa8e45db7b4644d3dd3aced028b923c';

const resultats = [];
const verifie = (nom, ok, detail = '') => resultats.push({ nom, ok: !!ok, detail });
const lire = (f) => { try { return fs.readFileSync(path.join(RACINE, f), 'utf8'); } catch { return null; } };
const sansCommentairesHtml = (s) => s.replace(/<!--[\s\S]*?-->/g, '');
// Commentaires JS/CSS : /* … */ et // en fin de ligne (pas le // de « https:// » ni celui d'une chaîne)
const sansCommentairesCode = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
const texte = (html) => sansCommentairesHtml(html)
  .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/\s+/g, ' ').trim();
const echappe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const corps = (h) => ((h.match(/<main[^>]*>([\s\S]*?)<\/main>/i) || [])[1] || '')
  .replace(/<p class="maj">[\s\S]*?<\/p>/, '<p class="maj">DATE</p>').replace(/\s+/g, ' ').trim();
const sha256 = (x) => crypto.createHash('sha256').update(x).digest('hex');
const lienMentions = new RegExp(`<a\\b[^>]*\\bhref="${echappe(PAGE)}"[^>]*>\\s*${echappe(LIBELLE)}\\s*</a>`);

console.log(`Banc mentions légales — dossier contrôlé : ${RACINE}${MISE_EN_LIGNE ? ' (mode mise en ligne)' : ''}\n`);

// 1. La page existe, avec ses rubriques et les 4 choix validés le 03/11/2026
const ml = lire(PAGE);
verifie('La page mentions-legales.html existe', ml !== null);
if (ml !== null) {
  const actif = sansCommentairesHtml(ml);
  const h1 = (actif.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1];
  verifie('Titre : « Mentions légales et données personnelles »', h1 && texte(h1) === LIBELLE, h1 ? texte(h1) : 'pas de <h1>');
  const h2 = [...actif.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => texte(m[1]));
  for (const r of RUBRIQUES) verifie(`Rubrique « ${r} »`, h2.includes(r));
  verifie('Rubriques dans le bon ordre', JSON.stringify(h2) === JSON.stringify(RUBRIQUES), h2.join(' | '));
  const t = texte(ml);
  verifie('Choix 1 : éditeur PIX-I-ART', t.includes('Sén Péi est un service édité par PIX-I-ART'));
  verifie('Choix 2 : compte supprimé après 3 ans sans connexion, avec un e-mail avant',
    t.includes("Un compte sans connexion depuis 3 ans est supprimé, après un e-mail d'avertissement."));
  verifie('Choix 3 : inscription à partir de 18 ans', t.includes("l'inscription est réservée aux personnes de 18 ans ou plus"));
  const phraseJsdelivr = 'La bibliothèque technique de connexion est chargée depuis jsDelivr';
  verifie('Choix 4 : la phrase sur jsDelivr n\'est plus affichée', !t.includes(phraseJsdelivr));
  verifie('Choix 4 : la phrase sur jsDelivr reste en commentaire dans le fichier',
    [...ml.matchAll(/<!--[\s\S]*?-->/g)].some((c) => c[0].includes(phraseJsdelivr)));
  verifie('La page s\'habille avec commun.css et les polices du site',
    /<link[^>]+href="commun\.css"/.test(actif) && /fonts\/fraunces-var\.woff2/.test(actif));

  // 6. Le repère de date
  if (!MISE_EN_LIGNE) {
    verifie(`Repère « ${REPERE} » présent (la page n'est pas encore en ligne)`, t.includes(`Dernière mise à jour : ${REPERE}`));
  } else {
    verifie(`Repère « ${REPERE} » remplacé par la vraie date`, !t.includes(REPERE));
    verifie('Date de mise à jour écrite avec son année', /Dernière mise à jour : [^.]*\b20\d\d\b/.test(t));
  }

  // Le texte est-il celui validé, mot pour mot ? Toujours contrôlé, par l'empreinte.
  const empreintePage = sha256(corps(ml));
  if (AFFICHE_EMPREINTE) console.log(`Empreinte du texte actuel (balise <main>, date masquée) : ${empreintePage}\n`);
  verifie('Texte mot pour mot celui validé le 03/11/2026 (empreinte sha256 de <main>, date mise à part)',
    corps(ml).length > 0 && empreintePage === EMPREINTE_TEXTE,
    `empreinte ${empreintePage}, attendue ${EMPREINTE_TEXTE}${BROUILLON ? '' : ' — pour voir où est l\'écart : --brouillon <fichier>'}`);

  // Option : où le texte s'écarte-t-il d'un brouillon ?
  if (BROUILLON) {
    let b = null; try { b = fs.readFileSync(BROUILLON, 'utf8'); } catch {}
    if (b === null) verifie('Texte identique au brouillon validé', false, `brouillon introuvable : ${BROUILLON}`);
    else {
      const a = corps(ml), c = corps(b);
      let k = 0; while (k < a.length && a[k] === c[k]) k++;
      if (sha256(c) !== EMPREINTE_TEXTE) console.log(`(Attention : ce brouillon n'est pas le texte validé le 03/11/2026, empreinte ${sha256(c)}.)\n`);
      verifie('Texte identique au brouillon donné (balise <main>, date mise à part)', a === c && a.length > 0,
        a === c ? '' : `écart au caractère ${k} : page « ${a.slice(k, k + 60)} » / brouillon « ${c.slice(k, k + 60)} »`);
    }
  }
}

// 2. Chaque page porte le lien, dans son pied de page
for (const p of PAGES) {
  const h = lire(p);
  const pied = h && (sansCommentairesHtml(h).match(/<footer[\s\S]*?<\/footer>/i) || [])[0];
  verifie(`${p} : lien « ${LIBELLE} » en pied de page`, pied && lienMentions.test(pied),
    h === null ? 'page absente' : (pied ? '' : 'pas de <footer>'));
}

// 3. La ligne sous le formulaire d'inscription d'app.html
const app = lire('app.html');
const inscription = app && (sansCommentairesHtml(app).match(/<form id="form-signup"[\s\S]*?<\/form>/) || [])[0];
verifie('app.html : ligne « Votre fiche, et le contact d\'un lieu, sont publics. » + lien, dans le formulaire d\'inscription',
  inscription && new RegExp(`Votre fiche, et le contact d'un lieu, sont publics\\.\\s*${lienMentions.source}`).test(inscription));

// 4. Plus aucune référence active à jsDelivr ni à un autre CDN (les commentaires sont tolérés)
const fichiers = [];
(function parcours(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const f = path.join(d, e.name);
    if (e.isDirectory()) parcours(f); else if (/\.(html|js|mjs|css)$/.test(e.name) && e.name !== 'banc-mentions.mjs') fichiers.push(f);
  }
})(RACINE);
const actifs = fichiers.filter((f) => CDN.test(sansCommentairesCode(sansCommentairesHtml(fs.readFileSync(f, 'utf8')))));
verifie('Aucune référence active à jsDelivr ou à un autre CDN', actifs.length === 0, actifs.map((f) => path.relative(RACINE, f)).join(', '));
const externes = [];
for (const p of PAGES) {
  const h = lire(p); if (!h) continue;
  const a = sansCommentairesCode(sansCommentairesHtml(h));
  for (const m of a.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/gi)) if (/^(https?:)?\/\//i.test(m[1])) externes.push(`${p} : ${m[1]}`);
  for (const m of a.matchAll(/\bimport\b[^'"`;]*?['"`]((?:https?:)?\/\/[^'"`]+)['"`]/g)) externes.push(`${p} : import ${m[1]}`);
  for (const m of a.matchAll(/\bimport\(\s*['"`]((?:https?:)?\/\/[^'"`]+)/g)) externes.push(`${p} : import() ${m[1]}`);
}
verifie('Aucun script chargé depuis un autre site', externes.length === 0, externes.join(' ; '));

// 5. Le fichier vendor correspond à LISEZMOI (empreinte sha384), et chaque page le charge avec cette empreinte
const lisezmoi = lire('vendor/LISEZMOI.md');
verifie('vendor/LISEZMOI.md existe', lisezmoi !== null);
const nomVendor = lisezmoi && (lisezmoi.match(/supabase-js-(2\.\d+\.\d+)\.js/) || [])[0];
const version = nomVendor && nomVendor.match(/2\.\d+\.\d+/)[0];
const empreinteNotee = lisezmoi && (lisezmoi.match(/sha384-[A-Za-z0-9+/]{64}/) || [])[0];
verifie('LISEZMOI donne une version 2.x figée, le fichier et son empreinte sha384', version && empreinteNotee,
  `version ${version || '?'}, empreinte ${empreinteNotee ? 'notée' : 'absente'}`);
verifie('LISEZMOI donne la source (paquet npm)', lisezmoi && /registry\.npmjs\.org|npm pack/.test(lisezmoi));
let empreinteReelle = null;
if (nomVendor) {
  try { empreinteReelle = 'sha384-' + crypto.createHash('sha384').update(fs.readFileSync(path.join(RACINE, 'vendor', nomVendor))).digest('base64'); } catch {}
}
verifie(`Le fichier vendor/${nomVendor || '…'} existe`, empreinteReelle !== null);
verifie('Son empreinte sha384 est celle notée dans LISEZMOI', empreinteReelle && empreinteReelle === empreinteNotee,
  empreinteReelle && empreinteReelle !== empreinteNotee ? `calculée ${empreinteReelle}` : '');
if (empreinteReelle) {
  const contenu = fs.readFileSync(path.join(RACINE, 'vendor', nomVendor), 'utf8');
  verifie('Le fichier vendor se suffit à lui-même (aucun import, aucun require)',
    !/\bimport\s*\(|\bimport\s+[\w{*]|\brequire\s*\(\s*['"]|importScripts/.test(contenu));
}
for (const p of PAGES_SUPABASE) {
  const h = lire(p); if (!h) { verifie(`${p} : charge supabase-js depuis vendor/`, false, 'page absente'); continue; }
  const a = sansCommentairesHtml(h);
  const balise = nomVendor && (a.match(new RegExp(`<script\\b[^>]*\\bsrc="vendor/${echappe(nomVendor)}"[^>]*>`)) || [])[0];
  const integ = balise && (balise.match(/\bintegrity="([^"]+)"/) || [])[1];
  verifie(`${p} : charge vendor/${nomVendor || '…'} avec integrity="${empreinteNotee ? empreinteNotee.slice(0, 18) + '…' : '…'}"`,
    balise && integ === empreinteNotee && integ === empreinteReelle, balise ? (integ ? 'empreinte différente' : 'sans integrity') : 'balise absente');
  verifie(`${p} : crée le client avec window.supabase.createClient`, /window\.supabase\b/.test(sansCommentairesCode(a)));
}

// 7. Vidéos d'artiste : rien n'est chargé chez YouTube ou Vimeo avant un clic (garde-fou statique ;
//    la preuve, c'est l'essai dans un vrai navigateur). Sinon les mentions deviennent fausses :
//    « aucun cookie de publicité ni de mesure d'audience », « deux prestataires techniques ».
const iframesEcrites = [], lecteursQuiSuivent = [];
for (const p of PAGES) {
  const h = lire(p); if (!h) continue;
  const a = sansCommentairesCode(sansCommentairesHtml(h));
  if (/<iframe\b/i.test(a)) iframesEcrites.push(p);
  // YouTube : jamais l'adresse www.youtube.com/embed. Vimeo : chaque player.vimeo.com/video/ suivi de ?dnt=1.
  const vimeoSansDnt = a.split('player.vimeo.com/video/').slice(1).some((suite) => !suite.slice(0, 40).includes('?dnt=1'));
  if (/(?:www\.|\/\/)youtube\.com\/embed/.test(a) || vimeoSansDnt) lecteursQuiSuivent.push(p);
}
verifie('Vidéos : aucune page n\'écrit de cadre <iframe> à l\'affichage', iframesEcrites.length === 0, iframesEcrites.join(', '));
const fiche = lire('fiche.html');
const ficheCode = fiche ? sansCommentairesCode(sansCommentairesHtml(fiche)) : '';
verifie('Vidéos : YouTube passe par youtube-nocookie.com, Vimeo reçoit dnt=1',
  lecteursQuiSuivent.length === 0 && /'https:\/\/www\.youtube-nocookie\.com\/embed\/'/.test(ficheCode) && /\?dnt=1/.test(ficheCode),
  lecteursQuiSuivent.join(', ') || 'adresse youtube-nocookie ou dnt=1 absente de fiche.html');
const iCree = ficheCode.indexOf("createElement('iframe')");
verifie('Vidéos : fiche.html ne crée le lecteur que dans un gestionnaire de clic',
  iCree > 0 && ficheCode.split("createElement('iframe')").length === 2
    && /(?:\.onclick\s*=|addEventListener\(\s*['"]click['"])[^}]{0,80}$/.test(ficheCode.slice(Math.max(0, iCree - 200), iCree)),
  iCree > 0 ? 'createElement(\'iframe\') hors d\'un .onclick' : 'createElement(\'iframe\') absent');

// Verdict
let rouges = 0;
for (const r of resultats) {
  if (!r.ok) rouges++;
  console.log(`${r.ok ? '  OK   ' : 'ROUGE  '} ${r.nom}${r.detail && !r.ok ? `\n          → ${r.detail}` : ''}`);
}
console.log(`\n${rouges === 0 ? 'VERT' : 'ROUGE'} : ${resultats.length - rouges}/${resultats.length} contrôles passent.`);
if (!MISE_EN_LIGNE) console.log(`Ce n'est PAS le feu vert de mise en ligne : le repère « ${REPERE} » est attendu ici.\n`
  + 'Juste avant le push : poser la date du jour, puis node banc-mentions.mjs --mise-en-ligne');
process.exit(rouges === 0 ? 0 : 1);
