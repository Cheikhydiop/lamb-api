import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';

export const generateToken = (payload : any) => {
     return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
};

export const verifyToken = (token:string) => {
     try {
         const decoded = jwt.verify(token, JWT_SECRET);
         return decoded;
     } catch (error) {
         throw new Error('Invalid token');
     }
 };