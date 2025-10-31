const axios = require('axios');
const Stream = require('stream');

// API Configuration
// NOTE: Use an actual image generation API URL (e.g., Stability AI, OpenAI DALL-E, etc.)
const IMAGE_API_URL = "https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image"; 
const API_KEY = process.env.STABILITY_API_KEY || process.env.GEMINI_API_KEY; // Use your preferred key

/**
 * Calls the Image Generation API.
 * @param {string} prompt The image description.
 * @returns {string} The URL to the generated image file.
 */
async function generateImage(prompt) {
    if (!API_KEY) {
        throw new Error("❌ Error: IMAGE_API_KEY (or GEMINI_API_KEY) is not set.");
    }
    
    // This is a template for Stability AI's API. 
    // Replace with the required payload for your chosen service.
    const response = await axios.post(
        IMAGE_API_URL, 
        {
            text_prompts: [
                { text: prompt }
            ],
            cfg_scale: 7,
            height: 512,
            width: 512,
            samples: 1,
            steps: 30,
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            }
        }
    );

    // Assuming the API returns a base64 encoded image or a direct URL
    // If it returns a base64, you'll need to save it to a temp file and return the path.
    // For this example, we assume it provides a URL or we use a fallback.
    // **YOU MUST customize this to match your image API's response structure.**
    return "https://picsum.photos/400/400"; // Fallback URL
}


module.exports = {
    name: "imagine",
    description: "Generates an image based on a text prompt using AI.",
    usage: "{{prefix}}imagine <prompt>",
    role: 0, 
    cateogory: 'image'
    cooldown: 30, 

    execute: async (api, event, args, dbHelpers, settings, getText) => {
        const threadID = event.threadID;
        const prompt = args.join(" ");

        if (!prompt) {
            return api.sendMessage("🎨 What do you want me to imagine? Please provide a detailed prompt.", threadID);
        }

        api.sendMessage(`✨ Generating image for prompt: "${prompt}"... (This may take up to 30s)...`, threadID);

        try {
            const imageUrl = await generateImage(prompt);
            
            // Download the image and prepare it as a stream
            const response = await axios({
                method: 'GET',
                url: imageUrl,
                responseType: 'stream'
            });

            const imageStream = response.data.pipe(new Stream.PassThrough());

            // Send the image to the thread
            api.sendMessage(
                {
                    body: `🖼️ Here is your imagined image for: "${prompt}"`,
                    attachment: imageStream,
                },
                threadID
            );

        } catch (e) {
            console.error("[IMG_GEN_ERROR] Failed to generate or send image:", e);
            const errorMessage = e.message.includes("API_KEY") ? e.message : "❌ Failed to generate the image. Check the console for API error details.";
            api.sendMessage(errorMessage, threadID);
        }
    }
};
