const express = require("express");
const Groq = require("groq-sdk");

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post("/health-analyze", async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms) {
      return res.status(400).json({ error: "Symptoms are required" });
    }

    const prompt = `
You are a medical assistant AI. Analyze the symptoms: "${symptoms}"

Respond with ONLY JSON in the exact format:

{
  "health_state": "",
  "diseases": [
    { "name": "", "probability": "", "reason": "" }
  ],
  "remedies": [],
  "otc": [],
  "urgent": "",
  "lifestyle": [],
  "disclaimer": "This is not medical advice."
}

Rules:
- Give real probabilities (10%–95%).
- Use strong medical reasoning.
- Identify red flags.
- Fill every field.
- No markdown, no explanation, ONLY JSON.
`;
const completion = await groq.chat.completions.create({
  model: "llama-3.1-8b-instant",
  messages: [{ role: "user", content: prompt }],
  temperature: 0.4,
});




    const aiText = completion.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(aiText);
    } catch (err) {
      console.log("Groq RAW OUTPUT:", aiText);
      return res.status(500).json({ error: "Invalid JSON returned by AI" });
    }

    const diseasesSource = parsed.diseases || parsed.possibleDiseases || [];

    const mapped = {
      healthState: parsed.health_state || parsed.healthState || null,
      possibleDiseases: Array.isArray(diseasesSource)
        ? diseasesSource.map((d) => ({
            name: d.name,
            confidence: d.probability || d.confidence,
            reason: d.reason,
          }))
        : [],
      remedies: parsed.remedies || [],
      otcMedicines: parsed.otc || parsed.otcMedicines || [],
      urgentCare: parsed.urgent || parsed.urgentCare || "",
      lifestyleAdvice: parsed.lifestyle || parsed.lifestyleAdvice || [],
      disclaimer: parsed.disclaimer || "",
    };

    res.json(mapped);

  } catch (error) {
    console.error("Groq Health Error:", error);
    res.status(500).json({ error: "Groq AI failed" });
  }
});

// Generate blog content from title and key points using Groq
router.post("/blog-generate", async (req, res) => {
  try {
    const { title, keyPoints } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const pointsText = Array.isArray(keyPoints)
      ? keyPoints.filter(Boolean).map((p) => `- ${p}`).join("\n")
      : (keyPoints || "");

    const prompt = `You are a medical writer. Write a well-structured blog post for a community health portal.\nTitle: ${title}\nKey points (bulleted):\n${pointsText}\n\nRequirements:\n- Clear introduction, informative body with subheadings, and a concise conclusion.\n- Tone: helpful, accessible, evidence-informed.\n- Add practical tips and, where useful, short bullet lists.\n- Do not fabricate statistics; avoid definitive medical claims without context.\n- Keep formatting as plain text with line breaks and markdown-style headings (##, ###).`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    });

    const content = completion.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return res.status(500).json({ error: "AI did not return content" });
    }

    return res.json({ content });
  } catch (error) {
    console.error("Groq Blog Generate Error:", error);
    return res.status(500).json({ error: "Groq AI failed" });
  }
});

module.exports = router;
