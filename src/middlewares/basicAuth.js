import dotenv from 'dotenv';
dotenv.config();

export default function basicAuth(req, res, next) {    
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }
      
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
      
    if (username === process.env.AUTH_USERNAME && password === process.env.AUTH_PASSWORD) {
      return next();
    }
  
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  