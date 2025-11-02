#!/usr/bin/env python3
"""
Database Manager for the Hybrid Job Recommendation Service
Handles all database operations with async support
"""

import asyncio
import logging
import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, date
import aiomysql
from config import Config

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Async database manager for MySQL connections"""
    
    def __init__(self):
        self.pool = None
        self._connection_params = {
            'host': Config.DB_HOST,
            'port': Config.DB_PORT,
            'user': Config.DB_USER,
            'password': Config.DB_PASSWORD,
            'db': Config.DB_NAME,
            'charset': 'utf8mb4',
            'autocommit': True
        }
    
    async def initialize(self):
        """Initialize database connection pool"""
        try:
            self.pool = await aiomysql.create_pool(
                minsize=1,
                maxsize=10,
                **self._connection_params
            )
            logger.info("✅ Database connection pool initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize database pool: {e}")
            raise
    
    async def close(self):
        """Close database connection pool"""
        if self.pool:
            self.pool.close()
            await self.pool.wait_closed()
            logger.info("🔄 Database connection pool closed")
    
    async def is_connected(self) -> bool:
        """Check if database is connected"""
        if not self.pool:
            return False
        
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("SELECT 1")
                    return True
        except Exception:
            return False
    
    async def get_user_profile(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get comprehensive user profile data"""
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    # Get user profile with courses
                    await cursor.execute("""
                        SELECT 
                            up.user_id,
                            up.first_name,
                            up.last_name,
                            up.student_type,
                            up.contact_number,
                            up.age,
                            up.birthdate,
                            up.gender,
                            up.profile_completed,
                            GROUP_CONCAT(c.course_name) as courses,
                            GROUP_CONCAT(uc.graduation_status) as graduation_statuses
                        FROM user_profiles up
                        LEFT JOIN user_courses uc ON up.user_id = uc.user_id
                        LEFT JOIN courses c ON uc.course_id = c.id
                        WHERE up.user_id = %s
                        GROUP BY up.user_id
                    """, (user_id,))
                    
                    profile = await cursor.fetchone()
                    
                    if not profile:
                        return None
                    
                    # Parse courses and graduation statuses
                    if profile['courses']:
                        courses = profile['courses'].split(',')
                        graduation_statuses = profile['graduation_statuses'].split(',') if profile['graduation_statuses'] else []
                        profile['courses_list'] = list(zip(courses, graduation_statuses))
                    else:
                        profile['courses_list'] = []
                    
                    return profile
        except Exception as e:
            logger.error(f"Error getting user profile {user_id}: {e}")
            return None
    
    async def get_user_resume(self, user_id: int, only_completed: bool = True) -> Optional[Dict[str, Any]]:
        """Get user's resume data (only completed resumes by default)"""
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    query = """
                        SELECT 
                            id, user_id, title, template_id, status,
                            personal_info, professional_summary, work_experience,
                            education, skills, websites_social_links,
                            custom_sections, extracurricular_activities,
                            hobbies, `references`, languages,
                            created_at, updated_at
                        FROM resumes 
                        WHERE user_id = %s
                    """
                    
                    if only_completed:
                        query += " AND status = 'completed'"
                    
                    query += " ORDER BY updated_at DESC LIMIT 1"
                    
                    await cursor.execute(query, (user_id,))
                    resume = await cursor.fetchone()
                    
                    if not resume:
                        return None
                    
                    # Parse JSON fields safely
                    json_fields = [
                        'personal_info', 'work_experience', 'education', 'skills',
                        'websites_social_links', 'custom_sections', 'extracurricular_activities',
                        'references', 'languages'
                    ]
                    
                    for field in json_fields:
                        if resume[field]:
                            try:
                                resume[field] = json.loads(resume[field]) if isinstance(resume[field], str) else resume[field]
                            except (json.JSONDecodeError, TypeError):
                                logger.warning(f"Failed to parse JSON field {field} for user {user_id}")
                                resume[field] = None
                    
                    return resume
        except Exception as e:
            logger.error(f"Error getting user resume {user_id}: {e}")
            return None
    
    async def get_active_jobs(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get all active jobs available for recommendation"""
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    query = """
                        SELECT 
                            j.id, j.title, j.category, j.description, j.summary,
                            j.location, j.work_type, j.work_arrangement,
                            j.experience_level, j.min_salary, j.max_salary,
                            j.positions_available, j.application_deadline,
                            j.created_by_type, j.created_by_id,
                            j.created_at, j.updated_at,
                            COALESCE(cp.company_name, coord_p.first_name, 'Unknown') as company_name,
                            COUNT(DISTINCT ja.id) as application_count
                        FROM jobs j
                        LEFT JOIN company_profiles cp ON j.created_by_type = 'company' AND j.created_by_id = cp.company_id
                        LEFT JOIN coordinator_profiles coord_p ON j.created_by_type = 'coordinator' AND j.created_by_id = coord_p.coordinator_id
                        LEFT JOIN job_applications ja ON j.id = ja.job_id
                        WHERE j.status = 'active'
                        AND (j.application_deadline IS NULL OR j.application_deadline > CURDATE())
                        GROUP BY j.id
                        ORDER BY j.created_at DESC
                    """
                    
                    if limit:
                        query += f" LIMIT {limit}"
                    
                    await cursor.execute(query)
                    jobs = await cursor.fetchall()
                    
                    return list(jobs) if jobs else []
        except Exception as e:
            logger.error(f"Error getting active jobs: {e}")
            return []
    
    async def get_job_details(self, job_id: int) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific job"""
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    await cursor.execute("""
                        SELECT 
                            j.*,
                            COALESCE(cp.company_name, coord_p.first_name, 'Unknown') as company_name,
                            COUNT(DISTINCT ja.id) as application_count,
                            AVG(jr.rating) as average_rating,
                            COUNT(DISTINCT jr.id) as rating_count
                        FROM jobs j
                        LEFT JOIN company_profiles cp ON j.created_by_type = 'company' AND j.created_by_id = cp.company_id
                        LEFT JOIN coordinator_profiles coord_p ON j.created_by_type = 'coordinator' AND j.created_by_id = coord_p.coordinator_id
                        LEFT JOIN job_applications ja ON j.id = ja.job_id
                        LEFT JOIN job_ratings jr ON j.id = jr.job_id
                        WHERE j.id = %s
                        GROUP BY j.id
                    """, (job_id,))
                    
                    return await cursor.fetchone()
        except Exception as e:
            logger.error(f"Error getting job details {job_id}: {e}")
            return None
    
    async def get_user_application_history(self, user_id: int) -> List[Dict[str, Any]]:
        """Get user's job application history for collaborative filtering"""
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    await cursor.execute("""
                        SELECT 
                            ja.job_id, 
                            ja.status,
                            ja.applied_at,
                            j.category,
                            j.work_type,
                            j.experience_level
                        FROM job_applications ja
                        JOIN jobs j ON ja.job_id = j.id
                        WHERE ja.user_id = %s
                        ORDER BY ja.applied_at DESC
                    """, (user_id,))
                    
                    applications = await cursor.fetchall()
                    return list(applications) if applications else []
        except Exception as e:
            logger.error(f"Error getting application history for user {user_id}: {e}")
            return []
    
    async def get_job_categories_mapping(self) -> Dict[str, List[str]]:
        """Get mapping of courses to job categories"""
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    await cursor.execute("""
                        SELECT course_name, category_name 
                        FROM job_categories
                        ORDER BY course_name, category_name
                    """)
                    
                    results = await cursor.fetchall()
                    
                    # Group by course name
                    mapping = {}
                    for row in results:
                        course = row['course_name']
                        category = row['category_name']
                        
                        if course not in mapping:
                            mapping[course] = []
                        mapping[course].append(category)
                    
                    return mapping
        except Exception as e:
            logger.error(f"Error getting job categories mapping: {e}")
            return {}
    
    async def get_popular_jobs(self, limit: int = 10) -> List[int]:
        """Get most popular job IDs based on application count"""
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("""
                        SELECT j.id, COUNT(ja.id) as app_count
                        FROM jobs j
                        LEFT JOIN job_applications ja ON j.id = ja.job_id
                        WHERE j.status = 'active'
                        AND (j.application_deadline IS NULL OR j.application_deadline > CURDATE())
                        GROUP BY j.id
                        ORDER BY app_count DESC, j.created_at DESC
                        LIMIT %s
                    """, (limit,))
                    
                    results = await cursor.fetchall()
                    return [row[0] for row in results] if results else []
        except Exception as e:
            logger.error(f"Error getting popular jobs: {e}")
            return []
    
    async def get_total_active_jobs_count(self) -> int:
        """Get count of total active jobs"""
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("""
                        SELECT COUNT(*) 
                        FROM jobs 
                        WHERE status = 'active'
                        AND (application_deadline IS NULL OR application_deadline > CURDATE())
                    """)
                    
                    result = await cursor.fetchone()
                    return result[0] if result else 0
        except Exception as e:
            logger.error(f"Error getting active jobs count: {e}")
            return 0
    
    async def log_recommendation_request(self, user_id: int, job_ids: List[int], scores: List[float]):
        """Log recommendation request for analytics (optional)"""
        try:
            if not job_ids:
                return
            
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    # Create simple logging table if it doesn't exist
                    await cursor.execute("""
                        CREATE TABLE IF NOT EXISTS recommendation_logs (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id INT NOT NULL,
                            recommended_jobs JSON,
                            scores JSON,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            INDEX idx_user_id (user_id),
                            INDEX idx_created_at (created_at)
                        )
                    """)
                    
                    # Insert log entry
                    await cursor.execute("""
                        INSERT INTO recommendation_logs (user_id, recommended_jobs, scores)
                        VALUES (%s, %s, %s)
                    """, (
                        user_id,
                        json.dumps(job_ids),
                        json.dumps(scores)
                    ))
                    
        except Exception as e:
            logger.warning(f"Failed to log recommendation request: {e}")
            # Don't raise exception for logging failures
