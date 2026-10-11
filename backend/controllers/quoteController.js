const fetcher = require('../utils/fetcher');
const QUOTE_API = "https://zenquotes.io/api/random";

exports.getQuote = async (req, res) => {
  try {
    const r = await fetcher(QUOTE_API);
    if (!r.ok) return res.status(502).json({ message: "Quote API fetch failed" });
    const data = Array.isArray(r.data) ? r.data[0] : r.data;
    const quote = data.q || data.quote || "Keep going!";
    const author = data.a || data.author || "Unknown";
    return res.json({ quote, author });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch quote", error: String(err) });
  }
};
