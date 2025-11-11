# Contributing to Emotion Recognition System

First off, thank you for considering contributing to the Emotion Recognition System! It's people like you that make this project better.

## 🤝 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## 🚀 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** to demonstrate the steps
- **Describe the behavior you observed** and what you expected
- **Include screenshots** if applicable
- **Include your environment details** (OS, browser, versions)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful**
- **List any alternative solutions** you've considered

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Ensure tests pass** for both frontend and backend
6. **Write a clear commit message**

## 💻 Development Setup

### Prerequisites
- Node.js 16+
- Python 3.9+
- PostgreSQL 16+
- Git

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python init_db.py
python run.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 📝 Coding Standards

### Python (Backend)
- Follow PEP 8 style guide
- Use type hints where applicable
- Write docstrings for functions and classes
- Keep functions small and focused
- Use meaningful variable names

Example:
```python
def calculate_wellness_score(emotions: Dict[str, float]) -> float:
    """
    Calculate overall wellness score based on emotion distribution.
    
    Args:
        emotions: Dictionary of emotion names to confidence values
        
    Returns:
        Wellness score between 0 and 100
    """
    # Implementation here
    pass
```

### TypeScript (Frontend)
- Follow Airbnb React/TypeScript style guide
- Use functional components with hooks
- Use TypeScript interfaces for props
- Keep components focused and reusable
- Use meaningful component and variable names

Example:
```typescript
interface EmotionData {
  emotion: string;
  confidence: number;
  timestamp: string;
}

const EmotionCard: React.FC<{ data: EmotionData }> = ({ data }) => {
  // Implementation here
};
```

### Commit Messages
Follow the conventional commits specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Example:
```
feat: add emotion trend analysis chart
fix: resolve camera permission issue on iOS
docs: update API documentation for /analytics endpoint
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
pytest --cov=app tests/  # With coverage
```

### Frontend Tests
```bash
cd frontend
npm test
npm test -- --coverage  # With coverage
```

### Manual Testing Checklist
- [ ] Camera permissions work correctly
- [ ] Emotion detection is accurate
- [ ] Analytics charts display properly
- [ ] Export (CSV/PDF) downloads correctly
- [ ] Authentication flow works
- [ ] Responsive design on mobile
- [ ] Dark/light theme switches properly

## 📦 Release Process

1. Update version in `package.json` and `__init__.py`
2. Update CHANGELOG.md
3. Create a git tag: `git tag v1.x.x`
4. Push tag: `git push origin v1.x.x`
5. Create GitHub release with notes

## 🐛 Debugging Tips

### Backend Debugging
- Use `print()` statements or Python debugger (`pdb`)
- Check Flask logs in terminal
- Verify database queries in PostgreSQL

### Frontend Debugging
- Use React DevTools browser extension
- Check browser console for errors
- Use Network tab to inspect API calls
- Verify state updates with console.log

## 📚 Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://reactjs.org/docs)
- [face-api.js Documentation](https://github.com/justadudewhohacks/face-api.js)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## ❓ Questions?

Feel free to open an issue with the `question` label or reach out to the maintainers.

## 🎉 Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort!

---

**Happy Coding! 🚀**
