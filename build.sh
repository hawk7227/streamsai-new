#!/bin/sh
cd "$(dirname "$0")" && npx esbuild src/main.jsx --bundle --minify --outdir=dist --public-path=/dist --loader:.js=jsx --loader:.webp=file --loader:.woff2=file --loader:.woff=file --define:process.env.NODE_ENV='"production"'
