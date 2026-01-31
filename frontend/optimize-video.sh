#!/bin/bash

echo "🎬 GameSpot Video Optimization Tool"
echo "===================================="
echo ""

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg is not installed!"
    echo ""
    echo "📦 Install ffmpeg:"
    echo "   macOS: brew install ffmpeg"
    echo "   Or use online tool: https://www.freeconvert.com/video-compressor"
    echo ""
    exit 1
fi

VIDEO_PATH="public/assets/videos/background.mp4"

if [ ! -f "$VIDEO_PATH" ]; then
    echo "❌ Video not found at: $VIDEO_PATH"
    exit 1
fi

echo "📊 Current video size:"
ls -lh "$VIDEO_PATH" | awk '{print $5}'
echo ""

echo "🔄 Compressing video (this may take a few minutes)..."
ffmpeg -i "$VIDEO_PATH" \
    -vcodec h264 \
    -crf 28 \
    -preset fast \
    -vf "scale=1920:1080" \
    -movflags +faststart \
    "public/assets/videos/background-optimized.mp4"

echo ""
echo "✅ Optimization complete!"
echo ""
echo "📊 New video size:"
ls -lh "public/assets/videos/background-optimized.mp4" | awk '{print $5}'
echo ""
echo "📝 Next steps:"
echo "1. Test the optimized video"
echo "2. If quality is good, replace the original:"
echo "   mv public/assets/videos/background-optimized.mp4 public/assets/videos/background.mp4"
echo "3. Commit and push the changes"
