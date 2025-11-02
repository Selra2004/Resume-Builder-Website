import { getConnection } from '../config/database.js';

interface UserProfile {
  id: number;
  skills: string[];
  courses: string[];
  experience: any[];
  student_type: string;
}

interface JobMatch {
  jobId: number;
  matchScore: number;
  matchReasons: string[];
}

export class JobRecommendationService {
  
  static async getRecommendationsForUser(userId: number): Promise<JobMatch[]> {
    const connection = getConnection();
    
    try {
      console.log('Getting recommendations for user:', userId);
      
      // Get user profile data
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        console.log('No user profile found for user:', userId);
        // Return some general recommendations even if no profile
        return await this.getGeneralRecommendations();
      }

      // Get all active jobs
      const [jobs] = await connection.execute(`
        SELECT 
          j.id,
          j.title,
          j.category,
          j.description,
          j.min_salary,
          j.max_salary,
          j.experience_level,
          j.work_type
        FROM jobs j
        WHERE j.status = 'active'
        AND j.application_deadline > CURDATE() OR j.application_deadline IS NULL
        ORDER BY j.created_at DESC
      `);

      // Calculate match scores for each job
      const jobMatches: JobMatch[] = [];
      
      for (const job of jobs as any[]) {
        const matchResult = this.calculateJobMatch(userProfile, job);
        if (matchResult.matchScore > 0) {
          jobMatches.push({
            jobId: job.id,
            matchScore: matchResult.matchScore,
            matchReasons: matchResult.reasons
          });
        }
      }

      // Sort by match score (highest first) and return top 10
      return jobMatches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10);

    } catch (error) {
      console.error('Error getting job recommendations:', error);
      return [];
    }
  }

  private static async getGeneralRecommendations(): Promise<JobMatch[]> {
    const connection = getConnection();
    
    try {
      // Get some popular/recent jobs as general recommendations
      const [jobs] = await connection.execute(`
        SELECT 
          j.id,
          j.title,
          j.category,
          j.description,
          j.min_salary,
          j.max_salary,
          j.experience_level,
          j.work_type,
          COUNT(ja.id) as application_count
        FROM jobs j
        LEFT JOIN job_applications ja ON j.id = ja.job_id
        WHERE j.status = 'active'
        AND (j.application_deadline > CURDATE() OR j.application_deadline IS NULL)
        GROUP BY j.id
        ORDER BY application_count DESC, j.created_at DESC
        LIMIT 10
      `);

      return (jobs as any[]).map(job => ({
        jobId: job.id,
        matchScore: 50, // Default score for general recommendations
        matchReasons: ['Popular job opportunity', 'Recently posted']
      }));

    } catch (error) {
      console.error('Error getting general recommendations:', error);
      return [];
    }
  }

  private static async getUserProfile(userId: number): Promise<UserProfile | null> {
    const connection = getConnection();
    
    try {
      // Get user basic info and profile (don't require profile_completed to be TRUE)
      const [userInfo] = await connection.execute(`
        SELECT 
          u.id,
          up.student_type,
          up.profile_completed
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = ?
      `, [userId]);

      if ((userInfo as any[]).length === 0) {
        console.log('No user found with ID:', userId);
        return null;
      }

      const user = (userInfo as any[])[0];

      // Get user courses
      const [userCourses] = await connection.execute(`
        SELECT c.course_name
        FROM user_courses uc
        JOIN courses c ON uc.course_id = c.id
        WHERE uc.user_id = ?
      `, [userId]);

      // Get user skills from resumes
      const [userResumes] = await connection.execute(`
        SELECT skills, work_experience, education
        FROM resumes
        WHERE user_id = ? AND status = 'completed'
        ORDER BY updated_at DESC
        LIMIT 1
      `, [userId]);

      const skills: string[] = [];
      const experience: any[] = [];
      
      if ((userResumes as any[]).length > 0) {
        const resume = (userResumes as any[])[0];
        
        // Extract skills
        if (resume.skills) {
          try {
            const skillsData = JSON.parse(resume.skills);
            if (Array.isArray(skillsData)) {
              skills.push(...skillsData.map((skill: any) => skill.name || skill).filter(Boolean));
            }
          } catch (e) {
            console.error('Error parsing skills:', e);
          }
        }

        // Extract experience
        if (resume.work_experience) {
          try {
            const expData = JSON.parse(resume.work_experience);
            if (Array.isArray(expData)) {
              experience.push(...expData);
            }
          } catch (e) {
            console.error('Error parsing work experience:', e);
          }
        }
      }

      const profile = {
        id: user.id,
        skills: skills,
        courses: (userCourses as any[]).map(c => c.course_name),
        experience: experience,
        student_type: user.student_type || 'student'
      };

      console.log('User profile for recommendations:', {
        userId: profile.id,
        skillsCount: profile.skills.length,
        coursesCount: profile.courses.length,
        experienceCount: profile.experience.length,
        studentType: profile.student_type
      });

      return profile;

    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  private static calculateJobMatch(userProfile: UserProfile, job: any): { matchScore: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const maxScore = 100;

    // 1. Course-based matching (40% weight)
    const courseMatch = this.getCourseJobMatch(userProfile.courses, job.category);
    if (courseMatch.isMatch) {
      score += 40;
      reasons.push(`Your ${courseMatch.matchedCourse} course aligns with this ${job.category} position`);
    }

    // 2. Skills matching (30% weight)
    const skillsMatch = this.getSkillsMatch(userProfile.skills, job.title, job.description);
    if (skillsMatch.matchCount > 0) {
      const skillScore = Math.min(30, (skillsMatch.matchCount / skillsMatch.totalSkills) * 30);
      score += skillScore;
      reasons.push(`${skillsMatch.matchCount} of your skills match this job`);
    }

    // 3. Experience level matching (20% weight)
    const experienceMatch = this.getExperienceMatch(userProfile, job.experience_level);
    score += experienceMatch.score;
    if (experienceMatch.reason) {
      reasons.push(experienceMatch.reason);
    }

    // 4. Student type matching (10% weight)
    const studentTypeMatch = this.getStudentTypeMatch(userProfile.student_type, job.work_type);
    score += studentTypeMatch.score;
    if (studentTypeMatch.reason) {
      reasons.push(studentTypeMatch.reason);
    }

    return {
      matchScore: Math.min(maxScore, Math.round(score)),
      reasons: reasons
    };
  }

  private static getCourseJobMatch(userCourses: string[], jobCategory: string): { isMatch: boolean; matchedCourse: string } {
    // Define course-to-category mappings
    const courseCategoryMap: { [key: string]: string[] } = {
      'Associate in Information Technology': [
        'IT Support / Helpdesk', 'Technical Support', 'Computer Technician', 
        'Junior Web Developer', 'Software Testing / QA', 'Network Support',
        'Data Entry / Office IT Assistant', 'Basic Web Design', 'System Administration (Junior)', 'IT Sales'
      ],
      'BS Information Technology': [
        'IT Support / Technical Support', 'Systems Administration', 'Network Administration',
        'Web Development', 'Database Administration', 'Software Development',
        'Information Security', 'Cloud Computing', 'IT Project Management', 'IT Consulting'
      ],
      'BS Computer Science': [
        'Software Development / Programming', 'Data Structures and Algorithms',
        'Artificial Intelligence / Machine Learning', 'Cybersecurity', 'Game Development',
        'Systems Development', 'Web and Mobile App Development', 'Data Analytics / Data Science',
        'DevOps / System Integration', 'Research & Development (Tech)'
      ],
      'BS Computer Engineering': [
        'Hardware Engineering', 'Embedded Systems', 'Network and Systems Engineering',
        'Robotics and Automation', 'Software Development', 'Systems Architecture',
        'IT Infrastructure', 'Cybersecurity (technical roles)', 'Firmware Development', 'Technical Project Management'
      ],
      'BS Accountancy': [
        'Accounting and Finance', 'Audit and Assurance', 'Taxation', 'Bookkeeping',
        'Financial Analysis', 'Management Accounting', 'Payroll', 'Banking and Financial Services',
        'Accounts Payable/Receivable', 'Corporate Finance'
      ],
      'Associate in Hotel and Restaurant Management': [
        'Food & Beverage Services', 'Front Office & Guest Services', 'Housekeeping Management',
        'Restaurant Management', 'Event Planning / Banquet Services', 'Hospitality and Tourism',
        'Hotel Operations', 'Barista / Bartending', 'Culinary Arts (basic)', 'Customer Service'
      ],
      'BS Hospitality Management': [
        'Hotel and Resort Management', 'Food & Beverage Management', 'Front Office and Concierge Services',
        'Hospitality Sales and Marketing', 'Event and Convention Services', 'Casino and Gaming Operations',
        'Housekeeping Operations', 'Lodging and Accommodation Services', 'Guest Relations', 'Travel and Leisure'
      ]
      // Add more mappings as needed
    };

    for (const course of userCourses) {
      const matchingCategories = courseCategoryMap[course] || [];
      if (matchingCategories.some(cat => 
        cat.toLowerCase().includes(jobCategory.toLowerCase()) || 
        jobCategory.toLowerCase().includes(cat.toLowerCase())
      )) {
        return { isMatch: true, matchedCourse: course };
      }
    }

    return { isMatch: false, matchedCourse: '' };
  }

  private static getSkillsMatch(userSkills: string[], jobTitle: string, jobDescription: string): { matchCount: number; totalSkills: number } {
    if (userSkills.length === 0) {
      return { matchCount: 0, totalSkills: 0 };
    }

    const jobText = `${jobTitle} ${jobDescription}`.toLowerCase();
    let matchCount = 0;

    for (const skill of userSkills) {
      if (jobText.includes(skill.toLowerCase())) {
        matchCount++;
      }
    }

    return { matchCount, totalSkills: userSkills.length };
  }

  private static getExperienceMatch(userProfile: UserProfile, jobExperienceLevel: string): { score: number; reason: string } {
    const userExperienceYears = userProfile.experience.length;
    
    switch (jobExperienceLevel) {
      case 'entry-level':
        if (userProfile.student_type === 'ojt' || userExperienceYears <= 2) {
          return { score: 20, reason: 'Perfect match for entry-level position' };
        }
        return { score: 10, reason: 'Suitable for entry-level role' };
      
      case 'mid-level':
        if (userExperienceYears >= 2 && userExperienceYears <= 5) {
          return { score: 20, reason: 'Good fit for mid-level position' };
        } else if (userProfile.student_type === 'alumni') {
          return { score: 15, reason: 'Alumni experience suitable for mid-level' };
        }
        return { score: 5, reason: 'May need more experience for this role' };
      
      default:
        return { score: 10, reason: '' };
    }
  }

  private static getStudentTypeMatch(studentType: string, workType: string): { score: number; reason: string } {
    if (studentType === 'ojt') {
      if (workType === 'internship') {
        return { score: 10, reason: 'Perfect internship opportunity for OJT students' };
      } else if (workType === 'part-time') {
        return { score: 8, reason: 'Good part-time opportunity' };
      }
      return { score: 3, reason: '' };
    }
    
    if (studentType === 'alumni') {
      if (workType === 'full-time') {
        return { score: 10, reason: 'Great full-time opportunity for alumni' };
      } else if (workType === 'contract') {
        return { score: 8, reason: 'Good contract opportunity' };
      }
      return { score: 5, reason: '' };
    }
    
    return { score: 5, reason: '' };
  }
}

