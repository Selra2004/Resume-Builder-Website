import express, { Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { getConnection } from '../config/database.js';

const router = express.Router();

// Resume templates configuration
const RESUME_TEMPLATES = {
  'classic-with-photo': { name: 'Classic Professional', hasPhoto: true, isATS: false },
  'modern-with-photo': { name: 'Modern Creative', hasPhoto: true, isATS: false },
  'elegant-with-photo': { name: 'Elegant Executive', hasPhoto: true, isATS: false },
  'classic-ats': { name: 'Classic ATS', hasPhoto: false, isATS: true },
  'modern-ats': { name: 'Modern ATS', hasPhoto: false, isATS: true },
  'simple-ats': { name: 'Simple ATS', hasPhoto: false, isATS: true }
};

// Get available templates
router.get('/templates', authenticate, authorize('user'), asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(RESUME_TEMPLATES);
}));

// Get user's resumes
router.get('/', authenticate, authorize('user'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const connection = getConnection();
  const { status } = req.query;
  
  let query = `
    SELECT id, title, template_id, status, is_primary, font_family, paper_size,
           download_count, created_at, updated_at
    FROM resumes
    WHERE user_id = ?
  `;
  const params: any[] = [req.user!.id];
  
  if (status && (status === 'draft' || status === 'completed')) {
    query += ' AND status = ?';
    params.push(status as string);
  }
  
  query += ' ORDER BY is_primary DESC, updated_at DESC';
  
  const [resumes] = await connection.execute(query, params);
  
  // Add template info to each resume
  const resumesWithTemplates = (resumes as any[]).map(resume => ({
    ...resume,
    template: RESUME_TEMPLATES[resume.template_id as keyof typeof RESUME_TEMPLATES] || null
  }));

  res.json(resumesWithTemplates);
}));

// Get specific resume
router.get('/:id', authenticate, authorize('user'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const connection = getConnection();
  
  const [resume] = await connection.execute(`
    SELECT * FROM resumes
    WHERE id = ? AND user_id = ?
  `, [id, req.user!.id]);

  if ((resume as any[]).length === 0) {
    return res.status(404).json({ message: 'Resume not found' });
  }

  const resumeData = (resume as any[])[0];
  
  // Parse JSON fields
  const parsedResume = {
    ...resumeData,
    personal_info: resumeData.personal_info ? JSON.parse(resumeData.personal_info) : {},
    work_experience: resumeData.work_experience ? JSON.parse(resumeData.work_experience) : [],
    education: resumeData.education ? JSON.parse(resumeData.education) : [],
    skills: resumeData.skills ? JSON.parse(resumeData.skills) : [],
    websites_social_links: resumeData.websites_social_links ? JSON.parse(resumeData.websites_social_links) : [],
    custom_sections: resumeData.custom_sections ? JSON.parse(resumeData.custom_sections) : [],
    extracurricular_activities: resumeData.extracurricular_activities ? JSON.parse(resumeData.extracurricular_activities) : [],
    references: resumeData.references ? JSON.parse(resumeData.references) : [],
    languages: resumeData.languages ? JSON.parse(resumeData.languages) : [],
    template: RESUME_TEMPLATES[resumeData.template_id as keyof typeof RESUME_TEMPLATES] || null
  };

  res.json(parsedResume);
}));

// Create resume
router.post('/', authenticate, authorize('user'), asyncHandler(async (req: AuthRequest, res) => {
  const {
    title,
    templateId,
    personalInfo,
    professionalSummary,
    workExperience,
    education,
    skills,
    websitesSocialLinks,
    customSections,
    extracurricularActivities,
    hobbies,
    references,
    languages,
    fontFamily,
    paperSize,
    isPrimary = false
  } = req.body;

  if (!title || !templateId) {
    return res.status(400).json({ message: 'Resume title and template are required' });
  }

  if (!RESUME_TEMPLATES[templateId as keyof typeof RESUME_TEMPLATES]) {
    return res.status(400).json({ message: 'Invalid template ID' });
  }

  const connection = getConnection();

  // If setting as primary, unset other primary resumes
  if (isPrimary) {
    await connection.execute(
      'UPDATE resumes SET is_primary = FALSE WHERE user_id = ?',
      [req.user!.id]
    );
  }

  const [result] = await connection.execute(`
    INSERT INTO resumes (
      user_id, title, template_id, status, personal_info, professional_summary,
      work_experience, education, skills, websites_social_links, custom_sections,
      extracurricular_activities, hobbies, \`references\`, languages,
      font_family, paper_size, is_primary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    req.user!.id,
    title,
    templateId,
    'draft',
    JSON.stringify(personalInfo || {}),
    professionalSummary || '',
    JSON.stringify(workExperience || []),
    JSON.stringify(education || []),
    JSON.stringify(skills || []),
    JSON.stringify(websitesSocialLinks || []),
    JSON.stringify(customSections || []),
    JSON.stringify(extracurricularActivities || []),
    hobbies || '',
    JSON.stringify(references || []),
    JSON.stringify(languages || []),
    fontFamily || 'times-new-roman',
    paperSize || 'a4',
    isPrimary
  ]);

  const resumeId = (result as any).insertId;

  res.status(201).json({
    message: 'Resume created successfully',
    resumeId,
    resume: {
      id: resumeId,
      title,
      template_id: templateId,
      status: 'draft',
      template: RESUME_TEMPLATES[templateId as keyof typeof RESUME_TEMPLATES]
    }
  });
}));

// Update resume (full update)
router.put('/:id', authenticate, authorize('user'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const {
    title,
    templateId,
    personalInfo,
    professionalSummary,
    workExperience,
    education,
    skills,
    websitesSocialLinks,
    customSections,
    extracurricularActivities,
    hobbies,
    references,
    languages,
    fontFamily,
    paperSize,
    status,
    isPrimary
  } = req.body;

  const connection = getConnection();

  // Verify resume belongs to user
  const [resume] = await connection.execute(
    'SELECT id, template_id FROM resumes WHERE id = ? AND user_id = ?',
    [id, req.user!.id]
  );

  if ((resume as any[]).length === 0) {
    return res.status(404).json({ message: 'Resume not found' });
  }

  // Validate template if changing
  if (templateId && !RESUME_TEMPLATES[templateId as keyof typeof RESUME_TEMPLATES]) {
    return res.status(400).json({ message: 'Invalid template ID' });
  }

  // If setting as primary, unset other primary resumes
  if (isPrimary) {
    await connection.execute(
      'UPDATE resumes SET is_primary = FALSE WHERE user_id = ? AND id != ?',
      [req.user!.id, id]
    );
  }

  const currentResume = (resume as any[])[0];

  await connection.execute(`
    UPDATE resumes SET
      title = COALESCE(?, title),
      template_id = COALESCE(?, template_id),
      status = COALESCE(?, status),
      personal_info = COALESCE(?, personal_info),
      professional_summary = COALESCE(?, professional_summary),
      work_experience = COALESCE(?, work_experience),
      education = COALESCE(?, education),
      skills = COALESCE(?, skills),
      websites_social_links = COALESCE(?, websites_social_links),
      custom_sections = COALESCE(?, custom_sections),
      extracurricular_activities = COALESCE(?, extracurricular_activities),
      hobbies = COALESCE(?, hobbies),
      \`references\` = COALESCE(?, \`references\`),
      languages = COALESCE(?, languages),
      font_family = COALESCE(?, font_family),
      paper_size = COALESCE(?, paper_size),
      is_primary = COALESCE(?, is_primary),
      updated_at = NOW()
    WHERE id = ? AND user_id = ?
  `, [
    title,
    templateId,
    status,
    personalInfo ? JSON.stringify(personalInfo) : null,
    professionalSummary,
    workExperience ? JSON.stringify(workExperience) : null,
    education ? JSON.stringify(education) : null,
    skills ? JSON.stringify(skills) : null,
    websitesSocialLinks ? JSON.stringify(websitesSocialLinks) : null,
    customSections ? JSON.stringify(customSections) : null,
    extracurricularActivities ? JSON.stringify(extracurricularActivities) : null,
    hobbies,
    references ? JSON.stringify(references) : null,
    languages ? JSON.stringify(languages) : null,
    fontFamily,
    paperSize,
    isPrimary,
    id,
    req.user!.id
  ]);

  res.json({ message: 'Resume updated successfully' });
}));

// Auto-save resume (partial update)
router.patch('/:id/autosave', authenticate, authorize('user'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const updates = req.body;

  const connection = getConnection();

  // Verify resume belongs to user
  const [resume] = await connection.execute(
    'SELECT id FROM resumes WHERE id = ? AND user_id = ?',
    [id, req.user!.id]
  );

  if ((resume as any[]).length === 0) {
    return res.status(404).json({ message: 'Resume not found' });
  }

  // Build dynamic update query based on provided fields
  const updateFields: string[] = [];
  const values: any[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    switch (key) {
      case 'title':
      case 'templateId':
      case 'professionalSummary':
      case 'hobbies':
      case 'fontFamily':
      case 'paperSize':
      case 'status':
        updateFields.push(`${key === 'templateId' ? 'template_id' : key === 'fontFamily' ? 'font_family' : key === 'paperSize' ? 'paper_size' : key === 'professionalSummary' ? 'professional_summary' : key} = ?`);
        values.push(value);
        break;
      case 'personalInfo':
      case 'personal_info':  // Handle snake_case
      case 'workExperience':
      case 'work_experience':  // Handle snake_case
      case 'education':
      case 'skills':
      case 'websitesSocialLinks':
      case 'websites_social_links':  // Handle snake_case
      case 'customSections':
      case 'custom_sections':  // Handle snake_case
      case 'extracurricularActivities':
      case 'extracurricular_activities':  // Handle snake_case
      case 'references':
      case 'languages':
        const dbField = (key === 'personalInfo' || key === 'personal_info') ? 'personal_info' : 
                       (key === 'workExperience' || key === 'work_experience') ? 'work_experience' :
                       (key === 'websitesSocialLinks' || key === 'websites_social_links') ? 'websites_social_links' :
                       (key === 'customSections' || key === 'custom_sections') ? 'custom_sections' :
                       (key === 'extracurricularActivities' || key === 'extracurricular_activities') ? 'extracurricular_activities' :
                       key;
        updateFields.push(`${dbField} = ?`);
        values.push(JSON.stringify(value));
        break;
    }
  });

  if (updateFields.length === 0) {
    return res.json({ message: 'No fields to update' });
  }

  updateFields.push('updated_at = NOW()');
  values.push(id, req.user!.id);

  const query = `UPDATE resumes SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`;
  
  await connection.execute(query, values);

  res.json({ message: 'Resume auto-saved successfully' });
}));

// Delete resume
router.delete('/:id', authenticate, authorize('user'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const connection = getConnection();

  // Verify resume belongs to user
  const [resume] = await connection.execute(
    'SELECT id FROM resumes WHERE id = ? AND user_id = ?',
    [id, req.user!.id]
  );

  if ((resume as any[]).length === 0) {
    return res.status(404).json({ message: 'Resume not found' });
  }

  await connection.execute(
    'DELETE FROM resumes WHERE id = ? AND user_id = ?',
    [id, req.user!.id]
  );

  res.json({ message: 'Resume deleted successfully' });
}));

// Set primary resume
router.patch('/:id/primary', authenticate, authorize('user'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const connection = getConnection();

  // Verify resume belongs to user
  const [resume] = await connection.execute(
    'SELECT id FROM resumes WHERE id = ? AND user_id = ?',
    [id, req.user!.id]
  );

  if ((resume as any[]).length === 0) {
    return res.status(404).json({ message: 'Resume not found' });
  }

  // Unset other primary resumes
  await connection.execute(
    'UPDATE resumes SET is_primary = FALSE WHERE user_id = ?',
    [req.user!.id]
  );

  // Set this resume as primary
  await connection.execute(
    'UPDATE resumes SET is_primary = TRUE WHERE id = ? AND user_id = ?',
    [id, req.user!.id]
  );

  res.json({ message: 'Primary resume updated successfully' });
}));

// Mark resume as completed
router.patch('/:id/complete', authenticate, authorize('user'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const connection = getConnection();

  // Verify resume belongs to user
  const [resume] = await connection.execute(
    'SELECT id FROM resumes WHERE id = ? AND user_id = ?',
    [id, req.user!.id]
  );

  if ((resume as any[]).length === 0) {
    return res.status(404).json({ message: 'Resume not found' });
  }

  await connection.execute(
    'UPDATE resumes SET status = "completed", updated_at = NOW() WHERE id = ? AND user_id = ?',
    [id, req.user!.id]
  );

  res.json({ message: 'Resume marked as completed' });
}));

// Download resume as PDF
router.get('/:id/download', authenticate, authorize('user'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const connection = getConnection();

  // Verify resume belongs to user and get data
  const [resume] = await connection.execute(
    'SELECT * FROM resumes WHERE id = ? AND user_id = ?',
    [id, req.user!.id]
  );

  if ((resume as any[]).length === 0) {
    return res.status(404).json({ message: 'Resume not found' });
  }

  const resumeData = (resume as any[])[0];

  // Update download count
  await connection.execute(
    'UPDATE resumes SET download_count = download_count + 1, last_downloaded = NOW() WHERE id = ? AND user_id = ?',
    [id, req.user!.id]
  );

  // For now, return the resume data - PDF generation will be implemented on the frontend
  // In a production app, you'd generate the PDF here using a library like Puppeteer
  const parsedResume = {
    ...resumeData,
    personal_info: resumeData.personal_info ? JSON.parse(resumeData.personal_info) : {},
    work_experience: resumeData.work_experience ? JSON.parse(resumeData.work_experience) : [],
    education: resumeData.education ? JSON.parse(resumeData.education) : [],
    skills: resumeData.skills ? JSON.parse(resumeData.skills) : [],
    websites_social_links: resumeData.websites_social_links ? JSON.parse(resumeData.websites_social_links) : [],
    custom_sections: resumeData.custom_sections ? JSON.parse(resumeData.custom_sections) : [],
    extracurricular_activities: resumeData.extracurricular_activities ? JSON.parse(resumeData.extracurricular_activities) : [],
    references: resumeData.references ? JSON.parse(resumeData.references) : [],
    languages: resumeData.languages ? JSON.parse(resumeData.languages) : [],
    template: RESUME_TEMPLATES[resumeData.template_id as keyof typeof RESUME_TEMPLATES] || null
  };

  res.json({
    message: 'Resume data for PDF generation',
    resume: parsedResume
  });
}));

// Duplicate resume
router.post('/:id/duplicate', authenticate, authorize('user'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const connection = getConnection();

  // Get original resume
  const [originalResume] = await connection.execute(
    'SELECT * FROM resumes WHERE id = ? AND user_id = ?',
    [id, req.user!.id]
  );

  if ((originalResume as any[]).length === 0) {
    return res.status(404).json({ message: 'Resume not found' });
  }

  const original = (originalResume as any[])[0];
  const newTitle = title || `${original.title} - Copy`;

  // Create duplicate
  const [result] = await connection.execute(`
    INSERT INTO resumes (
      user_id, title, template_id, status, personal_info, professional_summary,
      work_experience, education, skills, websites_social_links, custom_sections,
      extracurricular_activities, hobbies, \`references\`, languages,
      font_family, paper_size, is_primary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    req.user!.id,
    newTitle,
    original.template_id,
    'draft',
    original.personal_info,
    original.professional_summary,
    original.work_experience,
    original.education,
    original.skills,
    original.websites_social_links,
    original.custom_sections,
    original.extracurricular_activities,
    original.hobbies,
    original.references,
    original.languages,
    original.font_family,
    original.paper_size,
    false
  ]);

  const resumeId = (result as any).insertId;

  res.status(201).json({
    message: 'Resume duplicated successfully',
    resumeId,
    resume: {
      id: resumeId,
      title: newTitle,
      template_id: original.template_id,
      status: 'draft',
      template: RESUME_TEMPLATES[original.template_id as keyof typeof RESUME_TEMPLATES]
    }
  });
}));

export default router;
