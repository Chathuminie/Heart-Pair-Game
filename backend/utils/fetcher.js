const axios = require('axios');

const fetcher = async (url, opts = {}) => {
  try {
    const res = await axios.get(url, Object.assign({ timeout: 5000 }, opts));
    return { ok: true, data: res.data, status: res.status };
  } catch (err) {
    return { ok: false, error: err };
  }
};

module.exports = fetcher;
