import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Contract from '../models/Contract';
import mongoose from 'mongoose';

export const getContracts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employee, status } = req.query;
    const query: any = {};

    if (employee) query.employee = employee;
    if (status) query.status = status;

    const contracts = await Contract.find(query)
      .populate('employee', 'firstName lastName email employeeId')
      .populate('department', 'name')
      .populate('position', 'title')
      .sort({ startDate: -1 });

    res.json({ success: true, data: contracts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getContract = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid contract ID format' });
      return;
    }

    const contract = await Contract.findById(req.params.id)
      .populate('employee', 'firstName lastName email employeeId')
      .populate('department', 'name')
      .populate('position', 'title');

    if (!contract) {
      res.status(404).json({ success: false, message: 'Contract not found' });
      return;
    }

    res.json({ success: true, data: contract });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createContract = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contract = await Contract.create(req.body);
    const populated = await Contract.findById(contract._id)
      .populate('employee', 'firstName lastName email employeeId')
      .populate('department', 'name')
      .populate('position', 'title');

    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateContract = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid contract ID format' });
      return;
    }

    const contract = await Contract.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('employee', 'firstName lastName email employeeId')
      .populate('department', 'name')
      .populate('position', 'title');

    if (!contract) {
      res.status(404).json({ success: false, message: 'Contract not found' });
      return;
    }

    res.json({ success: true, data: contract });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteContract = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid contract ID format' });
      return;
    }

    const contract = await Contract.findByIdAndDelete(req.params.id);

    if (!contract) {
      res.status(404).json({ success: false, message: 'Contract not found' });
      return;
    }

    res.json({ success: true, message: 'Contract deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

