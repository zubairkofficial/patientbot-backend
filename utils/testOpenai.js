// Import necessary modules from LangChain
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { config } from "dotenv";
config({ path: './../.env' });

const apiKey = process.env.OPENAI_API_KEY;
// Initialize the LLM
const model = new ChatOpenAI({ apiKey: apiKey, model: "gpt-4o" });

// Function to calculate similarity score between two strings
function calculateSimilarityScore(studentAnswer, correctAnswer) {
    // This is a placeholder for an actual similarity scoring function
    return studentAnswer.toLowerCase() === correctAnswer.toLowerCase() ? 1 : 0.75; // Assuming a partial match if they’re close
}

// Define scoring function
async function calculateScore(mandatoryQuestions, positiveSymptoms, suggestedTreatments, predefinedTreatments) {
    let mandatoryScore = 0;
    let symptomsScore = 0;
    let treatmentsScore = 0;

    // Calculate mandatory question score
    mandatoryQuestions.forEach(q => {
        if (q.isAnswered) {
            const similarity = calculateSimilarityScore(q.answer, q.correctAnswer);
            mandatoryScore += similarity * (0.45 / mandatoryQuestions.length); // Weighted by 45%
        }
    });

    // Calculate symptoms score
    positiveSymptoms.forEach(symptom => {
        if (symptom.isRecorded) {
            const similarity = calculateSimilarityScore(symptom.description, symptom.correctDescription);
            symptomsScore += similarity * (0.5 / positiveSymptoms.length); // Weighted by 50%
        }
    });

    // Calculate treatments score
    suggestedTreatments.forEach(treatment => {
        const match = predefinedTreatments.some(predefined =>
            calculateSimilarityScore(treatment, predefined) > 0.7 // 70% similarity threshold
        );
        if (match) treatmentsScore += 0.05 / predefinedTreatments.length; // Weighted by 5%
    });

    const totalScore = mandatoryScore + symptomsScore + treatmentsScore;

    // Generate feedback
    const feedback = await generateFeedback(mandatoryQuestions, positiveSymptoms, suggestedTreatments, predefinedTreatments);

    return {
        score: totalScore,
        details: {
            mandatoryScore: mandatoryScore.toFixed(2),
            symptomsScore: symptomsScore.toFixed(2),
            treatmentsScore: treatmentsScore.toFixed(2)
        },
        feedback: feedback
    };
}

// Generate feedback based on inputs
async function generateFeedback(mandatoryQuestions, positiveSymptoms, suggestedTreatments, predefinedTreatments) {
    const missedQuestions = mandatoryQuestions.filter(q => !q.isAnswered);
    const unrecordedSymptoms = positiveSymptoms.filter(sym => !sym.isRecorded);
    const inappropriateTreatments = suggestedTreatments.filter(treatment =>
        !predefinedTreatments.some(predefined => calculateSimilarityScore(treatment, predefined) > 0.7)
    );

    const feedbackPrompt = `
        You are a feedback assistant. Based on the following data, provide structured feedback:
        - Missed Questions: ${missedQuestions.map(q => q.question).join(", ") || "None"}
        - Unrecorded Symptoms: ${unrecordedSymptoms.map(sym => sym.description).join(", ") || "None"}
        - Inappropriate Treatments: ${inappropriateTreatments.join(", ") || "None"}
    `;

    const promptTemplate = ChatPromptTemplate.fromMessages([
        ["system", "Provide feedback based on the student's performance."],
        ["user", feedbackPrompt],
    ]);

    const parser = new StringOutputParser();
    const llmChain = promptTemplate.pipe(model).pipe(parser);

    return await llmChain.invoke({});
}

// Example call to calculateScore function with new dataset
(async () => {
    const mandatoryQuestions = [
        { question: "Describe the patient's main complaint.", isAnswered: true, answer: "Severe headache", correctAnswer: "Severe headache and nausea" },
        { question: "What is the duration of symptoms?", isAnswered: true, answer: "Three days", correctAnswer: "Around three days" }
    ];
    const positiveSymptoms = [
        { description: "Frequent headaches", isRecorded: true, correctDescription: "Minor Headaches" },
        { description: "Mild nausea", isRecorded: true, correctDescription: "Vomiting" }
    ];
    const suggestedTreatments = ["Eat Vegentables",];
    const predefinedTreatments = ["No Work", "Hydration therapy", "Pain relief medication"];

    const result = await calculateScore(mandatoryQuestions, positiveSymptoms, suggestedTreatments, predefinedTreatments);
    console.log(result);
})();
