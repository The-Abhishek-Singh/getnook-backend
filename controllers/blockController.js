const Block = require('../models/Block');
const User = require('../models/User');
const Visit = require('../models/Visit');
const useragent = require('useragent');
const axios = require("axios");

const ensureProtocol = (url) => {
  if (!url) return url;
  if (!/^https?:\/\//i.test(url)) return `https://${url}`;
  return url;
};

exports.createBlock = async (req, res) => {
  try {
    const { type, position, content, style } = req.body;

    if (!type) return res.status(400).json({ message: "Type is required" });
    if (!position || !position.i)
      return res.status(400).json({ message: "Position is required" });

     const allowedTypes = [
      "link",
      "social",
      "text",
      "image",
      "video",
      "music",
      "qr",
    ];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid block type", });}

    if (typeof position !== "number") {
      return res.status(400).json({ success: false, message: "Position values must be numbers"  });}

    let finalContent = content || {};

    // Extract URL safely
    const rawUrl = content?.url || content?.handle || content?.text;

    if ((type === "link" || type === "social") && rawUrl) {
      const sanitizedUrl = ensureProtocol(
        rawUrl.trim().replace(/\\$/, "")
      );

      try {
        const microlinkRes = await axios.get(
          `https://api.microlink.io/?url=${encodeURIComponent(sanitizedUrl)}`
        );

        const data = microlinkRes.data.data;

        finalContent = {
          url: sanitizedUrl,
          title: data?.title || new URL(sanitizedUrl).hostname,
          logo: data?.logo?.url || `https://logo.clearbit.com/${new URL(sanitizedUrl).hostname}`,
        };

      } catch (err) {
        // fallback
        finalContent = {
          url: sanitizedUrl,
          title: new URL(sanitizedUrl).hostname,
          logo: `https://logo.clearbit.com/${new URL(sanitizedUrl).hostname}`,
        };
      }
    }

    const blockCount = await Block.countDocuments({ userId: req.user.id });

    const newBlock = await Block.create({
      userId: req.user.id,
      type,
      position: {
        i: position.i,
        x: position.x || 0,
        y: position.y || 0,
        w: position.w || 2,
        h: position.h || 1,
      },
      content: finalContent,
      style: style || {},
      order: blockCount,
    });

    return res.status(201).json({
      success: true,
      message: "Block created successfully",
      block: newBlock,
    });

  } catch (error) {
    console.error("Error creating block:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating block",
      error: error.message,
    });
  }
};

exports.updateBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
     return res.status(400).json({ success: false, message: "Invalid block ID"});}

    if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: "Request body cannot be empty", });}

    if (updates.content?.url) {
      try {
        new URL(ensureProtocol(updates.content.url.trim()));
      } catch {
        return res.status(400).json({ success: false, message: "Invalid URL"  });
      }
    }

    console.log(`Updating block ${id} with:`, JSON.stringify(updates, null, 2));

    // Build update object properly
    const updateFields = {};

    // Handle style updates
    if (updates.style) {
      // For each style property, set it individually
      Object.keys(updates.style).forEach(key => {
        if (updates.style[key] !== undefined) {
          updateFields[`style.${key}`] = updates.style[key];
        }
      });

      // If width is being updated, also update position dimensions
      if (updates.style.width) {
        const width = updates.style.width;
        const sizeMap = {
          '1x1': { w: 1, h: 1 },
          '2x1': { w: 2, h: 1 },
          '1x2': { w: 1, h: 2 },
          '2x2': { w: 2, h: 2 },
          'full': { w: 2, h: 1 }
        };

        const dimensions = sizeMap[width];
        if (dimensions) {
          updateFields['position.w'] = dimensions.w;
          updateFields['position.h'] = dimensions.h;
          console.log(`📐 Updated position dimensions to w=${dimensions.w}, h=${dimensions.h} for width ${width}`);
        }
      }
    }

    // Handle content updates
    if (updates.content) {
      Object.keys(updates.content).forEach(key => {
        if (updates.content[key] !== undefined) {
          updateFields[`content.${key}`] = updates.content[key];
        }
      });
    }

    // Handle position updates
    if (updates.position) {
      Object.keys(updates.position).forEach(key => {
        if (updates.position[key] !== undefined) {
          updateFields[`position.${key}`] = updates.position[key];
        }
      });
    }

    // Handle direct field updates
    if (updates.type) updateFields['type'] = updates.type;
    if (updates.order !== undefined) updateFields['order'] = updates.order;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No valid updates provided" });
    }

    console.log(`Final update fields:`, updateFields);

    // Use findByIdAndUpdate
    const updatedBlock = await Block.findByIdAndUpdate(
      id,
      { $set: updateFields },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedBlock) {
      return res.status(404).json({ message: "Block not found" });
    }

    console.log(`✅ Block ${id} updated successfully`);
    console.log(`📊 Updated style:`, updatedBlock.style);
    console.log(`📊 Updated position:`, updatedBlock.position);
    console.log(`📊 Width value: ${updatedBlock.style?.width}`);

    return res.status(200).json({
      success: true,
      message: "Block updated successfully",
      block: updatedBlock,
    });

  } catch (error) {
    console.error("Error updating block:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating block",
      error: error.message,
    });
  }
};

// Dedicated function for size updates
exports.updateBlockSize = async (req, res) => {
  try {
    const { id } = req.params;
    const { width } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
     return res.status(400).json({ success: false, message: "Invalid block ID"});}

    console.log(`📐 Updating block ${id} size to: ${width}`);

    if (!width) {
      return res.status(400).json({ message: "Width is required" });
    }

    // Map width to grid dimensions
    const sizeMap = {
      '1x1': { w: 1, h: 1 },
      '2x1': { w: 2, h: 1 },
      '1x2': { w: 1, h: 2 },
      '2x2': { w: 2, h: 2 },
      'full': { w: 2, h: 1 }
    };

    const dimensions = sizeMap[width];
    if (!dimensions) {
      return res.status(400).json({ message: "Invalid width value" });
    }

    // Update both style.width and position dimensions
    const updatedBlock = await Block.findByIdAndUpdate(
      id,
      {
        $set: {
          'style.width': width,
          'position.w': dimensions.w,
          'position.h': dimensions.h
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedBlock) {
      return res.status(404).json({ message: "Block not found" });
    }

    console.log(`✅ Block ${id} size updated to ${width}`);
    console.log(`📊 New style.width: ${updatedBlock.style?.width}`);
    console.log(`📊 New position: w=${updatedBlock.position?.w}, h=${updatedBlock.position?.h}`);

    res.json({
      success: true,
      message: "Block size updated successfully",
      block: updatedBlock
    });

  } catch (error) {
    console.error("Error updating block size:", error);
    res.status(500).json({
      success: false,
      message: "Error updating block size",
      error: error.message
    });
  }
};

exports.getUserBlocks = async (req, res) => {
  try {
    const username = req.params.username;

    if (!username?.trim()) {
      return res.status(400).json({ success: false, message: "Username is required"});}

    const user = await User.findOne(
      { username, isDeleted: false, isPublished: true },
      "profile theme socials"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const blocks = await Block.find(
      { userId: user._id, isActive: true },
      "-__v"
    ).sort({ order: 1 });

    // Track visit (async, does not slow response)
    setImmediate(async () => {
      try {
        const agent = useragent.parse(req.headers['user-agent']);
        let device = 'desktop';

        if (agent.device.family !== 'Other') device = 'mobile';
        if (req.headers['user-agent']?.toLowerCase().includes('tablet')) device = 'tablet';

        await Visit.create({
          userId: user._id,
          visitorId: req.ip,
          deviceType: device,
          referrer: req.headers['referer'] || 'direct',
        });

      } catch (err) {
        console.log("Analytics Error:", err.message);
      }
    });

    res.json({
      profile: user.profile,
      theme: user.theme,
      socials: user.socials,
      blocks
    });

  } catch (error) {
    console.error("Error fetching user blocks:", error);
    res.status(500).json({ message: 'Error fetching blocks', error: error.message });
  }
};

exports.getMyBlocks = async (req, res) => {
  try {
    const blocks = await Block.find({ userId: req.user.id })
      .sort({ order: 1 });

    console.log(`Found ${blocks.length} blocks for user ${req.user.id}`);

    res.json(blocks);
  } catch (error) {
    console.error("Error in getMyBlocks:", error);
    res.status(500).json({ message: 'Error fetching blocks', error: error.message });
  }
};

exports.debugRawBlocks = async (req, res) => {
  console.log("\n========== DEBUG RAW BLOCKS ==========");
  try {
    const blocks = await Block.find({ userId: req.user.id });

    const debugData = blocks.map(block => ({
      id: block._id,
      type: block.type,
      contentRaw: block.content,
      contentType: typeof block.content,
      contentStringified: JSON.stringify(block.content),
      logoExists: !!block.content?.logo,
      logoValue: block.content?.logo,
      titleExists: !!block.content?.title,
      titleValue: block.content?.title,
      urlExists: !!block.content?.url,
      urlValue: block.content?.url,
      style: block.style,
      position: block.position,
      createdAt: block.createdAt
    }));

    console.log("Debug data:", JSON.stringify(debugData, null, 2));

    res.json({
      success: true,
      blocks: debugData,
      rawBlocks: blocks
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getBlockById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate block id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid block ID"})}

    const block = await Block.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!block) return res.status(404).json({ message: 'Block not found' });

    res.json(block);
  } catch (error) {
    console.error("Error fetching block:", error);
    res.status(500).json({ message: 'Error fetching block', error: error.message });
  }
};

exports.updateBlockPositions = async (req, res) => {
  try {
    console.log("=== UPDATE POSITIONS CALLED ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const { blocks } = req.body;

    // Validation
    if (!blocks) {
      console.log("No blocks array in request");
      return res.status(400).json({
        success: false,
        message: "blocks array is required"
      });
    }

    if (!Array.isArray(blocks)) {
      console.log("blocks is not an array");
      return res.status(400).json({
        success: false,
        message: "blocks must be an array"
      });
    }

    if (blocks.length === 0) {
      console.log("blocks array is empty");
      return res.status(400).json({
        success: false,
        message: "blocks cannot be empty"
      });
    }

    // Update each block one by one (simpler for debugging)
    let updatedCount = 0;

    for (const block of blocks) {
      if (!block.id) {
        console.log("Skipping block without id:", block);
        continue;
      }

      console.log(`Updating block ${block.id} to order ${block.order}`);

      const result = await Block.updateOne(
        { _id: block.id, userId: req.user.id },
        { $set: { order: block.order } }
      );

      if (result.modifiedCount > 0) {
        updatedCount++;
        console.log(`✅ Updated block ${block.id}`);
      } else {
        console.log(`⚠️ Block ${block.id} not found or no change`);
      }
    }

    console.log(`✅ Successfully updated ${updatedCount} blocks`);

    return res.status(200).json({
      success: true,
      message: `Updated ${updatedCount} blocks successfully`,
      updatedCount: updatedCount
    });

  } catch (error) {
    console.error("Error in updateBlockPositions:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating positions",
      error: error.message
    });
  }
};

exports.toggleBlockActive = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid block ID",})}

    const block = await Block.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!block) return res.status(404).json({ message: 'Block not found' });

    block.isActive = !block.isActive;
    await block.save();

    res.json(block);
  } catch (error) {
    console.error("Error toggling block:", error);
    res.status(500).json({ message: 'Error toggling block', error: error.message });
  }
};

exports.duplicateBlock = async (req, res) => {
  try {
     const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false,message: "Invalid block ID"});}

    const block = await Block.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!block) return res.status(404).json({ message: 'Block not found' });

    const newBlock = block.toObject();
    delete newBlock._id;

    newBlock.position.y += 1;
    newBlock.order += 1;
    newBlock.clicks = 0;
    newBlock.views = 0;

    const createdBlock = await Block.create(newBlock);

     return res.status(201).json({ success: true, message: "Block duplicated successfully",
      block: createdBlock,
    });

  } catch (error) {
    console.error("Error duplicating block:", error);
    res.status(500).json({ message: 'Error duplicating block', error: error.message });
  }
};

exports.deleteBlock = async (req, res) => {
  try {
     const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid block ID"});
    }

    const block = await Block.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });


    if (!block) {
      return res.status(404).json({ message: 'Block not found or unauthorized' });
    }

    console.log(`✅ Block ${req.params.id} deleted successfully`);
    res.json({
      success: true,
      message: 'Block deleted successfully'
    });

  } catch (error) {
    console.error("Error deleting block:", error);
    res.status(500).json({
      success: false,
      message: 'Error deleting block',
      error: error.message
    });
  }
};

exports.trackBlockClick = async (req, res) => {
  try {
    await Block.findByIdAndUpdate(req.params.id, {
      $inc: { clicks: 1 }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Click tracking failed:", error);
    res.status(500).json({ message: 'Click tracking failed', error: error.message });
  }
};

exports.testPositions = async (req, res) => {
  console.log("Test endpoint hit!");
  res.json({ message: "Test endpoint working", body: req.body });
};
