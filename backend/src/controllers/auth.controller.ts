import { Request, Response } from "express";
import prisma from "../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../middleware/auth";

export async function register(req: Request, res: Response) {
  try {
    const { email, username, password } = req.body;

    if (!email || !password || !username)
      return res.status(400).json({ error: "Please fill in all the required fields" });

    // cek email
    const exist = await prisma.user.findUnique({ where: { email } });
    if (exist) return res.status(400).json({ error: "Email already used" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashed,
      }
    });

    return res.json({ message: "User registered", username: user.username, userId: user.id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Email not registered" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Incorrect password" });

    const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET as string,
    {
        expiresIn: process.env.JWT_EXPIRES || "7d",
    } as jwt.SignOptions
    );

    return res.json({ username: user.username, userId: user.id, token});
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function logout(_req: Request, res: Response) {
  try {
    return res.json({ message: "Logged out (token removed on frontend)" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch user data" });
  }
}
