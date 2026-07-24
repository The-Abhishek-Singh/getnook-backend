const express = require('express');
const router = express.Router();

const {
  registerUser,
  loginUser,
  oauthSync,
  getMe,
  updateProfile,
  updatePassword,
  deleteAccount,
  updateAvatar,
  setUsername,
  checkUsernameAvailability,
  getSocials,
  addSocials,
  getUsername,
  refreshToken,
  logout
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/oauth-sync', oauthSync);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

router.put('/set-username', protect, setUsername);
router.get('/check-username/:username', checkUsernameAvailability);
router.get('/get-my-username', protect, getUsername);
router.get('/me', protect, getMe);
router.get('/', protect, getSocials);
router.put('/update-profile', protect, updateProfile);
router.put('/update-password', protect, updatePassword);
router.put('/social/', protect, addSocials);
router.delete('/delete-account', protect, deleteAccount);
router.put('/update-avatar', protect, upload.single('image'), updateAvatar);

module.exports = router;