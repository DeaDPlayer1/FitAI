#!/bin/bash
echo "=== FitAI Android Production Build ==="
echo "Building APK..."
npx eas build --platform android --profile production --local
echo "Build complete! APK is ready."
