import re

s = open('assets/logo.svg', encoding='utf-8').read()

# Find all <image> elements
imgs = list(re.finditer(r'<image [^>]+>', s, re.DOTALL))
print(f'Total images: {len(imgs)}')
for i, m in enumerate(imgs):
    tag = m.group()
    has_filter = 'filter=' in tag
    href_preview = re.search(r'xlink:href="([^"]{0,40})', tag)
    print(f'Image {i}: filter={has_filter}, href_start={href_preview.group(1) if href_preview else "?"}')

# Strategy:
# Image 0: no filter — this is the one showing (red on white) — ADD white-removal filter
# Image 1: has filter 7d8662eefc (now broken) — REMOVE it entirely to avoid duplication

# Step 1: Add white-removal filter definition
# This filter keeps RGB colors but sets alpha = 1 - luminance (white becomes transparent)
white_removal_filter = '<filter id="removeWhite" x="0%" y="0%" width="100%" height="100%"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -0.2126 -0.7152 -0.0722 0 1" color-interpolation-filters="sRGB"/></filter>'

# Insert the new filter definition in <defs>
s = s.replace('<defs>', '<defs>' + white_removal_filter, 1)

# Step 2: Add filter to Image 0 (the one without filter)
def add_filter_to_image0(s):
    imgs = list(re.finditer(r'<image [^>]+>', s, re.DOTALL))
    for m in imgs:
        tag = m.group()
        if 'filter=' not in tag:
            # Add filter attribute before the closing >
            new_tag = tag[:-1] + ' filter="url(#removeWhite)">'
            s = s[:m.start()] + new_tag + s[m.end():]
            print(f'Added filter to: {new_tag[:100]}...')
            return s
    return s

s = add_filter_to_image0(s)

# Step 3: Remove Image 1 (the one with the broken filter) to avoid duplicate
imgs = list(re.finditer(r'<image [^>]+>', s, re.DOTALL))
for m in imgs:
    tag = m.group()
    if 'id="7d8662eefc"' in tag or 'filter="url(#7d8662eefc)"' in tag:
        s = s[:m.start()] + s[m.end():]
        print('Removed broken Image 1')
        break

open('assets/logo.svg', 'w', encoding='utf-8').write(s)
print('Done! logo.svg updated.')
