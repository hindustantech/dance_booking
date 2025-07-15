import Dancer from '../../Modle/Dancers/Dancers.modle.js';
import User from '../../Modle/user/User.js';
import multer from 'multer';
import { DancerVerification } from '../../Modle/Dancers/Dancers.modle.js';
import { uploadToCloudinary } from '../../Utils/cloudinary.js';
 

// Multer setup for ID proof upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/idproofs/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
export const upload = multer({ storage });

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
            experience,
        } = req.body;

        let dancerImageUrl = null;
        if (req.file) {
            dancerImageUrl = await uploadToCloudinary(req.file.path, 'dancers/images');
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Use 'new Dancer' and 'save' instead of 'create' for more control
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
            dancerImage: dancerImageUrl
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