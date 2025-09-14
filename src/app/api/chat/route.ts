import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to format financial data for AI context
function formatFinancialContext(data: any) {
  if (!data) return "No financial data available.";

  const { user, assets, liabilities, investments, ppf } = data;

  // Calculate totals
  const totalAssets = assets.reduce(
    (sum: number, asset: any) => sum + asset.value,
    0
  );
  const totalLiabilities = liabilities.reduce(
    (sum: number, liability: any) => sum + liability.amount,
    0
  );
  const totalInvestments = investments.reduce(
    (sum: number, investment: any) => sum + investment.total_value,
    0
  );
  const netWorth = user?.net_worth || totalAssets - totalLiabilities;

  return `
FINANCIAL PROFILE:
- Net Worth: ₹${netWorth?.toLocaleString() || "Not set"}
- Monthly Income: ₹${user?.monthly_income?.toLocaleString() || "Not set"}
- Credit Score: ${user?.credit_score || "Not set"}

ASSETS (Total: ₹${totalAssets.toLocaleString()}):
${
  assets.length > 0
    ? assets
        .map(
          (asset: any) =>
            `- ${asset.name} (${asset.type}): ₹${asset.value.toLocaleString()}`
        )
        .join("\n")
    : "- No assets recorded"
}

LIABILITIES (Total: ₹${totalLiabilities.toLocaleString()}):
${
  liabilities.length > 0
    ? liabilities
        .map(
          (liability: any) =>
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
  investments.length > 0
    ? investments
        .map(
          (investment: any) =>
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
    const systemPrompt = `Hello! I'm FinAI, and it's my pleasure to be your personal financial assistant.

Think of me as your trusted and humble partner, here to support you on your financial journey. My purpose isn't to be a generic calculator, but to help you understand your finances, make confident decisions, and get closer to achieving your goals.

To do this well, I'll always ground our conversation in the specific financial details you share with me: ${financialContext}. You won't get vague advice from me. Instead of saying something like "save more," I’ll suggest a clear, practical next step, such as, "It looks like you're doing well with savings; perhaps we could explore increasing your monthly SIP by ₹2,000."

I know that managing money can be challenging, and I want you to feel encouraged. It’s great that you’re taking charge, and I’ll always be a supportive voice in your corner. When we do need to look at the numbers, I’ll lay out the logic transparently so you're always in the loop. For example: "Here's how we can look at your net worth: Assets (₹[Value]) - Liabilities (₹[Value]) = Net Worth (₹[Value])."

To make sure I'm giving you the best possible help, I will keep our conversations focused strictly on your financial well-being. All my responses will be clear, concise (under 300 words), and use Indian Rupees (₹).`
;

    // Create streaming response using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 500,
      temperature: 0.7,
      stream: true,
    });

    // Create a readable stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              const data = `data: ${JSON.stringify({ content })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }
          // Send completion signal
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
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
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}