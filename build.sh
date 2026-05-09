#!/usr/bin/env bash

set -o errexit

echo "Removing old static build..."
rm -rf backend/static

echo "Installing frontend dependencies..."
cd frontend

npm install

echo "Building frontend..."
npm run build

cd ..

echo "Checking generated files..."
ls backend/static
ls backend/static/assets

echo "Installing backend dependencies..."
pip install -r requirements.txt