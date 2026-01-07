import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

export const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
});

export const analyzeRequest = async (details: any, attachments: string[] = []) => {
    if (!apiKey || apiKey.includes('your_')) {
        console.warn('OpenAI API Key is missing or invalid.');
        return {
            completeness_score: 75,
            summary: ["Please provide your OpenAI API key in the .env file to enable real-time AI auditing."],
            feedback: ["AI Analysis is currently in preview mode."]
        };
    }

    try {
        const fileNames = attachments.length > 0 ? attachments.join(', ') : 'No files uploaded';
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a professional Malaysian corporate auditor. 
                    Your task is to analyze an audit request for logical consistency and compliance.
                    
                    Structure your response as a valid JSON object with:
                    - "completeness_score" (integer 0-100)
                    - "summary" (array of exactly 3 concise strings summarizing the audit risk)
                    - "feedback" (array of strings with specific action items for the user)

                    CRITICAL ANALYSIS CRITERIA:
                    1. Date Consistency: Does the Transaction Date (${details.audit_date}) make sense for the title/category? (e.g., claiming high business meals on a Sunday or Public Holiday in Malaysia).
                    2. Document Alignment: Do the filenames (${fileNames}) actually relate to the Title and Description? (e.g., if Title is "Hardware", but files are "meal_receipt.jpg").
                    3. Category Logic: Does the amount (RM${details.amount}) seem reasonable for the Category (${details.category})?
                    4. Justification: Is the business reason provided in the description sufficient for an auditor to approve?`
                },
                {
                    role: "user",
                    content: `Please evaluate this submission:
                    Title: ${details.title}
                    Transaction Date: ${details.audit_date}
                    Category: ${details.category} ${details.customCategory || ''}
                    Amount: RM${details.amount}
                    Description: ${details.description}
                    Uploaded Files: ${fileNames}`
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content || '{}';
        return JSON.parse(content);
    } catch (error) {
        console.error('AI Analysis Error:', error);
        return {
            completeness_score: 0,
            summary: ["Analysis failed"],
            feedback: ["Check your connectivity or API key status"]
        };
    }
};
