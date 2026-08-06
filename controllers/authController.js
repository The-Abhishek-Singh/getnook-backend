const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }   // Access Token
  );
};

const generateRefreshToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
};


exports.registerUser = async (req, res) => {
  try {
    let { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ message: "Email, password and username are required" });
    }

    email = email.toLowerCase().trim();
    username = username.toLowerCase().trim();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9]+([._-]?[a-zA-Z0-9]+)*$/;

    if (!usernameRegex.test(username)) {
      return res.status(400).json({ message: "Invalid username. Only letters, numbers, ., _, - allowed and no consecutive symbols."  });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({
        message: "Username must be between 3 and 30 characters."
      });
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_\-+=])[A-Za-z\d@$!%*?&^#()_\-+=]{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, number and special character."
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already exists" });
      }

    const usernameTaken = await User.findOne({ username });
    if (usernameTaken) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      username,
      password: hashedPassword,
      authProvider: "local",
      profile: {
        displayName: email.split("@")[0]
      }
    });

    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      _id: user.id,
      email: user.email,
      username: user.username,
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
};

exports.loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required"});
    }
    email = email.toLowerCase().trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
    return res.status(401).json({ message:"Invalid email or password"});
    }

    if (user.isDeleted) {
      return res.status(403).json({ message: 'This account has been deleted.' });
     }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({message: "Invalid email or password" });
    }

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      _id: user.id,
      username: user.username,
      email: user.email,
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};

// exports.oauthSync = async (req, res) => {
//   try {
//     const { email, displayName, avatarUrl, provider, providerId } = req.body;
//     let user = await User.findOne({ email });

//     if (user && user.isDeleted) {
//       return res.status(403).json({ message: 'This account has been deleted. Please contact support to restore it.' });
//     }

//     if (user) {
//       const accessToken = generateToken(user._id);
//       const refreshToken = generateRefreshToken(user._id);

//      user.refreshToken = refreshToken;
//      await user.save();

//     return res.json({
//     _id: user.id,
//     username: user.username,
//     email: user.email,
//     accessToken,
//     refreshToken
//      });
//     }

//     const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
//     const uniqueUsername = `${baseUsername}_${Math.floor(Math.random() * 10000)}`;

//     user = await User.create({
//       username: uniqueUsername,
//       email,
//       authProvider: provider || 'google',
//       providerId: providerId,
//       profile: { displayName: displayName || baseUsername, avatarUrl: avatarUrl || "" }
//     });

//     const accessToken = generateToken(user._id);
//     const refreshToken = generateRefreshToken(user._id);

//     user.refreshToken = refreshToken;
//     await user.save();

//     res.status(201).json({
//     _id: user.id,
//     username: user.username,
//     email: user.email,
//     accessToken,
//     refreshToken
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'OAuth Sync Error', error: error.message });
//   }
// };


exports.oauthSync = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required."
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const email = payload.email.toLowerCase().trim();
    const displayName = payload.name;
    const avatarUrl = payload.picture;
    const provider = "google";
    const providerId = payload.sub;

    if (!email || !provider) {
      return res.status(400).json({ message: "Email and provider are required." });
}

    let user = await User.findOne({ email });

    if (user?.isDeleted) {
      return res.status(403).json({ message: "This account has been deleted. Please contact support to restore it."  });
    }

    if (user) {
      const accessToken = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      user.refreshToken = refreshToken;
      await user.save();

      return res.json({
        _id: user.id,
        username: user.username,
        email: user.email,
        accessToken,
        refreshToken
      });
    }

    // Generate unique username
    const baseUsername = email
      .split("@")[0]
      .replace(/[^a-zA-Z0-9_]/g, "")
      .toLowerCase();

    let uniqueUsername = baseUsername;
    let counter = 1;

    while (await User.findOne({ username: uniqueUsername })) {
      uniqueUsername = `${baseUsername}${counter++}`;
    }

    // Create user
    user = await User.create({
      username: uniqueUsername,
      email,
      authProvider: provider,
      providerId: providerId || null,
      profile: {
        displayName: displayName?.trim() || baseUsername,
        avatarUrl: avatarUrl || ""
      }
    });

    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      _id: user.id,
      username: user.username,
      email: user.email,
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error("OAUTH SYNC ERROR:", error);

    res.status(500).json({
      message: "OAuth Sync Error",
      error: error.message
    });
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

     if (!username) {
      return res.status(400).json({ message: "Username cannot be empty" });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ message: "Username must be between 3 and 30 characters." });
    }

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

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (error) {
    console.error("GET ME ERROR:", error);

    res.status(500).json({ message: "Server Error",
    error: error.message
    });
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
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image." });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found."  });
    }

    const cloudinary = require("cloudinary").v2;

    // Delete previous avatar (if exists)
    if (user.profile.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(user.profile.avatarPublicId);
      } catch (err) {
        console.error("Cloudinary delete failed:", err);
      }
    }

    // Validate upload response
    if (!req.file.path || !req.file.filename) {
      return res.status(500).json({  message: "Image upload failed." });
    }

    user.profile.avatarUrl = req.file.path;
    user.profile.avatarPublicId = req.file.filename;

    await user.save();

    res.json({
      message: "Avatar updated successfully",
      avatarUrl: user.profile.avatarUrl,
      publicId: user.profile.avatarPublicId
    });

  } catch (error) {
    console.error("UPDATE AVATAR ERROR:", error);

    res.status(500).json({
      message: "Avatar Update Error",
      error: error.message
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    let { oldPassword, newPassword } = req.body;


    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Old password and new password are required." });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ message: "New password must be different from the old password."  });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found."  });
    }

    if (user.authProvider !== "local") {
      return res.status(400).json({ message: "Cannot change password for accounts created via social login."  });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect old password." });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_\-+=])[A-Za-z\d@$!%*?&^#()_\-+=]{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, number and special character."
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({
      message: "Password updated successfully."
    });

  } catch (error) {
    console.error("UPDATE PASSWORD ERROR:", error);

    res.status(500).json({
      message: "Password Update Error",
      error: error.message
    });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({  message: "User not found."  });
    }

    if (user.isDeleted) {
      return res.status(400).json({ message: "Account is already deleted." });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.isPublished = false;

    // Invalidate refresh token
    user.refreshToken = null;

    await user.save();

    res.json({
      message: "Account deleted successfully."
    });

  } catch (error) {
    res.status(500).json({
      message: "Account Delete Error",
      error: error.message
    });
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
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message: "Not authorized, user missing"
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        message: "Invalid data format for socials"
      });
    }

    const allowedPlatforms = [
      "github",
      "linkedin",
      "twitter",
      "instagram",
      "facebook",
      "youtube",
      "spotify",
      "website",
      "discord",
      "telegram"
    ];

    const normalizeLink = (url) =>
      url.trim().replace(/\/+$/, "");

    const existingLinks = Array.from(user.socials.values())
      .map(normalizeLink);

    for (const [platform, link] of Object.entries(req.body)) {

      // Platform validation
      if (!allowedPlatforms.includes(platform)) {
        return res.status(400).json({
          message: `Unsupported platform: ${platform}`
        });
      }

      // Link validation
      if (!link || typeof link !== "string") {
        return res.status(400).json({
          message: `Invalid link for ${platform}`
        });
      }

      const cleanLink = normalizeLink(link);

      // URL validation
      try {
        new URL(cleanLink);
      } catch {
        return res.status(400).json({
          message: `Invalid URL for ${platform}`
        });
      }

      // Duplicate link
      if (existingLinks.includes(cleanLink)) {
        return res.status(400).json({
          message: `This link is already added: ${link}`
        });
      }

      user.socials.set(platform, cleanLink);
      existingLinks.push(cleanLink);
    }

    await user.save();

    res.json({
      message: "Socials updated successfully",
      socials: Object.fromEntries(user.socials)
    });

  } catch (error) {
    console.error("ADD SOCIALS ERROR:", error);

    res.status(500).json({
      message: "Error updating socials",
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

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token required"
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    if (user.refreshToken !== refreshToken) {
      return res.status(401).json({
        message: "Invalid refresh token"
      });
    }

    const newAccessToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    res.status(401).json({
      message: "Invalid or expired refresh token"
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.json({
        message: "Logged out"
      });
    }

    const user = await User.findOne({ refreshToken });

    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.json({
      message: "Logged out successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "Logout failed"
    });
  }
};

exports.changeUsername = async (req, res) => {
  try {
    let { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    username = username.toLowerCase().trim();

    if (!username) {
      return res.status(400).json({ message: "Username cannot be empty" });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ message: "Username must be between 3 and 30 characters." });
    }

    const usernameRegex = /^[a-zA-Z0-9]+([._-]?[a-zA-Z0-9]+)*$/;

    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        message:
          "Invalid username. Only letters, numbers, ., _, - allowed and no consecutive symbols"
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the new username is the same as the current one
    if (user.username === username) {
      return res.status(400).json({ message: "New username must be different from current username." });
    }

    // Check if the username is already taken by another user
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ message: "Username already taken" });
    }

    user.username = username;
    await user.save();

    res.json({
      message: "Username changed successfully",
      username: user.username
    });

  } catch (error) {
    console.error("CHANGE USERNAME ERROR:", error);

    res.status(500).json({
      message: "Error changing username",
      error: error.message
    });
  }
};