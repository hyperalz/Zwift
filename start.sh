#!/bin/bash
# Simple script to start the local server

echo "Starting Zwift Route Tracker..."
echo "Open http://localhost:8000 in your browser"
echo "Press Ctrl+C to stop the server"
echo ""

python3 -m http.server 8000

