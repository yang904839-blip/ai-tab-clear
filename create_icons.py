#!/usr/bin/env python3
"""
Simple icon creator without external dependencies.
Creates basic colored PNG icons for the Chrome extension.
"""

def create_simple_png(size, color_r, color_g, color_b, filename):
    """Create a simple PNG file with a colored square."""
    import struct
    import zlib
    
    # PNG signature
    png_signature = b'\x89PNG\r\n\x1a\n'
    
    # Create IHDR chunk (image header)
    width = height = size
    bit_depth = 8
    color_type = 6  # RGBA
    compression = 0
    filter_method = 0
    interlace = 0
    
    ihdr_data = struct.pack('>IIBBBBB', width, height, bit_depth, color_type,
                            compression, filter_method, interlace)
    ihdr_chunk = create_chunk(b'IHDR', ihdr_data)
    
    # Create image data
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # Filter type for this scanline
        for x in range(width):
            # Create a rounded square with gradient
            margin = size // 4
            if margin <= x < size - margin and margin <= y < size - margin:
                # Inside the square
                alpha = 255
            else:
                # Outside - transparent
                alpha = 0
            
            raw_data.extend([color_r, color_g, color_b, alpha])
    
    # Compress the data
    compressed_data = zlib.compress(bytes(raw_data), 9)
    idat_chunk = create_chunk(b'IDAT', compressed_data)
    
    # Create IEND chunk
    iend_chunk = create_chunk(b'IEND', b'')
    
    # Write PNG file
    with open(filename, 'wb') as f:
        f.write(png_signature)
        f.write(ihdr_chunk)
        f.write(idat_chunk)
        f.write(iend_chunk)

def create_chunk(chunk_type, data):
    """Create a PNG chunk."""
    import struct
    import zlib
    
    length = len(data)
    crc = zlib.crc32(chunk_type + data) & 0xffffffff
    return struct.pack('>I', length) + chunk_type + data + struct.pack('>I', crc)

# Create icons with different shades of purple/blue
icons = [
    (16, 99, 102, 241, 'icons/icon16.png'),   # #6366f1
    (48, 124, 58, 237, 'icons/icon48.png'),   # #7c3aed
    (128, 139, 92, 246, 'icons/icon128.png'), # #8b5cf6
]

for size, r, g, b, filename in icons:
    create_simple_png(size, r, g, b, filename)
    print(f'Created {filename}')

print('All icons created successfully!')
