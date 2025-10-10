# Génération des icônes pour la PWA

Pour que votre application soit installable, vous devez créer les icônes aux différentes tailles.

## Option 1 : Utiliser un générateur en ligne (RECOMMANDÉ)

1. **Créez un logo carré** (minimum 512x512px) pour votre association
   - Format PNG avec fond transparent ou de couleur
   - Vous pouvez utiliser Canva, Figma, ou Paint.NET

2. **Générez toutes les tailles automatiquement** :
   - Allez sur : https://www.pwabuilder.com/imageGenerator
   - OU : https://favicon.io/favicon-converter/
   - OU : https://realfavicongenerator.net/

3. **Téléchargez et placez les icônes** dans le dossier `icons/` de votre projet

## Option 2 : Utiliser un outil en ligne de commande

### Avec npm (Node.js)

```bash
# Installer pwa-asset-generator
npm install -g pwa-asset-generator

# Générer toutes les icônes depuis votre image source
pwa-asset-generator logo.png ./icons --icon-only --padding "10%" --background "#1a1a2e"
```

## Option 3 : Créer manuellement avec un logiciel

### Avec GIMP (gratuit)
1. Ouvrez votre logo
2. Image → Échelle et taille de l'image
3. Créez les tailles suivantes :
   - 16x16, 32x32, 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
4. Exportez chaque taille : `Fichier → Exporter sous → icon-XXxXX.png`

### Avec Photoshop
1. Ouvrez votre logo
2. Utilisez "Enregistrer pour le web" pour chaque taille
3. Nommez selon le format : `icon-XXxXX.png`

## Structure du dossier icons/

Créez un dossier `icons/` à la racine du projet avec ces fichiers :

```
GDJ/
├── icons/
│   ├── icon-16x16.png
│   ├── icon-32x32.png
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   └── icon-512x512.png
```

## Icône temporaire pour tester

Si vous voulez tester la PWA immédiatement, vous pouvez créer une icône simple :

### Script Python pour générer des icônes de test

```python
from PIL import Image, ImageDraw, ImageFont

# Créer une icône simple avec fond doré et texte "GDJ"
sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512]

for size in sizes:
    img = Image.new('RGB', (size, size), color='#ffd700')
    draw = ImageDraw.Draw(img)

    # Ajouter le texte "GDJ" au centre
    try:
        font_size = size // 3
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        font = ImageFont.load_default()

    text = "GDJ"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    x = (size - text_width) // 2
    y = (size - text_height) // 2

    draw.text((x, y), text, fill='#1a1a2e', font=font)

    img.save(f'icons/icon-{size}x{size}.png')

print("Icônes générées avec succès !")
```

### Ou utilisez ce code JavaScript dans la console du navigateur

```javascript
// Créer un canvas
const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Fond doré
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(0, 0, size, size);

  // Texte GDJ
  ctx.fillStyle = '#1a1a2e';
  ctx.font = `bold ${size/3}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GDJ', size/2, size/2);

  // Télécharger l'image
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `icon-${size}x${size}.png`;
    a.click();
  });
});
```

## Vérification

Une fois les icônes créées :

1. Déployez sur Netlify
2. Ouvrez l'app sur mobile (Chrome Android ou Safari iOS)
3. Vous devriez voir l'option "Ajouter à l'écran d'accueil"
4. Sur desktop Chrome, vous verrez une icône d'installation dans la barre d'adresse

## Ressources utiles

- **PWA Builder** : https://www.pwabuilder.com/
- **Générateur d'icônes** : https://favicon.io/
- **Documentation PWA** : https://web.dev/progressive-web-apps/
- **Test Lighthouse** : Dans DevTools Chrome (F12) → onglet "Lighthouse"
