import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { config } from "dotenv";

config({ path: './../.env' });

const apiKey = process.env.OPENAI_API_KEY;
const model = new ChatOpenAI({ apiKey: apiKey, model: "gpt-4" });
const embeddings = new OpenAIEmbeddings({ apiKey: apiKey });

async function aiEvaluateScore(data) {

   const predefined_symptoms =  JSON.stringify(data.predefined_symptoms)
    const promptTemplate = ChatPromptTemplate.fromMessages([

        
        { role: "system", content: `
            You are an examiner who evaluates student responses for accuracy and completeness. Given the dataset of predefined correct answers and the student's responses, rate the student's performance out of 100 based on the following criteria:
            
            - **Mandatory Questions** (45%): Evaluate if the student's questions address the key areas in the mandatory questions provided.
            - **Symptoms Recording** (40%): Check if the student has correctly recorded relevant symptoms and the accuracy of their descriptions.
            - **Diagnosis Accuracy** (10%): Assess the accuracy of the student's diagnosis.
            - **Treatment Appropriateness** (5%): Review the suggested treatments to see if they align with correct treatments.

            Provide a structured response including:
            - **Score**: A single number out of 100 reflecting the overall accuracy and completeness.
            - **Details**: Breakdown of scores for each section (Mandatory Questions, Symptoms, Diagnosis, Treatments).
            - **Feedback**: Specific suggestions on areas where the student performed well or needs improvement.
        `},
        { role: "user", content: `
            Here is the data:
            
            - **Predefined Mandatory Questions**: ${JSON.stringify(data.predefined_Mandatory_questions)}
            - **Student Mandatory Questions**: ${JSON.stringify(data.student_mandatory_questions)}
            - **Predefined Symptoms**: ${{predefined_symptoms}}
            - **Student Symptoms**: ${JSON.stringify(data.student_symptoms)}
            - **Predefined Diagnosis**: ${JSON.stringify(data.predefined_diagnosis)}
            - **Student Diagnosis**: ${JSON.stringify(data.student_diagnosis)}
            - **Predefined Treatments**: ${JSON.stringify(data.predefined_appropriate_treatments)}
            - **Student Treatments**: ${JSON.stringify(data.student_appropriate_treatments)}
        `}
    ]);

    const parser = new StringOutputParser();
    const llmChain = promptTemplate.pipe(model).pipe(parser);

    const response = await llmChain.invoke({});
    return response;
}

// Example usage
(async () => {
    const data = {
        predefined_Mandatory_questions: ["You have to deal with it"],
        student_mandatory_questions: [
            "Can you please introduce yourself and let me know how you would approach a patient like me with the symptoms provided above?",
            "As a medical student, you would start by introducing yourself to me as the patient. You would inquire about my symptoms and ask about the details of the symptoms, such as when they started, how severe they are, and if there are any factors that worsen or improve them. You would also ask about any relevant medical history or medications I may be taking"
        ],
        predefined_appropriate_treatments: [],
        student_appropriate_treatments: [],
        predefined_diagnosis: ["Death"],
        student_diagnosis: ["Cancer"],
        predefined_symptoms: [
            { Name: "Headache", Severity: "severe", Description: "Intense headache" }
        ],
        student_symptoms: []
    };

    const result = await aiEvaluateScore(data);
    console.log(result);
})();
