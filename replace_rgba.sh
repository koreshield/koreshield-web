#!/bin/bash
cd src

# Function to run sed on a specific folder or file
replace_rgba() {
    find "$1" -type f \( -name "*.tsx" -o -name "*.ts" \) -print0 | while IFS= read -r -d '' file; do
        # 16,185,129 (emerald) -> 169,198,82 (primary)
        sed -i '' 's/16,185,129/169,198,82/g' "$file"
        
        # 59,130,246 (blue) -> 98,98,198 (secondary)
        sed -i '' 's/59,130,246/98,98,198/g' "$file"
        
        # 14,165,233 (sky) -> 98,98,198 (secondary)
        sed -i '' 's/14,165,233/98,98,198/g' "$file"
        
        # 168,85,247 (purple) -> 69,69,139 (secondary-dark)
        sed -i '' 's/168,85,247/69,69,139/g' "$file"
        
        # 245,158,11 (amber) -> 122,139,57 (primary-dark)
        sed -i '' 's/245,158,11/122,139,57/g' "$file"
        
        # 225,29,72 (rose) -> 198,105,82 (destructive-rust)
        sed -i '' 's/225,29,72/198,105,82/g' "$file"

        # 3b82f6 -> 6262c6
        sed -i '' 's/3b82f6/6262c6/g' "$file"
        
        # 76B900 -> A9C652
        sed -i '' 's/76B900/A9C652/g' "$file"
        
    done
}

replace_rgba "components"
replace_rgba "pages"
