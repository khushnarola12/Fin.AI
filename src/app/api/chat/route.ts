import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "edge";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to format financial data for AI context
function formatFinancialContext(data// eslint-disable-next-line @typescript-eslint/no-explicit-any
any) {
  if (!data) return "No financial data available.";

  const { user, assets, liabilities, investments, ppf } = data;

  // Calculate totals
  const totalAssets = assets?.reduce(
    (sum: number, asset// eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => sum + asset.value,
    0
  ) || 0;
  const totalLiabilities = liabilities?.reduce(
    (sum: number, liability// eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => sum + liability.amount,
    0
  ) || 0;
  const totalInvestments = investments?.reduce(
    (sum: number, investment// eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => sum + investment.total_value,
    0
  ) || 0;
  const netWorth = user?.net_worth || totalAssets - totalLiabilities;

  return `
FINANCIAL PROFILE:
- Net Worth: ₹${netWorth?.toLocaleString() || "Not set"}
- Monthly Income: ₹${user?.monthly_income?.toLocaleString() || "Not set"}
- Credit Score: ${user?.credit_score || "Not set"}

ASSETS (Total: ₹${totalAssets.toLocaleString()}):
${
  assets?.length > 0
    ? assets
        .map(
          (asset// eslint-disable-next-line @typescript-eslint/no-explicit-any
any) =>
            `- ${asset.name} (${asset.type}): ₹${asset.value.toLocaleString()}`
        )
        .join("\n")
    : "- No assets recorded"
}

LIABILITIES (Total: ₹${totalLiabilities.toLocaleString()}):
${
  liabilities?.length > 0
    ? liabilities
        .map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (liability// eslint-disable-next-line @typescript-eslint/no-explicit-any
any) =>
            `- ${liability.name} (${
              liability.type
            }): ₹${liability.amount.toLocaleString()}${
              liability.interest_rate
                ? ` at ${liability.interest_rate}% interest`
                : ""
            }`
        )
        .join("\n")
    : "- No liabilities recorded"
}

INVESTMENTS (Total: ₹${totalInvestments.toLocaleString()}):
${
  investments?.length > 0
    ? investments
        .map(
          (investment// eslint-disable-next-line @typescript-eslint/no-explicit-any
any) =>
            `- ${investment.name} (${investment.type}): ${
              investment.shares
            } shares at ₹${
              investment.current_price
            } each, Total: ₹${investment.total_value.toFixed(2)} (${
              investment.gain_loss >= 0 ? "+" : ""
            }${investment.gain_loss_percentage.toFixed(2)}%)`
        )
        .join("\n")
    : "- No investments recorded"
}

PPF BALANCE:
${
  ppf
    ? `- Total Balance: ₹${ppf.total_balance?.toLocaleString() || "Not set"}
- Annual Contribution: ₹${
        ppf.annual_contribution?.toLocaleString() || "Not set"
      }
- Interest Rate: ${ppf.interest_rate || "Not set"}%`
    : "- No PPF data available"
}
`;
}

export async function POST(req: NextRequest) {
  try {
    const { message, financialData } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Format the financial context from passed data
    const financialContext = formatFinancialContext(financialData);

    // Create system prompt with financial context
    const systemPrompt = `Hello! I'm FinAI, your personal financial assistant.

Think of me as your trusted partner, here to support you on your financial journey. My purpose is to help you understand your finances, make confident decisions, and achieve your goals.

I'll always ground our conversation in your specific financial details: ${financialContext}. You won't get vague advice from me. Instead of saying "save more," I'll suggest clear, practical steps, such as "consider increasing your monthly SIP by ₹2,000."

I know that managing money can be challenging, and I want you to feel encouraged. When we look at numbers, I'll explain the logic transparently. For example: "Net worth calculation: Assets (₹[Value]) - Liabilities (₹[Value]) = Net Worth (₹[Value])."

I will keep our conversations focused strictly on your financial well-being. All responses will be clear, concise (under 300 words), and use Indian Rupees (₹).`;

    // Get the Gemini model with safety settings
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH", 
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE",
        },
      ],
    });

    // Combine system prompt and user message
    const fullPrompt = `${systemPrompt}\n\nUser: ${message}`;

    console.log("Generating content with prompt:", fullPrompt.substring(0, 200) + "...");

    // Generate streaming content
    const result = await model.generateContentStream(fullPrompt);

    console.log("Stream result received:", !!result);

    // Create a readable stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let hasContent = false;
          
          for await (const chunk of result.stream) {
            console.log("Received chunk:", chunk);
            
            const chunkText = chunk.text();
            console.log("Chunk text:", chunkText);
            
            if (chunkText) {
              hasContent = true;
              const data = `data: ${JSON.stringify({ content: chunkText })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
            
            // Check for safety blocking
            if (chunk.candidates?.[0]?.finishReason === "SAFETY") {
              console.log("Content blocked by safety filters");
              const errorData = `data: ${JSON.stringify({ 
                error: "Content blocked by safety filters" 
              })}\n\n`;
              controller.enqueue(encoder.encode(errorData));
              break;
            }
          }

          // If no content was received, send a fallback response
          if (!hasContent) {
            console.log("No content received, sending fallback");
            const fallbackData = `data: ${JSON.stringify({ 
              content: "I apologize, but I'm unable to generate a response right now. Please try rephrasing your question or try again later." 
            })}\n\n`;
            controller.enqueue(encoder.encode(fallbackData));
          }

          // Send completion signal
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          
          // Send error response
          const errorData = `data: ${JSON.stringify({ 
            error: "Stream processing failed: " + error.message 
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to generate response: " + error.message },
      { status: 500 }
    );
  }
}
