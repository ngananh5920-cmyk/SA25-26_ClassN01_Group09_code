import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import KPI from '../models/KPI';
import mongoose from 'mongoose';
import { fetchEmployeesByIds } from '../utils/employeeClient';
import { createAuditLog } from '../utils/auditLogger';

export const getKPIs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employee, year, type, status } = req.query;
    const query: any = {};

    if (employee) query.employee = employee;
    if (year) query['period.year'] = Number(year);
    if (type) query['period.type'] = type;
    if (status) query.status = status;

    // If user is employee, only show their KPIs
    if (req.user.role === 'employee' && req.user.employeeId) {
      query.employee = req.user.employeeId;
    }

    const kpis = await KPI.find(query)
      .populate('reviewedBy', 'email')
      .sort({ 'period.year': -1, 'period.month': -1, 'period.quarter': -1 });

    const employeeIds = Array.from(
      new Set(kpis.map((kpi) => kpi.employee?.toString()).filter(Boolean))
    );
    const employees = await fetchEmployeesByIds(employeeIds, req.header('Authorization'));
    const enriched = kpis.map((kpi) => ({
      ...kpi.toObject(),
      employee: employees[kpi.employee?.toString() || ''] || kpi.employee,
    }));

    res.json({ success: true, data: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getKPI = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid KPI ID format' });
      return;
    }

    const kpi = await KPI.findById(req.params.id)
      .populate('reviewedBy', 'email');

    if (!kpi) {
      res.status(404).json({ success: false, message: 'KPI not found' });
      return;
    }

    const employees = await fetchEmployeesByIds(
      kpi.employee ? [kpi.employee.toString()] : [],
      req.header('Authorization')
    );
    res.json({
      success: true,
      data: {
        ...kpi.toObject(),
        employee: employees[kpi.employee?.toString() || ''] || kpi.employee,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createKPI = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const kpi = await KPI.create(req.body);
    const created = await KPI.findById(kpi._id);
    if (!created) {
      res.status(201).json({ success: true, data: created });
      return;
    }
    const employees = await fetchEmployeesByIds(
      created.employee ? [created.employee.toString()] : [],
      req.header('Authorization')
    );
    res.status(201).json({
      success: true,
      data: {
        ...created.toObject(),
        employee: employees[created.employee?.toString() || ''] || created.employee,
      },
    });

    await createAuditLog(req, 'kpi', 'create', { type: 'kpi', id: created._id.toString() }, {
      employee: created.employee?.toString(),
      status: created.status,
      period: created.period,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateKPI = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid KPI ID format' });
      return;
    }

    // Calculate overall score if goals are updated
    if (req.body.goals) {
      const totalWeight = req.body.goals.reduce((sum: number, goal: any) => sum + (goal.weight || 0), 0);
      if (totalWeight > 0) {
        const overallScore = req.body.goals.reduce((sum: number, goal: any) => {
          if (goal.actual !== undefined && goal.target > 0) {
            const achievement = (goal.actual / goal.target) * 100;
            return sum + (achievement * (goal.weight / totalWeight));
          }
          return sum;
        }, 0);

        req.body.overallScore = Math.round(overallScore * 100) / 100;

        // Determine rating
        if (req.body.overallScore >= 90) req.body.rating = 'excellent';
        else if (req.body.overallScore >= 80) req.body.rating = 'good';
        else if (req.body.overallScore >= 70) req.body.rating = 'average';
        else if (req.body.overallScore >= 60) req.body.rating = 'below_average';
        else req.body.rating = 'poor';
      }
    }

    const kpi = await KPI.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('reviewedBy', 'email');

    if (!kpi) {
      res.status(404).json({ success: false, message: 'KPI not found' });
      return;
    }

    const employees = await fetchEmployeesByIds(
      kpi.employee ? [kpi.employee.toString()] : [],
      req.header('Authorization')
    );
    res.json({
      success: true,
      data: {
        ...kpi.toObject(),
        employee: employees[kpi.employee?.toString() || ''] || kpi.employee,
      },
    });

    await createAuditLog(req, 'kpi', 'update', { type: 'kpi', id: kpi._id.toString() }, {
      employee: kpi.employee?.toString(),
      status: kpi.status,
      period: kpi.period,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const reviewKPI = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid KPI ID format' });
      return;
    }

    const kpi = await KPI.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        status: 'reviewed',
      },
      { new: true }
    )
      .populate('reviewedBy', 'email');

    if (!kpi) {
      res.status(404).json({ success: false, message: 'KPI not found' });
      return;
    }

    const employees = await fetchEmployeesByIds(
      kpi.employee ? [kpi.employee.toString()] : [],
      req.header('Authorization')
    );
    res.json({
      success: true,
      data: {
        ...kpi.toObject(),
        employee: employees[kpi.employee?.toString() || ''] || kpi.employee,
      },
    });

    await createAuditLog(req, 'kpi', 'review', { type: 'kpi', id: kpi._id.toString() }, {
      employee: kpi.employee?.toString(),
      status: kpi.status,
      period: kpi.period,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteKPI = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid KPI ID format' });
      return;
    }

    const kpi = await KPI.findByIdAndDelete(req.params.id);
    if (!kpi) {
      res.status(404).json({ success: false, message: 'KPI not found' });
      return;
    }

    res.json({ success: true, message: 'KPI deleted successfully' });

    await createAuditLog(req, 'kpi', 'delete', { type: 'kpi', id: req.params.id }, {});
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


