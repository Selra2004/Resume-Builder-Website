# 🤖 Hybrid Job Recommendation Service

Advanced machine learning-powered job recommendation system for the ACC Job Portal platform.

## 🌟 Features

### 🎯 **Hybrid Algorithm**
- **Content-Based Filtering** (40%): Matches user skills, education, and experience
- **Knowledge Matching** (60%): Advanced semantic similarity using NLP

### 🧠 **Machine Learning Capabilities**
- **BERT Embeddings**: Deep semantic understanding using sentence transformers
- **TF-IDF Fallback**: Reliable text similarity when advanced models unavailable
- **Skill Extraction**: Intelligent parsing of resume skills and experience
- **Course Mapping**: Maps academic courses to job categories

### 📊 **Data Sources**
- **User Profiles**: Demographics, student type, course information
- **Resume Data**: Only uses completed resumes for accurate matching
- **Job Details**: Comprehensive job descriptions and requirements
- **Application History**: Learning from user preferences (optional)

### ⚡ **Performance Features**
- **Async Processing**: High-performance async database operations
- **Caching**: Smart caching of embeddings and computations
- **Fallback System**: Graceful degradation when ML models unavailable
- **Batch Processing**: Efficient handling of multiple recommendations

## 🚀 Quick Start

### Option 1: Automatic Setup (Windows)
```bash
# Clone and navigate to recommendation service
cd recommendation_service

# Run the startup script
start.bat
```

### Option 2: Automatic Setup (Linux/Mac)
```bash
# Clone and navigate to recommendation service
cd recommendation_service

# Make script executable and run
chmod +x start.sh
./start.sh
```

### Option 3: Manual Setup
```bash
# 1. Create virtual environment
python -m venv venv

# 2. Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 3. Install minimal requirements first
pip install -r requirements-minimal.txt

# 4. Install ML requirements (optional, for advanced features)
pip install -r requirements-ml.txt

# 5. Start the service
python main.py
```

## 📋 Requirements

### System Requirements
- **Python 3.8+**
- **MySQL Database** (for ACC Portal)
- **2GB+ RAM** (4GB+ recommended with ML models)

### Dependencies
- **Core**: FastAPI, aiomysql, pydantic
- **ML**: scikit-learn, numpy, pandas
- **Advanced**: sentence-transformers, torch (optional)

## ⚙️ Configuration

### Environment Variables
```bash
# Server Configuration
HOST=0.0.0.0
PORT=5001
DEBUG=false

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=acc_portal

# Algorithm Weights
CONTENT_WEIGHT=0.4
KNOWLEDGE_WEIGHT=0.6

# Feature Flags
USE_SEMANTIC_SIMILARITY=true
ENABLE_POPULARITY_BOOST=true
ENABLE_DIVERSITY_BOOST=true
```

### Algorithm Tuning
```bash
# Content-Based Scoring Weights (should sum to 1.0)
SKILLS_WEIGHT=0.30      # 30% - User skills matching
EDUCATION_WEIGHT=0.25   # 25% - Education level compatibility  
EXPERIENCE_WEIGHT=0.20  # 20% - Work experience alignment
COURSE_WEIGHT=0.15      # 15% - Academic course relevance
LOCATION_WEIGHT=0.10    # 10% - Location preference

# Performance Settings
MIN_RECOMMENDATION_SCORE=0.3  # Minimum score threshold
MAX_RECOMMENDATIONS=50        # Maximum jobs to analyze
BATCH_SIZE=32                # Processing batch size
```

## 📡 API Endpoints

### Health Check
```http
GET /
```
Returns service health status and configuration.

### Get Recommendations
```http
POST /recommendations
Content-Type: application/json

{
  "user_id": 123,
  "limit": 10,
  "include_reasons": true
}
```

### Debug User Profile
```http
GET /user/{user_id}/profile
```
Returns user profile data for debugging.

### Get Active Jobs Count
```http
GET /jobs/active/count
```
Returns count of available jobs.

### Retrain Models
```http
POST /retrain
```
Retrains ML models with latest data.

## 🎯 Algorithm Details

### Content-Based Scoring
1. **Skills Matching**: Extracts skills from resume and matches against job descriptions
2. **Education Matching**: Aligns student type and graduation status with job requirements
3. **Experience Matching**: Compares work experience with job experience level
4. **Course Mapping**: Maps academic courses to relevant job categories
5. **Location Scoring**: Basic location preference (future enhancement)

### Knowledge Matching
1. **Text Extraction**: Creates comprehensive text profiles for users and jobs
2. **Semantic Similarity**: 
   - **Primary**: BERT embeddings via sentence-transformers
   - **Fallback**: TF-IDF cosine similarity
   - **Basic**: Word overlap similarity
3. **Context Understanding**: Considers professional summary, work experience, and skills

### Hybrid Combination
- Final Score = (Content Score × 0.4) + (Knowledge Score × 0.6)
- **Post-processing**: Popularity boost, diversity enhancement
- **Confidence Scoring**: Based on data completeness and score consistency

## 🔄 Integration with ACC Portal

### Backend Integration
The Node.js backend automatically calls this service:
```javascript
// In server/routes/jobs.ts
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
const response = await fetch(`${AI_SERVICE_URL}/recommendations`, { ... });
```

### Fallback System
- **Primary**: Python AI service (this service)  
- **Fallback**: Legacy Node.js recommendation system
- **Graceful Degradation**: Service continues if ML models fail

### Data Requirements
- **User Profile**: Must be completed for basic recommendations
- **Resume**: Only completed resumes are used (status = 'completed')
- **Minimum Data**: At least 2 resume sections for knowledge matching

## 📊 Performance & Monitoring

### Logging
The service logs detailed information:
- 📥 User requests and processing times
- 🤖 ML model loading and availability  
- ⚠️ Warnings for missing data or failures
- 📊 Recommendation generation statistics

### Caching
- **Embeddings**: BERT embeddings cached for reuse
- **Job Categories**: Course-category mappings cached
- **Popular Jobs**: Cached for popularity boost

### Metrics
- Processing time per recommendation request
- Success rate of ML model usage
- Cache hit rates
- User profile completeness statistics

## 🛠️ Development

### Adding New Features
1. **New Scoring Algorithms**: Add methods to `HybridJobRecommendationEngine`
2. **Data Sources**: Extend `DatabaseManager` for new data
3. **ML Models**: Add model loading in `_load_ml_models()`
4. **Post-processing**: Add logic in `_apply_post_processing()`

### Testing
```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest tests/
```

### Debugging
```bash
# Enable debug mode
export DEBUG=true

# Check user profile
curl http://localhost:5001/user/123/profile

# Test recommendations
curl -X POST http://localhost:5001/recommendations \
  -H "Content-Type: application/json" \
  -d '{"user_id": 123, "limit": 5}'
```

## 🔧 Troubleshooting

### Common Issues

**Service won't start**
- Check Python version (3.8+ required)
- Verify database connection settings
- Check port 5001 availability

**ML models not loading**
- Install ML requirements: `pip install -r requirements-ml.txt`
- Check available RAM (2GB+ recommended)
- Try disabling advanced models: Set `USE_SEMANTIC_SIMILARITY=false`

**No recommendations returned**
- Ensure user has completed profile
- Check if user has completed resume
- Verify active jobs exist in database
- Lower `MIN_RECOMMENDATION_SCORE` for testing

**Poor recommendation quality**
- Complete user resume with detailed skills
- Add more job categories to database
- Retrain models: `POST /retrain`
- Adjust algorithm weights in configuration

### Database Connection Issues
```bash
# Test database connection
mysql -h localhost -u root -p acc_portal -e "SELECT COUNT(*) FROM jobs WHERE status='active';"
```

### Service Logs
```bash
# View service logs
tail -f logs/recommendation_service.log
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit pull request with detailed description

## 📄 License

This recommendation service is part of the ACC Job Portal platform.

---

**🚀 Ready to provide intelligent job recommendations!**

For support, check the logs or contact the development team.
