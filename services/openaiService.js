// src/services/langchainService.js
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { config } from "dotenv";

config({ path: './../.env' });

const apiKey = process.env.OPENAI_API_KEY;
const model = new ChatOpenAI({ apiKey: apiKey, model: "gpt-4o", maxTokens: 8000 });

// Function to extract information from student and predefined data
export async function extractInformation(studentData, predefinedData) {
    const promptTemplate = ChatPromptTemplate.fromMessages([
        {
            role: "system",
            content: "You are an assistant that extracts medical information from conversational and paragraph data."
        },
        {
            role: "user",
            content: `
                Extract the following information from the provided data in JSON format only.
                
                Student Data: ${studentData}
                
                Predefined Data: ${predefinedData}
                
                JSON output format:
                {{
                    "predefined_mandatory_questions": [],
                    "student_mandatory_questions": [],
                    "predefined_appropriate_treatments": [],
                    "student_appropriate_treatments": [],
                    "predefined_diagnosis": [],
                    "student_diagnosis": [],
                    "predefined_symptoms": [],
                    "student_symptoms": []
                }}
                
                Only respond with the JSON object, and ensure no extra text is included.
            `
        }
    ]);

    const parser = new StringOutputParser();
    const llmChain = promptTemplate.pipe(model).pipe(parser);

    try {
        // Invoke the model with the constructed template
        const result = await llmChain.invoke({});
        const cleanResult = result.replace('```json', '').replace('```', ''); // Clean JSON formatting artifacts

        // Parse the result as JSON
        const structuredData = JSON.parse(cleanResult);
        return structuredData;
    } catch (error) {
        console.error("Error parsing LangChain response:", error);
        throw new Error("An error occurred while processing the data.");
    }
}
export async function extractInformationSummary(studentData, predefinedData) {
    const promptTemplate = ChatPromptTemplate.fromMessages([
        {
            role: "system",
            content: "You are an assistant providing a comprehensive summary of a medical training session, including details on student interactions and predefined patient data."
        },
        {
            role: "user",
            content: `
                Provide a detailed summary of the following data. Include information about the student's questions, findings, and comparisons with the predefined patient data:
                
                Student Data: ${studentData}
                
                Predefined Data: ${predefinedData}
                
                Summary:
                - What questions the student asked.
                - What findings the student identified.
                - Comparison with predefined symptoms, treatments, and diagnosis.
                - Include key points, differences, and completeness of the student's assessment.
                - It should be a statistical summary as it is going to be used for scoring and marking.
                - Each scenario and detail question answers should be highlighted in the summary.
                
                Only provide a clear, narrative summary without JSON formatting.
            `
        }
    ]);

    const parser = new StringOutputParser();
    const llmChain = promptTemplate.pipe(model).pipe(parser);

    try {
        // Invoke the model with the constructed template
        const result = await llmChain.invoke({});
        return result.trim();
    } catch (error) {
        console.error("Error generating summary with LangChain:", error);
        throw new Error("An error occurred while generating the summary.");
    }
}

// Function to calculate the score and provide feedback based on the summary
export async function calculateScore(string) {
const summary = JSON.stringify(string);

    const promptTemplate = ChatPromptTemplate.fromMessages([
        {
            role: "system",
            content: "You are a tutor evaluating a student's performance based on a medical training summary. You will evaluate the student based on specific scoring criteria and provide scores for each section, along with constructive feedback."
        },
        {
            role: "user",
            content: `
                Based on the following information, assess the student's performance. Provide scores for each of the following sections, with a total score out of 100. Additionally, provide detailed feedback for each section.

                Scoring Criteria:
                1. Proportion of mandatory questions asked: [45% of total score].
                2. Proportion of positive symptoms included in the note: [40% of total score].
                3. Correct diagnosis: [10% of total score].
                4. Appropriate treatments: [5% of total score].

               Detailed Summary:  ${{ summary }}

                Response Format:
            Total Score:
            Each Section Score:
            Overall feedback:
            Each Section Feedback: 

                Please evaluate the student's performance based on the provided scoring criteria and give feedback for each section accordingly.
            `
        }
    ]);

    const parser = new StringOutputParser();
    const llmChain = promptTemplate.pipe(model).pipe(parser);

    try {
        // Invoke the model to get the score and feedback
        const result = await llmChain.invoke({});

        // Clean JSON formatting artifacts if present
        const cleanResult = result.replace('```json', '').replace('```', '').trim();

        // Parse the result as JSON
        const structuredData = cleanResult;

        return structuredData;
    } catch (error) {
        console.error("Error calculating score with LangChain:", error);
        throw new Error("An error occurred while calculating the score.");
    }
}
