import express from "express";
const router = express.Router();

// Step 1: Search web using Tavily
async function searchTechNews() {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query: "top technology news last 24 hours",
      search_depth: "advanced",
      include_images: true,
      include_answer: false,
      max_results: 7,
      topic: "news",
      days: 1,
    }),
  });
  return response.json();
}

// Step 2: Curate and summarize via Groq
async function curateWithGroq(searchResults) {
  const articlesText = searchResults.results
    .map(
      (r, i) =>
        `Article ${i + 1}:
Title: ${r.title}
URL: ${r.url}
Image: ${r.images?.[0] || null}
Published: ${r.published_date || "unknown"}
Content: ${r.content}`,
    )
    .join("\n\n");

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        max_tokens: 8000,
        messages: [
          {
            role: "system",
            content: `You are a tech news curator. You receive raw search results and return a clean JSON array of the top 5 tech news stories. Return ONLY raw JSON, no markdown, no backticks, no extra text. Write detailed, informative summaries.`,
          },
          {
            role: "user",
            content: `From the articles below, pick the top 5 most important tech stories and return them as a JSON array in this exact format:
[
  {
    "rank": 1,
    "title": "Article title",
    "summary": "Write a 90-100 words detailed summary covering the main topic, key facts and numbers, significance and impact, and any future implications. Be informative and journalistic in tone.",
    "source": "Source name",
    "url": "https://...",
    "imageUrl": "direct image url or null",
    "category": "Identify the most accurate and specific tech category this article belongs to (e.g. AI, Machine Learning, Cybersecurity, Cloud Computing, semiconductors, Robotics, Biotech, EVs, Space Tech, Developer Tools, etc — use your best judgment)",
    "publishedAt": "ISO date string"
  }
]

Rules:
- Strictly tech related articles only
- Summary must be 90-100 words, detailed and informative, covering the main topic, key facts, impact and any future implications
- imageUrl must be a direct image URL (jpg/png/webp) or null
- Ranked by importance/impact
- Category must be specific and accurately reflect the article's core tech domain — don't force it into a predefined bucket, use whatever label best describes it
- Return ONLY the JSON array, nothing else

Here are the articles:
${articlesText}`,
          },
        ],
      }),
    },
  );
  return response.json();
}

let cache = {
  data: null,
  lastFetched: null,
};

const CACHE_DURATION = 3 * 60 * 60 * 1000;

// Main route
router.get("/", async (req, res) => {
  try {
    if (
      cache.data &&
      cache.lastFetched &&
      Date.now() - cache.lastFetched < CACHE_DURATION
    ) {
      return res.json({
        ...cache.data,
        cachedAt: new Date(cache.lastFetched).toISOString(),
        fromCache: true,
      });
    }
    // Step 1: Fetch news via Tavily
    const searchData = await searchTechNews();

    if (!searchData.results || searchData.results.length === 0) {
      return res
        .status(500)
        .json({ error: "No search results from Tavily", raw: searchData });
    }

    // Step 2: Curate and summarize via Groq
    const groqData = await curateWithGroq(searchData);

    if (groqData.error) {
      return res
        .status(500)
        .json({ error: "Groq API error", details: groqData.error });
    }

    const raw = groqData.choices?.[0]?.message?.content
      ?.trim()
      .replace(/```json|```/g, "")
      .trim();

    if (!raw) {
      return res
        .status(500)
        .json({ error: "No content from Groq", raw: groqData });
    }

    let articles;
    try {
      articles = JSON.parse(raw);
    } catch (parseErr) {
      return res.status(500).json({
        error: "Failed to parse Groq response as JSON",
        raw,
      });
    }

    cache.data = {
      success: true,
      fetchedAt: new Date().toISOString(),
      total: articles.length,
      articles,
    };
    cache.lastFetched = Date.now();

    res.json(cache.data);

    // res.json({
    //   success: true,
    //   fetchedAt: new Date().toISOString(),
    //   total: articles.length,
    //   articles,
    // });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

export default router;
