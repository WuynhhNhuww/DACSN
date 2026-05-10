const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const testAI = async () => {
    try {
        console.log("API Key:", process.env.GEMINI_API_KEY?.substring(0, 10) + "...");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent("Xin chào");
        const response = await result.response;
        console.log("AI Response:", response.text());
        process.exit(0);
    } catch (error) {
        console.error("AI Test Error:", error);
        process.exit(1);
    }
};

testAI();
