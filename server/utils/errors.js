class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

class AuthError extends AppError {}
class TaskError extends AppError {}
class EmployeeError extends AppError {}
class AssignmentError extends AppError {}

module.exports = { AppError, AuthError, TaskError, EmployeeError, AssignmentError };
