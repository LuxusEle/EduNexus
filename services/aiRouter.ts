import { GoogleGenAI, Type } from "@google/genai";
import { LessonPack, GradingResult, SourceSet, Quiz } from "../types";

// NOTE: In Production, this key MUST NOT be in client code.
// These methods should call: fetch('https://your-api.com/api/ai/grade', ...)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = "gemini-2.5-flash";

export const aiRouter = {
  
  // --- Material Factory ---
  
  async generateLessonPack(
    topic: string, 
    sourceSet: SourceSet, 
    objectives: string[]
  ): Promise<LessonPack | null> {
    try {
      // Simulate RAG: Retrieve context from sourceSet (mocking vector search)
      const context = sourceSet.sources.map(s => s.content || s.title).join('\n').substring(0, 15000);
      
      const prompt = `
        Role: Academic Curriculum Designer.
        Task: Create a complete Lesson Pack for topic: "${topic}".
        Context: Use the following source material strictly: ${context}
        Objectives: ${objectives.join(', ')}
        
        Output: JSON with title, slides (topic, bullet points, visual image prompt), and worksheet questions.
      `;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              modules: {
                type: Type.OBJECT,
                properties: {
                  slides: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        topic: { type: Type.STRING },
                        content: { type: Type.ARRAY, items: { type: Type.STRING } },
                        imagePrompt: { type: Type.STRING }
                      }
                    }
                  },
                  worksheet: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        question: { type: Type.STRING },
                        difficulty: { type: Type.STRING, enum: ["EASY", "MEDIUM", "HARD"] }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        return {
          id: `lp_${Date.now()}`,
          classId: sourceSet.classId,
          sourceSetId: sourceSet.id,
          status: 'DRAFT',
          title: data.title,
          objectives,
          modules: data.modules
        };
      }
      return null;
    } catch (e) {
      console.error("AI Lesson Gen Error", e);
      return null;
    }
  },

  // --- Marking Factory ---

  async gradeResponse(
    imageBase64: string | undefined, 
    textInput: string | undefined,
    rubricContext: string
  ): Promise<GradingResult | null> {
    try {
      const prompt = `
        Role: Strict Academic Grader.
        Task: Grade this student response against the rubric.
        Rubric/Context: ${rubricContext}
        
        Steps:
        1. If image, extract text/handwriting.
        2. Evaluate against criteria.
        3. Assign confidence score (0-1). If handwriting is illegible or ambiguous, low confidence.
        4. Flag specific issues (ILLEGIBLE, SUSPECTED_CHEATING).
        
        Output: JSON.
      `;

      const parts: any[] = [{ text: prompt }];
      if (imageBase64) {
        parts.push({ inlineData: { mimeType: "image/jpeg", data: imageBase64 } });
      }
      if (textInput) {
        parts.push({ text: `Student Answer Text: ${textInput}` });
      }

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              awardedMarks: { type: Type.NUMBER },
              maxMarks: { type: Type.NUMBER },
              confidence: { type: Type.NUMBER },
              flags: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING, enum: ["ILLEGIBLE", "UNCERTAIN", "SUSPECTED_CHEATING"] } 
              },
              feedback: {
                type: Type.OBJECT,
                properties: {
                  summary: { type: Type.STRING },
                  corrections: { 
                    type: Type.ARRAY, 
                    items: { type: Type.OBJECT, properties: { issue: { type: Type.STRING }, fix: { type: Type.STRING } } } 
                  },
                  nextPractice: {
                     type: Type.ARRAY,
                     items: { type: Type.OBJECT, properties: { skillCode: { type: Type.STRING }, suggestion: { type: Type.STRING } } }
                  }
                }
              },
              safeForStudent: { type: Type.BOOLEAN }
            }
          }
        }
      });

      if (response.text) {
        return JSON.parse(response.text) as GradingResult;
      }
      return null;

    } catch (e) {
      console.error("AI Grading Error", e);
      return null;
    }
  }
};
