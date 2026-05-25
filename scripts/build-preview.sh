#!/bin/bash
echo "=== FitAI Preview Build ==="
npx eas build --platform android --profile preview --local
echo "Preview build complete."
