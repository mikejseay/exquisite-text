#!/bin/bash

function scan_package() {
  local root_dir="$1"
  local output_file="$2"

  find "$root_dir" -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r filename; do
    # Minify content using sed and write to output file with comment
    cat "$filename" | sed -r 's/\s+//g' | tee -a "$output_file" > /dev/null
    echo "// $(realpath --relative-to="$root_dir" "$filename")" >> "$output_file"
  done
}

# Example usage
root_dir="."
output_file="minified.txt"
scan_package "$root_dir" "$output_file"