// Centralized API calls for the application
// All fake API calls are organized here for easy replacement with real implementations

// Types and Interfaces
export interface Employee {
  id: string;
  name: string;
  salary: number;
  walletAddress: string;
  teamId: string;
}

export interface Team {
  id: string;
  name: string;
  budget: number;
  color: string;
  members: Employee[];
}

export interface TeamsAndEmployeesData {
  teams: Team[];
  totalEmployees: number;
  totalTeamCosts: number;
}

export interface TreasuryBalance {
  amount: number;
  currency: string;
  lastUpdated: Date;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface DashboardData {
  dashboardStats: {
    totalUsers: number;
    activeProjects: number;
    completedTasks: number;
    revenue: string;
  };
  projects: Array<{
    id: number;
    name: string;
    status: string;
    progress: number;
  }>;
  notifications: Array<{
    id: number;
    message: string;
    time: string;
  }>;
}

export interface PortfolioData {
  value: string;
  change: string;
}

export interface AddEmployeeRequest {
  name: string;
  walletAddress: string;
  teamId: string;
  salary: number;
}

export interface CreateTeamRequest {
  name: string;
  budget: number;
  color: string;
}

export interface DeleteTeamRequest {
  teamId: string;
}

// =============================================================================
// TREASURY & COMPANY FINANCES
// =============================================================================

/**
 * Fetches the current treasury balance for the company
 * @returns Promise<TreasuryBalance>
 */
export const fetchTreasuryBalance = (): Promise<TreasuryBalance> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        amount: 30000.00, // Updated amount as per user's change
        currency: 'USD',
        lastUpdated: new Date()
      });
    }, 2000); // 2-second delay
  });
};

// =============================================================================
// TEAMS & EMPLOYEE MANAGEMENT
// =============================================================================

/**
 * Fetches all teams with their employees - UNIFIED API CALL
 * @returns Promise<TeamsAndEmployeesData>
 */
export const fetchTeamsAndEmployees = (): Promise<TeamsAndEmployeesData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const teams: Team[] = [
        {
          id: '1',
          name: 'Marketing',
          budget: 0, // Will be calculated from employee salaries
          color: '#FF6B6B',
          members: [
            {
              id: '1',
              name: 'Alice Johnson',
              salary: 5500,
              walletAddress: '0x742d35Cc6634C0532925a3b8D2F0f8e7',
              teamId: '1'
            },
            {
              id: '2',
              name: 'Bob Smith',
              salary: 4200,
              walletAddress: '0x8ba1f109551bD432803012645Hac136c',
              teamId: '1'
            }
          ]
        },
        {
          id: '2',
          name: 'Developers',
          budget: 0, // Will be calculated from employee salaries
          color: '#4ECDC4',
          members: [
            {
              id: '3',
              name: 'Carol Davis',
              salary: 6800,
              walletAddress: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p',
              teamId: '2'
            },
            {
              id: '4',
              name: 'David Wilson',
              salary: 3900,
              walletAddress: '0x9f8e7d6c5b4a3928171605f4c3b2a190',
              teamId: '2'
            },
            {
              id: '5',
              name: 'Eva Martinez',
              salary: 7200,
              walletAddress: '0x5d4c3b2a1928374650ebcdef123456789',
              teamId: '2'
            }
          ]
        },
        {
          id: '3',
          name: 'Design',
          budget: 0, // Will be calculated from employee salaries
          color: '#45B7D1',
          members: [
            {
              id: '6',
              name: 'Frank Miller',
              salary: 5800,
              walletAddress: '0xa1b2c3d4e5f6789012345678901234567',
              teamId: '3'
            }
          ]
        },
        {
          id: '4',
          name: 'Sales',
          budget: 0, // Will be calculated from employee salaries
          color: '#96CEB4',
          members: [
            {
              id: '7',
              name: 'Grace Lee',
              salary: 4500,
              walletAddress: '0x123456789abcdef0123456789abcdef01',
              teamId: '4'
            },
            {
              id: '8',
              name: 'Henry Clark',
              salary: 5200,
              walletAddress: '0xfedcba9876543210fedcba9876543210',
              teamId: '4'
            }
          ]
        },
        {
          id: '5',
          name: 'Operations',
          budget: 0, // Will be calculated from employee salaries
          color: '#FECA57',
          members: []
        },
        {
          id: '6',
          name: 'Legal',
          budget: 0, // Will be calculated from employee salaries
          color: '#B8860B',
          members: []
        },
        {
          id: '7',
          name: 'HR',
          budget: 0, // Will be calculated from employee salaries
          color: '#DDA0DD',
          members: []
        }
      ];

      // Calculate budget for each team based on employee salaries
      teams.forEach(team => {
        team.budget = team.members.reduce((sum, member) => sum + member.salary, 0);
      });

      const totalEmployees = teams.reduce((sum, team) => sum + team.members.length, 0);
      const totalTeamCosts = teams.reduce((sum, team) => sum + team.budget, 0);

      resolve({
        teams,
        totalEmployees,
        totalTeamCosts
      });
    }, 2000); // 2-second delay
  });
};

/**
 * Fetches all employees for the company (backwards compatibility)
 * @returns Promise<Employee[]>
 */
export const fetchEmployees = (): Promise<Employee[]> => {
  return fetchTeamsAndEmployees().then(data => {
    const allEmployees: Employee[] = [];
    data.teams.forEach(team => {
      allEmployees.push(...team.members);
    });
    return allEmployees;
  });
};

/**
 * Adds a new employee to a team
 * @param employeeData - The employee data to add
 * @returns Promise<{ success: boolean; employee?: Employee; error?: string }>
 */
export const addEmployee = (employeeData: AddEmployeeRequest): Promise<{ success: boolean; employee?: Employee; error?: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate validation
      if (!employeeData.walletAddress || !employeeData.name || !employeeData.teamId) {
        resolve({
          success: false,
          error: 'Missing required fields'
        });
        return;
      }

      const newEmployee: Employee = {
        id: `emp_${Date.now()}`,
        name: employeeData.name,
        salary: employeeData.salary,
        walletAddress: employeeData.walletAddress,
        teamId: employeeData.teamId
      };

      resolve({
        success: true,
        employee: newEmployee
      });
    }, 1500); // 1.5-second delay
  });
};

/**
 * Creates a new team
 * @param teamData - The team data to create
 * @returns Promise<{ success: boolean; team?: Team; error?: string }>
 */
export const createTeam = (teamData: CreateTeamRequest): Promise<{ success: boolean; team?: Team; error?: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate validation
      if (!teamData.name) {
        resolve({
          success: false,
          error: 'Team name is required'
        });
        return;
      }

      const newTeam: Team = {
        id: `team_${Date.now()}`,
        name: teamData.name,
        budget: 0, // Budget will be calculated from employee salaries
        color: teamData.color,
        members: []
      };

      resolve({
        success: true,
        team: newTeam
      });
    }, 1500); // 1.5-second delay
  });
};

/**
 * Deletes a team
 * @param teamId - The ID of the team to delete
 * @returns Promise<{ success: boolean; error?: string }>
 */
export const deleteTeam = (teamId: string): Promise<{ success: boolean; error?: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate validation
      if (!teamId) {
        resolve({
          success: false,
          error: 'Team ID is required'
        });
        return;
      }

      // In a real implementation, you would check if the team has members
      // and handle accordingly (either prevent deletion or reassign members)
      resolve({
        success: true
      });
    }, 1500); // 1.5-second delay
  });
};

/**
 * Processes salary payments for all employees
 * @param employees - Array of employees to pay
 * @param totalAmount - Total amount to be paid
 * @returns Promise<PaymentResult>
 */
export const processPayrollPayments = (
  employees: Employee[], 
  totalAmount: number
): Promise<PaymentResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        transactionId: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
    }, 3000); // 3-second delay
  });
};

// =============================================================================
// DASHBOARD & PORTFOLIO DATA
// =============================================================================

/**
 * Fetches dashboard data for the main page
 * @returns Promise<DashboardData>
 */
export const fetchDashboardData = (): Promise<DashboardData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        dashboardStats: {
          totalUsers: 1087,
          activeProjects: 32,
          completedTasks: 756,
          revenue: '$98,230'
        },
        projects: [
          { id: 1, name: 'Blockchain Explorer', status: 'active', progress: 60 },
          { id: 2, name: 'Smart Contract Audit', status: 'completed', progress: 100 }
        ],
        notifications: [
          { id: 1, message: 'System update completed', time: '5 minutes ago' }
        ]
      });
    }, 1500); // 1.5-second delay
  });
};

/**
 * Fetches portfolio data for different sections
 * @param sectionId - The section identifier
 * @returns Promise<any>
 */
export const fetchSectionData = (sectionId: string): Promise<any> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData = {
        portfolio: { value: '$24,567.89', change: '+$1,234.56 (+5.3%)' },
        transactions: [],
        tradingData: { volume: '$156,789', pairs: 12 }
      };
      resolve(mockData);
    }, 1500); // 1.5-second delay
  });
};

/**
 * Fetches individual portfolio data
 * @returns Promise<PortfolioData>
 */
export const fetchPortfolioData = (): Promise<PortfolioData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        value: '$24,567.89',
        change: '+$1,234.56 (+5.3%) today'
      });
    }, 1500); // 1.5-second delay
  });
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Simulates a generic API call with customizable delay and data
 * @param data - The data to return
 * @param delay - Delay in milliseconds (default: 1000)
 * @returns Promise<T>
 */
export const simulateApiCall = <T>(data: T, delay: number = 1000): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
};

/**
 * Simulates an API call that might fail
 * @param data - The data to return on success
 * @param delay - Delay in milliseconds
 * @param failureRate - Probability of failure (0-1)
 * @returns Promise<T>
 */
export const simulateApiCallWithFailure = <T>(
  data: T, 
  delay: number = 1000, 
  failureRate: number = 0.1
): Promise<T> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < failureRate) {
        reject(new Error('Simulated API failure'));
      } else {
        resolve(data);
      }
    }, delay);
  });
};

// =============================================================================
// EXPORT ALL FUNCTIONS
// =============================================================================

export default {
  // Treasury & Finances
  fetchTreasuryBalance,
  
  // Teams & Employee Management
  fetchTeamsAndEmployees,
  fetchEmployees,
  addEmployee,
  createTeam,
  deleteTeam,
  processPayrollPayments,
  
  // Dashboard & Portfolio
  fetchDashboardData,
  fetchSectionData,
  fetchPortfolioData,
  
  // Utilities
  simulateApiCall,
  simulateApiCallWithFailure
}; 