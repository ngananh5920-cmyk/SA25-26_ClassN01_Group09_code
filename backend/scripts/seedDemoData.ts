import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Recruitment, Candidate } from '../src/models/Recruitment';
import KPI from '../src/models/KPI';
import { Training, TrainingEnrollment } from '../src/models/Training';
import Announcement from '../src/models/Announcement';
import User from '../src/models/User';
import Employee from '../src/models/Employee';
import Department from '../src/models/Department';
import Position from '../src/models/Position';

dotenv.config();

async function seedDemoData() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrm_db';
    
    console.log('🔄 Đang kết nối tới MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Đã kết nối MongoDB\n');

    // Lấy dữ liệu cần thiết
    const adminUser = await User.findOne({ role: 'admin' });
    const hrUser = await User.findOne({ role: 'hr' });
    const users = await User.find();
    const employees = await Employee.find().limit(10);
    const departments = await Department.find();
    const positions = await Position.find();

    if (!adminUser || !hrUser) {
      console.log('⚠️  Cần có admin và hr user để tạo dữ liệu demo');
      return;
    }

    if (employees.length === 0 || departments.length === 0 || positions.length === 0) {
      console.log('⚠️  Cần có employees, departments và positions để tạo dữ liệu demo');
      return;
    }

    const createdBy = adminUser._id;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // ========== 1. TUYỂN DỤNG (RECRUITMENT) ==========
    console.log('🎯 Đang tạo dữ liệu Tuyển dụng...');
    
    const recruitmentData = [
      {
        title: 'Tuyển dụng Nhân viên Kinh doanh',
        department: departments[0]._id, // IT hoặc Sales
        position: positions.find(p => p.title?.includes('Kinh doanh') || p.title?.includes('Sales'))?._id || positions[0]._id,
        description: 'Công ty đang tìm kiếm nhân viên kinh doanh có kinh nghiệm, năng động, nhiệt tình. Cơ hội phát triển nghề nghiệp và thu nhập hấp dẫn.',
        requirements: [
          'Tốt nghiệp Đại học chuyên ngành Kinh tế, Marketing hoặc tương đương',
          'Có kinh nghiệm tối thiểu 2 năm trong lĩnh vực kinh doanh',
          'Kỹ năng giao tiếp tốt, tự tin, năng động',
          'Có khả năng làm việc độc lập và theo nhóm',
          'Thành thạo tin học văn phòng',
        ],
        quantity: 3,
        status: 'open' as const,
        postedDate: new Date(),
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày sau
        createdBy,
      },
      {
        title: 'Tuyển dụng Lập trình viên Full-stack',
        department: departments.find(d => d.name?.includes('IT') || d.name?.includes('Công nghệ'))?._id || departments[0]._id,
        position: positions.find(p => p.title?.includes('Lập trình') || p.title?.includes('Developer'))?._id || positions[0]._id,
        description: 'Tuyển dụng lập trình viên Full-stack với kinh nghiệm React, Node.js, MongoDB. Môi trường làm việc trẻ trung, năng động, có cơ hội thăng tiến.',
        requirements: [
          'Tốt nghiệp Đại học chuyên ngành CNTT hoặc tương đương',
          'Có kinh nghiệm tối thiểu 1 năm với React và Node.js',
          'Thành thạo JavaScript, TypeScript',
          'Có kinh nghiệm với MongoDB, Express.js',
          'Có portfolio hoặc dự án cá nhân',
        ],
        quantity: 2,
        status: 'open' as const,
        postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 ngày trước
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        createdBy,
      },
      {
        title: 'Tuyển dụng Chuyên viên Nhân sự',
        department: departments.find(d => d.name?.includes('HR') || d.name?.includes('Nhân sự'))?._id || departments[1]._id,
        position: positions.find(p => p.title?.includes('HR') || p.title?.includes('Nhân sự'))?._id || positions[4]._id,
        description: 'Tuyển dụng chuyên viên nhân sự có kinh nghiệm trong tuyển dụng, quản lý hồ sơ nhân viên, xử lý các vấn đề về lao động.',
        requirements: [
          'Tốt nghiệp Đại học chuyên ngành Quản trị Nhân sự, Kinh tế hoặc tương đương',
          'Có kinh nghiệm tối thiểu 1 năm trong lĩnh vực nhân sự',
          'Hiểu biết về Luật Lao động Việt Nam',
          'Kỹ năng giao tiếp, đàm phán tốt',
          'Thành thạo Excel, Word, các phần mềm quản lý nhân sự',
        ],
        quantity: 1,
        status: 'open' as const,
        postedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        createdBy,
      },
    ];

    const recruitments = [];
    for (const data of recruitmentData) {
      const recruitment = await Recruitment.create(data);
      recruitments.push(recruitment);
      console.log(`   ✅ ${recruitment.title}`);
    }

    // Tạo ứng viên cho một số tin tuyển dụng
    if (recruitments.length > 0) {
      const candidateData = [
        {
          recruitment: recruitments[0]._id,
          firstName: 'Nguyễn',
          lastName: 'Văn A',
          email: 'nguyenvana@example.com',
          phone: '0912345678',
          status: 'applied' as const,
          coverLetter: 'Tôi rất quan tâm đến vị trí này và mong muốn được góp phần vào sự phát triển của công ty.',
        },
        {
          recruitment: recruitments[0]._id,
          firstName: 'Trần',
          lastName: 'Thị B',
          email: 'tranthib@example.com',
          phone: '0912345679',
          status: 'screening' as const,
          rating: 4,
        },
        {
          recruitment: recruitments[1]._id,
          firstName: 'Lê',
          lastName: 'Văn C',
          email: 'levanc@example.com',
          phone: '0912345680',
          status: 'interview' as const,
          interviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          rating: 5,
        },
      ];

      for (const data of candidateData) {
        await Candidate.create(data);
      }
      console.log(`   ✅ Đã tạo ${candidateData.length} ứng viên\n`);
    }

    // ========== 2. ĐÁNH GIÁ & KPI ==========
    console.log('📊 Đang tạo dữ liệu Đánh giá & KPI...');

    const kpiData = [];
    for (let i = 0; i < Math.min(employees.length, 5); i++) {
      const employee = employees[i];
      const goals = [
        {
          name: 'Doanh số bán hàng',
          target: 100000000,
          actual: 85000000 + Math.random() * 30000000,
          weight: 40,
          unit: 'VND',
        },
        {
          name: 'Số khách hàng mới',
          target: 20,
          actual: 15 + Math.floor(Math.random() * 10),
          weight: 30,
          unit: 'khách hàng',
        },
        {
          name: 'Tỷ lệ hài lòng khách hàng',
          target: 90,
          actual: 85 + Math.floor(Math.random() * 10),
          weight: 20,
          unit: '%',
        },
        {
          name: 'Hoàn thành dự án đúng hạn',
          target: 100,
          actual: 90 + Math.floor(Math.random() * 10),
          weight: 10,
          unit: '%',
        },
      ];

      // Tính điểm tổng thể
      const totalWeight = goals.reduce((sum, g) => sum + g.weight, 0);
      let overallScore = goals.reduce((sum, goal) => {
        if (goal.actual !== undefined && goal.target > 0) {
          const achievement = Math.min((goal.actual / goal.target) * 100, 100); // Giới hạn tối đa 100%
          return sum + (achievement * (goal.weight / totalWeight));
        }
        return sum;
      }, 0);

      // Đảm bảo overallScore không vượt quá 100
      overallScore = Math.min(overallScore, 100);

      let rating: 'excellent' | 'good' | 'average' | 'below_average' | 'poor' = 'average';
      if (overallScore >= 90) rating = 'excellent';
      else if (overallScore >= 80) rating = 'good';
      else if (overallScore >= 70) rating = 'average';
      else if (overallScore >= 60) rating = 'below_average';
      else rating = 'poor';

      kpiData.push({
        employee: employee._id,
        period: {
          type: 'monthly' as const,
          month: currentMonth - 1 || 11,
          year: currentMonth === 1 ? currentYear - 1 : currentYear,
        },
        goals,
        overallScore: Math.round(overallScore * 100) / 100,
        rating,
        managerComment: 'Nhân viên có hiệu suất làm việc tốt, cần tiếp tục phát huy.',
        status: 'reviewed' as const,
        reviewedBy: hrUser._id,
        reviewedAt: new Date(),
      });
    }

    for (const data of kpiData) {
      await KPI.create(data);
      console.log(`   ✅ KPI cho nhân viên ${data.employee}`);
    }
    console.log(`✅ Đã tạo ${kpiData.length} KPI\n`);

    // ========== 3. ĐÀO TẠO (TRAINING) ==========
    console.log('🎓 Đang tạo dữ liệu Đào tạo...');

    const trainingData = [
      {
        title: 'Đào tạo Kỹ năng Bán hàng Chuyên nghiệp',
        description: 'Khóa học cung cấp các kỹ năng bán hàng từ cơ bản đến nâng cao, bao gồm: kỹ thuật chốt sale, xử lý từ chối, xây dựng mối quan hệ khách hàng.',
        type: 'internal' as const,
        instructor: 'Nguyễn Văn An - Trưởng phòng Kinh doanh',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        location: 'Phòng họp A - Tầng 3',
        maxParticipants: 20,
        status: 'scheduled' as const,
        createdBy,
      },
      {
        title: 'Khóa học React & Node.js Nâng cao',
        description: 'Khóa học dành cho lập trình viên muốn nâng cao kỹ năng với React hooks, Redux, Node.js, MongoDB. Bao gồm thực hành dự án thực tế.',
        type: 'external' as const,
        instructor: 'Trung tâm Đào tạo CNTT TechMaster',
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        location: 'Trung tâm TechMaster - 14 P. Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
        maxParticipants: 15,
        status: 'scheduled' as const,
        createdBy,
      },
      {
        title: 'Workshop Quản lý Thời gian Hiệu quả',
        description: 'Workshop 1 ngày về kỹ năng quản lý thời gian, ưu tiên công việc, và tăng năng suất làm việc. Phù hợp cho tất cả nhân viên.',
        type: 'workshop' as const,
        instructor: 'Chuyên gia Nguyễn Thị Bình',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        location: 'Hội trường lớn - Tầng 1',
        maxParticipants: 50,
        status: 'completed' as const,
        createdBy,
      },
      {
        title: 'Đào tạo Trực tuyến: Excel Nâng cao',
        description: 'Khóa học trực tuyến về các hàm Excel nâng cao, Pivot Table, VBA cơ bản. Học viên có thể học theo tiến độ của mình.',
        type: 'online' as const,
        instructor: 'Giảng viên Online',
        startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        location: 'Nền tảng học trực tuyến',
        maxParticipants: 100,
        status: 'ongoing' as const,
        createdBy,
      },
    ];

    const trainings = [];
    for (const data of trainingData) {
      const training = await Training.create(data);
      trainings.push(training);
      console.log(`   ✅ ${training.title}`);
    }

    // Tạo đăng ký đào tạo
    if (trainings.length > 0 && employees.length > 0) {
      const enrollmentData = [];
      
      // Đăng ký cho training đang diễn ra
      for (let i = 0; i < Math.min(employees.length, 5); i++) {
        enrollmentData.push({
          training: trainings[3]._id, // Excel online
          employee: employees[i]._id,
          status: 'attending' as const,
          progress: 30 + Math.floor(Math.random() * 50),
        });
      }

      // Đăng ký cho training sắp tới
      for (let i = 0; i < Math.min(employees.length, 3); i++) {
        enrollmentData.push({
          training: trainings[0]._id, // Kỹ năng bán hàng
          employee: employees[i]._id,
          status: 'enrolled' as const,
        });
      }

      // Hoàn thành training
      for (let i = 0; i < Math.min(employees.length, 2); i++) {
        enrollmentData.push({
          training: trainings[2]._id, // Workshop đã hoàn thành
          employee: employees[i]._id,
          status: 'completed' as const,
          progress: 100,
          score: 85 + Math.floor(Math.random() * 15),
        });
      }

      for (const data of enrollmentData) {
        try {
          await TrainingEnrollment.create(data);
        } catch (error) {
          // Bỏ qua nếu đã tồn tại
        }
      }
      console.log(`   ✅ Đã tạo ${enrollmentData.length} đăng ký đào tạo\n`);
    }

    // ========== 4. THÔNG BÁO (ANNOUNCEMENTS) ==========
    console.log('📢 Đang tạo dữ liệu Thông báo...');

    const announcementData = [
      {
        title: 'Thông báo Lịch nghỉ Tết Nguyên Đán 2025',
        content: `Kính gửi toàn thể cán bộ, nhân viên công ty,

Công ty thông báo lịch nghỉ Tết Nguyên Đán 2025 như sau:
- Bắt đầu nghỉ: 28/01/2025 (29 Tết)
- Quay lại làm việc: 05/02/2025 (Mùng 7 Tết)

Trong thời gian nghỉ Tết, các phòng ban cần bố trí người trực để xử lý các công việc khẩn cấp.

Chúc toàn thể cán bộ, nhân viên và gia đình một năm mới an khang, thịnh vượng!`,
        type: 'company' as const,
        priority: 'high' as const,
        targetAudience: 'all',
        publishDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        status: 'published' as const,
        createdBy,
      },
      {
        title: 'Tin tức: Công ty đạt doanh thu kỷ lục Quý 4/2024',
        content: `Chúng ta vui mừng thông báo rằng công ty đã đạt doanh thu kỷ lục trong Quý 4/2024, vượt mục tiêu 15%.

Thành tích này là nhờ sự nỗ lực không ngừng của toàn thể nhân viên. Ban lãnh đạo xin gửi lời cảm ơn chân thành đến tất cả các bạn.

Phần thưởng và tiền thưởng sẽ được chi trả vào lương tháng 1/2025.`,
        type: 'news' as const,
        priority: 'normal' as const,
        targetAudience: 'all',
        publishDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'published' as const,
        createdBy,
      },
      {
        title: 'Sự kiện: Team Building cuối năm 2024',
        content: `Kính mời toàn thể nhân viên tham gia sự kiện Team Building cuối năm 2024:

📅 Thời gian: 15/12/2024 (Chủ nhật)
📍 Địa điểm: Khu du lịch Đầm Sen, TP.HCM
⏰ Tập trung: 7:00 sáng tại công ty

Chương trình bao gồm:
- Hoạt động team building
- Ăn trưa buffet
- Trò chơi tập thể
- Trao giải thưởng

Vui lòng đăng ký tham gia trước ngày 10/12/2024.`,
        type: 'event' as const,
        priority: 'normal' as const,
        targetAudience: 'all',
        publishDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        status: 'published' as const,
        createdBy,
      },
      {
        title: 'Chính sách mới: Quy định về làm việc từ xa',
        content: `Công ty ban hành quy định mới về làm việc từ xa (Remote Work):

1. Nhân viên có thể làm việc từ xa tối đa 2 ngày/tuần sau khi được quản lý phê duyệt.

2. Yêu cầu:
   - Có kết nối internet ổn định
   - Tham gia đầy đủ các cuộc họp trực tuyến
   - Báo cáo công việc hàng ngày

3. Đăng ký: Gửi email cho quản lý trực tiếp trước 1 tuần.

Quy định có hiệu lực từ ngày 01/01/2025.`,
        type: 'policy' as const,
        priority: 'high' as const,
        targetAudience: 'all',
        publishDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'published' as const,
        createdBy,
      },
      {
        title: 'Thông báo khẩn: Họp toàn công ty tháng 12',
        content: `Kính mời toàn thể nhân viên tham gia cuộc họp toàn công ty:

📅 Thời gian: 20/12/2024, 14:00 - 16:00
📍 Địa điểm: Hội trường lớn - Tầng 1

Nội dung:
- Tổng kết hoạt động năm 2024
- Kế hoạch năm 2025
- Trao giải thưởng nhân viên xuất sắc

Vui lòng có mặt đúng giờ.`,
        type: 'company' as const,
        priority: 'urgent' as const,
        targetAudience: 'all',
        publishDate: new Date(),
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'published' as const,
        createdBy,
      },
    ];

    for (const data of announcementData) {
      const announcement = await Announcement.create(data);
      console.log(`   ✅ ${announcement.title}`);
    }
    console.log(`✅ Đã tạo ${announcementData.length} thông báo\n`);

    console.log('🎉 Hoàn thành tạo dữ liệu demo!');
    console.log('\n📊 Tóm tắt:');
    console.log(`   - Tuyển dụng: ${recruitments.length} tin`);
    console.log(`   - KPI: ${kpiData.length} bản đánh giá`);
    console.log(`   - Đào tạo: ${trainings.length} khóa học`);
    console.log(`   - Thông báo: ${announcementData.length} thông báo`);

    await mongoose.disconnect();
    console.log('\n✅ Đã ngắt kết nối MongoDB');
  } catch (error: any) {
    console.error('❌ Lỗi:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Chạy script
if (require.main === module) {
  seedDemoData();
}

export default seedDemoData;

