import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate a professional Job Description using Gemini AI
 * @param {Object} offerDetails - Details from offer
 * @param {Object} additionalDetails - Additional HR details
 * @returns {Promise<Object>} Generated JD content
 */
export const generateJDWithAI = async (offerDetails, additionalDetails) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert HR professional and job description writer. Create a professional, comprehensive job description based on the following information:

**Offer Details:**
- Job Title: ${offerDetails.jobTitle}
- Location: ${offerDetails.location}${offerDetails.city ? `, ${offerDetails.city}` : ""}
- Employment Type: ${offerDetails.employmentType}
- Positions Available: ${offerDetails.positionAvailable}
- Salary: ${offerDetails.salary} ${offerDetails.currency}
- Required Skills: ${offerDetails.skills.join(", ")}
- Preferred Skills: ${offerDetails.preferredSkills && offerDetails.preferredSkills.length > 0 ? offerDetails.preferredSkills.join(", ") : "None specified"}
- Experience Required: ${offerDetails.experience}

**Additional HR Details:**
- Company Name: ${additionalDetails.companyName || "Not specified"}
- Key Responsibilities: ${additionalDetails.keyResponsibilities || "Not specified"}
- Required Qualifications: ${additionalDetails.qualifications || "Not specified"}
- Benefits: ${additionalDetails.benefits || "Not specified"}
- Company Culture/Additional Notes: ${additionalDetails.additionalNotes || "Not specified"}

Please generate a professional job description with the following sections in JSON format:
{
  "jobSummary": "A compelling 2-3 sentence overview of the position",
  "responsibilities": ["Array of 6-8 key responsibilities"],
  "requirements": ["Array of 6-8 essential requirements and qualifications"],
  "benefits": ["Array of benefits and perks"],
  "additionalInfo": "Any additional information about the role or company culture"
}

Make sure the description is professional, engaging, and tailored to attract the right candidates.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response as JSON");
    }

    const generatedJD = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      data: generatedJD,
      raw: text,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Filter resumes with AI for a JD
// export async function filterResumesWithAI(jd, candidates) {
//   try {
//     const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
//  const prompt = `
// You are a senior technical recruiter and professional resume evaluator.

// Your job: 
// For each candidate, **download and analyze the resume from the provided URL**.
// You MUST read the file content. DO NOT guess. If the resume cannot be analyzed, mark the candidate as unfiltered with explanation.

// STRICT RULES:
// 1. Determine if the file is an actual resume (CV/biodata). 
//    - If it looks like a marksheet, photo, certificate, or unrelated file → mark as unfiltered.
// 2. Extract skills, experience, education, and job-role relevance from the resume.
// 3. Compare it with the Job Description.

// Job Description:
// Title: ${jd.jobSummary}
// Responsibilities: ${jd.responsibilities.join(", ")}
// Requirements: ${jd.requirements.join(", ")}

// Return JSON ONLY in this format:
// {
//   "filtered": [
//     {
//       "id": "candidateId",
//       "score": 0-100,
//       "explanation": "1-2 sentence professional explanation"
//     }
//   ],
//   "unfiltered": [
//     {
//       "id": "candidateId",
//       "score": 0-100,
//       "explanation": "1-2 sentence professional explanation"
//     }
//   ]
// }

// Candidates:
// ${candidates.map(c => `
// {
//   "id": "${c.id}",
//   "name": "${c.name}",
//   "email": "${c.email}",
//   "resumeUrl": "${c.resume}",
//   "reallocate": ${c.reallocate}
// }
// `).join("\n")}

// VERY IMPORTANT:
// - Only mark a candidate as "filtered" if their resume content **strongly matches** the JD.
// - If resume is low quality, blank, marksheet, image, certificate → put in unfiltered and explain.
// - Be strict and professional like a real recruiter.
// `;

//     const result = await model.generateContent(prompt);
//     const response = result.response;
//     const text = response.text();
//     const jsonMatch = text.match(/\{[\s\S]*\}/);
//     if (!jsonMatch) throw new Error("Failed to parse AI response as JSON");
//     const parsed = JSON.parse(jsonMatch[0]);
//     return { success: true, filtered: parsed.filtered, unfiltered: parsed.unfiltered };
//   } catch (error) {
//     return { success: false, error: error.message };
//   }
// }




export async function downloadFile(url) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data, "binary");
}


// export async function extractResumeText(resumeUrl) {
//   const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

//   const prompt = `
// You MUST open and read the file from this URL: ${resumeUrl}

// Your job:
// 1. Extract ALL readable text from the file.
// 2. DO NOT ASSUME anything.
// 3. If the file seems like a marksheet, photo, certificate, school document, or non-resume → clearly state it.

// Return ONLY this JSON:
// {
//   "isResume": true/false,
//   "content": "full extracted text or reason why not a resume"
// }
// `;

//   const result = await model.generateContent(prompt);
//   const text = result.response.text();
//   const json = text.match(/\{[\s\S]*\}/);

//   return JSON.parse(json[0]);
// }


function sanitizeJSON(str) {
  if (!str) return "";
  return str.replace(/[\u0000-\u0019]+/g, " ");
}


export async function extractResumeText(resumeUrl) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const fileBuffer = await downloadFile(resumeUrl);

  const result = await model.generateContent([
    {
      inlineData: {
        data: fileBuffer.toString("base64"),
        mimeType: "application/pdf",
      },
    },
    {
      text: `
Extract ALL text from this document.
Tell whether it's a resume or not.
Return JSON:
{
  "isResume": true/false,
  "content": "text"
}
`
    }
  ]);

  const text = sanitizeJSON(result.response.text());
  const json = text.match(/\{[\s\S]*\}/);

  return JSON.parse(json[0]);
}



export async function evaluateResume(jd, candidate, extractedText) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
You are a strict senior technical recruiter.

Here is the Job Description:
Title: ${jd.jobSummary}
Responsibilities: ${jd.responsibilities.join(", ")}
Requirements: ${jd.requirements.join(", ")}

Candidate Resume Extracted Content:
${extractedText}

Rules:
- If the resume is NOT a resume → score 0, unfiltered, explanation why.
- If resume is real → match skills, experience, tech stack, responsibilities.
- Be strict. No guessing. Only rely on extracted text.

Return ONLY this JSON:
{
  "id": "${candidate.id}",
  "score": number,
  "explanation": "1-2 sentence professional explanation"
}
`;

  const result = await model.generateContent(prompt);
  const text = sanitizeJSON(result.response.text());
  const json = text.match(/\{[\s\S]*\}/);

  return JSON.parse(json[0]);
}


export async function filterResumesWithAI(jd, candidates) {
  try {
    const filtered = [];
    const unfiltered = [];

    for (const candidate of candidates) {

      // Step 1: Extract resume text
      const extraction = await extractResumeText(candidate.resume);

      if (!extraction.isResume) {
        // unfiltered.push({
        //   id: candidate.id,
        //   score: 0,
        //   explanation: "The uploaded document is not a resume. " + extraction.content
        // });
        unfiltered.push({
          id: candidate.id,
          score: 0,
          explanation: sanitizeJSON("The uploaded document is not a resume. " + extraction.content)
        });
        continue;
      }

      // Step 2: Evaluate based on JD
      const evaluation = await evaluateResume(jd, candidate, extraction.content);

      // Score threshold - you can adjust
      if (evaluation.score >= 60) {
        filtered.push(evaluation);
      } else {
        unfiltered.push(evaluation);
      }
    }

    return { success: true, filtered, unfiltered };
  } catch (error) {
    return { success: false, error: error.message };
  }
}


export default { generateJDWithAI };
