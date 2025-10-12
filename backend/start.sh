#!/bin/bash

# Render Startup Script - Auto-initialize database on first run
# This script runs before starting the Gunicorn server

echo "=========================================="
echo "🚀 RENDER STARTUP SCRIPT"
echo "=========================================="
echo ""

# Check if running on Render
if [ -n "$RENDER" ]; then
    echo "✅ Running on Render platform"
    echo "📍 Service: $RENDER_SERVICE_NAME"
    echo ""
fi

# Initialize database with sample data
echo "🗄️  Checking database initialization..."
python auto_init.py

# Check if initialization was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database initialization complete!"
    echo ""
else
    echo ""
    echo "⚠️  Database initialization had issues (may already be initialized)"
    echo ""
fi

echo "🚀 Starting Gunicorn server..."
echo "=========================================="
echo ""

# Start Gunicorn
exec gunicorn -w 4 -b 0.0.0.0:$PORT app:app
