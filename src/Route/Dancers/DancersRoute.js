import express from 'express';
import {
  addDancer,
  updateDancer,
  deleteDancer,
  activateDancer,
  deactivateDancer,
  verifyDancer,
  getDancers,
  getDancerById
} from '../../Controller/Dancers/AddDancers.js';
import { protect } from '../../Middleware/authMiddleware.js';

const router = express.Router();

// Get all dancers
router.get('/', protect, getDancers);
// Get single dancer
router.get('/:id', protect, getDancerById);      
// Create dancer
router.post('/', protect, addDancer);
// Update dancer
router.put('/:id', protect, updateDancer);
// Delete dancer
router.delete('/:id', protect, deleteDancer);
// Activate dancer
router.patch('/:id/activate', protect, activateDancer);
// Deactivate dancer
router.patch('/:id/deactivate', protect, deactivateDancer);
// Verify dancer (with ID proof upload)
router.post('/:id/verify', protect, verifyDancer);

export default router;
