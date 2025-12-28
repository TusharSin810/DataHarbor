import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import "dotenv/config";

export function userAuthMiddleware(req: Request,res: Response,next: NextFunction) {
  
  const authHeader = req.headers.authorization;
  const secret = process.env.JWT_SCERET;

  if (!authHeader || !secret) {
    return res.status(403).json({ message: "Missing token" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "Invalid token format" });
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    if (!decoded.userId) {
      return res.status(403).json({ message: "You are not logged in" });
    }
    //@ts-ignore
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token malformed or expired" });
  }
}

export function authMiddleware(req: Request,res: Response,next: NextFunction) {
  
  const authHeader = req.headers.authorization;
  const secret = process.env.JWT_SCERET;

  if (!authHeader || !secret) {
    return res.status(403).json({ message: "Missing token" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "Invalid token format" });
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    if (!decoded.userId) {
      return res.status(403).json({ message: "You are not logged in" });
    }
    //@ts-ignore
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token malformed or expired" });
  }
}