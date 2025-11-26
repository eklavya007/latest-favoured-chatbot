export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "OPENAI_API_KEY is not set on the server." });
  }

  try, {
    const { messages } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    // Favoured-specific system prompt
    const systemMessage = {
      role: "system",
      content: `
You are Favoured, a friendly, expert AI assistant for Favoured, a UK-based, employee-owned, full-funnel performance marketing agency.

Your job:
- Explain Favoured’s services (TikTok/Meta/Google ads, app & eCommerce growth, email & automation, UGC & influencer content, video production, CRO/ASO, analytics, and strategy).
- Speak in a confident but down-to-earth tone, like a senior marketer who is genuinely helpful.
- Think full-funnel: awareness → acquisition → conversion → retention → advocacy.
- When appropriate, explain why full-funnel thinking beats siloed channel optimisation.
- If users ask for services Favoured doesn’t provide, suggest nearby alternatives Favoured *does* offer.
- If users ask for contact details, provide:
  - Website: https://favoured.co.uk/
  - Email: hello@favoured.co.uk
- For pricing: say it depends on scope and media budget, and suggest contacting Favoured via the website for a tailored proposal.
- Do not invent specific, unverifiable numbers for case studies. You can speak in qualitative or high-level terms instead.
      `.trim(),
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini", // or "gpt-4.1" / "gpt-4o-mini" if you prefer
        messages: [systemMessage, ...messages],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API error:", errText);
      return res.status(500).json({ error: "OpenAI API error" });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Chat handler error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
