const randomInt = (min,max) => Math.floor(Math.random()*(max-min+1))+min;

exports.getHeart = (req, res) => {
  try {
    const solution = randomInt(1,10);
    const addend = randomInt(1,10);
    return res.json({ prompt: `heart + ${addend} = ${solution + addend}`, solution });
  } catch (err) {
    return res.status(500).json({ message: 'Error selecting heart', error: String(err) });
  }
};

// Proxy external Heart Game API to avoid CORS issues from browser
const fetcher = require('../utils/fetcher');
exports.getExternal = async (req, res) => {
  try {
    const externalUrl = 'http://marcconrad.com/uob/heart/api.php?out=json&base64=no';
    const r = await fetcher(externalUrl);
    if (!r.ok) {
      return res.status(502).json({ message: 'External Heart API fetch failed' });
    }
    // r.data may be JSON or string; ensure it's an object
    const data = r.data;
    if (!data || typeof data.question !== 'string' || !/^https?:\/\//.test(data.question) || !Number.isFinite(Number(data.solution))) {
      return res.status(502).json({ error: 'External puzzle response was invalid' });
    }
    return res.json(data);
  } catch (err) {
    console.error('Error fetching external heart API:', err);
    return res.status(500).json({ message: 'Error fetching external heart API' });
  }
};
