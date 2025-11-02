#!/usr/bin/env python3
"""
Configuration settings for the Hybrid Job Recommendation Service
"""

import os
from dataclasses import dataclass
from typing import Optional

@dataclass
class Config:
    """Configuration class for the recommendation service"""
    
    # Server Configuration
    HOST: str = os.getenv('HOST', '0.0.0.0')
    PORT: int = int(os.getenv('PORT', '5001'))
    DEBUG: bool = os.getenv('DEBUG', 'False').lower() == 'true'
    
    # Database Configuration  
    DB_HOST: str = os.getenv('DB_HOST', 'localhost')
    DB_PORT: int = int(os.getenv('DB_PORT', '3306'))
    DB_USER: str = os.getenv('DB_USER', 'root')
    DB_PASSWORD: str = os.getenv('DB_PASSWORD', '')
    DB_NAME: str = os.getenv('DB_NAME', 'acc_database')
    
    # Recommendation Engine Configuration
    CONTENT_WEIGHT: float = float(os.getenv('CONTENT_WEIGHT', '0.4'))  # 40%
    KNOWLEDGE_WEIGHT: float = float(os.getenv('KNOWLEDGE_WEIGHT', '0.6'))  # 60%
    
    # Scoring Thresholds
    MIN_RECOMMENDATION_SCORE: float = float(os.getenv('MIN_RECOMMENDATION_SCORE', '0.3'))
    MAX_RECOMMENDATIONS: int = int(os.getenv('MAX_RECOMMENDATIONS', '50'))
    
    # Content-Based Scoring Weights
    SKILLS_WEIGHT: float = float(os.getenv('SKILLS_WEIGHT', '0.30'))           # 30%
    EDUCATION_WEIGHT: float = float(os.getenv('EDUCATION_WEIGHT', '0.25'))     # 25%
    EXPERIENCE_WEIGHT: float = float(os.getenv('EXPERIENCE_WEIGHT', '0.20'))   # 20%
    COURSE_WEIGHT: float = float(os.getenv('COURSE_WEIGHT', '0.15'))          # 15%
    LOCATION_WEIGHT: float = float(os.getenv('LOCATION_WEIGHT', '0.10'))       # 10%
    
    # Knowledge Matching Configuration
    USE_SEMANTIC_SIMILARITY: bool = os.getenv('USE_SEMANTIC_SIMILARITY', 'True').lower() == 'true'
    SEMANTIC_THRESHOLD: float = float(os.getenv('SEMANTIC_THRESHOLD', '0.5'))
    
    # NLP Model Configuration
    SENTENCE_TRANSFORMER_MODEL: str = os.getenv('SENTENCE_TRANSFORMER_MODEL', 'all-MiniLM-L6-v2')
    NLP_CACHE_SIZE: int = int(os.getenv('NLP_CACHE_SIZE', '1000'))
    
    # Performance Configuration
    BATCH_SIZE: int = int(os.getenv('BATCH_SIZE', '32'))
    MAX_CONCURRENT_USERS: int = int(os.getenv('MAX_CONCURRENT_USERS', '10'))
    CACHE_TTL_SECONDS: int = int(os.getenv('CACHE_TTL_SECONDS', '3600'))  # 1 hour
    
    # Feature Flags
    ENABLE_COLLABORATIVE_FILTERING: bool = os.getenv('ENABLE_COLLABORATIVE_FILTERING', 'False').lower() == 'true'
    ENABLE_POPULARITY_BOOST: bool = os.getenv('ENABLE_POPULARITY_BOOST', 'True').lower() == 'true'
    ENABLE_DIVERSITY_BOOST: bool = os.getenv('ENABLE_DIVERSITY_BOOST', 'True').lower() == 'true'
    
    # Resume Processing Configuration
    REQUIRE_COMPLETED_RESUME: bool = os.getenv('REQUIRE_COMPLETED_RESUME', 'False').lower() == 'true'
    MIN_RESUME_SECTIONS: int = int(os.getenv('MIN_RESUME_SECTIONS', '2'))  # Minimum sections to consider resume useful
    
    # Job Filtering Configuration
    EXCLUDE_EXPIRED_JOBS: bool = os.getenv('EXCLUDE_EXPIRED_JOBS', 'True').lower() == 'true'
    EXCLUDE_DRAFT_JOBS: bool = os.getenv('EXCLUDE_DRAFT_JOBS', 'True').lower() == 'true'
    
    # Logging Configuration
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT: str = os.getenv('LOG_FORMAT', '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    @classmethod
    def get_database_url(cls) -> str:
        """Get database connection URL"""
        return f"mysql+asyncmy://{cls.DB_USER}:{cls.DB_PASSWORD}@{cls.DB_HOST}:{cls.DB_PORT}/{cls.DB_NAME}"
    
    @classmethod
    def validate_weights(cls) -> bool:
        """Validate that content-based scoring weights sum to 1.0"""
        total_content_weight = (
            cls.SKILLS_WEIGHT + 
            cls.EDUCATION_WEIGHT + 
            cls.EXPERIENCE_WEIGHT + 
            cls.COURSE_WEIGHT + 
            cls.LOCATION_WEIGHT
        )
        return abs(total_content_weight - 1.0) < 0.01  # Allow small floating point errors
    
    @classmethod
    def validate_hybrid_weights(cls) -> bool:
        """Validate that hybrid scoring weights sum to 1.0"""
        total_hybrid_weight = cls.CONTENT_WEIGHT + cls.KNOWLEDGE_WEIGHT
        return abs(total_hybrid_weight - 1.0) < 0.01
    
    @classmethod
    def print_config(cls):
        """Print current configuration (excluding sensitive data)"""
        print("🔧 Hybrid Job Recommendation Service Configuration:")
        print(f"   Server: {cls.HOST}:{cls.PORT}")
        print(f"   Database: {cls.DB_HOST}:{cls.DB_PORT}/{cls.DB_NAME}")
        print(f"   Hybrid Weights: Content={cls.CONTENT_WEIGHT}, Knowledge={cls.KNOWLEDGE_WEIGHT}")
        print(f"   Content Weights: Skills={cls.SKILLS_WEIGHT}, Education={cls.EDUCATION_WEIGHT}")
        print(f"   Experience={cls.EXPERIENCE_WEIGHT}, Course={cls.COURSE_WEIGHT}, Location={cls.LOCATION_WEIGHT}")
        print(f"   Semantic Similarity: {cls.USE_SEMANTIC_SIMILARITY}")
        print(f"   Model: {cls.SENTENCE_TRANSFORMER_MODEL}")
        print(f"   Min Score Threshold: {cls.MIN_RECOMMENDATION_SCORE}")
        
        # Validate configuration
        if not cls.validate_weights():
            print("⚠️ WARNING: Content-based weights do not sum to 1.0")
        if not cls.validate_hybrid_weights():
            print("⚠️ WARNING: Hybrid weights do not sum to 1.0")

# Environment-specific configurations
class DevelopmentConfig(Config):
    """Development environment configuration"""
    DEBUG = True
    LOG_LEVEL = "DEBUG"
    CACHE_TTL_SECONDS = 300  # 5 minutes for faster development

class ProductionConfig(Config):
    """Production environment configuration"""
    DEBUG = False
    LOG_LEVEL = "INFO"
    CACHE_TTL_SECONDS = 3600  # 1 hour
    USE_SEMANTIC_SIMILARITY = True
    MAX_CONCURRENT_USERS = 50

class TestingConfig(Config):
    """Testing environment configuration"""
    DEBUG = True
    DB_NAME = "acc_portal_test"
    LOG_LEVEL = "DEBUG"
    CACHE_TTL_SECONDS = 0  # No caching in tests
    MIN_RECOMMENDATION_SCORE = 0.0  # Lower threshold for testing

# Get configuration based on environment
def get_config() -> Config:
    """Get configuration based on ENVIRONMENT variable"""
    env = os.getenv('ENVIRONMENT', 'development').lower()
    
    if env == 'production':
        return ProductionConfig()
    elif env == 'testing':
        return TestingConfig()
    else:
        return DevelopmentConfig()

# Export the current configuration
Config = get_config()
