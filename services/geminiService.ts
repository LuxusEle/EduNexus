import { GoogleGenAI, Type } from "@google/genai";
import { Quiz, GradingResult, StudyPlan } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

/**
 * Generates a structured study plan JSON with image prompts for slides.
 */
export const generateStudyPlan = async (content: string, topic: string): Promise<StudyPlan | null> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `You are an expert academic curriculum planner. 
      
      Instructions:
      1. Analyze the provided "Target Subject" and "Available Source Materials".
      2. Since full document content might be unavailable (simulated), strictly infer the curriculum topics from the file names provided in the source materials and the user's target subject.
      3. Generate a structured week-by-week study plan that matches the ${topic} subject.
      4. For each week (slide), provide a visual image description (slideImagePrompt) that represents the key concept.

      Input Data:
      ${content.substring(0, 15000)}... 
      
      Return the output in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            contextSummary: { type: Type.STRING },
            weeks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  weekNumber: { type: Type.INTEGER },
                  topic: { type: Type.STRING },
                  objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                  keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                  slideImagePrompt: { type: Type.STRING, description: "A detailed visual description of an image to illustrate this slide, approx 15 words." }
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
        id: Date.now().toString(),
        generatedDate: new Date().toISOString(),
        ...data
      } as StudyPlan;
    }
    return null;
  } catch (error) {
    console.error("Error generating study plan:", error);
    return null;
  }
};

/**
 * Updates an existing study plan based on user chat input.
 */
export const updateStudyPlan = async (currentPlan: StudyPlan, userInstruction: string): Promise<StudyPlan | null> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `You are an AI assistant helping a teacher edit a study plan/presentation.
      
      Current Plan JSON:
      ${JSON.stringify(currentPlan)}

      User Instruction:
      "${userInstruction}"

      Modify the JSON to satisfy the user's request. Maintain the same schema. Return the full updated JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            contextSummary: { type: Type.STRING },
            weeks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  weekNumber: { type: Type.INTEGER },
                  topic: { type: Type.STRING },
                  objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                  keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                  slideImagePrompt: { type: Type.STRING }
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
        ...currentPlan,
        ...data,
        id: currentPlan.id // Keep same ID
      } as StudyPlan;
    }
    return null;
  } catch (error) {
    console.error("Error updating study plan:", error);
    return null;
  }
};

/**
 * Generates a quiz based on a topic and difficulty.
 */
export const generateQuiz = async (topic: string, difficulty: string): Promise<Quiz | null> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Create a ${difficulty} difficulty quiz with 5 multiple choice questions about "${topic}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  topic: { type: Type.STRING }
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
        id: Date.now().toString(),
        generatedDate: new Date().toISOString(),
        ...data
      } as Quiz;
    }
    return null;
  } catch (error) {
    console.error("Error generating quiz:", error);
    return null;
  }
};

/**
 * Grades a handwritten answer image.
 */
export const gradeStudentAnswer = async (imageBase64: string, context: string): Promise<GradingResult | null> => {
  try {
    const prompt = `You are a strict academic grader. 
    Analyze this image of a student's answer. 
    The expected topic/context is: "${context}".
    
    1. Read the handwriting.
    2. Compare it against standard academic correctness for the topic.
    3. Grade it out of 10.
    4. Provide specific feedback.
    5. Identify error types (e.g., Calculation Error, Conceptual Understanding, Formatting).
    
    Return the result in JSON format.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            maxScore: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            errorAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  description: { type: Type.STRING },
                  severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
                }
              }
            },
            topicTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as GradingResult;
    }
    return null;
  } catch (error) {
    console.error("Error grading answer:", error);
    return null;
  }
};