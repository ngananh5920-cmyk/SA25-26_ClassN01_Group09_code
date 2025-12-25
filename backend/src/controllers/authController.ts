import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Employee from '../models/Employee';

const generateToken = (id: string): string => {
  return jwt.sign(
    { id }, 
    (process.env.JWT_SECRET as string) || 'fallback_secret', 
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    } as any
  );
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role, employeeId } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Check if employee exists if employeeId is provided
    if (employeeId) {
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        res.status(400).json({ message: 'Employee not found' });
        return;
      }
    }

    const user = await User.create({
      email,
      password,
      role: role || 'employee',
      employeeId,
    });

    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Please provide email and password' });
      return;
    }

    // Check MongoDB connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected. ReadyState:', mongoose.connection.readyState);
      res.status(503).json({ 
        message: 'Database connection error. Please check MongoDB is running.',
        error: 'MongoDB not connected'
      });
      return;
    }

    console.log(`🔍 Attempting to find user with email: ${email}`);
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
      },
    });
  } catch (error: any) {
    console.error('❌ Login error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    // More specific error messages
    let errorMessage = 'Internal server error';
    if (error.name === 'MongoServerError' || error.message?.includes('Mongo')) {
      errorMessage = 'Database connection error. Please check MongoDB.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      message: errorMessage,
      error: error.name || 'UnknownError',
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message,
        stack: error.stack 
      })
    });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById((req as any).user.id);
    res.json({
      success: true,
      user: {
        id: user?._id,
        email: user?.email,
        role: user?.role,
        employeeId: user?.employeeId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const linkEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.body;
    const userId = (req as any).user.id;

    if (!employeeId) {
      res.status(400).json({ message: 'Employee ID is required' });
      return;
    }

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    // Check if employee is already linked to another user
    const existingUser = await User.findOne({ employeeId });
    if (existingUser && existingUser._id.toString() !== userId) {
      res.status(400).json({ message: 'Employee is already linked to another user' });
      return;
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { employeeId },
      { new: true }
    );

    res.json({
      success: true,
      user: {
        id: user?._id,
        email: user?.email,
        role: user?.role,
        employeeId: user?.employeeId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

