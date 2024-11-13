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
async function calculateScore(predefinedData, studentData) {
    let mandatoryScore = 0;
    let symptomsScore = 0;
    let diagnosisScore = 0;
    let treatmentsScore = 0;

    // 1. Calculate mandatory question score (45%)
    const mandatoryQuestionsAsked = studentData.mandatoryQuestions.filter(q => q.isAnswered).length;
    mandatoryScore = (mandatoryQuestionsAsked / predefinedData.mandatoryQuestions.length) * 0.45;

    // 2. Calculate symptoms score (40%)
    const recordedSymptoms = studentData.positiveSymptoms.filter(symptom => symptom.isRecorded).length;
    symptomsScore = (recordedSymptoms / predefinedData.positiveSymptoms.length) * 0.4;

    // 3. Calculate diagnosis score (10%)
    const diagnosisSimilarity = await calculateSimilarityScore(studentData.diagnosis, predefinedData.diagnosis);
    if (diagnosisSimilarity > 0.7) { // 70% similarity threshold
        diagnosisScore = 0.1;
    }

    // 4. Calculate treatments score (5%)
    for (const studentTreatment of studentData.suggestedTreatments) {
        const match = await Promise.all(predefinedData.predefinedTreatments.map(async predefined => 
            await calculateSimilarityScore(studentTreatment, predefined)
        ));
        if (match.some(similarity => similarity > 0.7)) { // 70% similarity threshold
            treatmentsScore += 0.05 / predefinedData.predefinedTreatments.length; // Weighted by 5%
        }
    }

    const totalScore = mandatoryScore + symptomsScore + diagnosisScore + treatmentsScore;

    // Generate feedback
    const feedback = await generateFeedback(predefinedData, studentData);

    return {
        score: totalScore,
        details: {
            mandatoryScore: mandatoryScore.toFixed(2),
            symptomsScore: symptomsScore.toFixed(2),
            diagnosisScore: diagnosisScore.toFixed(2),
            treatmentsScore: treatmentsScore.toFixed(2)
        },
        feedback: feedback
    };
}

// Generate feedback based on inputs
async function generateFeedback(predefinedData, studentData) {
    const missedQuestions = predefinedData.mandatoryQuestions
        .filter((_, i) => !studentData.mandatoryQuestions[i].isAnswered);
    const unrecordedSymptoms = predefinedData.positiveSymptoms
        .filter((_, i) => !studentData.positiveSymptoms[i].isRecorded);
    const incorrectDiagnosis = await calculateSimilarityScore(studentData.diagnosis, predefinedData.diagnosis) < 0.7;
    const inappropriateTreatments = studentData.suggestedTreatments.filter(async studentTreatment =>
        !(await Promise.all(predefinedData.predefinedTreatments.map(async predefined =>
            await calculateSimilarityScore(studentTreatment, predefined)
        ))).some(similarity => similarity > 0.7)
    );

    const feedbackPrompt = `
        You are a feedback assistant. Based on the following data, provide structured feedback:
        - Missed Questions: ${missedQuestions.map(q => q.question).join(", ") || "None"}
        - Unrecorded Symptoms: ${unrecordedSymptoms.map(sym => sym.description).join(", ") || "None"}
        - Incorrect Diagnosis: ${incorrectDiagnosis ? "Yes" : "No"}
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

// Example data structure
// Example call to calculateScore function
(async () => {
    const predefinedData = {
        mandatoryQuestions: [
            { question: "Describe the primary concern of the patient.", correctAnswer: "Severe headache with occasional nausea" },
            { question: "How long have the symptoms persisted?", correctAnswer: "Approximately three days" },
            { question: "List any medications currently taken by the patient.", correctAnswer: "Ibuprofen, sometimes acetaminophen" },
            { question: "Have there been any other notable symptoms?", correctAnswer: "Dizziness and sensitivity to light" },
            { question: "Is the patient aware of any allergies?", correctAnswer: "No known allergies reported" },
            { question: "Has the patient traveled recently?", correctAnswer: "Yes, traveled to Mexico in the past month" },
            { question: "Outline the patient's medical history.", correctAnswer: "No significant medical history except occasional migraines" },
            { question: "Is the patient on any other regular medication?", correctAnswer: "Yes, blood pressure medication" }
        ],
        positiveSymptoms: [
            { description: "Moderate headaches" },
            { description: "Feeling nauseous" },
            { description: "Slight dizziness" },
            { description: "Persistent fatigue" },
            { description: "Light sensitivity" },
            { description: "Ringing sounds in ears" },
            { description: "Occasional blurry vision" },
            { description: "Minor chest discomfort" }
        ],
        diagnosis: "Migraine with aura",
        predefinedTreatments: [
            "Encourage rest",
            "Increase fluid intake",
            "Administer pain relievers as needed",
            "Avoid exposure to bright light",
            "Ginger tea to alleviate nausea",
            "Recommend over-the-counter pain medication",
            "Schedule a follow-up if symptoms persist",
            "Consider cognitive therapy",
            "Suggest physical therapy for neck tension",
            "Limit screen exposure and rest in dark environments"
        ]
    };

    const studentData = {
        mandatoryQuestions: [
            { isAnswered: true, answer: "Severe headaches and sometimes nausea" },
            { isAnswered: true, answer: "Three days" },
            { isAnswered: true, answer: "Takes Ibuprofen" },
            { isAnswered: false, answer: "" },
            { isAnswered: true, answer: "No known allergies" },
            { isAnswered: true, answer: "Traveled to Mexico recently" },
            { isAnswered: true, answer: "No significant past health issues" },
            { isAnswered: true, answer: "Takes blood pressure medicine" },
            { isAnswered: true, answer: "Feeling somewhat fatigued" },
            { isAnswered: false, answer: "" },
        ],
        positiveSymptoms: [
            { isRecorded: true, description: "Frequent headaches" },
            { isRecorded: true, description: "Occasional nausea" },
            { isRecorded: true, description: "Mild dizziness" },
            { isRecorded: true, description: "Constant fatigue" },
            { isRecorded: true, description: "Sensitive to bright lights" },
            { isRecorded: false, description: "" },
            { isRecorded: true, description: "Blurred vision at times" },
            { isRecorded: false, description: "" }
        ],
        diagnosis: "Migraine",
        suggestedTreatments: [
            "Get adequate rest",
            "Stay hydrated",
            "Take Ibuprofen for pain relief",
            "Avoid bright screens",
            "Use ginger for nausea",
            "Try deep breathing exercises",
            "Apply a cold compress to the forehead",
            "Limit physical activity temporarily"
        ]
    };

    const result = await calculateScore(predefinedData, studentData);
    console.log(result);
})();

