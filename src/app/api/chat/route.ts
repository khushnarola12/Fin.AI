import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to format financial data for AI context
function formatFinancialContext(data: any) {
  if (!data) return "No financial data available.";

  const { user, assets, liabilities, investments, ppf } = data;
  
  // Calculate totals
  const totalAssets = assets.reduce((sum: number, asset: any) => sum + asset.value, 0);
  const totalLiabilities = liabilities.reduce((sum: number, liability: any) => sum + liability.amount, 0);
  const totalInvestments = investments.reduce((sum: number, investment: any) => sum + investment.total_value, 0);
  const netWorth = user?.net_worth || (totalAssets - totalLiabilities);

  return `
FINANCIAL PROFILE:
- Net Worth: ₹${netWorth?.toLocaleString() || 'Not set'}
- Monthly Income: ₹${user?.monthly_income?.toLocaleString() || 'Not set'}
- Credit Score: ${user?.credit_score || 'Not set'}

ASSETS (Total: ₹${totalAssets.toLocaleString()}):
${assets.length > 0 ? assets.map((asset: any) => `- ${asset.name} (${asset.type}): ₹${asset.value.toLocaleString()}`).join('\n') : '- No assets recorded'}

LIABILITIES (Total: ₹${totalLiabilities.toLocaleString()}):
${liabilities.length > 0 ? liabilities.map((liability: any) => `- ${liability.name} (${liability.type}): ₹${liability.amount.toLocaleString()}${liability.interest_rate ? ` at ${liability.interest_rate}% interest` : ''}`).join('\n') : '- No liabilities recorded'}

INVESTMENTS (Total: ₹${totalInvestments.toLocaleString()}):
${investments.length > 0 ? investments.map((investment: any) => `- ${investment.name} (${investment.type}): ${investment.shares} shares at ₹${investment.current_price} each, Total: ₹${investment.total_value.toFixed(2)} (${investment.gain_loss >= 0 ? '+' : ''}${investment.gain_loss_percentage.toFixed(2)}%)`).join('\n') : '- No investments recorded'}

PPF BALANCE:
${ppf ? `- Total Balance: ₹${ppf.total_balance?.toLocaleString() || 'Not set'}
- Annual Contribution: ₹${ppf.annual_contribution?.toLocaleString() || 'Not set'}
- Interest Rate: ${ppf.interest_rate || 'Not set'}%` : '- No PPF data available'}
`;
}

export async function POST(req: NextRequest) {
  try {
    const { message, financialData } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Format the financial context from passed data
    const financialContext = formatFinancialContext(financialData);

    // Create system prompt with financial context
    const systemPrompt = `You are FinAI, a personal financial assistant. You help users understand their finances, make better financial decisions, and provide personalized advice based on their actual financial data.

IMPORTANT GUIDELINES:
- Always base your responses on the user's actual financial data provided below
- Provide specific, actionable advice
- Use Indian Rupees (₹) for all monetary values
- Be encouraging but realistic about financial goals
- If asked about topics outside finance, politely redirect to financial matters
- Keep responses concise but informative (max 300 words)
- Use the user's actual numbers when giving advice

USER'S FINANCIAL DATA:
${financialContext}

Remember: You have access to real financial data, so provide personalized insights rather than generic advice.`;

    // Create streaming response using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
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
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              const data = `data: ${JSON.stringify({ content })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }
          // Send completion signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}