const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.registerUser = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ message: 'Email, password and username are required' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const usernameTaken = await User.findOne({ username });
    if (usernameTaken) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      username,
      password: hashedPassword,
      authProvider: 'local',
      profile: {
        displayName: email.split('@')[0]
      }
    });

    res.status(201).json({
      _id: user.id,
      email: user.email,
      username: user.username,
      token: generateToken(user._id)
    });

  } catch (error) {
    console.log("CRASH_LOG:", error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (user && user.isDeleted) {
      return res.status(403).json({ message: 'This account has been deleted.' });
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.oauthSync = async (req, res) => {
  try {
    const { email, displayName, avatarUrl, provider, providerId } = req.body;
    let user = await User.findOne({ email });

    if (user && user.isDeleted) {
      return res.status(403).json({ message: 'This account has been deleted. Please contact support to restore it.' });
    }

    if (user) {
      return res.json({
        _id: user.id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id)
      });
    }

    const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
    const uniqueUsername = `${baseUsername}_${Math.floor(Math.random() * 10000)}`;

    user = await User.create({
      username: uniqueUsername,
      email,
      authProvider: provider || 'google',
      providerId: providerId,
      profile: { displayName: displayName || baseUsername, avatarUrl: avatarUrl || "" }
    });

    res.status(201).json({
      _id: user.id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: 'OAuth Sync Error', error: error.message });
  }
};

exports.setUsername = async (req, res) => {
  try {
    let { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    username = username.toLowerCase().trim();

    const usernameRegex = /^[a-zA-Z0-9]+([._-]?[a-zA-Z0-9]+)*$/;

    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        message:
          "Invalid username. Only letters, numbers, ., _, - allowed and no consecutive symbols"
      });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.username) {
      return res.status(400).json({
        message: "Username already set. You cannot change it again."
      });
    }


    user.username = username;
    await user.save();


    res.json({
      message: "Username set successfully",
      username: user.username
    });

  } catch (error) {
    console.error("SET USERNAME ERROR:", error);


    res.status(500).json({
      message: "Error setting username",
      error: error.message
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getUsername = async (req, res) => {
  // req.user.id comes from the 'protect' middleware
  console.log("getUsername called for authenticated user:", req.user.id);
  try {
    const user = await User.findById(req.user.id).select("username");
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      username: user.username
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.updateProfile = async (req, res) => {
  console.log("update profile called");
  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update profile fields
    if (req.body.profile) {
      for (const key of Object.keys(req.body.profile)) {
        user.profile[key] = req.body.profile[key];
      }
    }

    // Update theme fields
    if (req.body.theme) {
      user.theme = { ...user.theme, ...req.body.theme };
    }

    // Update dynamic socials
    if (req.body.socials) {
      for (const [platform, link] of Object.entries(req.body.socials)) {
        user.socials.set(platform, link);
      }
    }

    const updatedUser = await user.save();
    res.json(updatedUser);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Profile Update Error', error: error.message });
  }
};

exports.updateAvatar = async (req, res) => {
  console.log("update avatar called");

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete old avatar from Cloudinary (important)
    if (user.profile.avatarPublicId) {
      const cloudinary = require("cloudinary").v2;
      await cloudinary.uploader.destroy(user.profile.avatarPublicId);
    }

    // Save new avatar
    user.profile.avatarUrl = req.file.path;
    user.profile.avatarPublicId = req.file.filename;

    await user.save();

    res.json({
      message: "Avatar updated successfully",
      avatarUrl: req.file.path,
      publicId: req.file.filename,
    });
  } catch (error) {
    res.status(500).json({
      message: "Avatar Update Error",
      error: error.message,
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (user.authProvider !== 'local') {
      return res.status(400).json({ message: 'Cannot change password for accounts created via social login.' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect old password.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Password Update Error', error: error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.isPublished = false;

    await user.save();
    res.json({ message: 'Account deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Account Delete Error' });
  }
};

exports.checkUsernameAvailability = async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const user = await User.findOne({ username });

    if (user) {
      return res.json({ available: false });
    }

    res.json({ available: true });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.addSocials = async (req, res) => {
  console.log("social called");

  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Not authorized, user missing' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Invalid data format for socials' });
    }

    // 🔥 Normalize function (remove trailing slash & trim)
    const normalizeLink = (url) => url.trim().replace(/\/+$/, '');

    // 🔥 Existing links (normalized)
    const existingLinks = Array.from(user.socials.values()).map(normalizeLink);

    for (const [platform, link] of Object.entries(req.body)) {
      if (!link || typeof link !== 'string') {
        return res.status(400).json({
          message: `Invalid link for platform: ${platform}`
        });
      }

      const cleanLink = normalizeLink(link);

      // ❌ Duplicate link check
      if (existingLinks.includes(cleanLink)) {
        return res.status(400).json({
          message: `This link is already added: ${link}`
        });
      }

      // ✅ Add / overwrite platform
      user.socials.set(platform, cleanLink);

      // 🔁 Update array to prevent duplicates in same request
      existingLinks.push(cleanLink);
    }

    await user.save();

    res.json({
      message: 'Socials updated successfully',
      socials: Object.fromEntries(user.socials)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error updating socials',
      error: error.message
    });
  }
};

exports.getSocials = async (req, res) => {
  console.log("social called");
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Not authorized, user missing' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ socials: Object.fromEntries(user.socials) });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching socials', error: error.message });
  }
};