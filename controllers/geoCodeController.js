exports.searchLocation = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: "Query too short" });
    }

    const response = await fetch(
      `https://us1.locationiq.com/v1/search?key=${process.env.LOCATIONIQ_API_KEY}&q=${encodeURIComponent(q)}&format=json&limit=5`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LOCATIONIQ ERROR:", response.status, errorText);
      return res.status(502).json({ message: "Geocoding provider error" });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("GEOCODE ERROR:", error);
    res.status(500).json({ message: "Geocoding failed" });
  }
};