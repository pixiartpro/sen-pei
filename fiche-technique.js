// Sén Péi — fiche technique et plan de scène (partagé par app.html et fiche.html)
// Données : colonne scene_artistes.fiche_technique (JSON, 12 000 octets au plus).
// Format v1 :
// { v:1, formule:'duo', musiciens:[{nom, place:'A1'}], entrees:[{source, branchement}],
//   retours:2, prises:2, sono:'lieu'|'artiste'|'a_voir', installation:30, set:'1 h 30', notes:'' }
// Le plan de scène est une grille de 3 × 3 cases : A = devant, B = milieu, C = fond ;
// 1 = jardin (gauche vu de la salle), 2 = centre, 3 = cour (droite vu de la salle).
// Aucune donnée personnelle : pas de téléphone ni d'adresse (le contact passe par Sén Péi).
(function () {
  const PLACES = {
    A1: 'Devant, gauche', A2: 'Devant, centre', A3: 'Devant, droite',
    B1: 'Milieu, gauche', B2: 'Milieu, centre', B3: 'Milieu, droite',
    C1: 'Fond, gauche', C2: 'Fond, centre', C3: 'Fond, droite'
  }
  const BRANCHEMENTS = ['Micro chant', 'Micro instrument', "Micro d'ampli", 'DI', 'DI stéréo', 'Sortie DJ', 'Autre']
  const SONO = { lieu: 'Le lieu fournit la sono', artiste: "J'apporte ma sono", a_voir: 'À voir ensemble' }
  const SETS = ['45 min', '1 h', '1 h 30', '2 h', '2 × 45 min', '3 × 45 min', '3 h']
  const FORMULES = { solo: 'Solo', duo: 'Duo', trio: 'Trio', groupe: 'Groupe', dj: 'DJ' }
  const m = (nom, place) => ({ nom, place })
  const e = (source, branchement) => ({ source, branchement })
  const MODELES = {
    solo: { musiciens: [m('Voix et guitare', 'A2')], entrees: [e('Voix', 'Micro chant'), e('Guitare', 'DI')], retours: 1, prises: 1, installation: 20, set: '2 × 45 min' },
    duo: { musiciens: [m('Voix et guitare', 'A1'), m('Voix et percussions', 'A3')],
      entrees: [e('Voix 1', 'Micro chant'), e('Voix 2', 'Micro chant'), e('Guitare', 'DI'), e('Kayamb / percussions', 'Micro instrument')], retours: 2, prises: 2, installation: 30, set: '2 × 45 min' },
    trio: { musiciens: [m('Voix et guitare', 'A1'), m('Voix et basse', 'A3'), m('Percussions / cajón', 'B2')],
      entrees: [e('Voix 1', 'Micro chant'), e('Voix 2', 'Micro chant'), e('Guitare', 'DI'), e('Basse', 'DI'), e('Percussions', 'Micro instrument')], retours: 3, prises: 3, installation: 40, set: '2 × 45 min' },
    groupe: { musiciens: [m('Chant', 'A2'), m('Guitare', 'A1'), m('Basse', 'B1'), m('Clavier', 'B3'), m('Batterie', 'C2')],
      entrees: [e('Grosse caisse', 'Micro instrument'), e('Caisse claire', 'Micro instrument'), e('Overhead gauche', 'Micro instrument'), e('Overhead droit', 'Micro instrument'),
        e('Basse', 'DI'), e('Guitare', "Micro d'ampli"), e('Clavier', 'DI stéréo'), e('Chant lead', 'Micro chant'), e('Chœur', 'Micro chant')], retours: 4, prises: 5, installation: 60, set: '2 × 45 min' },
    dj: { musiciens: [m('DJ', 'B2')], entrees: [e('Table DJ', 'Sortie DJ')], retours: 1, prises: 2, installation: 20, set: '3 h' }
  }
  function modele(formule) {
    const b = MODELES[formule] || MODELES.solo
    return JSON.parse(JSON.stringify({ v: 1, formule: MODELES[formule] ? formule : 'solo', sono: 'a_voir', notes: '', ...b }))
  }
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const txt = (s, n) => String(s ?? '').slice(0, n)
  const entier = (x, max) => { const n = parseInt(x, 10); return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0 }
  // Nettoie une fiche venue de la base ou du formulaire : formes et longueurs bornées
  function nettoyer(f) {
    if (!f || typeof f !== 'object' || Array.isArray(f)) return null
    const formule = Object.hasOwn(FORMULES, f.formule) ? f.formule : 'solo'
    return {
      v: 1, formule,
      musiciens: (Array.isArray(f.musiciens) ? f.musiciens : []).slice(0, 10)
        .map(x => ({ nom: txt(x && x.nom, 40).trim(), place: Object.hasOwn(PLACES, x && x.place) ? x.place : 'A2' })).filter(x => x.nom),
      entrees: (Array.isArray(f.entrees) ? f.entrees : []).slice(0, 24)
        .map(x => ({ source: txt(x && x.source, 40).trim(), branchement: BRANCHEMENTS.includes(x && x.branchement) ? x.branchement : 'Autre' })).filter(x => x.source),
      retours: entier(f.retours, 8), prises: entier(f.prises, 12),
      sono: Object.hasOwn(SONO, f.sono) ? f.sono : 'a_voir',
      installation: entier(f.installation, 180),
      set: SETS.includes(f.set) ? f.set : '',
      notes: txt(f.notes, 400).trim()
    }
  }
  // Plan de scène en SVG : la salle en bas, la scène vue d'en face
  function coupe(n) { // un nom en 2 lignes de 13 signes au plus
    const mots = txt(n, 26).split(/\s+/), l = ['']
    for (const w of mots) { if ((l[l.length - 1] + ' ' + w).trim().length > 13 && l[l.length - 1]) l.push(w); else l[l.length - 1] = (l[l.length - 1] + ' ' + w).trim() }
    return l.slice(0, 2).map(x => x.length > 13 ? x.slice(0, 12) + '…' : x)
  }
  function planSVG(f) {
    const x0 = 8, y0 = 8, cw = 112, ch = 76, W = x0 * 2 + cw * 3, H = y0 + ch * 3 + 62
    const parCase = {}
    ;(f.musiciens || []).forEach(x => { (parCase[x.place] ||= []).push(x.nom) })
    let cases = ''
    ;['C', 'B', 'A'].forEach((rang, ri) => [1, 2, 3].forEach((col, ci) => {
      const k = rang + col, x = x0 + ci * cw, y = y0 + ri * ch, tous = parCase[k] || [], noms = tous.length > 2 ? [tous[0], '+ ' + (tous.length - 1) + ' autres'] : tous
      cases += `<rect x="${x + 3}" y="${y + 3}" width="${cw - 6}" height="${ch - 6}" rx="9" fill="${noms.length ? '#F6BE54' : 'none'}" fill-opacity="${noms.length ? .25 : 0}" stroke="#7a5a43" stroke-opacity=".35" stroke-dasharray="${noms.length ? '0' : '3 4'}"/>`
      const lignes = noms.flatMap((n, i) => coupe(n).map(t => ({ t, i })))
      lignes.forEach((l, i) => {
        const yy = y + ch / 2 + (i - (lignes.length - 1) / 2) * 15 + 4.5 + (l.i ? 3 : 0)
        cases += `<text x="${x + cw / 2}" y="${yy}" text-anchor="middle" font-size="12.5" font-weight="600" fill="#1F0F09">${esc(l.t)}</text>`
      })
    }))
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Plan de scène" xmlns="http://www.w3.org/2000/svg" font-family="Inter, system-ui, sans-serif">
      <rect x="${x0}" y="${y0}" width="${cw * 3}" height="${ch * 3}" rx="12" fill="#FBF6F0" stroke="#7a5a43" stroke-width="1.5"/>
      ${cases}
      <text x="${x0 + 2}" y="${y0 + ch * 3 + 16}" font-size="10.5" fill="#7a5a43">◀ jardin</text>
      <text x="${x0 + cw * 1.5}" y="${y0 + ch * 3 + 16}" font-size="10.5" fill="#7a5a43" text-anchor="middle">fond de scène en haut</text>
      <text x="${x0 + cw * 3 - 2}" y="${y0 + ch * 3 + 16}" font-size="10.5" fill="#7a5a43" text-anchor="end">cour ▶</text>
      <rect x="${x0 + 40}" y="${y0 + ch * 3 + 26}" width="${cw * 3 - 80}" height="28" rx="14" fill="#1F0F09" fill-opacity=".08"/>
      <text x="${x0 + cw * 1.5}" y="${y0 + ch * 3 + 44}" text-anchor="middle" font-size="11.5" fill="#7a5a43" letter-spacing="2">PUBLIC</text>
    </svg>`
  }
  // Fiche complète en HTML (écran et impression). nom = nom de l'artiste.
  function fiche(f, nom) {
    f = nettoyer(f); if (!f) return ''
    const autonome = f.sono === 'artiste'
    const lignes = autonome ? '' : f.entrees.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x.source)}</td><td>${esc(x.branchement)}</td></tr>`).join('')
    const besoins = [
      ['Formule', FORMULES[f.formule] + (f.musiciens.length ? ` (${f.musiciens.length} sur scène)` : '')],
      ['Sono', SONO[f.sono]],
      autonome ? ['Retours', ''] : ['Retours', f.retours ? String(f.retours) : 'aucun'],
      ['Prises électriques', f.prises ? `${f.prises} sur scène` : ''],
      ['Installation', f.installation ? `${f.installation} min` : ''],
      ['Durée du set', f.set]
    ].filter(x => x[1])
    return `<div class="ft">
      <div class="ft-tete"><div class="ft-nom">${esc(nom || '')}</div><div class="ft-sous">Fiche technique</div></div>
      <div class="ft-plan">${planSVG(f)}</div>
      <dl class="ft-besoins">${besoins.map(b => `<div><dt>${esc(b[0])}</dt><dd>${esc(b[1])}</dd></div>`).join('')}</dl>
      ${lignes ? `<table class="ft-entrees"><caption>Entrées (liste de branchement)</caption><thead><tr><th>N°</th><th>Source</th><th>Branchement</th></tr></thead><tbody>${lignes}</tbody></table>` : ''}
      ${f.notes ? `<div class="ft-notes"><b>À savoir</b><br>${esc(f.notes)}</div>` : ''}
      <div class="ft-pied">Sén Péi · la scène péi</div>
    </div>`
  }
  // Style commun de la fiche (fond crème, lisible imprimé en noir et blanc)
  const CSS = `.ft{background:#FBF6F0;color:#1F0F09;border-radius:14px;padding:20px;font-size:14px;line-height:1.45}
    .ft-tete{display:flex;justify-content:space-between;align-items:baseline;gap:12px;border-bottom:1px solid #e2d6c8;padding-bottom:10px}
    .ft-nom{font-family:'Fraunces',serif;font-weight:700;font-size:22px;letter-spacing:-.01em}
    .ft-sous{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#7a5a43}
    .ft-plan svg{display:block;width:100%;height:auto;margin:12px 0 4px}
    .ft-besoins{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;margin:8px 0 12px}
    .ft-besoins dt{font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#7a5a43}
    .ft-besoins dd{margin:0;font-weight:600}
    .ft-entrees{width:100%;border-collapse:collapse;margin-top:6px}
    .ft-entrees caption{text-align:left;font-weight:600;margin-bottom:4px}
    .ft-entrees th,.ft-entrees td{border-bottom:1px solid #e2d6c8;padding:6px 4px;text-align:left}
    .ft-entrees th{font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#7a5a43;font-weight:600}
    .ft-entrees td:first-child{width:36px;font-variant-numeric:tabular-nums}
    .ft-notes{margin-top:12px;white-space:pre-wrap}
    .ft-pied{margin-top:14px;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#7a5a43;text-align:right}`
  window.FT = { PLACES, BRANCHEMENTS, SONO, SETS, FORMULES, modele, nettoyer, planSVG, fiche, CSS }
})()
