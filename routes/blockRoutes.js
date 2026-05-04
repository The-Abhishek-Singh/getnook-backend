const express = require('express');
const router = express.Router();

const {
  createBlock,
  getUserBlocks,
  getMyBlocks,
  getBlockById,
  updateBlock,
  updateBlockPositions,
  toggleBlockActive,
  duplicateBlock,
  deleteBlock,
  trackBlockClick,
  testPositions
} = require('../controllers/blockController');

const { protect } = require('../middleware/authMiddleware');

router.get('/user/:username', getUserBlocks);
router.post('/click/:id', trackBlockClick);

router.get('/me', protect, getMyBlocks);
router.get('/:id', protect, getBlockById);

router.put('/positions', protect, updateBlockPositions);

router.put('/toggle/:id', protect, toggleBlockActive);
router.post('/duplicate/:id', protect, duplicateBlock);

router.post('/', protect, createBlock);
router.put('/:id', protect, updateBlock);
router.delete('/:id', protect, deleteBlock);

router.put('/positions-test', protect, testPositions);


module.exports = router;