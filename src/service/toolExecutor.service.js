import axios from 'axios';
import { ChatMistralAI } from '@langchain/mistralai';
import { config } from '../config/config.js';
import Tenant from '../models/tenant.model.js';
import { decrypt } from '../utils/encryption.js';

const mistralChat = new ChatMistralAI({
  apiKey: config.MISTRAL_KEY,
  model: config.MISTRAL_MODEL,
  temperature: 0.1, // Low temperature for deterministic JSON output
});

// Helper: Find tool by name across all integrations
const findTool = (tenant, toolName) => {
    for (const integration of tenant.integrations) {
        for (const endpoint of integration.endpoints) {
            if (endpoint.name === toolName) {
                return { integration, endpoint };
            }
        }
    }
    return null;
};

// Helper: Build URL by replacing path parameters and appending query params
const buildUrl = (baseUrl, path, paramsObj, endpointParams) => {
    let finalPath = path;
    const queryParams = new URLSearchParams();

    // endpointParams is the schema of params
    for (const p of endpointParams) {
        const value = paramsObj[p.name];
        if (value !== undefined) {
            if (finalPath.includes(`:${p.name}`)) {
                finalPath = finalPath.replace(`:${p.name}`, encodeURIComponent(value));
            } else {
                queryParams.append(p.name, value);
            }
        }
    }
    
    const url = new URL(finalPath, baseUrl);
    const queryString = queryParams.toString();
    if (queryString) {
        return `${url.toString()}?${queryString}`;
    }
    return url.toString();
};

// Helper: Build headers based on auth config
const buildHeaders = (auth) => {
    const headers = {};
    if (!auth || auth.type === 'none') return headers;

    const decryptedKey = auth.key ? decrypt(auth.key) : '';
    
    if (auth.type === 'bearer') {
        headers['Authorization'] = `Bearer ${decryptedKey}`;
    } else if (auth.type === 'apiKey') {
        const headerName = auth.headerName || 'x-api-key';
        headers[headerName] = decryptedKey;
    }

    return headers;
};

export const tryTenantAPIs = async ({ tenantId, customerMessage }) => {
    try {
        const tenant = await Tenant.findById(tenantId);
        
        if (!tenant || !tenant.integrations || tenant.integrations.length === 0) {
            return null;
        }

        // 3. Convert all endpoints into "tool descriptions"
        const availableTools = [];
        for (const integration of tenant.integrations) {
            for (const endpoint of integration.endpoints) {
                availableTools.push({
                    name: endpoint.name,
                    description: endpoint.description,
                    parameters: endpoint.params.map(p => ({
                        name: p.name,
                        type: p.type,
                        required: p.required
                    }))
                });
            }
        }

        if (availableTools.length === 0) {
            return null;
        }

        // 4. Ask LLM to decide
        const prompt = `You are a helpful AI assistant. Decide if you need to use a tool to answer the user's query.
Use a tool ONLY if needed. Do not hallucinate. Ask for required params if missing from the user query.

AVAILABLE TOOLS:
${JSON.stringify(availableTools, null, 2)}

USER QUERY: "${customerMessage}"

Respond in STRICT JSON format:
{
  "tool": "toolName",
  "params": { "paramName": "value" }
}
If no tool is needed or if you cannot answer the query with the available tools, respond with:
{
  "tool": null
}
`;

        const decisionResponse = await mistralChat.invoke([
            { role: 'system', content: 'You are a system that only outputs valid JSON.' },
            { role: 'user', content: prompt }
        ]);

        // 5. Parse LLM response safely
        let decision;
        try {
            // Clean up potential markdown formatting
            const jsonString = decisionResponse.content.replace(/```json/g, '').replace(/```/g, '').trim();
            decision = JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse Mistral tool decision:", decisionResponse.content);
            return null;
        }

        // 6. If tool is null -> return null
        if (!decision || !decision.tool) {
            return null;
        }

        // 7. Find matching endpoint in tenant.integrations
        const toolDetails = findTool(tenant, decision.tool);
        if (!toolDetails) {
            console.error(`Tool ${decision.tool} not found in tenant integrations.`);
            return null;
        }

        const { integration, endpoint } = toolDetails;

        // Verify required params
        const providedParams = decision.params || {};
        for (const p of endpoint.params) {
            if (p.required && providedParams[p.name] === undefined) {
                console.warn(`Missing required param: ${p.name} for tool ${decision.tool}`);
                return null; // Return null to fallback to human agent, or we could ask the user (but prompt says missing params -> return null)
            }
        }

        // 8. Build API URL
        const url = buildUrl(integration.baseUrl, endpoint.path, providedParams, endpoint.params);

        // 9. Build headers
        const headers = buildHeaders(integration.auth);

        // 10. Execute API using axios
        const startTime = Date.now();
        let apiResult;
        try {
            const response = await axios({
                method: endpoint.method.toUpperCase(),
                url,
                headers,
                timeout: 5000 // 5 seconds max
            });
            apiResult = response.data;
        } catch (apiError) {
            console.error(`API Call failed for tool ${decision.tool}:`, apiError.message);
            return null; // API failure -> fallback
        }
        const endTime = Date.now();

        // 6. Log every API call
        console.log(`[Tenant Integration API Call] Tool: ${decision.tool}, Params: ${JSON.stringify(providedParams)}, ResponseTime: ${endTime - startTime}ms`);

        if (!apiResult) {
            return null; // Empty API response -> fallback to human
        }

        // 11. Convert API response into human-friendly reply using LLM
        const summaryPrompt = `You made an API call to a tool named "${decision.tool}" to help the user.
USER QUERY: "${customerMessage}"
API RESPONSE: ${JSON.stringify(apiResult)}

TASK: Convert the API response into a professional, human-friendly reply for the user.
RULES:
- Do not expose raw JSON.
- Summarize clearly.
- Keep the tone professional.
- Address the user's query directly using the data provided.
`;
        
        const summaryResponse = await mistralChat.invoke([
            { role: 'user', content: summaryPrompt }
        ]);

        return {
            success: true,
            response: summaryResponse.content
        };

    } catch (error) {
        console.error("Error in tryTenantAPIs:", error);
        return null;
    }
};
