function decodeBase64ToJson(encoded) {
  try {
    const buf = Buffer.from(encoded, 'base64');
    const jsonStr = buf.toString('utf8');
    return JSON.parse(jsonStr);
  } catch (err) {
    throw new Error('Invalid base64 or JSON: ' + err.message);
  }
}

module.exports = { decodeBase64ToJson };