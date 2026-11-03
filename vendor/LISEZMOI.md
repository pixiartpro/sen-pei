# vendor/ — bibliothèques hébergées sur le site

Sén Péi ne charge aucun script depuis un autre site. La bibliothèque de connexion à la base
(supabase-js) est copiée ici, à une version figée. Ainsi, aucun visiteur n'envoie l'adresse de
son appareil à un service de diffusion de fichiers (choix 4 des mentions légales, validé le
mardi 03/11/2026).

## supabase-js

- Fichier : `supabase-js-2.118.0.js`
- Version : 2.118.0 (figée), publiée sur npm le jeudi 15/10/2026
- Source : le paquet npm `@supabase/supabase-js@2.118.0`, récupéré avec
  `npm pack @supabase/supabase-js@2.118.0`
  (https://registry.npmjs.org/@supabase/supabase-js/-/supabase-js-2.118.0.tgz).
  Le fichier est `package/dist/umd/supabase.js`, copié tel quel, sans retouche.
- Empreinte du paquet, vérifiée le mardi 03/11/2026 contre celle du registre npm :
  `sha512-FxI8UXMVC2UG7IkeiI8fuQZqq2oI3JeSuN8MPIC2RLVaoEAxKS0nqE6kii9Ewpq8f9gNPM6git1Y8f0vN/QLFw==`
- Empreinte du fichier (sha384, la même que dans l'attribut `integrity` des pages) :
  `sha384-TcHRA3zBbn+Lexh5n+Oil4guNPOS3rjNDpGRAN46u/s/mB2IZ50ceC6TYDU2yvgK`
- Licence : MIT, voir `supabase-js-LICENSE.txt`.

Le fichier se suffit à lui-même : il n'importe rien d'un autre site. Il crée l'objet
`window.supabase`. Les pages `app.html`, `decouvrir.html` et `fiche.html` le chargent ainsi :

```html
<script src="vendor/supabase-js-2.118.0.js" integrity="sha384-TcHRA3zBbn+Lexh5n+Oil4guNPOS3rjNDpGRAN46u/s/mB2IZ50ceC6TYDU2yvgK"></script>
<script type="module">
const { createClient } = window.supabase
</script>
```

## Changer de version

1. `npm pack @supabase/supabase-js@<version>` dans un dossier vide, puis comparer l'empreinte
   `sha512` du fichier `.tgz` à celle du registre (`npm view @supabase/supabase-js@<version> dist.integrity`).
2. Copier `package/dist/umd/supabase.js` ici, sous le nom `supabase-js-<version>.js`, et supprimer l'ancien.
3. Calculer la nouvelle empreinte :
   `echo "sha384-$(openssl dgst -sha384 -binary supabase-js-<version>.js | openssl base64 -A)"`
4. La reporter dans ce fichier et dans l'attribut `integrity` des trois pages.
5. Lancer `node banc-mentions.mjs` à la racine du dépôt : il doit être vert. Ce vert-là ne vaut pas
   feu vert de mise en ligne (voir ci-dessous).

## Avant chaque mise en ligne (push)

Le contrôle d'avant le push est :

```
node banc-mentions.mjs --mise-en-ligne
```

Il se lance après avoir remplacé, dans `mentions-legales.html`, le repère
« [date de mise en ligne] » par la date du jour, avec son année. Sans `--mise-en-ligne`, le banc
est vert alors que le repère est encore là : c'est voulu pendant le travail, mais une page avec ce
repère ne doit jamais être mise en ligne.

Le banc contrôle à chaque lancement que le texte des mentions est mot pour mot celui validé le
mardi 03/11/2026, grâce à une empreinte inscrite dans `banc-mentions.mjs` (aucun fichier extérieur
n'est nécessaire). `--brouillon <fichier>` sert seulement à montrer où se trouve un écart. Si
Guillaume valide un nouveau texte, `node banc-mentions.mjs --empreinte` donne la nouvelle empreinte
à reporter dans le banc.

Les vidéos des fiches artistes ne se chargent qu'au clic sur « Lire la vidéo » (YouTube par
youtube-nocookie.com, Vimeo avec dnt=1). Avant ce clic, aucune requête ne part chez YouTube ou
Vimeo. Le banc le surveille aussi.
