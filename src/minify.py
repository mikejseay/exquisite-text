import os
import re

def scan_package(root_dir, output_file):
  with open(output_file, 'w') as output:
    for root, _, files in os.walk(root_dir):
      for filename in files:
        if filename.endswith('.ts') or filename.endswith('.tsx'):
          with open(os.path.join(root, filename), 'r') as f:
            content = f.read()
            # Minify content by removing spaces and newlines
            content = re.sub(r'\s+', '', content)
            # Add comment with directory and filename
            output.write(f'// {os.path.relpath(root, root_dir)}/{filename}\n')
            output.write(content)
            output.write('\n')

# Example usage
root_dir = '.'
output_file = 'minified.txt'
scan_package(root_dir, output_file)
