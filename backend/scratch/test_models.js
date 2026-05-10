const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const listModels = async () => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // SDK doesn't have a direct listModels but we can try to fetch a specific one
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Test");
        console.log("Success with gemini-1.5-flash");
        process.exit(0);
    } catch (error) {
        console.error("Error with gemini-1.5-flash:", error.status, error.statusText);
        
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            await model.generateContent("Test");
            console.log("Success with gemini-pro");
            process.exit(0);
        } catch (error2) {
            console.error("Error with gemini-pro:", error2.status, error2.statusText);
            process.exit(1);
        }
    }
};

listModels();
