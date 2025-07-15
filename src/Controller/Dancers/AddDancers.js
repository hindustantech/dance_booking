import Dancer from '../../Modle/Dancers/Dancers.modle.js';
import User from '../../Modle/user/User.js';
import multer from 'multer';
import { DancerVerification } from '../../Modle/Dancers/Dancers.modle.js';
import { uploadToCloudinary } from '../../Utils/cloudinary.js';
 

// Multer setup for ID proof and video uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
export const upload = multer({ storage });

// Helper to upload multiple files to Cloudinary
const uploadMultipleToCloudinary = async (files, folder) => {
    if (!files || files.length === 0) return [];
    const urls = [];
    for (const file of files) {
        const url = await uploadToCloudinary(file.path, folder);
        urls.push(url);
    }
    return urls;
};

export const addDancer = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const {
            fullName,
            dancerName,
            danceSpeciality,
            ratePerPerformance,
            age,
            height,
            weight,
            gender,
            experience
        } = req.body;
        let dancerImageUrl = null;
        if (req.files && req.files.dancerImage && req.files.dancerImage[0]) {
            dancerImageUrl = await uploadToCloudinary(req.files.dancerImage[0].path, 'dancers/images');
        }
        let videos = [];
        if (req.files && req.files.videos) {
            videos = await uploadMultipleToCloudinary(req.files.videos, 'dancers/videos');
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        const dancer = new Dancer({
            fullName,
            dancerName,
            danceSpeciality,
            ratePerPerformance,
            age,
            height,
            weight,
            gender,
            experience,
            userId,
            dancerImage: dancerImageUrl,
            videos
        });
        await dancer.save();
        res.status(201).json({ message: 'Dancer added successfully', dancer });
    } catch (error) {
        next(error);
    }
};

export const getDancers = async (req, res, next) => {
    try {
        const dancers = await Dancer.find();
        res.json({ dancers });
    } catch (error) {
        next(error);
    }
};

// Get all dancers for a particular user by userId
export const getDancerById = async (req, res, next) => {
    try {
        const userId = req.user._id; // id here is userId
        // Find all dancers where userId matches the given id
        const dancers = await Dancer.find({ userId: userId });
        if (!dancers || dancers.length === 0) {
            return res.status(404).json({ message: 'No dancers found for this user' });
        }
        res.json({ dancers });
    } catch (error) {
        next(error);
    }
};

export const updateDancer = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        const { id } = req.params;
        const update = req.body;
        const dancer = await Dancer.findById(id);
        if (!dancer) return res.status(404).json({ message: 'Dancer not found' });
        if (dancer.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this dancer' });
        }
        // Optionally update image
        if (req.files && req.files.dancerImage && req.files.dancerImage[0]) {
            update.dancerImage = await uploadToCloudinary(req.files.dancerImage[0].path, 'dancers/images');
        }
        // Optionally update videos (replace all if provided)
        if (req.files && req.files.videos) {
            update.videos = await uploadMultipleToCloudinary(req.files.videos, 'dancers/videos');
        }
        Object.assign(dancer, update);
        await dancer.save();
        res.json({ message: 'Dancer updated successfully', dancer });
    } catch (error) {
        next(error);
    }
};

export const deleteDancer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const dancer = await Dancer.findById(id);
        if (!dancer) return res.status(404).json({ message: 'Dancer not found' });
        if (dancer.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this dancer' });
        }
        await dancer.deleteOne();
        res.json({ message: 'Dancer deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const activateDancer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const dancer = await Dancer.findByIdAndUpdate(id, { booked: false }, { new: true });
        if (!dancer) return res.status(404).json({ message: 'Dancer not found' });
        res.json({ message: 'Dancer activated', dancer });
    } catch (error) {
        next(error);
    }
};

export const deactivateDancer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const dancer = await Dancer.findByIdAndUpdate(id, { booked: true }, { new: true });
        if (!dancer) return res.status(404).json({ message: 'Dancer not found' });
        res.json({ message: 'Dancer deactivated', dancer });
    } catch (error) {
        next(error);
    }
};

export const verifyDancer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { idProofNumber } = req.body;
        let idProofFileUrl = null;
        if (req.file) {
            idProofFileUrl = await uploadToCloudinary(req.file.path, 'dancers/idproofs');
        }
        if (!idProofFileUrl || !idProofNumber) {
            return res.status(400).json({ message: 'ID proof file and number are required' });
        }
        // Save verification info to DancerVerification
        const verification = await DancerVerification.create({
            dancerId: id,
            idProofFile: idProofFileUrl,
            idProofNumber,
            verified: false
        });
        res.json({ message: 'Dancer verification submitted', verification });
    } catch (error) {
        next(error);
    }
};