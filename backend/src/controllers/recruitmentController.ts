import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Recruitment, Candidate } from '../models/Recruitment';
import mongoose from 'mongoose';

export const getRecruitments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, department } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (department) query.department = department;

    const recruitments = await Recruitment.find(query)
      .populate('department', 'name')
      .populate('position', 'title')
      .populate('createdBy', 'email')
      .sort({ postedDate: -1 });

    res.json({ success: true, data: recruitments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecruitment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid recruitment ID format' });
      return;
    }

    const recruitment = await Recruitment.findById(req.params.id)
      .populate('department', 'name')
      .populate('position', 'title')
      .populate('createdBy', 'email');

    if (!recruitment) {
      res.status(404).json({ success: false, message: 'Recruitment not found' });
      return;
    }

    const candidates = await Candidate.find({ recruitment: recruitment._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { ...recruitment.toObject(), candidates } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createRecruitment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recruitment = await Recruitment.create({
      ...req.body,
      createdBy: req.user.id,
    });
    const populated = await Recruitment.findById(recruitment._id)
      .populate('department', 'name')
      .populate('position', 'title')
      .populate('createdBy', 'email');

    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateRecruitment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid recruitment ID format' });
      return;
    }

    const recruitment = await Recruitment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('department', 'name')
      .populate('position', 'title')
      .populate('createdBy', 'email');

    if (!recruitment) {
      res.status(404).json({ success: false, message: 'Recruitment not found' });
      return;
    }

    res.json({ success: true, data: recruitment });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteRecruitment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid recruitment ID format' });
      return;
    }

    // Delete related candidates
    await Candidate.deleteMany({ recruitment: req.params.id });

    const recruitment = await Recruitment.findByIdAndDelete(req.params.id);
    if (!recruitment) {
      res.status(404).json({ success: false, message: 'Recruitment not found' });
      return;
    }

    res.json({ success: true, message: 'Recruitment and all candidates deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Candidate operations
export const getCandidates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { recruitment, status } = req.query;
    const query: any = {};

    if (recruitment) query.recruitment = recruitment;
    if (status) query.status = status;

    const candidates = await Candidate.find(query)
      .populate('recruitment', 'title')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: candidates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCandidate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const candidate = await Candidate.create(req.body);
    const populated = await Candidate.findById(candidate._id)
      .populate('recruitment', 'title');

    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCandidate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid candidate ID format' });
      return;
    }

    const candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('recruitment', 'title');

    if (!candidate) {
      res.status(404).json({ success: false, message: 'Candidate not found' });
      return;
    }

    res.json({ success: true, data: candidate });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCandidate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid candidate ID format' });
      return;
    }

    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) {
      res.status(404).json({ success: false, message: 'Candidate not found' });
      return;
    }

    res.json({ success: true, message: 'Candidate deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

