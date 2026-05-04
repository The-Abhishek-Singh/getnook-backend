const User = require('../models/User');

exports.updateSEO = async (req, res) => {
    try {
        const { metaTitle, metaDescription, ogImage } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ message: "User not found" });

        // ✅ Initialize seo if undefined
        if (!user.seo) {
            user.seo = {
                metaTitle: "",
                metaDescription: "",
                ogImage: ""
            };
        }

        if (metaTitle !== undefined) user.seo.metaTitle = metaTitle;
        if (metaDescription !== undefined) user.seo.metaDescription = metaDescription;
        if (ogImage !== undefined) user.seo.ogImage = ogImage;

        await user.save();

        res.json({
            message: "SEO updated",
            seo: user.seo
        });

    } catch (error) {
        console.error("SEO update error:", error);
        res.status(500).json({ message: "SEO update failed", error: error.message });
    }
};