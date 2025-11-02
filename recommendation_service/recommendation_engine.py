#!/usr/bin/env python3
"""
Hybrid Job Recommendation Engine
Combines content-based filtering and knowledge matching for optimal job recommendations
"""

import asyncio
import logging
import re
import json
import hashlib
from typing import Dict, List, Any, Optional, Tuple, Set
from datetime import datetime, timedelta
from dataclasses import dataclass
from collections import defaultdict
import math

# ML and NLP imports (with fallback support)
try:
    import numpy as np
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    from sklearn.preprocessing import StandardScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logging.warning("⚠️ scikit-learn not available, using simplified algorithms")

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    logging.warning("⚠️ sentence-transformers not available, using TF-IDF for semantic similarity")

from database import DatabaseManager
from config import Config

logger = logging.getLogger(__name__)

@dataclass
class UserProfile:
    """Structured user profile data"""
    user_id: int
    first_name: str
    last_name: str
    student_type: str
    courses: List[Tuple[str, str]]  # (course_name, graduation_status)
    age: Optional[int]
    profile_completed: bool
    
    # Resume data (only if completed)
    has_completed_resume: bool = False
    skills: List[str] = None
    work_experience: List[Dict] = None
    education: List[Dict] = None
    professional_summary: str = None
    languages: List[str] = None
    hobbies: str = None

@dataclass
class JobProfile:
    """Structured job profile data"""
    job_id: int
    title: str
    category: str
    description: str
    summary: Optional[str]
    location: str
    work_type: str
    work_arrangement: str
    experience_level: str
    min_salary: Optional[float]
    max_salary: Optional[float]
    company_name: str
    application_count: int

@dataclass
class RecommendationScore:
    """Individual recommendation score breakdown"""
    job_id: int
    content_score: float
    knowledge_score: float
    hybrid_score: float
    confidence: float
    reasons: List[str]
    job_title: str
    job_category: str
    company_name: str

class HybridJobRecommendationEngine:
    """Advanced hybrid job recommendation engine"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
        self.is_initialized = False
        
        # ML Models
        self.sentence_model = None
        self.tfidf_vectorizer = None
        self.scaler = None
        
        # Caches
        self.embeddings_cache = {}
        self.job_categories_mapping = {}
        self.popular_jobs = []
        
        # Algorithm info
        self.algorithm_version = "2.0.0"
        self.features_used = []
    
    async def initialize(self):
        """Initialize the recommendation engine"""
        try:
            logger.info("🔧 Initializing Hybrid Recommendation Engine...")
            
            # Load ML models
            await self._load_ml_models()
            
            # Load supporting data
            await self._load_job_categories_mapping()
            await self._load_popular_jobs()
            
            # Set algorithm features
            self._set_algorithm_features()
            
            self.is_initialized = True
            logger.info("✅ Hybrid Recommendation Engine initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize recommendation engine: {e}")
            raise
    
    async def _load_ml_models(self):
        """Load machine learning models"""
        try:
            # Load sentence transformer model if available
            if SENTENCE_TRANSFORMERS_AVAILABLE and Config.USE_SEMANTIC_SIMILARITY:
                try:
                    logger.info(f"📥 Loading sentence transformer: {Config.SENTENCE_TRANSFORMER_MODEL}")
                    self.sentence_model = SentenceTransformer(Config.SENTENCE_TRANSFORMER_MODEL)
                    logger.info("✅ Sentence transformer loaded successfully")
                except Exception as e:
                    logger.warning(f"⚠️ Failed to load sentence transformer: {e}, falling back to TF-IDF")
                    self.sentence_model = None
            
            # Initialize TF-IDF vectorizer as fallback
            if SKLEARN_AVAILABLE:
                self.tfidf_vectorizer = TfidfVectorizer(
                    max_features=5000,
                    stop_words='english',
                    ngram_range=(1, 2),
                    min_df=2,
                    max_df=0.95
                )
                self.scaler = StandardScaler()
                logger.info("✅ TF-IDF vectorizer initialized")
            
        except Exception as e:
            logger.error(f"Error loading ML models: {e}")
            # Continue without ML models for basic functionality
    
    async def _load_job_categories_mapping(self):
        """Load job categories mapping from database"""
        try:
            self.job_categories_mapping = await self.db.get_job_categories_mapping()
            logger.info(f"📊 Loaded {len(self.job_categories_mapping)} course-category mappings")
        except Exception as e:
            logger.warning(f"⚠️ Failed to load job categories mapping: {e}")
            self.job_categories_mapping = {}
    
    async def _load_popular_jobs(self):
        """Load popular jobs for popularity boost"""
        try:
            if Config.ENABLE_POPULARITY_BOOST:
                self.popular_jobs = await self.db.get_popular_jobs(limit=50)
                logger.info(f"📈 Loaded {len(self.popular_jobs)} popular jobs")
        except Exception as e:
            logger.warning(f"⚠️ Failed to load popular jobs: {e}")
            self.popular_jobs = []
    
    def _set_algorithm_features(self):
        """Set algorithm features based on available components"""
        self.features_used = [
            "content_based_filtering",
            "skill_matching",
            "education_matching", 
            "experience_matching",
            "course_category_mapping"
        ]
        
        if self.sentence_model:
            self.features_used.append("semantic_similarity_bert")
        elif self.tfidf_vectorizer:
            self.features_used.append("tfidf_similarity")
        
        if Config.ENABLE_POPULARITY_BOOST:
            self.features_used.append("popularity_boost")
        
        if Config.ENABLE_DIVERSITY_BOOST:
            self.features_used.append("diversity_boost")
    
    def is_ready(self) -> bool:
        """Check if engine is ready to provide recommendations"""
        return self.is_initialized
    
    async def get_recommendations(
        self, 
        user_id: int, 
        limit: int = 10, 
        include_reasons: bool = True
    ) -> List[RecommendationScore]:
        """
        Get hybrid job recommendations for a user
        
        Args:
            user_id: User ID to get recommendations for
            limit: Maximum number of recommendations to return
            include_reasons: Whether to include explanation reasons
            
        Returns:
            List of RecommendationScore objects sorted by hybrid score
        """
        try:
            if not self.is_ready():
                raise ValueError("Recommendation engine not initialized")
            
            # Get user profile data
            user_profile = await self._build_user_profile(user_id)
            if not user_profile:
                raise ValueError(f"No profile found for user {user_id}")
            
            # Get active jobs
            jobs = await self.db.get_active_jobs(limit=Config.MAX_RECOMMENDATIONS)
            if not jobs:
                return []
            
            # Convert to job profiles
            job_profiles = [self._build_job_profile(job) for job in jobs]
            
            # Calculate recommendations
            recommendations = await self._calculate_hybrid_recommendations(
                user_profile, 
                job_profiles,
                include_reasons
            )
            
            # Apply post-processing
            recommendations = self._apply_post_processing(recommendations, user_profile)
            
            # Sort by hybrid score and limit results
            recommendations.sort(key=lambda x: x.hybrid_score, reverse=True)
            final_recommendations = recommendations[:limit]
            
            # Log recommendation request
            if final_recommendations:
                job_ids = [r.job_id for r in final_recommendations]
                scores = [r.hybrid_score for r in final_recommendations]
                await self.db.log_recommendation_request(user_id, job_ids, scores)
            
            logger.info(f"📊 Generated {len(final_recommendations)} recommendations for user {user_id}")
            return final_recommendations
            
        except Exception as e:
            logger.error(f"Error getting recommendations for user {user_id}: {e}")
            raise
    
    async def _build_user_profile(self, user_id: int) -> Optional[UserProfile]:
        """Build comprehensive user profile from database"""
        try:
            # Get basic profile
            profile_data = await self.db.get_user_profile(user_id)
            if not profile_data:
                return None
            
            # Get resume data (only completed resumes)
            resume_data = await self.db.get_user_resume(user_id, only_completed=True)
            
            # Build user profile
            user_profile = UserProfile(
                user_id=user_id,
                first_name=profile_data.get('first_name', ''),
                last_name=profile_data.get('last_name', ''),
                student_type=profile_data.get('student_type', ''),
                courses=profile_data.get('courses_list', []),
                age=profile_data.get('age'),
                profile_completed=bool(profile_data.get('profile_completed', False))
            )
            
            # Add resume data if available
            if resume_data:
                user_profile.has_completed_resume = True
                user_profile.skills = self._extract_skills_from_resume(resume_data)
                user_profile.work_experience = resume_data.get('work_experience', [])
                user_profile.education = resume_data.get('education', [])
                user_profile.professional_summary = resume_data.get('professional_summary', '')
                user_profile.languages = self._extract_languages_from_resume(resume_data)
                user_profile.hobbies = resume_data.get('hobbies', '')
            
            return user_profile
            
        except Exception as e:
            logger.error(f"Error building user profile for {user_id}: {e}")
            return None
    
    def _build_job_profile(self, job_data: Dict[str, Any]) -> JobProfile:
        """Build job profile from database record"""
        return JobProfile(
            job_id=job_data['id'],
            title=job_data['title'],
            category=job_data['category'],
            description=job_data['description'] or '',
            summary=job_data.get('summary'),
            location=job_data['location'],
            work_type=job_data['work_type'],
            work_arrangement=job_data['work_arrangement'],
            experience_level=job_data['experience_level'],
            min_salary=job_data.get('min_salary'),
            max_salary=job_data.get('max_salary'),
            company_name=job_data.get('company_name', 'Unknown'),
            application_count=job_data.get('application_count', 0)
        )
    
    def _extract_skills_from_resume(self, resume_data: Dict) -> List[str]:
        """Extract skills list from resume data"""
        try:
            skills = resume_data.get('skills', [])
            if isinstance(skills, list):
                # Handle both simple list and complex skill objects
                skill_names = []
                for skill in skills:
                    if isinstance(skill, dict):
                        if 'name' in skill:
                            skill_names.append(skill['name'])
                        elif 'skill' in skill:
                            skill_names.append(skill['skill'])
                    elif isinstance(skill, str):
                        skill_names.append(skill)
                return skill_names
            return []
        except Exception as e:
            logger.warning(f"Error extracting skills from resume: {e}")
            return []
    
    def _extract_languages_from_resume(self, resume_data: Dict) -> List[str]:
        """Extract languages from resume data"""
        try:
            languages = resume_data.get('languages', [])
            if isinstance(languages, list):
                lang_names = []
                for lang in languages:
                    if isinstance(lang, dict) and 'language' in lang:
                        lang_names.append(lang['language'])
                    elif isinstance(lang, str):
                        lang_names.append(lang)
                return lang_names
            return []
        except Exception as e:
            logger.warning(f"Error extracting languages from resume: {e}")
            return []
    
    async def _calculate_hybrid_recommendations(
        self, 
        user_profile: UserProfile, 
        job_profiles: List[JobProfile],
        include_reasons: bool
    ) -> List[RecommendationScore]:
        """Calculate hybrid recommendation scores"""
        recommendations = []
        
        for job_profile in job_profiles:
            try:
                # Calculate content-based score
                content_score, content_reasons = self._calculate_content_score(user_profile, job_profile)
                
                # Calculate knowledge matching score
                knowledge_score, knowledge_reasons = await self._calculate_knowledge_score(user_profile, job_profile)
                
                # Calculate hybrid score
                hybrid_score = (
                    Config.CONTENT_WEIGHT * content_score + 
                    Config.KNOWLEDGE_WEIGHT * knowledge_score
                )
                
                # Calculate confidence based on available data
                confidence = self._calculate_confidence(user_profile, content_score, knowledge_score)
                
                # Combine reasons
                all_reasons = []
                if include_reasons:
                    all_reasons.extend(content_reasons)
                    all_reasons.extend(knowledge_reasons)
                
                # Create recommendation score
                if hybrid_score >= Config.MIN_RECOMMENDATION_SCORE:
                    recommendation = RecommendationScore(
                        job_id=job_profile.job_id,
                        content_score=content_score,
                        knowledge_score=knowledge_score,
                        hybrid_score=hybrid_score,
                        confidence=confidence,
                        reasons=all_reasons,
                        job_title=job_profile.title,
                        job_category=job_profile.category,
                        company_name=job_profile.company_name
                    )
                    recommendations.append(recommendation)
                    
            except Exception as e:
                logger.warning(f"Error calculating score for job {job_profile.job_id}: {e}")
                continue
        
        return recommendations
    
    def _calculate_content_score(self, user_profile: UserProfile, job_profile: JobProfile) -> Tuple[float, List[str]]:
        """Calculate content-based matching score"""
        score = 0.0
        reasons = []
        
        try:
            # Skills matching (30%)
            if user_profile.skills:
                skills_score = self._calculate_skills_match(user_profile.skills, job_profile)
                score += Config.SKILLS_WEIGHT * skills_score
                if skills_score > 0.5:
                    matching_skills = self._get_matching_skills(user_profile.skills, job_profile)
                    if matching_skills:
                        reasons.append(f"Skills match: {', '.join(matching_skills[:3])}")
            
            # Education matching (25%)
            education_score = self._calculate_education_match(user_profile, job_profile)
            score += Config.EDUCATION_WEIGHT * education_score
            if education_score > 0.5:
                reasons.append(f"Education level matches {job_profile.experience_level} requirements")
            
            # Experience matching (20%)
            experience_score = self._calculate_experience_match(user_profile, job_profile)
            score += Config.EXPERIENCE_WEIGHT * experience_score
            if experience_score > 0.5:
                reasons.append(f"Experience level aligns with {job_profile.experience_level} role")
            
            # Course-category matching (15%)
            course_score = self._calculate_course_match(user_profile.courses, job_profile.category)
            score += Config.COURSE_WEIGHT * course_score
            if course_score > 0.7:
                reasons.append(f"Your course background fits {job_profile.category} field")
            
            # Location preference (10%) - placeholder for future enhancement
            location_score = 0.5  # Neutral score for now
            score += Config.LOCATION_WEIGHT * location_score
            
        except Exception as e:
            logger.warning(f"Error calculating content score: {e}")
        
        return min(1.0, score), reasons
    
    async def _calculate_knowledge_score(self, user_profile: UserProfile, job_profile: JobProfile) -> Tuple[float, List[str]]:
        """Calculate knowledge matching score using NLP"""
        score = 0.0
        reasons = []
        
        try:
            if not user_profile.has_completed_resume:
                return 0.0, ["Complete your resume for better job matching"]
            
            # Create user text for comparison
            user_text = self._create_user_text(user_profile)
            job_text = self._create_job_text(job_profile)
            
            if not user_text or not job_text:
                return 0.0, []
            
            # Calculate semantic similarity
            if self.sentence_model:
                similarity = await self._calculate_semantic_similarity_bert(user_text, job_text)
            elif self.tfidf_vectorizer and SKLEARN_AVAILABLE:
                similarity = self._calculate_tfidf_similarity(user_text, job_text)
            else:
                similarity = self._calculate_simple_text_similarity(user_text, job_text)
            
            score = similarity
            
            if similarity > 0.7:
                reasons.append("Strong semantic match between your profile and job requirements")
            elif similarity > 0.5:
                reasons.append("Good compatibility with job description")
            elif similarity > 0.3:
                reasons.append("Some relevant experience matches job needs")
            
        except Exception as e:
            logger.warning(f"Error calculating knowledge score: {e}")
        
        return min(1.0, score), reasons
    
    def _create_user_text(self, user_profile: UserProfile) -> str:
        """Create consolidated text representation of user"""
        text_parts = []
        
        if user_profile.professional_summary:
            text_parts.append(user_profile.professional_summary)
        
        if user_profile.skills:
            text_parts.append(" ".join(user_profile.skills))
        
        if user_profile.work_experience:
            for exp in user_profile.work_experience:
                if isinstance(exp, dict):
                    job_title = exp.get('jobTitle', '')
                    description = exp.get('description', '')
                    company = exp.get('company', '')
                    text_parts.append(f"{job_title} {company} {description}")
        
        if user_profile.education:
            for edu in user_profile.education:
                if isinstance(edu, dict):
                    degree = edu.get('degree', '')
                    field = edu.get('fieldOfStudy', '')
                    school = edu.get('school', '')
                    text_parts.append(f"{degree} {field} {school}")
        
        # Add course information
        for course, status in user_profile.courses:
            text_parts.append(f"{course} {status}")
        
        return " ".join(text_parts).lower()
    
    def _create_job_text(self, job_profile: JobProfile) -> str:
        """Create consolidated text representation of job"""
        text_parts = [
            job_profile.title,
            job_profile.category,
            job_profile.description or '',
            job_profile.summary or '',
            job_profile.work_type,
            job_profile.experience_level
        ]
        
        return " ".join(text_parts).lower()
    
    async def _calculate_semantic_similarity_bert(self, user_text: str, job_text: str) -> float:
        """Calculate semantic similarity using BERT embeddings"""
        try:
            # Create cache key
            cache_key = hashlib.md5(f"{user_text}||{job_text}".encode()).hexdigest()
            
            if cache_key in self.embeddings_cache:
                return self.embeddings_cache[cache_key]
            
            # Get embeddings
            embeddings = self.sentence_model.encode([user_text, job_text])
            
            # Calculate cosine similarity
            similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
            
            # Cache result
            if len(self.embeddings_cache) < Config.NLP_CACHE_SIZE:
                self.embeddings_cache[cache_key] = similarity
            
            return float(similarity)
            
        except Exception as e:
            logger.warning(f"Error calculating BERT similarity: {e}")
            return 0.0
    
    def _calculate_tfidf_similarity(self, user_text: str, job_text: str) -> float:
        """Calculate similarity using TF-IDF vectors"""
        try:
            texts = [user_text, job_text]
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(texts)
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return float(similarity)
        except Exception as e:
            logger.warning(f"Error calculating TF-IDF similarity: {e}")
            return 0.0
    
    def _calculate_simple_text_similarity(self, user_text: str, job_text: str) -> float:
        """Simple text similarity using word overlap"""
        try:
            user_words = set(re.findall(r'\w+', user_text.lower()))
            job_words = set(re.findall(r'\w+', job_text.lower()))
            
            if not user_words or not job_words:
                return 0.0
            
            intersection = user_words.intersection(job_words)
            union = user_words.union(job_words)
            
            return len(intersection) / len(union) if union else 0.0
        except Exception as e:
            logger.warning(f"Error calculating simple similarity: {e}")
            return 0.0
    
    def _calculate_skills_match(self, user_skills: List[str], job_profile: JobProfile) -> float:
        """Calculate skills matching score"""
        if not user_skills:
            return 0.0
        
        job_text = f"{job_profile.title} {job_profile.description}".lower()
        
        matching_skills = 0
        for skill in user_skills:
            if skill.lower() in job_text:
                matching_skills += 1
        
        return matching_skills / len(user_skills) if user_skills else 0.0
    
    def _get_matching_skills(self, user_skills: List[str], job_profile: JobProfile) -> List[str]:
        """Get list of matching skills"""
        job_text = f"{job_profile.title} {job_profile.description}".lower()
        return [skill for skill in user_skills if skill.lower() in job_text]
    
    def _calculate_education_match(self, user_profile: UserProfile, job_profile: JobProfile) -> float:
        """Calculate education level matching"""
        # Map experience levels to education expectations
        experience_education_map = {
            'entry-level': 0.8,
            'mid-level': 0.6,
            'senior-level': 0.4,
            'executive': 0.2
        }
        
        # Base score on student type and experience level
        if user_profile.student_type == 'alumni':
            base_score = 0.8
        else:  # OJT
            base_score = 0.6
        
        experience_modifier = experience_education_map.get(job_profile.experience_level, 0.5)
        
        return base_score * experience_modifier
    
    def _calculate_experience_match(self, user_profile: UserProfile, job_profile: JobProfile) -> float:
        """Calculate work experience matching"""
        # Simple experience matching based on student type and work experience
        if not user_profile.has_completed_resume:
            return 0.3  # Low score without resume
        
        experience_count = len(user_profile.work_experience) if user_profile.work_experience else 0
        
        # Score based on experience level requirements
        if job_profile.experience_level == 'entry-level':
            return 0.9 if experience_count >= 0 else 0.6
        elif job_profile.experience_level == 'mid-level':
            return 0.8 if experience_count >= 1 else 0.4
        elif job_profile.experience_level == 'senior-level':
            return 0.7 if experience_count >= 2 else 0.3
        else:  # executive
            return 0.6 if experience_count >= 3 else 0.2
    
    def _calculate_course_match(self, user_courses: List[Tuple[str, str]], job_category: str) -> float:
        """Calculate course-category matching score"""
        if not user_courses:
            return 0.0
        
        max_score = 0.0
        for course_name, graduation_status in user_courses:
            # Check if course maps to job category
            if course_name in self.job_categories_mapping:
                if job_category in self.job_categories_mapping[course_name]:
                    # Higher score for graduated students
                    score = 1.0 if graduation_status == 'graduated' else 0.8
                    max_score = max(max_score, score)
        
        return max_score
    
    def _calculate_confidence(self, user_profile: UserProfile, content_score: float, knowledge_score: float) -> float:
        """Calculate confidence score for the recommendation"""
        confidence = 0.5  # Base confidence
        
        # Increase confidence based on available data
        if user_profile.profile_completed:
            confidence += 0.2
        
        if user_profile.has_completed_resume:
            confidence += 0.3
        
        # Confidence based on score consistency
        score_diff = abs(content_score - knowledge_score)
        if score_diff < 0.2:
            confidence += 0.1
        
        return min(1.0, confidence)
    
    def _apply_post_processing(self, recommendations: List[RecommendationScore], user_profile: UserProfile) -> List[RecommendationScore]:
        """Apply post-processing boosts and adjustments"""
        try:
            # Apply popularity boost
            if Config.ENABLE_POPULARITY_BOOST and self.popular_jobs:
                for rec in recommendations:
                    if rec.job_id in self.popular_jobs:
                        boost = 0.1 * (1 - self.popular_jobs.index(rec.job_id) / len(self.popular_jobs))
                        rec.hybrid_score = min(1.0, rec.hybrid_score + boost)
                        if boost > 0.05:
                            rec.reasons.append("Popular job opportunity")
            
            # Apply diversity boost (ensure variety in categories)
            if Config.ENABLE_DIVERSITY_BOOST:
                recommendations = self._apply_diversity_boost(recommendations)
            
        except Exception as e:
            logger.warning(f"Error in post-processing: {e}")
        
        return recommendations
    
    def _apply_diversity_boost(self, recommendations: List[RecommendationScore]) -> List[RecommendationScore]:
        """Apply diversity boost to ensure variety in recommendations"""
        try:
            category_counts = defaultdict(int)
            for rec in recommendations:
                category_counts[rec.job_category] += 1
            
            # Boost underrepresented categories
            for rec in recommendations:
                if category_counts[rec.job_category] == 1:  # Unique category
                    rec.hybrid_score = min(1.0, rec.hybrid_score + 0.05)
        
        except Exception as e:
            logger.warning(f"Error applying diversity boost: {e}")
        
        return recommendations
    
    async def get_user_profile_debug(self, user_id: int) -> Dict[str, Any]:
        """Get user profile data for debugging"""
        user_profile = await self._build_user_profile(user_id)
        if not user_profile:
            return {"error": "User profile not found"}
        
        return {
            "user_id": user_profile.user_id,
            "name": f"{user_profile.first_name} {user_profile.last_name}",
            "student_type": user_profile.student_type,
            "courses": user_profile.courses,
            "profile_completed": user_profile.profile_completed,
            "has_completed_resume": user_profile.has_completed_resume,
            "skills_count": len(user_profile.skills) if user_profile.skills else 0,
            "work_experience_count": len(user_profile.work_experience) if user_profile.work_experience else 0,
            "education_count": len(user_profile.education) if user_profile.education else 0
        }
    
    async def get_total_active_jobs(self) -> int:
        """Get total count of active jobs"""
        return await self.db.get_total_active_jobs_count()
    
    def get_algorithm_info(self) -> Dict[str, Any]:
        """Get information about the recommendation algorithm"""
        return {
            "version": self.algorithm_version,
            "type": "hybrid",
            "features": self.features_used,
            "weights": {
                "content": Config.CONTENT_WEIGHT,
                "knowledge": Config.KNOWLEDGE_WEIGHT
            },
            "content_weights": {
                "skills": Config.SKILLS_WEIGHT,
                "education": Config.EDUCATION_WEIGHT,
                "experience": Config.EXPERIENCE_WEIGHT,
                "course": Config.COURSE_WEIGHT,
                "location": Config.LOCATION_WEIGHT
            },
            "ml_models": {
                "sentence_transformer": self.sentence_model is not None,
                "tfidf": self.tfidf_vectorizer is not None,
                "sklearn_available": SKLEARN_AVAILABLE
            }
        }
    
    async def retrain_models(self):
        """Retrain models with latest data"""
        try:
            logger.info("🔄 Retraining recommendation models...")
            
            # Reload job categories mapping
            await self._load_job_categories_mapping()
            
            # Reload popular jobs
            await self._load_popular_jobs()
            
            # Clear caches
            self.embeddings_cache.clear()
            
            logger.info("✅ Model retraining completed")
            
        except Exception as e:
            logger.error(f"Error retraining models: {e}")
            raise
