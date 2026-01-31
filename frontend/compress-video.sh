#!/bin/bash

# Video Compression Script for GameSpot
# Compresses background.mp4 from 23 MB to 3-5 MB

echo "🎬 GameSpot Video Compression Tool"
echo "===================================="
echo ""

VIDEO_PATH="./public/assets/videos/background.mp4"
OUTPUT_PATH="./public/assets/videos/background-compressed.mp4"
BACKUP_PATH="./public/assets/videos/background-original.mp4"

# Check if video exists
if [ ! -f "$VIDEO_PATH" ]; then
    echo "❌ Error: background.mp4 not found at $VIDEO_PATH"
    exit 1
fi

# Check original size
ORIGINAL_SIZE=$(du -h "$VIDEO_PATH" | cut -f1)
echo "📦 Original video size: $ORIGINAL_SIZE"
echo ""

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  FFmpeg not found!"
    echo ""
    echo "🔧 OPTION 1: Install FFmpeg"
    echo "   macOS:   brew install ffmpeg"
    echo "   Ubuntu:  sudo apt install ffmpeg"
    echo "   Windows: choco install ffmpeg"
    echo ""
    echo "🌐 OPTION 2: Use Online Tool"
    echo "   1. Go to: https://www.freeconvert.com/video-compressor"
    echo "   2. Upload: $VIDEO_PATH"
    echo "   3. Settings:"
    echo "      - Target Size: 3-5 MB"
    echo "      - Codec: H.264"
    echo "      - Resolution: 1920x1080"
    echo "      - Quality: Medium-High"
    echo "   4. Download compressed video"
    echo "   5. Replace: $VIDEO_PATH"
    echo ""
    exit 1
fi

echo "🔄 Compressing video with FFmpeg..."
echo "   This may take 1-2 minutes..."
echo ""

# Backup original
cp "$VIDEO_PATH" "$BACKUP_PATH"
echo "✅ Backed up original to: $BACKUP_PATH"

# Compress video
# - CRF 28: Good quality with smaller size (range: 18-28, lower = better quality)
# - Preset fast: Balance between speed and compression
# - Scale to 1920x1080 if larger
# - 30 fps for smooth playback
ffmpeg -i "$VIDEO_PATH" \
    -vcodec libx264 \
    -crf 28 \
    -preset fast \
    -vf "scale='min(1920,iw)':min(1080,ih):force_original_aspect_ratio=decrease" \
    -r 30 \
    -an \
    "$OUTPUT_PATH" \
    -y \
    -loglevel error

if [ $? -eq 0 ]; then
    COMPRESSED_SIZE=$(du -h "$OUTPUT_PATH" | cut -f1)
    echo ""
    echo "✅ Compression successful!"
    echo ""
    echo "📊 Results:"
    echo "   Original:   $ORIGINAL_SIZE"
    echo "   Compressed: $COMPRESSED_SIZE"
    echo "   Saved:      ~$(echo "scale=0; 100 - ($(stat -f%z "$OUTPUT_PATH") * 100 / $(stat -f%z "$VIDEO_PATH"))" | bc)%"
    echo ""
    echo "📁 Files:"
    echo "   Compressed: $OUTPUT_PATH"
    echo "   Backup:     $BACKUP_PATH"
    echo ""
    read -p "🔄 Replace original with compressed version? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        mv "$OUTPUT_PATH" "$VIDEO_PATH"
        echo "✅ Original replaced with compressed version"
        echo "💾 Original backed up at: $BACKUP_PATH"
    else
        echo "ℹ️  Compressed video saved as: $OUTPUT_PATH"
        echo "   Manually replace when ready"
    fi
else
    echo "❌ Compression failed!"
    exit 1
fi

echo ""
echo "🎉 Done! Deploy to Railway to see improvements."
