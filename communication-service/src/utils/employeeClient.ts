import axios from 'axios';

const baseURL = process.env.EMPLOYEE_SERVICE_URL || 'http://localhost:8002';
const serviceKey = process.env.SERVICE_KEY;

export const fetchEmployeeDepartment = async (
  employeeId: string,
  authHeader?: string
): Promise<string | null> => {
  if (!employeeId) {
    return null;
  }

  const response = await axios.get(
    `${baseURL}/api/employees/${employeeId}`,
    {
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        ...(serviceKey ? { 'X-Service-Key': serviceKey } : {}),
      },
    }
  );
  const employee = response.data?.data;
  return employee?.department?._id || employee?.department || null;
};

