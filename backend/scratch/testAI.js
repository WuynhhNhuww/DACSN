const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: "C:/Users/Wuynhh_Nhuww/Desktop/shopee-mini/backend/.env" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// The SDK doesn't easily allow changing the version in the constructor like this, 
// but we can try to see if it works with different model strings.
console.log("API Key loaded:", process.env.GEMINI_API_KEY ? "YES" : "NO");
console.log("API Key length:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);

async function testAI() {
    try {
        console.log("Listing models...");
        const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // dummy
        // Note: genAI doesn't have a direct listModels, we need to use the base client or just guess.
        // Actually, let's try a very common one: "gemini-pro"
        
        const testModel = async (modelName) => {
            try {
                console.log(`Testing model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hi");
                const response = await result.response;
                console.log(`${modelName} success:`, response.text());
                return true;
            } catch (e) {
                console.error(`${modelName} failed:`, e.message);
                return false;
            }
        };

        await testModel("gemini-pro");
        await testModel("gemini-1.5-flash");
        await testModel("gemini-1.5-pro");
        await testModel("gemini-2.0-flash-exp");
    } catch (error) {
        console.error("General Error:", error.message);
    }
}

testAI();
