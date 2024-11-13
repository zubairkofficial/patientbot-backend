import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { config } from "dotenv";

config({ path: './../.env' });

const apiKey = process.env.OPENAI_API_KEY;
const model = new ChatOpenAI({ apiKey: apiKey, model: "gpt-4o" });

// Function to extract information from student and predefined data
async function extractInformation(studentData, predefinedData) {
    const promptTemplate = ChatPromptTemplate.fromMessages([
        {
            role: "system",
            content: "You are an assistant that extracts medical information from conversational and paragraph data."
        },
        {
            role: "user",
            content: `
                Extract the following information from the provided data:
                Predefined Mandatory Questions 
                Student Mandatory Questions 
                Predefined Appropriate Treatments
                Student Appropriate Treatments
                Predefined Diagnosis
                Student Diagnosis
                Predefined Symptoms
                Student Symptoms

                Student Data: ${studentData}
                Predefined Data: ${predefinedData}
                only return the json nothing text or string. respond everything in json format from letter index 0 to end.
            `
        }
    ]);

    const parser = new StringOutputParser();
    const llmChain = promptTemplate.pipe(model).pipe(parser);

    const result = await llmChain.invoke({});

    // Log the result for debugging
    console.log(result);

    // Remove unwanted characters and parse as JSON
    const cleanResult = result.replace(/```json/g, '').replace(/```/g, '');

    try {
        const structuredData = JSON.parse(cleanResult);
        return structuredData;
    } catch (error) {
        console.error("Error parsing JSON:", error);
    }
}

// Example usage
(async () => {
    const studentData = `
    **AI Virtual Patient:** Hi there, I've been feeling really unwell lately. For the past week, I've been experiencing these intense headaches that seem to come and go. 

    **Student:** I'm sorry to hear that! Can you tell me more about the headaches? When do they usually occur?

    **AI Virtual Patient:** They tend to be particularly severe in the mornings, and sometimes they last for several hours. I also feel nauseous, which makes it hard for me to eat anything.

    **Student:** That sounds tough. Have you tried taking anything for the pain?

    **AI Virtual Patient:** Yes, I took ibuprofen a couple of times, but it only helps a little and for a short time. I still feel dizzy, especially when I stand up quickly.

    **Student:** Dizziness can be concerning. Do you notice anything that makes the headaches worse?

    **AI Virtual Patient:** Bright lights and loud noises definitely make it worse. I’ve been avoiding social situations because of it. 

    **Student:** I understand. How about your energy levels? Are you feeling more tired than usual?

    **AI Virtual Patient:** Yes, I feel unusually fatigued, like I haven't slept well, even though I try to keep a regular sleep schedule. 

    **Student:** It sounds like you’re going through a lot. Based on what you’ve told me, I think it might be a good idea to see a doctor. In the meantime, have you considered any other remedies or treatments?

    **AI Virtual Patient:** I haven’t really thought about it. What do you suggest I do to feel better?

     **Student:** From the symptoms i can say it might be some kind of brain tumor.
     For treatment i would suggest chemotherapy.
    `;
    const predefinedData = `
    The patient has been evaluated and presents with a complex case characterized by recurrent severe headaches, which are often accompanied by episodes of nausea. 
    These headaches have been reported to last for several hours and are particularly debilitating, leading to significant discomfort. 
    The patient has self-administered ibuprofen, but the relief has been minimal and short-lived. 
    Notably, the patient experiences dizziness, especially upon standing, which raises concerns about potential underlying issues. 
    The clinical assessment indicates that appropriate treatments may include hydration therapy, which is crucial for alleviating symptoms, as well as over-the-counter pain relievers that can help manage the headache episodes. 
    Furthermore, the differential diagnosis may suggest brain aneurysm.
    Symptoms reported also include heightened sensitivity to light, known as photophobia, and episodes of fatigue that could indicate a more systemic issue. 
    It is advisable for the patient to monitor their symptoms closely and consider consulting a healthcare professional for a comprehensive evaluation and tailored treatment plan.
    `;

    const structuredData = await extractInformation(studentData, predefinedData);
    console.log(JSON.stringify(structuredData, null, 2));
})();
