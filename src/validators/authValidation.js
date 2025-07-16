export function validateRegistration(body) {
    const { name, email, password, confirmPassword } = body;
    const errors = [];
  
    if (!name) errors.push({ field: "name", message: "Name is required" });
    if (!email) errors.push({ field: "email", message: "Email is required" });
    if (!password) errors.push({ field: "password", message: "Password is required" });
    if (!confirmPassword) errors.push({ field: "confirmPassword", message: "Confirm password is required" });
  
    if (password && confirmPassword && password !== confirmPassword) {
      errors.push({ field: "confirmPassword", message: "Passwords do not match" });
    }
  
    return errors;
}
  
export function validateLogin(body) {
    const { email, password } = body;
    const errors = [];
  
    if (!email) errors.push({ field: "email", message: "Email is required" });
    if (!password) errors.push({ field: "password", message: "Password is required" });
  
    return errors;
}

export function validateRefreshToken(body) {
  const { refreshToken } = body;
  const errors = [];

  if (!refreshToken) errors.push({ field: "refreshToken", message: "Refresh token is required" });

  return errors;
}
  