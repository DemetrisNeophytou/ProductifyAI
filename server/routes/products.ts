import { Router } from "express";
import { db } from "../db";
import { products } from "../schema";
import { eq } from "drizzle-orm";

const router = Router();

// GET /products - List all products
router.get("/", async (req, res) => {
  try {
    const allProducts = await db.select().from(products);
    res.json({ ok: true, data: allProducts });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Failed to fetch products" });
  }
});

// GET /products/:id - Get single product
router.get("/:id", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await db.select().from(products).where(eq(products.id, productId));
    
    if (product.length === 0) {
      return res.status(404).json({ ok: false, error: "Product not found" });
    }
    
    res.json({ ok: true, data: product[0] });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Failed to fetch product" });
  }
});

// POST /products - Create new product
router.post("/", async (req, res) => {
  try {
    const { ownerId, title, kind, price, published } = req.body;
    
    const newProduct = await db.insert(products).values({
      ownerId,
      title,
      kind,
      price: price || "0",
      published: published || false,
    }).returning();
    
    res.status(201).json({ ok: true, data: newProduct[0] });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Failed to create product" });
  }
});

// PUT /products/:id - Update product
router.put("/:id", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { title, kind, price, published } = req.body;
    
    const updated = await db.update(products)
      .set({ title, kind, price, published })
      .where(eq(products.id, productId))
      .returning();
    
    if (updated.length === 0) {
      return res.status(404).json({ ok: false, error: "Product not found" });
    }
    
    res.json({ ok: true, data: updated[0] });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Failed to update product" });
  }
});

// DELETE /products/:id - Delete product
router.delete("/:id", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    const deleted = await db.delete(products)
      .where(eq(products.id, productId))
      .returning();
    
    if (deleted.length === 0) {
      return res.status(404).json({ ok: false, error: "Product not found" });
    }
    
    res.json({ ok: true, data: { message: "Product deleted" } });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Failed to delete product" });
  }
});

export default router;



