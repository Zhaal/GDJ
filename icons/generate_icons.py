#!/usr/bin/env python3
"""
Script pour générer les icônes de différentes tailles à partir de gdji.png
"""

from PIL import Image
import os

# Chemin de l'image source
source_image = "gdji.png"

# Tailles d'icônes à générer
sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512]

def generate_icons():
    """Génère toutes les icônes à partir de l'image source"""

    # Vérifier que l'image source existe
    if not os.path.exists(source_image):
        print(f"Erreur: {source_image} n'existe pas!")
        return

    # Ouvrir l'image source
    print(f"Ouverture de {source_image}...")
    img = Image.open(source_image)

    # Convertir en RGBA si nécessaire
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    print(f"Image source: {img.size[0]}x{img.size[1]} pixels")

    # Générer chaque taille
    for size in sizes:
        output_filename = f"icon-{size}x{size}.png"
        print(f"Génération de {output_filename}...")

        # Redimensionner avec antialiasing pour une meilleure qualité
        resized = img.resize((size, size), Image.Resampling.LANCZOS)

        # Sauvegarder
        resized.save(output_filename, 'PNG', optimize=True)
        print(f"  OK - {output_filename} cree ({size}x{size})")

    print("\nToutes les icones ont ete generees avec succes!")

if __name__ == "__main__":
    generate_icons()
