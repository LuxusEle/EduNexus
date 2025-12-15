
import { GoogleGenAI, Type } from "@google/genai";
import { LessonPack, GradingResult, SourceSet, Quiz, ClassSettings, AnalysisResult } from "../types";

// NOTE: In Production, this key MUST NOT be in client code.
// These methods should call: fetch('https://your-api.com/api/ai/grade', ...)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = "gemini-2.5-flash";

export const aiRouter = {
  
  // --- Metadata Extraction (Pre-generation) ---
  async extractMetadata(sourceSet: SourceSet): Promise<AnalysisResult[] | null> {
    try {
      // Limit context to avoid token limits during quick scan
      const context = sourceSet.sources.map(s => `Title: ${s.title}\nContent Preview: ${s.content?.substring(0, 500)}`).join('\n\n');
      
      const prompt = `
        Analyze the provided source materials to build a "Syllabus Learning Map".
        
        Task:
        1. Identify 3-5 distinct MAJOR topics.
        2. Assign a 'weight' (High/Medium/Low) based on the volume/complexity of content.
        3. For each topic, break it down into atomic learning objectives.
        4. CRITICAL: Each objective must have "subPoints" that go indepth. Do not just give one liners. Expand on what needs to be taught.
        
        If the content is sparse, infer standard academic structure from the titles.
        
        Source Content: 
        ${context}
      `;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                weight: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                objectives: { 
                    type: Type.ARRAY, 
                    items: { 
                        type: Type.OBJECT, 
                        properties: {
                            id: { type: Type.STRING },
                            main: { type: Type.STRING },
                            subPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    } 
                }
              }
            }
          }
        }
      });

      if (response.text) {
        // Post-process to ensure IDs exist if AI missed them
        const data = JSON.parse(response.text) as AnalysisResult[];
        return data.map((d, i) => ({
            ...d,
            objectives: d.objectives.map((o, j) => ({
                ...o,
                id: o.id || `${i}-${j}`
            }))
        }));
      }
      return null;
    } catch (e) {
      console.error("Extraction Error", e);
      return null;
    }
  },

  // --- Material Factory ---
  
  async generateLessonPack(
    topic: string, 
    sourceSet: SourceSet, 
    objectives: string[],
    settings: ClassSettings
  ): Promise<LessonPack | null> {
    try {
      // Simulate RAG: Retrieve context from sourceSet (mocking vector search)
      const context = sourceSet.sources.map(s => s.content || s.title).join('\n').substring(0, 15000);
      
      const prompt = `
        Role: Expert Curriculum Designer for ${settings.educationSystem} (${settings.gradeLevel}).
        Language: ${settings.language}.
        Task: Create a detailed Lesson Pack for topic: "${topic}".
        
        Requirements:
        1. Content must be detailed and academic, suitable for Grade ${settings.gradeLevel}.
        2. Include Latex equations where applicable.
        3. Describe diagrams needed for the slide in detail.
        4. Suggest 2 high-quality web resources (URLs) for the teacher to review per slide.
        
        Context: Use the following source material strictly: ${context}
        Objectives to cover: 
        ${objectives.join('\n')}
        
        Output: JSON with title, slides, and worksheet questions.
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
                        id: { type: Type.STRING },
                        topic: { type: Type.STRING },
                        content: { type: Type.ARRAY, items: { type: Type.STRING } },
                        equations: { type: Type.ARRAY, items: { type: Type.STRING } },
                        diagramDescription: { type: Type.STRING },
                        webResources: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT, 
                                properties: { title: {type: Type.STRING}, url: {type: Type.STRING} } 
                            } 
                        }
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
        // Safely extract title and modules
        return {
          id: `lp_${Date.now()}`,
          classId: sourceSet.classId,
          sourceSetId: sourceSet.id,
          status: 'DRAFT',
          title: data.title || "Untitled Lesson",
          objectives,
          modules: data.modules || { slides: [], worksheet: [] }
        };
      }
      return null;
    } catch (e) {
      console.error("AI Lesson Gen Error", e);
      return null;
    }
  },

  // --- Slide Modification with Visual Context ---
  async modifySlide(
    currentSlideJSON: string, 
    instruction: string, 
    annotatedImageBase64?: string
  ): Promise<any | null> {
    try {
        const parts: any[] = [
            { text: `You are a helpful teaching assistant. Modify this slide JSON based on the user's request.
                     Current Slide: ${currentSlideJSON}
                     Instruction: ${instruction}
                     
                     If an image is provided, it contains red circles or markings indicating exactly what needs to change.
                     Return the full updated JSON for the slide.` }
        ];

        if (annotatedImageBase64) {
            parts.push({ inlineData: { mimeType: "image/png", data: annotatedImageBase64 } });
        }

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: { parts },
            config: { responseMimeType: "application/json" }
        });

        if (response.text) return JSON.parse(response.text);
        return null;
    } catch (e) {
        console.error("Slide mod error", e);
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
