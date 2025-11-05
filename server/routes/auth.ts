import { Router } from "express";
import { db } from "../db";
import { users } from "../schema";
import { eq } from "drizzle-orm";

const router = Router();

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    
    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        error: "User with this email already exists",
      });
    }

    // TODO: Hash password in production
    // For demo purposes, we'll store it as-is (NOT recommended for production)
    
    const newUser = await db.insert(users).values({
      email,
      name: name || email.split('@')[0],
      isPro: false,
    }).returning();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: newUser[0].id,
          email: newUser[0].email,
          name: newUser[0].name,
          isPro: newUser[0].isPro,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to register user",
    });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Find user
    const user = await db.select().from(users).where(eq(users.email, email));
    
    if (user.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // TODO: Verify password hash in production
    // For demo purposes, we'll accept any password
    
    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
          isPro: user[0].isPro,
        },
        token: `demo_token_${user[0].id}`, // TODO: Generate JWT in production
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to login",
    });
  }
});

// Get user profile
router.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await db.select().from(users).where(eq(users.id, parseInt(userId)));
    
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
          isPro: user[0].isPro,
          createdAt: user[0].createdAt,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get user profile",
    });
  }
});

// Update user profile
router.put("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, isPro } = req.body;
    
    const updatedUser = await db.update(users)
      .set({ name, isPro })
      .where(eq(users.id, parseInt(userId)))
      .returning();
    
    if (updatedUser.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: updatedUser[0].id,
          email: updatedUser[0].email,
          name: updatedUser[0].name,
          isPro: updatedUser[0].isPro,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update profile",
    });
  }
});

// Verify token (middleware helper)
export const verifyToken = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    // TODO: Verify JWT token in production
    // For demo purposes, extract user ID from demo token
    const userId = token.replace('demo_token_', '');
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    // Verify user exists
    const user = await db.select().from(users).where(eq(users.id, parseInt(userId)));
    
    if (user.length === 0) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    req.user = user[0];
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: "Token verification failed",
    });
  }
};

export default router;
