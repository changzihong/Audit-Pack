import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

export const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
});

export const analyzeRequest = async (details: any, files: File[] = []) => {
    if (!apiKey || apiKey.includes('your_')) {
        console.warn('OpenAI API Key is missing or invalid.');
        return {
            completeness_score: 75,
            summary: ["Please provide your OpenAI API key in the .env file to enable real-time AI auditing."],
            feedback: ["AI Analysis is currently in preview mode."]
        };
    }

    try {
        // Convert image files to base64 for vision analysis
        const imagePromises = files
            .filter(file => file.type.startsWith('image/'))
            .slice(0, 3) // Limit to 3 images to avoid token limits
            .map(file => {
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            });

        const base64Images = await Promise.all(imagePromises);

        // Build message content with images
        const messageContent: any[] = [
            {
                type: "text",
                text: `Please evaluate this audit submission:
                
Title: ${details.title}
Transaction Date: ${details.audit_date}
Category: ${details.category}
Department: ${details.department}
Amount: RM${details.amount}
Description: ${details.description}
Files Uploaded: ${files.length} file(s) - ${files.map(f => f.name).join(', ')}

${base64Images.length > 0 ? 'Analyze the uploaded images/receipts to verify:' : 'Note: No images uploaded for verification.'}
1. Does the receipt/invoice match the claimed amount?
2. Is the date on the document consistent with the transaction date?
3. Does the vendor/merchant align with the category?
4. Are there any red flags or inconsistencies?`
            }
        ];

        // Add images to the message
        base64Images.forEach(base64 => {
            messageContent.push({
                type: "image_url",
                image_url: {
                    url: base64,
                    detail: "high"
                }
            });
        });

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are a professional Malaysian corporate auditor with expertise in expense verification and fraud detection.
                    
Your task is to analyze audit requests by examining:
1. The form details (title, amount, date, description)
2. Uploaded receipts/invoices/documents (if provided)
3. Business justification quality and relevance
4. Malaysian market pricing and product references

Structure your response as a valid JSON object with:
- "completeness_score" (integer 0-100) - Higher score means better compliance
- "summary" (array of exactly 3 concise bullet points about the submission)
- "feedback" (array of specific observations or concerns)

CRITICAL ANALYSIS CRITERIA:

1. **Document Verification**: If images are provided, verify amounts, dates, and vendor details match the claim

2. **Malaysian Market Pricing**: 
   - Compare claimed amounts against typical Malaysian market prices
   - Flag unusually high prices (e.g., RM500 for office lunch, RM10,000 for basic laptop)
   - Consider regional pricing variations (KL vs other states)
   - Reference common Malaysian vendors and typical price ranges

3. **Business Justification Analysis**:
   - Is the justification specific and detailed enough?
   - Does it clearly explain the business purpose?
   - Is the expense reasonable for the stated purpose?
   - Does it align with the category and amount claimed?
   - Are there sufficient details about what was purchased/why?

4. **Date Consistency**: 
   - Check if transaction date makes sense (e.g., weekend expenses for office supplies)
   - Verify dates on receipts match claimed dates

5. **Category Alignment**:
   - Does the purchase match the selected category?
   - Is the amount appropriate for the category?

6. **Red Flags**: 
   - Vague or generic justifications (e.g., "business expense", "needed for work")
   - Duplicate receipts or altered documents
   - Suspicious patterns or inconsistencies
   - Personal expenses disguised as business expenses

Be thorough but fair. Provide constructive, specific feedback. Reference Malaysian context where relevant.`
                },
                {
                    role: "user",
                    content: messageContent
                }
            ],
            response_format: { type: "json_object" },
            max_tokens: 1000
        });

        const content = response.choices[0].message.content || '{}';
        return JSON.parse(content);
    } catch (error) {
        console.error('AI Analysis Error:', error);
        return {
            completeness_score: 0,
            summary: ["Analysis failed - please check your connection"],
            feedback: ["Unable to process request. Please try again."]
        };
    }
};
