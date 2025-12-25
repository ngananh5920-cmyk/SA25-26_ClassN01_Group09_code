import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Position from '../models/Position';
import Employee from '../models/Employee';
import mongoose from 'mongoose';

export const getPositions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { department } = req.query;
    const query: any = {};

    if (department) query.department = department;

    const positions = await Position.find(query)
      .populate('department', 'name')
      .sort({ title: 1 });

    res.json({ success: true, data: positions });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPosition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: 'Invalid position ID format' });
      return;
    }

    const position = await Position.findById(req.params.id).populate('department', 'name');

    if (!position) {
      res.status(404).json({ message: 'Position not found' });
      return;
    }

    const employees = await Employee.find({ position: position._id })
      .select('firstName lastName email employeeId status')
      .populate('department', 'name');

    res.json({
      success: true,
      data: {
        ...position.toObject(),
        employees,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createPosition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const position = await Position.create(req.body);
    const populated = await Position.findById(position._id).populate('department', 'name');

    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePosition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: 'Invalid position ID format' });
      return;
    }

    const position = await Position.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('department', 'name');

    if (!position) {
      res.status(404).json({ message: 'Position not found' });
      return;
    }

    res.json({ success: true, data: position });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePosition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const positionId = req.params.id;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(positionId)) {
      console.error(`Invalid position ID format: ${positionId}`);
      res.status(400).json({ 
        success: false,
        message: 'Invalid position ID format' 
      });
      return;
    }

    // Check if position exists first
    const position = await Position.findById(positionId);
    if (!position) {
      console.error(`Position not found: ${positionId}`);
      res.status(404).json({ 
        success: false,
        message: 'Position not found' 
      });
      return;
    }

    // Check if position has employees
    const employeesCount = await Employee.countDocuments({ position: positionId });
    if (employeesCount > 0) {
      console.error(`Cannot delete position ${positionId}: has ${employeesCount} employees`);
      res.status(400).json({
        success: false,
        message: `Cannot delete position. It has ${employeesCount} employee(s).`,
      });
      return;
    }

    // Delete position
    await Position.findByIdAndDelete(positionId);
    console.log(`Successfully deleted position: ${positionId}`);

    res.json({ success: true, message: 'Position deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting position:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to delete position' 
    });
  }
};


