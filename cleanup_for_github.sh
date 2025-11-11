#!/bin/bash

# Cleanup script for preparing project for GitHub upload
# This script removes unnecessary files and prepares the repository

echo "🧹 Cleaning up project for GitHub upload..."

# Remove temporary documentation files
echo "Removing temporary documentation files..."
rm -f DEMO_CHECKLIST.md
rm -f EXPORT_FIX_SUMMARY.md
rm -f MASTER_PROMPTS_COMPLETION.md
rm -f POSTGRESQL_SETUP.md
rm -f PRESENTATION_GUIDE.md
rm -f PROJECT_SUMMARY.md
rm -f SLIDE_CONTENT.md

# Remove Word documents
echo "Removing Word documents..."
rm -f Code_Documentation.docx
rm -f Emotion_Recognition_Essential_Code.docx

# Remove Python script files used for documentation
echo "Removing documentation generation scripts..."
rm -f create_code_documentation.py
rm -f create_concise_doc.py

# Remove entire docs folder with all SWE practicals and diagrams
echo "Removing entire docs folder..."
rm -rf docs/

# Remove .DS_Store files
echo "Removing .DS_Store files..."
find . -name ".DS_Store" -delete

# Remove Python cache files
echo "Removing Python cache files..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find . -name "*.pyc" -delete
find . -name "*.pyo" -delete
find . -name "*.pyd" -delete

# Remove node_modules if exists (will be reinstalled)
if [ -d "frontend/node_modules" ]; then
    echo "Note: frontend/node_modules exists (excluded by .gitignore)"
fi

# Remove build directories
if [ -d "frontend/build" ]; then
    echo "Note: frontend/build exists (excluded by .gitignore)"
fi

# Remove frontend coverage directory
if [ -d "frontend/coverage" ]; then
    echo "Removing frontend/coverage directory..."
    rm -rf frontend/coverage/
fi

# Replace old README with new one
if [ -f "README_NEW.md" ]; then
    echo "Updating README.md..."
    mv README_NEW.md README.md
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📋 Files remaining in project:"
echo "  ✓ .gitignore"
echo "  ✓ README.md"
echo "  ✓ LICENSE"
echo "  ✓ CONTRIBUTING.md"
echo "  ✓ setup_postgres.sh"
echo "  ✓ backend/ (Flask application)"
echo "  ✓ frontend/ (React application)"
echo ""
echo "📋 Next steps:"
echo "1. Review the changes: git status"
echo "2. Add files: git add ."
echo "3. Commit: git commit -m 'Initial commit: Emotion Recognition System'"
echo "4. Add remote: git remote add origin https://github.com/hridaydevkar/EmotionRecognitionSystem.git"
echo "5. Push to GitHub: git push -u origin main"
echo ""
echo "🎉 Your project is ready for GitHub!"
