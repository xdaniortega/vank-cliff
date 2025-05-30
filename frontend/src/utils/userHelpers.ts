/**
 * Utility function to safely check if user is a company
 * @param user - The user object from Dynamic context
 * @returns boolean indicating if the user is a company
 */
export const isUserCompany = (user: any): boolean => {
  if (!user?.metadata || typeof user.metadata !== 'object') {
    return false;
  }
  
  const metadata = user.metadata as Record<string, any>;
  const userIsCompanyValue = metadata.UserIsCompany;
  
  // Handle different formats of UserIsCompany
  if (typeof userIsCompanyValue === 'string') {
    // Handle new string format: "Company" or "Employee"
    return userIsCompanyValue.toLowerCase() === 'company';
  } else if (Array.isArray(userIsCompanyValue)) {
    // If it's an array, check the first element
    const firstValue = userIsCompanyValue[0];
    if (typeof firstValue === 'string') {
      // Handle array with string values like ["Company"] or ["Employee"]
      return firstValue.toLowerCase() === 'company';
    } else {
      // Handle array with boolean/numeric values like ["1"] or ["0"]
      return firstValue === true || firstValue === 'true' || firstValue === '1';
    }
  } else {
    // Handle direct boolean or string values (fallback for other formats)
    return userIsCompanyValue === true || userIsCompanyValue === 'true' || userIsCompanyValue === '1';
  }
}; 