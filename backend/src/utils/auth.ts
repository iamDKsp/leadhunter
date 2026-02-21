import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error(
        'JWT_SECRET environment variable is required. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    );
}

export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

export const generateToken = (userId: string): string => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): any => {
    return jwt.verify(token, JWT_SECRET);
};
