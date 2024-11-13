import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { config } from "dotenv";
import cosineSimilarity from "cosine-similarity";

config({ path: './../.env' });

const apiKey = process.env.OPENAI_API_KEY;
// Initialize the LLM and OpenAI Embeddings
const model = new ChatOpenAI({ apiKey: apiKey, model: "gpt-4" });
const embeddings = new OpenAIEmbeddings({ apiKey: apiKey });

// Function to calculate similarity score between two strings using embeddings
async function calculateSimilarityScore(studentAnswer, correctAnswer) {
    const studentEmbedding = await embeddings.embedQuery(studentAnswer);
    const correctEmbedding = await embeddings.embedQuery(correctAnswer);
    
    // Calculate cosine similarity
    const similarity = cosineSimilarity(studentEmbedding, correctEmbedding);
    
    return similarity;
}

// Define scoring function
async function calculateScore(mandatoryQuestions, positiveSymptoms, suggestedTreatments, predefinedTreatments) {
    let mandatoryScore = 0;
    let symptomsScore = 0;
    let treatmentsScore = 0;

    // Calculate mandatory question score
    for (const q of mandatoryQuestions) {
        if (q.isAnswered) {
            const similarity = await calculateSimilarityScore(q.answer, q.correctAnswer);
            mandatoryScore += similarity * (0.45 / mandatoryQuestions.length); // Weighted by 45%
        }
    }

    // Calculate symptoms score
    for (const symptom of positiveSymptoms) {
        if (symptom.isRecorded) {
            const similarity = await calculateSimilarityScore(symptom.description, symptom.correctDescription);
            symptomsScore += similarity * (0.5 / positiveSymptoms.length); // Weighted by 50%
        }
    }

    // Calculate treatments score
    for (const treatment of suggestedTreatments) {
        const match = await Promise.all(predefinedTreatments.map(async predefined => 
            await calculateSimilarityScore(treatment, predefined)
        ));
        if (match.some(similarity => similarity > 0.7)) { // 70% similarity threshold
            treatmentsScore += 0.05 / predefinedTreatments.length; // Weighted by 5%
        }
    }

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
    const inappropriateTreatments = suggestedTreatments.filter(async treatment =>
        !(await Promise.all(predefinedTreatments.map(async predefined => 
            await calculateSimilarityScore(treatment, predefined)
        ))).some(similarity => similarity > 0.7)
    );

    const feedbackPrompt = `
        You are a feedback assistant. Based on the following data, provide structured feedback:
        - Missed Questions: ${missedQuestions.map(q => q.question).join(", ") || "None"}
        - Unrecorded Symptoms: ${unrecordedSymptoms.map(sym => sym.description).join(", ") || "None"}
        - Inappropriate Treatments: ${inappropriateTreatments.join(", ") || "None"}
    `;

    const promptTemplate = ChatPromptTemplate.fromMessages([
        { role: "system", content: "Provide feedback based on the student's performance." },
        { role: "user", content: feedbackPrompt },
 ]);

    const parser = new StringOutputParser();
    const llmChain = promptTemplate.pipe(model).pipe(parser);

    return await llmChain.invoke({});
}

// Example call to calculateScore function
(async () => {
    const mandatoryQuestions = [
        { question: "Describe the patient's main complaint.", isAnswered: true, answer: "Severe headache", correctAnswer: "Severe headache and nausea" },
        { question: "What is the duration of symptoms?", isAnswered: true, answer: "Three days", correctAnswer: "Around three days" },
        { question: "What medications have you taken?", isAnswered: true, answer: "Ibuprofen", correctAnswer: "Ibuprofen or acetaminophen" },
        { question: "Have you experienced any other symptoms?", isAnswered: false, answer: "", correctAnswer: "Yes, dizziness" },
        { question: "Do you have any allergies?", isAnswered: true, answer: "No known allergies", correctAnswer: "No known allergies" },
        { question: "Have you traveled recently?", isAnswered: true, answer: "Yes, to Mexico", correctAnswer: "Yes, to Mexico" },
        { question: "What is your medical history?", isAnswered: true, answer: "No significant history", correctAnswer: "No significant medical history" },
        { question: "Are you currently taking any other medications?", isAnswered: false, answer: "", correctAnswer: "Yes, blood pressure medication" }
    ];
    const positiveSymptoms = [
        { description: "Frequent headaches", isRecorded: true, correctDescription: "Minor Headaches" },
        { description: "Mild nausea", isRecorded: true, correctDescription: "Vomiting" },
        { description: "Dizziness", isRecorded: false, correctDescription: "Lightheadedness" },
        { description: "Fatigue", isRecorded: true, correctDescription: "Extreme tiredness" },
        { description: "Sensitivity to light", isRecorded: true, correctDescription: "Photophobia" },
        { description: "Tinnitus", isRecorded: false, correctDescription: "Ringing in the ears" },
        { description: "Blurred vision", isRecorded: true, correctDescription: "Visual disturbances" },
        { description: "Chest pain", isRecorded: false, correctDescription: "Angina" }
    ];
    const suggestedTreatments = ["Eat Vegetables", "Rest", "Stay Hydrated", "Take a warm bath", "Use a cold compress", "Practice deep breathing"];
    const predefinedTreatments = [
        "No Work", 
        "Hydration therapy", 
        "Pain relief medication", 
        "Rest and relaxation", 
        "Avoid bright lights", 
        "Ginger tea for nausea", 
        "Over-the-counter pain relievers", 
        "Consult a physician if symptoms persist", 
        "Cognitive behavioral therapy", 
        "Physical therapy for tension relief"
    ];

    const result = await calculateScore(mandatoryQuestions, positiveSymptoms, suggestedTreatments, predefinedTreatments);
    console.log(result);
})();
