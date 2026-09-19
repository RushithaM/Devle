import { AppError } from "../../utils/AppError";
import { signToken } from "../../utils/jwt";
import { comparePassword, hashPassword } from "../../utils/password";
import { createUserWithDefaults, findUserByEmail, toPublicUser } from "../users/users.service";
import type { LoginInput, RegisterInput } from "./auth.schemas";

export async function register(input: RegisterInput) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw AppError.conflict("An account with this email already exists", "EMAIL_TAKEN");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUserWithDefaults({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  const token = signToken({ userId: user.id });
  return { user: toPublicUser(user), token };
}

export async function login(input: LoginInput) {
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw AppError.unauthorized("Incorrect email or password", "INVALID_CREDENTIALS");
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw AppError.unauthorized("Incorrect email or password", "INVALID_CREDENTIALS");
  }

  const token = signToken({ userId: user.id });
  return { user: toPublicUser(user), token };
}
