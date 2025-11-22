#!/usr/bin/env python3
"""
Generate image manifest for auto-masonry gallery
Run this script to automatically discover all images in a folder
"""

import os
import json
from pathlib import Path

def generate_image_manifest(folder_path, output_file='manifest.json'):
    """Generate a JSON manifest of all images in a folder"""
    
    # Supported image extensions
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'}
    
    # Get all image files
    folder = Path(folder_path)
    if not folder.exists():
        print(f"Error: Folder {folder_path} does not exist")
        return
    
    images = []
    for file in folder.iterdir():
        if file.is_file() and file.suffix.lower() in image_extensions:
            # Skip system files like .DS_Store
            if not file.name.startswith('.'):
                images.append(file.name)
    
    # Sort images naturally
    images.sort()
    
    # Create manifest
    manifest = {
        "folder": str(folder.name),
        "total_images": len(images),
        "generated": "auto",
        "images": images
    }
    
    # Write manifest file
    manifest_path = folder / output_file
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print(f"Generated manifest with {len(images)} images:")
    for img in images:
        print(f"  - {img}")
    print(f"Manifest saved to: {manifest_path}")

if __name__ == "__main__":
    # Generate manifest for Nice photos
    nice_folder = "images/nice"
    generate_image_manifest(nice_folder)
    
    # Generate manifest for Val Thorens photos
    val_thorens_folder = "images/val_thorens"
    generate_image_manifest(val_thorens_folder)
    
    # You can add other folders here
    # generate_image_manifest("images/netherlands")
