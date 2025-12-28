import { Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';

export const login = async (req: any, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ message: 'Email và mật khẩu là bắt buộc' });
      return;
    }

    // Find user (password field is now included by default since we removed select: false)
    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
      return;
    }

    // Ensure password exists
    if (!user.password) {
      console.error('Password field is missing from user object');
      console.error('User email:', user.email);
      console.error('User object keys:', Object.keys(user.toObject()));
      res.status(500).json({ message: 'Lỗi xác thực: không tìm thấy mật khẩu' });
      return;
    }

    // Check password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
      return;
    }

    // Generate JWT token
    const jwtSecret: string = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign(
      { id: user._id.toString() },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRE || '7d' } as SignOptions
    );

    // Return user data (without password) and token
    const userData = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
    };

    res.json({
      success: true,
      token,
      user: userData,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: error.message || 'Lỗi server',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getMe = async (req: any, res: Response): Promise<void> => {
  try {
    // User is already attached by auth middleware
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
