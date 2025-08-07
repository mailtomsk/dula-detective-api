import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

//Login 
export async function login(req, res) {
    const { email, password, rememberMe } = req.body;

    const user = await prisma.admin.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
    }

    // Set expiresIn based on rememberMe flag
    const expiresIn = rememberMe ? '50d' : '5h';

    const jwt_token = jwt.sign(
        { userId: user.id, email: user.email, username: user.username },
        process.env.JWT_SECRET || 'devsecret',
        { expiresIn }
    );

    res.json({
        jwt_token: jwt_token,
        user: {
        id: user.id,
        email: user.email,
        name: user.username || '',
        },
    });
}