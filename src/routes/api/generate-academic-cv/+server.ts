import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';

export const POST: RequestHandler = async ({ request, locals: { supabase, getSession } }) => {
    const session = await getSession();
    
    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Define schema for validation
    const academicCvSchema = z.object({
        cvData: z.object({
            personalInfo: z.object({
                fullName: z.string().min(1).max(100),
                email: z.string().email(),
                phone: z.string().max(20).optional(),
                address: z.string().max(200).optional(),
                linkedin: z.string().url().optional(),
                website: z.string().url().optional()
            }),
            academicField: z.string().min(1).max(100),
            education: z.array(z.any()).optional().default([]),
            experience: z.array(z.any()).optional().default([]),
            publications: z.array(z.any()).optional().default([]),
            skills: z.array(z.string()).optional().default([]),
            awards: z.array(z.any()).optional().default([]),
            languages: z.array(z.string()).optional().default([]),
            certifications: z.array(z.any()).optional().default([])
        })
    });

    try {
        const requestData = await request.json();

        // Validate and sanitize input
        const parsed = academicCvSchema.safeParse(requestData);
        if (!parsed.success) {
            return json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
        }
        const data = parsed.data;
        
        // Validate required fields
        if (!data.cvData.personalInfo?.fullName || !data.cvData.personalInfo?.email) {
            return json(
                { error: 'Name and email are required' },
                { status: 400 }
            );
        }
        
        // Simulate processing time for realistic UX
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create mock download URLs
        // In production, you'd:
        // 1. Generate actual PDF/DOCX using AI + document libraries
        // 2. Upload to storage (S3, etc.)
        // 3. Return real download URLs
        
        const timestamp = Date.now();
        const safeName = data.cvData.personalInfo.fullName
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase();
        const fileName = `academic-cv-${safeName}-${timestamp}`;
        
        const response = {
            pdf_url: `/generated-cvs/${fileName}.pdf`,
            docx_url: `/generated-cvs/${fileName}.docx`,
            generated_at: new Date().toISOString(),
            field: data.cvData.academicField,
            sections_included: [
                'Personal Information',
                'Education', 
                'Professional Experience',
                data.cvData.publications.length > 0 ? 'Publications' : null,
                'Skills & Competencies',
                data.cvData.awards.length > 0 ? 'Awards & Honors' : null
            ].filter(Boolean),
            // Include a text preview for demo purposes
            preview: generateCVPreview(data.cvData)
        };
        
        return json({
            success: true,
            ...response
        });
        
    } catch (error) {
        console.error('Error generating academic CV:', error);
        return json({ error: 'Failed to generate academic CV' }, { status: 500 });
    }
};

function generateCVPreview(cvData: any): string {
    // Generate a text preview to show what the CV contains
    let preview = `${cvData.personalInfo.fullName.toUpperCase()}\n`;
    preview += `${cvData.personalInfo.email}`;
    if (cvData.personalInfo.phone) preview += ` | ${cvData.personalInfo.phone}`;
    if (cvData.personalInfo.address) preview += `\n${cvData.personalInfo.address}`;
    preview += `\n\n${'='.repeat(50)}\n`;
    
    // Education
    if (cvData.education.length > 0) {
        preview += `\nEDUCATION\n`;
        cvData.education.forEach((edu: any) => {
            if (edu.degree && edu.institution) {
                preview += `• ${edu.degree}, ${edu.institution}`;
                if (edu.year) preview += ` (${edu.year})`;
                preview += '\n';
            }
        });
    }
    
    // Experience
    if (cvData.experience.length > 0) {
        preview += `\nPROFESSIONAL EXPERIENCE\n`;
        cvData.experience.forEach((exp: any) => {
            if (exp.title && exp.institution) {
                preview += `• ${exp.title}, ${exp.institution}`;
                if (exp.duration) preview += ` (${exp.duration})`;
                preview += '\n';
            }
        });
    }
    
    // Publications
    if (cvData.publications.length > 0) {
        preview += `\nPUBLICATIONS\n`;
        cvData.publications.slice(0, 3).forEach((pub: any) => {
            if (pub.title && pub.journal) {
                preview += `• ${pub.title}. ${pub.journal}`;
                if (pub.year) preview += ` (${pub.year})`;
                preview += '\n';
            }
        });
        if (cvData.publications.length > 3) {
            preview += `... and ${cvData.publications.length - 3} more\n`;
        }
    }
    
    // Skills
    if (cvData.skills.technical.length > 0 || cvData.skills.software.length > 0) {
        preview += `\nSKILLS & COMPETENCIES\n`;
        if (cvData.skills.technical.length > 0) {
            preview += `Technical: ${cvData.skills.technical.join(', ')}\n`;
        }
        if (cvData.skills.software.length > 0) {
            preview += `Software: ${cvData.skills.software.join(', ')}\n`;
        }
    }
    
    preview += `\n${'='.repeat(50)}\n`;
    preview += `Academic Field: ${cvData.academicField.replace('_', ' ').toUpperCase()}`;
    
    return preview;
}