import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ApiKey, ChatGPTModel } from "../models/index.js"; // Import your ORM model for API keys

let model;

async function initializeModel() {
    try {
        // Fetch the first active API key for OpenAI from the database
        const apiKeyRecord = await ApiKey.findOne({
            where: { service: "OpenAI", isActive: true },
            include: [
                {
                    model: ChatGPTModel, // Assuming you have defined the association
                    as: "model", // Use the alias defined in your Sequelize relationship
                },
            ],
            order: [["createdAt", "ASC"]], // Use the oldest key first
        });

        if (!apiKeyRecord) {
            throw new Error("No active API key found for OpenAI.");
        }



        // Extract the API key
        const apiKey = apiKeyRecord.apiKey;

        // Extract model details from the included ChatGPTModel table
        const modelDetails = apiKeyRecord.model;

        if (!modelDetails) {
            throw new Error(`Model details not found for modelId: ${apiKeyRecord.modelId}`);
        }



        // Initialize the model
        model = new ChatOpenAI({
            apiKey: apiKey,
            model:  modelDetails.modelName || 'gpt-4o',
            maxTokens: modelDetails.maxTokens || 8000,
            temperature: 0.3// Default to 8000 if maxTokens is not defined
        });
    } catch (error) {
        console.error("Error initializing model with API key:", error.message);
        throw new Error("Failed to initialize model with API key.");
    }
}


// Function to extract information from student and predefined data
export async function extractInformation(studentData, predefinedData) {
    if (!model) {
        await initializeModel();
    }

    const promptTemplate = ChatPromptTemplate.fromMessages([
        {
            role: "system",
            content: `You are an assistant tasked with extracting medical information from both predefined data and note submitted by the student. You need to categorize extracted information into two main parts: "Predefined Data" and "Student-Provided Data". Analyze the conversation. Pay special attention to the student’s messages, particularly any questions they ask, symptoms discussed, and whether those symptoms are identified as positive or negative. This information will be used for evaluating the student's performance.`,
        },
        {
            role: "user",
            content: `
                Extract the requested information from the provided data below. Ensure your response is in JSON format only, without additional text or explanations.

                Data Categories:
                1. **Predefined Data** - Includes mandatory questions, appropriate treatments, diagnosis, and symptoms provided beforehand.
                2. **Student-Provided Data** - Includes mandatory questions asked by the student, treatments suggested, diagnosis made, and symptoms discussed by the student during the conversation. Note if the student has asked about symptoms, and specify whether those symptoms were positive or negative.

                Data Input:
                - Student Conversation Data: ${studentData}
                - Predefined Patient Data: ${predefinedData}

                Expected JSON Output Format:
                {{ 
                    "predefined_mandatory_questions": [],
                    "student_mandatory_questions": [],
                    "predefined_appropriate_treatments": [],
                    "student_appropriate_treatments": [],
                    "predefined_diagnosis": [],
                    "student_diagnosis": [],
                    "predefined_symptoms": [],
                    "student_symptoms":  [],
                   
                }}

                Make sure the response strictly follows the JSON format above. Do not include any additional text or commentary. Focus on ensuring that all relevant information is accurately categorized and extracted.
            `,
        },
    ]);

    const parser = new StringOutputParser();
    const llmChain = promptTemplate.pipe(model).pipe(parser);

    try {
        const result = await llmChain.invoke({});
        const cleanResult = result.replace("```json", "").replace("```", ""); // Clean JSON formatting artifacts

        const structuredData = JSON.parse(cleanResult);
        return structuredData;
    } catch (error) {
        console.error("Error parsing LangChain response:", error);
        throw new Error("An error occurred while processing the data.");
    }
}

// Other functions like `extractInformationSummary` and `calculateScore` would follow the same pattern of checking and initializing the `model` if not already initialized.
export async function extractInformationSummary(studentData, predefinedData) {
    if (!model) {
        await initializeModel(); // Ensure the model is initialized with the correct API key
    }

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
                - Provide a statistical summary, as this will be used for scoring and marking.
                - Each scenario and detailed question-answer pairs should be highlighted in the summary.

                Please provide a clear, narrative summary without JSON formatting.
            `
        }
    ]);

    const parser = new StringOutputParser();
    const llmChain = promptTemplate.pipe(model).pipe(parser);

    try {
        // Invoke the model with the constructed template
        const result = await llmChain.invoke({});
        return result.trim(); // Return the plain-text summary
    } catch (error) {
        console.error("Error generating summary with LangChain:", error);
        throw new Error("An error occurred while generating the summary.");
    }
}

// Function to calculate the score and provide feedback based on the summary
export async function calculateScore(string, json) {
    const summary = JSON.stringify(string);
    const structuredData = JSON.stringify(json);

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

                Detailed Summary:  ${summary}

                Structured Data: ${{ structuredData }}

                Expected JSON Output Format:
                {{ 
                    "total_score": "",
                    "mandatory_question_score": "",
                    "treatments_score": "",
                    "diagnosis_score": "",
                    "symptoms_score": "",
                    "feedback": ""
                }}

                Please evaluate the student's performance based on the provided scoring criteria and give feedback for each section accordingly.Always return only JSON except feedback. Feedback should be in string paragraphs.
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
