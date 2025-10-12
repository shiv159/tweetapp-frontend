export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}
