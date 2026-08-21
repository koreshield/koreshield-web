#!/bin/bash
cd src

# Function to run sed on a specific folder or file
replace_colors() {
    find "$1" -type f \( -name "*.tsx" -o -name "*.ts" \) -print0 | while IFS= read -r -d '' file; do
        # We need to be careful with things like text-blue-500.
        # Let's replace the whole class name part.
        
        # primary
        sed -i '' 's/emerald-500/primary/g' "$file"
        sed -i '' 's/emerald-400/primary/g' "$file"
        sed -i '' 's/emerald-300/primary/g' "$file"
        sed -i '' 's/electric-green/primary/g' "$file"
        
        # primary-dark
        sed -i '' 's/emerald-600/primary-dark/g' "$file"
        sed -i '' 's/emerald-700/primary-dark/g' "$file"
        sed -i '' 's/emerald-900/primary-dark/g' "$file"
        sed -i '' 's/emerald-bright/primary-dark/g' "$file"
        
        # secondary
        sed -i '' 's/sky-500/secondary/g' "$file"
        sed -i '' 's/sky-400/secondary/g' "$file"
        sed -i '' 's/sky-300/secondary/g' "$file"
        sed -i '' 's/blue-400/secondary/g' "$file"
        sed -i '' 's/blue-500/secondary/g' "$file"
        sed -i '' 's/blue-600/secondary/g' "$file"
        sed -i '' 's/blue-700/secondary/g' "$file"
        sed -i '' 's/cyan-400/secondary/g' "$file"
        sed -i '' 's/cyan-500/secondary/g' "$file"
        sed -i '' 's/indigo-400/secondary/g' "$file"
        sed -i '' 's/indigo-500/secondary/g' "$file"
        
        # secondary-dark
        sed -i '' 's/violet-400/secondary-dark/g' "$file"
        sed -i '' 's/violet-500/secondary-dark/g' "$file"
        sed -i '' 's/purple-400/secondary-dark/g' "$file"
        sed -i '' 's/purple-500/secondary-dark/g' "$file"
        sed -i '' 's/purple-600/secondary-dark/g' "$file"
        
        # specials
        sed -i '' 's/blue-50\([^0-9]\)/secondary\/5\1/g' "$file"
        sed -i '' 's/blue-50$/secondary\/5/g' "$file"
        sed -i '' 's/blue-100/secondary\/10/g' "$file"
        sed -i '' 's/blue-900/secondary-dark\/20/g' "$file"
        sed -i '' 's/blue-950/secondary-dark\/30/g' "$file"
        
        sed -i '' 's/purple-50\([^0-9]\)/secondary-dark\/5\1/g' "$file"
        sed -i '' 's/purple-50$/secondary-dark\/5/g' "$file"
        sed -i '' 's/purple-100/secondary-dark\/10/g' "$file"
        sed -i '' 's/purple-900/secondary-dark\/20/g' "$file"
        sed -i '' 's/purple-950/secondary-dark\/30/g' "$file"

        # primary-dark for teal
        sed -i '' 's/teal-400/primary-dark/g' "$file"
        sed -i '' 's/teal-500/primary-dark/g' "$file"

    done
}

replace_colors "components"
replace_colors "pages"
