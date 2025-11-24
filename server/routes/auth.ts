import { Router } from "express";
import { db } from "../db";
import { users } from "../schema";
import { eq } from "drizzle-orm";
import {
  fallbackNameFromEmail,
  mapUserToApi,
  planFieldsFromIsPro,
  splitName,
} from "../utils/user-response";

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

    const existingUser = await db.select().from(users).where(eq(users.email, email));

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        error: "User with this email already exists",
      });
    }

    const nameParts = splitName(name);
    const firstName = nameParts.firstName ?? fallbackNameFromEmail(email);
    const lastName = nameParts.lastName ?? null;
    const displayName =
      name?.trim() || [firstName, lastName].filter(Boolean).join(" ") || fallbackNameFromEmail(email);

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name: displayName,
        firstName,
        lastName,
        isPro: false,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: mapUserToApi(newUser),
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

    const user = await db.select().from(users).where(eq(users.email, email));

    if (user.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: mapUserToApi(user[0]),
        token: `demo_token_${user[0].id}`,
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

    const user = await db.select().from(users).where(eq(users.id, userId));

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
          ...mapUserToApi(user[0]),
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

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (typeof name === "string") {
      const nameParts = splitName(name);
      if (nameParts.firstName) {
        updates.firstName = nameParts.firstName;
      }
      if (nameParts.lastName !== undefined) {
        updates.lastName = nameParts.lastName ?? null;
      }
      updates.name =
        name.trim() ||
        [nameParts.firstName, nameParts.lastName].filter(Boolean).join(" ") ||
        undefined;
    }

    if (typeof isPro === "boolean") {
      Object.assign(updates, planFieldsFromIsPro(isPro));
    }

    const updatedUser = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
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
        user: mapUserToApi(updatedUser[0]),
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
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const userId = token.replace("demo_token_", "");

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    const user = await db.select().from(users).where(eq(users.id, userId));

    if (user.length === 0) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    req.user = mapUserToApi(user[0]);
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: "Token verification failed",
    });
  }
};

export default router;
