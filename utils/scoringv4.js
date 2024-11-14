import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { config } from "dotenv";

config({ path: './../.env' });

const apiKey = process.env.OPENAI_API_KEY;
const model = new ChatOpenAI({ apiKey: apiKey, model: "gpt-4o" });
const embeddings = new OpenAIEmbeddings({ apiKey: apiKey });

async function aiEvaluateScore(data) {

    const predefined_symptoms = JSON.stringify(data.predefined_symptoms);
    const predefined_mandatory_questions = JSON.stringify(data.predefined_Mandatory_questions);
    const student_mandatory_questions = JSON.stringify(data.student_mandatory_questions);
    const student_symptoms = JSON.stringify(data.student_symptoms);
    const predefined_diagnosis = JSON.stringify(data.predefined_diagnosis);
    const student_diagnosis = JSON.stringify(data.student_diagnosis);
    const predefined_appropriate_treatments = JSON.stringify(data.predefined_appropriate_treatments);
    const student_appropriate_treatments = JSON.stringify(data.student_appropriate_treatments);
    
    const promptTemplate = ChatPromptTemplate.fromMessages([
      { 
        role: "system", 
        content: `
          You are an examiner who evaluates student responses for accuracy and completeness. Given the data of predefined correct answers and the student's responses, Analyze the data properly, score the student's performance out of 100 based on the following criteria:
          
          - **Mandatory Questions** (45%): Evaluate if the student's questions address the key areas in the mandatory questions provided.
          - **Symptoms Recording** (40%): Check if the student has correctly recorded relevant symptoms and the accuracy of their descriptions.
          - **Diagnosis Accuracy** (10%): Assess the accuracy of the student's diagnosis.
          - **Treatment Appropriateness** (5%): Review the suggested treatments to see if they align with correct treatments.
    
          Provide a structured response including:
          - **Score**: Overall Percentage out of 100 reflecting the overall accuracy and completeness.
          - **Details**: Breakdown of scores percentage between 0 to 100 for each section (Mandatory Questions, Symptoms, Diagnosis, Treatments).
          - **Feedback**: Specific suggestions on areas where the student performed well or needs improvement.
        ` 
      },
      { 
        role: "user", 
        content: `
          Here is the data:
          
          - **Predefined Mandatory Questions**: ${predefined_mandatory_questions}
          - **Student Mandatory Questions**: ${student_mandatory_questions}
          - **Predefined Symptoms**: ${{predefined_symptoms}}
          - **Student Symptoms**: ${{student_symptoms}}
          - **Predefined Diagnosis**: ${predefined_diagnosis}
          - **Student Diagnosis**: ${student_diagnosis}
          - **Predefined Treatments**: ${predefined_appropriate_treatments}
          - **Student Treatments**: ${student_appropriate_treatments}
        `
      }
    ]);

    const parser = new StringOutputParser();
    const llmChain = promptTemplate.pipe(model).pipe(parser);

    const response = await llmChain.invoke({});
    return response;
}

// Example usage
(async () => {
    const data = {
       predefined_mandatory_questions: [
            "This is test Mandatory Question"
        ],
        student_mandatory_questions: [
            "can you tell me what's your name",
            "okay so can you tell me how long have you been experiencing these symptoms"
        ],
        predefined_appropriate_treatments: [
            "This is test predefined treatment."
        ],
        student_appropriate_treatments: [],
        predefined_diagnosis: [
            "Death"
        ],
        student_diagnosis: [
            "This is dead bot"
        ],
        predefined_symptoms: [
            {
                name: "Fatigue",
                severity: "moderate",
                description: "Feeling tired"
            },
            {
                name: "Joint pain",
                severity: "mild",
                description: "Pain in left joint"
            }
        ],
        student_symptoms: [
            {
                name: "Fatigue",
                indication: "positive"
            },
            {
                name: "Joint pain",
                indication: "positive"
            }
        ],
        student_questions_on_symptoms: [
            "okay so can you tell me how long have you been experiencing these symptoms"
        ]
    };

    const result = await aiEvaluateScore(data);
    console.log(result);
})();
